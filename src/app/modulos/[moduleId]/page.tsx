"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ModuloResumoPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-zinc-50">Avisos do Módulo</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Este módulo foi ativado recentemente. Navegue pelas guias para estruturar seu estudo.</p>
          </div>
          <Link href={`/modulos/${moduleId}/videos`} className="w-full">
            <Button className="w-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200">
              Começar a Estudar
            </Button>
          </Link>
       </div>
    </div>
  );
}
