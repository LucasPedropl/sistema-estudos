"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, FileText, FileVideo, Lightbulb, PlayCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getModuleById, getVideosForModule, getContentPagesForModule, getNotesForModule, getQuizzesForModule, ModuleData } from "@/src/features/modules/services/module.service";

export default function ModuloResumoPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [stats, setStats] = useState({ videos: 0, contents: 0, notes: 0, quizzes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const mod = await getModuleById(moduleId);
      setModuleData(mod);
      
      const v = await getVideosForModule(moduleId);
      const c = await getContentPagesForModule(moduleId);
      const n = await getNotesForModule(moduleId);
      const q = await getQuizzesForModule(moduleId);
      
      setStats({
        videos: v.length,
        contents: c.length,
        notes: n.length,
        quizzes: q.length
      });
      setLoading(false);
    }
    loadData();
  }, [moduleId]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Carregando resumo do módulo...</div>;
  }

  if (!moduleData) {
    return <div className="p-12 text-center text-slate-500">Módulo não encontrado.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
       <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-8 sm:p-10">
         <div className="max-w-3xl">
           <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
             <BookOpen className="w-3.5 h-3.5" /> Visão Geral
           </div>
           <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-zinc-50 mb-4">{moduleData.name}</h1>
           <p className="text-slate-600 dark:text-zinc-400 text-lg leading-relaxed">{moduleData.description}</p>
         </div>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
             <FileVideo className="w-6 h-6 text-blue-500" />
             <span className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{stats.videos}</span>
             <span className="text-sm font-medium text-slate-500">Vídeos</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
             <FileText className="w-6 h-6 text-emerald-500" />
             <span className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{stats.contents}</span>
             <span className="text-sm font-medium text-slate-500">Páginas de Leitura</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
             <BookOpen className="w-6 h-6 text-purple-500" />
             <span className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{stats.notes}</span>
             <span className="text-sm font-medium text-slate-500">Anotações</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
             <Lightbulb className="w-6 h-6 text-yellow-500" />
             <span className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{stats.quizzes}</span>
             <span className="text-sm font-medium text-slate-500">Bancos de Questões</span>
          </div>
       </div>

       <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-50 mb-1">Pronto para começar?</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm">Escolha por onde quer iniciar seus estudos neste módulo.</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
             <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none">
               <Link href={`/modulos/${moduleId}/conteudo`}><FileText className="w-4 h-4" /> Ler Material</Link>
             </Button>
             <Button asChild variant="outline" className="gap-2 flex-1 sm:flex-none bg-white dark:bg-zinc-900">
               <Link href={`/modulos/${moduleId}/videos`}><PlayCircle className="w-4 h-4" /> Ver Vídeos</Link>
             </Button>
          </div>
       </div>
    </div>
  );
}
