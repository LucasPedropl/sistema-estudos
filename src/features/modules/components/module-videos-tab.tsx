"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/src/components/ui/button";
import { Play, SkipForward, SkipBack, Upload, ListVideo, Trash2 } from "lucide-react";
import { addVideoToModule, getVideosForModule, VideoMetadata, deleteVideoMetadata } from "@/src/features/modules/services/module.service";
import { getHandlesMap, saveHandlesMap } from "@/src/features/video/components/local-video-player";
import { CustomVideoPlayer } from "@/src/features/video/components/custom-video-player";
import { cn } from "@/src/lib/utils";

export default function ModuleVideosTab({ moduleId }: { moduleId: string }) {
  const [courseVideos, setCourseVideos] = useState<VideoMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

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
    loadCourseVideos();
  }, [moduleId]);

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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
      {/* Main Area - Video Player Maximized */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 bg-black rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center relative group">
          {needsPermission ? (
            <div className="text-center p-8 space-y-4 max-w-md">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                <ListVideo className="w-8 h-8 text-slate-300" />
              </div>
              <div className="space-y-2">
                <p className="text-slate-100 font-bold text-lg">Acesso Necessário</p>
                <p className="text-slate-400 text-sm">O navegador exige permissão para acessar os vídeos locais do seu dispositivo.</p>
              </div>
              <Button onClick={requestPermissions} variant="outline" className="text-slate-900 border-none bg-white hover:bg-slate-100 font-bold px-8">
                Liberar Acesso
              </Button>
            </div>
          ) : videoUrl ? (
            <CustomVideoPlayer 
              src={videoUrl} 
              onEnded={handleVideoEnd} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-slate-500 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center animate-pulse">
                <Upload className="w-8 h-8 opacity-50 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-zinc-50">Sua Galeria está vazia</p>
                <p className="text-xs text-slate-500 max-w-[200px] mt-1">Selecione vídeos do seu computador para começar a estudar.</p>
              </div>
              <Button size="sm" onClick={handleSelectVideosForCourse} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                Importar Vídeos
              </Button>
            </div>
          )}
        </div>
        
        {courseVideos.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between shrink-0">
             <div className="flex-1 min-w-0 pr-4">
               <h3 className="font-black text-slate-900 dark:text-zinc-50 truncate leading-tight uppercase tracking-tight text-sm">
                {courseVideos[currentIndex]?.name}
               </h3>
               <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 rounded uppercase">Reproduzindo</span>
                <span className="text-[10px] font-bold text-slate-400">VÍDEO {currentIndex + 1} / {courseVideos.length}</span>
               </div>
             </div>
             <div className="flex gap-1.5 shrink-0">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-zinc-800" disabled={currentIndex === 0 || needsPermission} onClick={() => setCurrentIndex(currentIndex - 1)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-zinc-800" disabled={currentIndex >= courseVideos.length - 1 || needsPermission} onClick={() => setCurrentIndex(currentIndex + 1)}>
                  <SkipForward className="w-4 h-4" />
                </Button>
             </div>
          </div>
        )}
      </div>

      {/* Playlist Sidebar */}
      <div className="w-full lg:w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/50">
           <span className="font-black text-slate-900 dark:text-zinc-50 text-xs tracking-widest uppercase">Próximos Vídeos <span className="text-blue-500 ml-1">({courseVideos.length})</span></span>
           <Button size="icon" variant="ghost" onClick={handleSelectVideosForCourse} className="h-8 w-8 text-blue-600 dark:text-blue-400">
             <Upload className="w-4 h-4" />
           </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {courseVideos.length === 0 && (
             <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <ListVideo className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nenhuma mídia</p>
             </div>
          )}
          {courseVideos.map((meta, i) => (
             <div 
               key={meta.id} 
               className={cn(
                  "group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer mb-1",
                  i === currentIndex 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'
               )}
               onClick={() => !needsPermission && setCurrentIndex(i)}
             >
               <div className={cn(
                 "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors relative overflow-hidden",
                 i === currentIndex ? "bg-blue-500 text-white shadow-inner" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
               )}>
                 {i === currentIndex ? (
                    <div className="flex gap-0.5 items-end h-3">
                        <div className="w-1 bg-current rounded-full animate-[sound_0.6s_infinite_alternate]" />
                        <div className="w-1 bg-current rounded-full animate-[sound_0.8s_infinite_alternate]" />
                        <div className="w-1 bg-current rounded-full animate-[sound_0.4s_infinite_alternate]" />
                    </div>
                 ) : (
                    <span className="text-[10px] font-black">{i + 1}</span>
                 )}
               </div>
               
               <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-[11px] font-bold block truncate leading-tight uppercase tracking-tight", 
                  i === currentIndex ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-zinc-400'
                )}>
                    {meta.name}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">MP4 • Local</span>
               </div>

               <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0" onClick={(e) => { e.stopPropagation(); handleDeleteVideo(meta, i); }}>
                 <Trash2 className="w-3.5 h-3.5" />
               </Button>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
