"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/src/components/ui/button";
import { Play, SkipForward, SkipBack, Upload, ListVideo, Trash2 } from "lucide-react";
import { addVideoToModule, getVideosForModule, VideoMetadata, deleteVideoMetadata } from "@/src/features/modules/services/module.service";
import { getHandlesMap, saveHandlesMap } from "@/src/features/video/components/local-video-player";
import { CustomVideoPlayer } from "@/src/features/video/components/custom-video-player";

export default function ModuleVideosTab({ moduleId }: { moduleId: string }) {
  const [courseVideos, setCourseVideos] = useState<VideoMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => {
    loadCourseVideos();
  }, [moduleId]);

  async function loadCourseVideos() {
    const videos = await getVideosForModule(moduleId);
    setCourseVideos(videos);
    
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
      if (allGranted) setNeedsPermission(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function playVideoByMeta(meta: VideoMetadata) {
    try {
      const handlesMap = await getHandlesMap();
      const handle = handlesMap[meta.localHandleId];
      if (!handle) {
         setVideoUrl(null);
         return;
      }
      const file = await handle.getFile();
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } catch (err) {
      console.error("Error loading file", err);
    }
  }

  async function handleSelectVideosForCourse() {
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
         handlesMap[handleId] = handle; 
         await addVideoToModule(moduleId, handle.name, handleId, startingOrder + i);
      }
      
      await saveHandlesMap(handlesMap);
      await loadCourseVideos();
    } catch (err) {
      console.error(err);
    }
  }

  function handleVideoEnd() {
    if (currentIndex < courseVideos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  async function handleDeleteVideo(meta: VideoMetadata, index: number) {
    if (!meta.id) return;
    if (confirm(`Remover "${meta.name}" deste módulo?`)) {
      await deleteVideoMetadata(meta.id);
      if (currentIndex === index && courseVideos.length > 1) {
         setCurrentIndex(Math.max(0, index - 1));
      } else if (courseVideos.length === 1) {
         setVideoUrl(null);
      }
      await loadCourseVideos();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Video Player */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="aspect-video w-full bg-black rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col items-center justify-center relative">
          {needsPermission ? (
            <div className="text-center p-8 space-y-4">
              <ListVideo className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto" />
              <p className="text-slate-300">Navegador exige permissão para acessar os vídeos do seu PC após recarregar a tela.</p>
              <Button onClick={requestPermissions} variant="outline" className="text-slate-900 border-slate-700 bg-white hover:bg-slate-100">
                Restaurar Permissão
              </Button>
            </div>
          ) : videoUrl ? (
            <CustomVideoPlayer 
              src={videoUrl} 
              onEnded={handleVideoEnd} 
              className="w-full h-full"
            />
          ) : (
            <div className="text-slate-500 flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 opacity-50 mb-2" />
              <p>O Reprodutor está vazio.</p>
              <Button size="sm" onClick={handleSelectVideosForCourse}>Adicionar Vídeos</Button>
            </div>
          )}
        </div>
        
        {courseVideos.length > 0 && (
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
             <div>
               <h3 className="font-semibold text-slate-900 dark:text-zinc-50">{courseVideos[currentIndex]?.name}</h3>
               <p className="text-xs text-slate-500">Vídeo {currentIndex + 1} de {courseVideos.length}</p>
             </div>
             <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={currentIndex === 0 || needsPermission} onClick={() => setCurrentIndex(currentIndex - 1)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={currentIndex >= courseVideos.length - 1 || needsPermission} onClick={() => setCurrentIndex(currentIndex + 1)}>
                  <SkipForward className="w-4 h-4" />
                </Button>
             </div>
          </div>
        )}
      </div>

      {/* Fila */}
      <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col h-[400px] lg:h-[calc(100vh-18rem)]">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
           <span className="font-semibold text-slate-900 dark:text-zinc-50 text-sm">Fila ({courseVideos.length})</span>
           <Button size="sm" variant="ghost" onClick={handleSelectVideosForCourse} className="h-8 text-blue-600 dark:text-blue-400">
             <Upload className="w-4 h-4 mr-1" /> Add
           </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {courseVideos.length === 0 && <p className="text-xs text-center text-slate-500 mt-4">Lista vazia.</p>}
          {courseVideos.map((meta, i) => (
             <div 
               key={meta.id} 
               className={`group flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${i === currentIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
               onClick={() => !needsPermission && setCurrentIndex(i)}
             >
               {i === currentIndex ? <Play className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <div className="w-3.5 shrink-0 text-[10px] text-slate-400 text-center">{i + 1}</div>}
               <span className={`text-xs flex-1 truncate font-medium ${i === currentIndex ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                 {meta.name}
               </span>
               <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteVideo(meta, i); }}>
                 <Trash2 className="w-3 h-3" />
               </Button>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
