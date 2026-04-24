"use client";

import { useEffect, useState } from "react";
import { getModules, ModuleData } from "@/src/features/modules/services/module.service";
import { ModuleCard } from "@/src/features/modules/components/module-card";
import { Button } from "@/src/components/ui/button";
import { Upload, Sparkles, BookOpen, Plus } from "lucide-react";
import { useAuth } from "@/src/components/auth-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user) {
        const list = await getModules(user.uid);
        setModules(list);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Dashboard Headline Section */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end justify-between bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles className="w-64 h-64 text-blue-500" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plataforma Inteligente</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Bem-vindo de volta, Estudante.
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-lg">
            Sua trilha de estudos está pronta. Você tem{" "}
            <strong className="text-blue-500 font-semibold">{loading ? "..." : modules.length} módulos ativos</strong>{" "}
            esperando para revisão.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 mt-6 md:mt-0">
          <Button variant="outline" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Explorar Tudo
          </Button>
          <Button className="gap-2 shadow-md hover:shadow-lg transition-all" onClick={() => router.push("/materiais")}>
            <Upload className="w-4 h-4" />
            Importar PDF
          </Button>
        </div>
      </section>

      {/* Recent Modules Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-zinc-50">
            Continuar de onde parou
          </h2>
        </div>
        
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse border border-slate-200 dark:border-zinc-800" />
             ))}
           </div>
        ) : modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={{ 
                id: module.id, 
                title: module.name, 
                description: module.description, 
                progress: 0, 
                totalTopics: 0,
                completedTopics: 0,
                lastAccessed: new Date(module.createdAt).toISOString() 
              }} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[rgba(255,255,255,0.02)] p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-sm mb-4 border border-slate-200 dark:border-zinc-800">
              <Upload className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-zinc-50 mb-2">
              Pronto para novos conteúdos?
            </h3>
            <p className="text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
              Comece criando seu primeiro módulo de estudo ou importe um arquivo PDF para gerar automaticamente.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                 <Link href="/materiais" className="gap-2"><Plus className="w-4 h-4" /> Criar Módulo</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
