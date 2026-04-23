"use client";

import React, { useEffect, useState, useRef } from "react";
import { get, set } from "idb-keyval";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/src/components/ui/button";
import { Play, SkipForward, SkipBack, Upload, ListVideo, Trash2, Box, PlusCircle } from "lucide-react";
import { useAuth } from "@/src/components/auth-provider";
import { createModule, getModules, addVideoToModule, getVideosForModule, ModuleData, VideoMetadata } from "@/src/features/modules/services/module.service";

// Using IndexedDB only to map UUIDs to strictly non-serializable FileSystemFileHandles.
// The UUIDs and names are saved safely to Firebase, cross-referencing this map on load.
export async function getHandlesMap(): Promise<Record<string, FileSystemFileHandle>> {
  return (await get("pea-handles-map")) || {};
}

export async function saveHandlesMap(map: Record<string, FileSystemFileHandle>) {
  await set("pea-handles-map", map);
}

export function LocalVideoPlayer() {
  const { user } = useAuth();
  
  // App States
  const [courses, setCourses] = useState<ModuleData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ModuleData | null>(null);
  
  const [courseVideos, setCourseVideos] = useState<VideoMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  
  // UI States
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);

  // Load Courses
  useEffect(() => {
    if (user) {
      loadCourses();
    } else {
      setCourses([]);
      setSelectedCourse(null);
    }
  }, [user]);

  async function loadCourses() {
    if (!user) return;
    const loaded = await getModules(user.uid);
    setCourses(loaded);
  }

  // Load Course Videos when course selected
  useEffect(() => {
    if (selectedCourse) {
      loadCourseVideos(selectedCourse.id);
    } else {
      setCourseVideos([]);
      setVideoUrl(null);
    }
  }, [selectedCourse]);

  async function loadCourseVideos(courseId: string) {
    const videos = await getVideosForModule(courseId);
    setCourseVideos(videos);
    
    // Test if we have permission for the first video to see if session needs restore
    if (videos.length > 0) {
       const handlesMap = await getHandlesMap();
       const firstHandle = handlesMap[videos[0].localHandleId];
       if (firstHandle) {
         const hasPerm = await verifyPermission(firstHandle, false, false);
         if (!hasPerm) setNeedsPermission(true);
       }
       setCurrentIndex(0);
    } else {
      setNeedsPermission(false);
    }
  }

  // Handle Video Selection/Change
  useEffect(() => {
    if (courseVideos.length > 0 && !needsPermission) {
      const currentMeta = courseVideos[currentIndex];
      if (currentMeta) {
         playVideoByMeta(currentMeta);
      }
    }
  }, [currentIndex, courseVideos, needsPermission]);

  async function verifyPermission(fileHandle: FileSystemFileHandle, readWrite = false, promptUser = false) {
    const handle = fileHandle as any;
    const options: any = {};
    if (readWrite) options.mode = "readwrite";
    
    if ((await handle.queryPermission(options)) === "granted") return true;
    if (promptUser && (await handle.requestPermission(options)) === "granted") return true;
    
    return false;
  }

  async function requestPermissions() {
    try {
      const handlesMap = await getHandlesMap();
      let allGranted = true;
      for (const meta of courseVideos) {
        const handle = handlesMap[meta.localHandleId];
        if (handle) {
           if (!(await verifyPermission(handle, false, true))) {
             allGranted = false;
           }
        }
      }
      if (allGranted) {
        setNeedsPermission(false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function playVideoByMeta(meta: VideoMetadata) {
    try {
      const handlesMap = await getHandlesMap();
      const handle = handlesMap[meta.localHandleId];
      if (!handle) {
        console.error("Local handle not found for video UUID: ", meta.localHandleId);
        return;
      }
      const file = await handle.getFile();
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } catch (err) {
      console.error("Error loading file", err);
    }
  }

  async function handleCreateCourse() {
    if (!user || !newCourseName.trim()) return;
    await createModule(user.uid, newCourseName, "");
    setNewCourseName("");
    setIsCreatingCourse(false);
    await loadCourses();
  }

  async function handleSelectVideosForCourse() {
    if (!selectedCourse) return;
    try {
      const selected = await (window as any).showOpenFilePicker({
        multiple: true,
        types: [{ description: 'Videos', accept: { 'video/*': ['.mp4', '.webm', '.ogg'] } }]
      });
      
      const handlesMap = await getHandlesMap();
      const startingOrder = courseVideos.length;

      for (let i = 0; i < selected.length; i++) {
         const handle = selected[i] as FileSystemFileHandle;
         const handleId = uuidv4();
         handlesMap[handleId] = handle; // Store local handle
         
         // Store mapping in Firebase
         await addVideoToModule(selectedCourse.id, handle.name, handleId, startingOrder + i);
      }
      
      await saveHandlesMap(handlesMap);
      await loadCourseVideos(selectedCourse.id);
      
    } catch (err) {
      console.error(err);
    }
  }

  function handleVideoEnd() {
    if (currentIndex < courseVideos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <ListVideo className="w-12 h-12 text-slate-300 dark:text-zinc-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Faça Login para Acessar</h2>
        <p className="text-slate-500 dark:text-zinc-400 text-center max-w-md">
          Conecte-se para começar a usar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Cursos Sidebar */}
      <div className="lg:col-span-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 flex flex-col h-[calc(100vh-14rem)]">
         <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
           <h3 className="font-semibold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
             <Box className="w-4 h-4" />
             Meus Módulos
           </h3>
         </div>
         
         {!isCreatingCourse ? (
           <Button variant="outline" className="w-full mb-4 gap-2 dark:border-zinc-800 dark:hover:bg-zinc-800" onClick={() => setIsCreatingCourse(true)}>
             <PlusCircle className="w-4 h-4" /> Novo Módulo
           </Button>
         ) : (
           <div className="flex flex-col gap-2 mb-4 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
             <input 
               autoFocus
               placeholder="Nome..."
               className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 outline-none focus:border-blue-500 text-slate-900 dark:text-zinc-50"
               value={newCourseName}
               onChange={e => setNewCourseName(e.target.value)}
             />
             <div className="flex gap-2">
               <Button size="sm" className="flex-1" onClick={handleCreateCourse}>Criar</Button>
               <Button size="sm" variant="ghost" className="flex-1" onClick={() => setIsCreatingCourse(false)}>X</Button>
             </div>
           </div>
         )}
         
         <div className="flex-1 overflow-y-auto space-y-1 pr-1">
           {courses.map(course => (
             <div 
               key={course.id}
               onClick={() => setSelectedCourse(course)}
               className={`px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                 selectedCourse?.id === course.id 
                   ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                   : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
               }`}
             >
               {course.name}
             </div>
           ))}
           {courses.length === 0 && <p className="text-xs text-slate-400 dark:text-zinc-500 text-center mt-6">Nenhum módulo criado.</p>}
         </div>
      </div>

      {/* Video Player & Playlist */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {!selectedCourse ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm h-full opacity-60">
             <ListVideo className="w-16 h-16 text-slate-300 dark:text-zinc-700 mb-4" />
             <p className="text-slate-500 dark:text-zinc-400 font-medium">Selecione um módulo para abrir o Reprodutor</p>
          </div>
        ) : (
          <>
            {/* Player */}
            <div className="aspect-video w-full bg-black rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col items-center justify-center relative">
              {needsPermission ? (
                <div className="text-center p-8 space-y-4">
                  <ListVideo className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto" />
                  <p className="text-slate-300">Você tem vídeos salvos, mas o navegador precisa de permissão de acesso após recarregar a página.</p>
                  <Button onClick={requestPermissions} variant="outline" className="text-slate-900 dark:text-zinc-50 border-slate-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700">
                    Restaurar Permissão
                  </Button>
                </div>
              ) : videoUrl ? (
                <video 
                  ref={videoRef}
                  src={videoUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                  onEnded={handleVideoEnd}
                />
              ) : (
                <div className="text-slate-500 flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 opacity-50" />
                  <p>Adicione vídeos</p>
                </div>
              )}
            </div>

            {/* Fila & Controles */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <div>
                   <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-zinc-50">
                     {selectedCourse.name} {courseVideos[currentIndex] && `- ${courseVideos[currentIndex].name}`}
                   </h2>
                   <p className="text-slate-500 dark:text-zinc-400 text-sm">
                     {courseVideos.length > 0 ? `Vídeo ${currentIndex + 1} de ${courseVideos.length}` : "Nenhum vídeo"}
                   </p>
                 </div>
                 
                 <div className="flex gap-2">
                   <Button variant="outline" size="icon" disabled={currentIndex === 0 || needsPermission || courseVideos.length === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>
                     <SkipBack className="w-4 h-4" />
                   </Button>
                   <Button variant="outline" size="icon" disabled={currentIndex >= courseVideos.length - 1 || needsPermission || courseVideos.length === 0} onClick={() => setCurrentIndex(currentIndex + 1)}>
                     <SkipForward className="w-4 h-4" />
                   </Button>
                   <Button onClick={handleSelectVideosForCourse} className="ml-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 text-white">
                     <Upload className="w-4 h-4 mr-2" />
                     Adicionar Vídeos
                   </Button>
                 </div>
              </div>

              <div className="space-y-2">
                 {courseVideos.map((meta, i) => (
                   <div 
                     key={meta.id} 
                     className={`flex items-center gap-3 p-3 rounded-lg border ${i === currentIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'} cursor-pointer`}
                     onClick={() => !needsPermission && setCurrentIndex(i)}
                   >
                     {i === currentIndex ? <Play className="w-4 h-4 text-blue-500 shrink-0" /> : <div className="w-4 shrink-0 text-xs text-slate-400 text-center">{i + 1}</div>}
                     <span className={`text-sm flex-1 font-medium ${i === currentIndex ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                       {meta.name}
                     </span>
                   </div>
                 ))}
                 {courseVideos.length === 0 && <p className="text-sm text-slate-500 dark:text-zinc-500">Nenhum vídeo adicionado.</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
