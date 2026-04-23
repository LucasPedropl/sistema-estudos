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

  useEffect(() => {
    loadCoursePdfs();
  }, [moduleId]);

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
       {/* PDF List Sidebar */}
       <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
           <span className="font-semibold text-slate-900 dark:text-zinc-50 text-sm">Biblioteca ({coursePdfs.length})</span>
           <Button size="sm" variant="ghost" onClick={handleSelectPdfsForCourse} className="h-8 text-blue-600 dark:text-blue-400">
             <Upload className="w-4 h-4 mr-1" /> Add
           </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {coursePdfs.length === 0 && <p className="text-xs text-center text-slate-500 mt-4">Lista vazia.</p>}
          {coursePdfs.map((meta, i) => (
             <div 
               key={meta.id} 
               className={`group flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${i === currentIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
               onClick={() => !needsPermission && setCurrentIndex(i)}
             >
               <FileText className={`w-4 h-4 shrink-0 ${i === currentIndex ? 'text-blue-500' : 'text-slate-400'}`} />
               <span className={`text-xs flex-1 truncate font-medium ${i === currentIndex ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                 {meta.name}
               </span>
               <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeletePdf(meta, i); }}>
                 <Trash2 className="w-3 h-3" />
               </Button>
             </div>
          ))}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="lg:col-span-3 flex flex-col h-[calc(100vh-14rem)] bg-slate-100 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
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
