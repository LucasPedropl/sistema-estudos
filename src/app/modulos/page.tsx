"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/components/auth-provider";
import { createModule, getModules, ModuleData, deleteModule } from "@/src/features/modules/services/module.service";
import { Button } from "@/src/components/ui/button";
import { PlusCircle, BookOpen, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ModulosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (user) {
      loadModules();
    }
  }, [user]);

  async function loadModules() {
    if (!user) return;
    const loaded = await getModules(user.uid);
    setModules(loaded);
  }

  async function handleCreate() {
    if (!user || !newName.trim()) return;
    const newId = await createModule(user.uid, newName, newDesc);
    setNewName("");
    setNewDesc("");
    setIsCreating(false);
    // Go directly to the new module
    router.push(`/modulos/${newId}`);
  }

  async function handleDelete(id: string) {
    if (confirm("Quer mesmo deletar este módulo? Todos os vídeos, pdfs e notas sumirão da lista central.")) {
      await deleteModule(id);
      loadModules();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Meus Módulos
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-lg">
            Organize seus estudos. Um módulo centraliza seus PDFs, Vídeos e Anotações.
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 text-white">
             <PlusCircle className="w-4 h-4" /> Criar Módulo
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-50 text-lg">Novo Módulo</h3>
          <div className="space-y-4">
             <input 
               autoFocus
               placeholder="Nome do Módulo (ex: Matemática Básica)"
               className="w-full px-4 py-2 text-sm rounded-lg bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 outline-none focus:border-blue-500 text-slate-900 dark:text-zinc-50"
               value={newName}
               onChange={e => setNewName(e.target.value)}
             />
             <textarea 
               placeholder="Descrição breve..."
               className="w-full px-4 py-2 text-sm rounded-lg bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 outline-none focus:border-blue-500 text-slate-900 dark:text-zinc-50 min-h-[80px] resize-none"
               value={newDesc}
               onChange={e => setNewDesc(e.target.value)}
             />
          </div>
          <div className="flex gap-3">
             <Button onClick={handleCreate} disabled={!newName.trim()}>
               Salvar e Continuar
             </Button>
             <Button variant="ghost" onClick={() => setIsCreating(false)}>
               Cancelar
             </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {modules.map(mod => (
           <Link 
             key={mod.id} 
             href={`/modulos/${mod.id}`}
             className="group flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-blue-900/50"
           >
              <div className="p-6 flex-1 flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-zinc-50 mb-2 truncate">
                  {mod.name}
                </h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm line-clamp-2 flex-1 mb-4">
                  {mod.description || "Nenhuma descrição detalhada."}
                </p>
                <div className="flex items-center justify-between mt-auto">
                   <div className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                     Abrir Módulo <ArrowRight className="w-4 h-4 ml-1" />
                   </div>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       handleDelete(mod.id);
                     }}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                </div>
              </div>
           </Link>
         ))}
      </div>
      
      {modules.length === 0 && !isCreating && (
        <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-500 dark:text-zinc-500">
           Nenhum módulo criado ainda. Comece criando seu primeiro módulo de estudos.
        </div>
      )}
    </div>
  );
}
