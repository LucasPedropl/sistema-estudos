import { MOCK_RECENT_MODULES } from "@/src/features/modules/mock";
import { ModuleCard } from "@/src/features/modules/components/module-card";
import { Button } from "@/src/components/ui/button";
import { Upload, Sparkles, BookOpen } from "lucide-react";

export default function Home() {
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
            <strong className="text-blue-500 font-semibold">{MOCK_RECENT_MODULES.length} módulos ativos</strong>{" "}
            esperando para revisão.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 mt-6 md:mt-0">
          <Button variant="outline" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Explorar Tudo
          </Button>
          <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_RECENT_MODULES.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>
      
      {/* Empty State / Next Steps placeholder for when user uploads */}
      <section className="mt-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-[rgba(255,255,255,0.02)] p-12 text-center flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-sm mb-4 border border-slate-200 dark:border-zinc-800">
          <Upload className="w-8 h-8 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-zinc-50 mb-2">
          Pronto para novos conteúdos?
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
          Sempre que você importar um PDF, nosso modelo de IA processará e transformará o documento em um novo módulo de estudo estruturado aqui.
        </p>
        <Button variant="outline">
          Fazer upload de um arquivo
        </Button>
      </section>
    </div>
  );
}
