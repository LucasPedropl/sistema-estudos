"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/src/components/ui/button";
import { Upload, Trash2, FileText } from "lucide-react";
import { addPdfToModule, getPdfsForModule, PDFMetadata, deletePdfMetadata } from "@/src/features/modules/services/module.service";
import { getHandlesMap, saveHandlesMap } from "@/src/features/video/components/local-video-player"; // reusing the same IDB store mapping

export default function ModulePdfsTab({ moduleId }: { moduleId: string }) {
  const [coursePdfs, setCoursePdfs] = useState<PDFMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  async function loadCoursePdfs() {
    const pdfs = await getPdfsForModule(moduleId);
    setCoursePdfs(pdfs);
    
    if (pdfs.length > 0) {
       const handlesMap = await getHandlesMap();
       const firstHandle = handlesMap[pdfs[0].localHandleId];
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
    loadCoursePdfs();
  }, [moduleId]);

  async function loadPdfByMeta(meta: PDFMetadata) {
    try {
      const handlesMap = await getHandlesMap();
      const handle = handlesMap[meta.localHandleId];
      if (!handle) {
         setPdfUrl(null);
         return;
      }
      const file = await handle.getFile();
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    } catch (err) {
      console.error("Error loading file", err);
    }
  }

  useEffect(() => {
    if (coursePdfs.length > 0 && !needsPermission) {
      const currentMeta = coursePdfs[currentIndex];
      if (currentMeta) {
         loadPdfByMeta(currentMeta);
      }
    } else {
      setPdfUrl(null);
    }
  }, [currentIndex, coursePdfs, needsPermission]);

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
      for (const meta of coursePdfs) {
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


  async function handleSelectPdfsForCourse() {
    try {
      const selected = await (window as any).showOpenFilePicker({
        multiple: true,
        types: [{ description: 'PDFs', accept: { 'application/pdf': ['.pdf'] } }]
      });
      
      const handlesMap = await getHandlesMap();
      const startingOrder = coursePdfs.length;

      for (let i = 0; i < selected.length; i++) {
         const handle = selected[i] as FileSystemFileHandle;
         const handleId = uuidv4();
         handlesMap[handleId] = handle; 
         await addPdfToModule(moduleId, handle.name, handleId, startingOrder + i);
      }
      
      await saveHandlesMap(handlesMap);
      await loadCoursePdfs();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeletePdf(meta: PDFMetadata, index: number) {
    if (!meta.id) return;
    if (confirm(`Remover "${meta.name}" deste módulo?`)) {
      await deletePdfMetadata(meta.id);
      if (currentIndex === index && coursePdfs.length > 1) {
         setCurrentIndex(Math.max(0, index - 1));
      } else if (coursePdfs.length === 1) {
         setPdfUrl(null);
      }
      await loadCoursePdfs();
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
       {/* PDF List Sidebar - Sleek and compact */}
       <div className="w-full lg:w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/50">
           <span className="font-bold text-slate-900 dark:text-zinc-50 text-sm tracking-tight">Biblioteca <span className="text-blue-500 ml-1 opacity-70">({coursePdfs.length})</span></span>
           <Button size="icon" variant="ghost" onClick={handleSelectPdfsForCourse} className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
             <Upload className="w-4 h-4" />
           </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {coursePdfs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Lista Vazia</p>
            </div>
          )}
          {coursePdfs.map((meta, i) => (
             <div 
               key={meta.id} 
               className={cn(
                  "group flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer mb-1",
                  i === currentIndex 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'
               )}
               onClick={() => !needsPermission && setCurrentIndex(i)}
             >
               <div className={cn(
                 "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                 i === currentIndex ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
               )}>
                 <FileText className="w-4 h-4" />
               </div>
               
               <span className={cn(
                 "text-xs flex-1 truncate font-bold leading-tight", 
                 i === currentIndex ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'
               )}>
                 {meta.name}
               </span>
               
               <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0" onClick={(e) => { e.stopPropagation(); handleDeletePdf(meta, i); }}>
                 <Trash2 className="w-3.5 h-3.5" />
               </Button>
             </div>
          ))}
        </div>
      </div>

      {/* PDF Viewer - Maximized and Immersive */}
      <div className="flex-1 flex flex-col bg-slate-100 dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xl">
        {needsPermission ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <FileText className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto" />
              <p className="text-slate-500">Navegador exige permissão para ler seus PDFs.</p>
              <Button onClick={requestPermissions} variant="outline" className="text-slate-900 border-slate-300 bg-white hover:bg-slate-50">
                Restaurar Permissão
              </Button>
            </div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full border-none" title="PDF Viewer" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
              <FileText className="w-12 h-12 opacity-50 mb-2" />
              <p>Nenhum PDF selecionado.</p>
              <Button onClick={handleSelectPdfsForCourse} variant="outline" className="mt-2 text-slate-900 border-slate-300">
                Escolher Arquivos Locais
              </Button>
            </div>
        )}
      </div>
    </div>
  );
}
