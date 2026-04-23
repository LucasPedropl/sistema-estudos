"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { BookOpen, Home, Settings, LogOut, Grid, ArrowLeft, Video, BookMarked, FileText, File, Plus, BrainCircuit, Edit2, Trash2, X, ArrowUp, ArrowDown, Smile } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { useAuth } from "@/src/components/auth-provider";
import { Button } from "../ui/button";
import { useEffect, useState, useRef } from "react";
import { ModuleData, getModuleById, ContentPageData, getContentPagesForModule, createContentPage, updateContentPage, deleteContentPage, updateContentPagesOrder } from "@/src/features/modules/services/module.service";

// Helper component for content icons
const PageIcon = ({ icon, className, isActive }: { icon?: string, className?: string, isActive?: boolean }) => {
  if (!icon) return <File className={cn(className, isActive ? "text-slate-900 dark:text-zinc-50" : "text-slate-400 dark:text-zinc-500")} />;
  
  // Simple check for Emoji (regex for emoji range)
  const isEmoji = icon.length <= 8 && /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(icon);
  if (isEmoji) return <span className={cn(className, "flex items-center justify-center text-base")}>{icon}</span>;

  // Try to find Lucide Icon
  const IconComponent = (LucideIcons as any)[icon];
  if (IconComponent) return <IconComponent className={cn(className, isActive ? "text-slate-900 dark:text-zinc-50" : "text-slate-400 dark:text-zinc-500")} />;

  return <span className={cn(className, "flex items-center justify-center")}>{icon}</span>;
};

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  
  const moduleId = params?.moduleId as string | undefined;
  
  const [activeModule, setActiveModule] = useState<ModuleData | null>(null);
  const [contentPages, setContentPages] = useState<ContentPageData[]>([]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ id: string, name: string, icon?: string, x: number, y: number } | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [selectingIconId, setSelectingIconId] = useState<string | null>(null);
  const [editPageName, setEditPageName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (moduleId) {
      getModuleById(moduleId).then(setActiveModule);
      getContentPagesForModule(moduleId).then(setContentPages);
      
      interval = setInterval(() => {
         // Don't poll while interacting to avoid state resets
         if (!editingPageId && !draggedPageId && !selectingIconId) {
            getContentPagesForModule(moduleId).then(setContentPages);
         }
      }, 5000);
    } else {
      setActiveModule(null);
      setContentPages([]);
    }
    
    return () => clearInterval(interval);
  }, [moduleId, editingPageId, draggedPageId, selectingIconId]);

  useEffect(() => {
    if (editingPageId && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
  }, [editingPageId]);

  useEffect(() => {
    if (selectingIconId && iconInputRef.current) {
        iconInputRef.current.focus();
        iconInputRef.current.select();
    }
  }, [selectingIconId]);

  async function handleAddContentPage() {
    if (!moduleId) return;
    const newOrder = contentPages.length;
    const newId = await createContentPage(moduleId, "Nova Página de Conteúdo", "", newOrder);
    const pages = await getContentPagesForModule(moduleId);
    setContentPages(pages);
    router.push(`/modulos/${moduleId}/conteudo/${newId}`);
  }

  async function handleRenameFinish() {
    if (!editingPageId || !moduleId) return;
    const p = contentPages.find(cp => cp.id === editingPageId);
    if (p && editPageName.trim()) {
       await updateContentPage(editingPageId, editPageName.trim(), p.content, p.isBookmarked, p.icon);
       const updated = await getContentPagesForModule(moduleId);
       setContentPages(updated);
    }
    setEditingPageId(null);
  }

  async function handleIconFinish() {
    if (!selectingIconId || !moduleId) return;
    const p = contentPages.find(cp => cp.id === selectingIconId);
    if (p) {
       await updateContentPage(selectingIconId, p.title, p.content, p.isBookmarked, editIcon.trim());
       const updated = await getContentPagesForModule(moduleId);
       setContentPages(updated);
    }
    setSelectingIconId(null);
  }

  async function handleDeleteContent(id: string) {
    if (!moduleId) return;
    // Removed window.confirm due to iframe blockage
    await deleteContentPage(id);
    const pages = await getContentPagesForModule(moduleId);
    setContentPages(pages);
    if (pathname.includes(`/conteudo/${id}`)) {
       router.push(`/modulos/${moduleId}`);
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedPageId(id);
    e.dataTransfer.effectAllowed = 'move';
    if (typeof window !== "undefined") {
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // 1x1 transparent gif
      e.dataTransfer.setDragImage(img, 0, 0);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedPageId || draggedPageId === targetId) return;
    
    let newPages = [...contentPages];
    const sourceIndex = newPages.findIndex(p => p.id === draggedPageId);
    const targetIndex = newPages.findIndex(p => p.id === targetId);
    
    if (sourceIndex > -1 && targetIndex > -1) {
       const [moved] = newPages.splice(sourceIndex, 1);
       newPages.splice(targetIndex, 0, moved);
       
       setContentPages(newPages);
       const updates = newPages.map((p, i) => ({ id: p.id!, order: i }));
       await updateContentPagesOrder(updates);
    }
    
    setDraggedPageId(null);
  }

  return (
    <>
      <aside className="flex h-full flex-col border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm select-none">
        <div className="flex justify-between h-16 items-center px-6 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white dark:text-zinc-50">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              P.E.A
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar">
          {moduleId && activeModule ? (
            <div className="flex flex-col gap-4">
              <Link href="/modulos" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Módulos
              </Link>
              
              <div className="px-1">
                <h2 className="font-display font-bold text-lg leading-tight text-slate-900 dark:text-zinc-50">
                  {activeModule.name}
                </h2>
              </div>
              
              <nav className="flex flex-col gap-1 mt-2">
                {[
                  { name: "Visão Geral", href: `/modulos/${moduleId}`, icon: BookOpen },
                  { name: "Meus Vídeos", href: `/modulos/${moduleId}/videos`, icon: Video },
                  { name: "Biblioteca", href: `/modulos/${moduleId}/pdfs`, icon: BookMarked },
                  { name: "Bloco de Notas", href: `/modulos/${moduleId}/anotacoes`, icon: FileText },
                  { name: "Quizzes", href: `/modulos/${moduleId}/quizzes`, icon: BrainCircuit }
                ].map(item => {
                   const isActive = pathname === item.href;
                   return (
                     <Link
                       key={item.href}
                       href={item.href}
                       className={cn(
                         "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                         isActive
                           ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                           : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-50"
                       )}
                     >
                       <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-zinc-500")} />
                       {item.name}
                     </Link>
                   )
                })}
              </nav>
              
              <div className="h-px bg-slate-100 dark:bg-zinc-800 my-2" />
              
              {/* Content Pages Section */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Conteúdos</span>
                  <Button variant="ghost" size="icon" onClick={handleAddContentPage} className="h-6 w-6 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                     <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {contentPages.map(page => {
                   if (!page.id) return null;
                   const pageHref = `/modulos/${moduleId}/conteudo/${page.id}`;
                   const isActive = pathname === pageHref;
                   const isEditing = editingPageId === page.id;
                   
                   return (
                     <div
                       key={page.id}
                       draggable={!isEditing}
                       onDragStart={(e) => handleDragStart(e, page.id!)}
                       onDragOver={handleDragOver}
                       onDrop={(e) => handleDrop(e, page.id!)}
                       onDragEnd={() => setDraggedPageId(null)}
                       onContextMenu={(e) => {
                         e.preventDefault();
                         setContextMenu({ id: page.id!, name: page.title, icon: page.icon, x: e.clientX, y: e.clientY });
                       }}
                       className={cn(
                         "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer group",
                         isActive
                           ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 font-medium"
                           : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-50 font-medium",
                         draggedPageId === page.id && "opacity-50"
                       )}
                     >
                       <PageIcon icon={page.icon} className="h-4 w-4 shrink-0" isActive={isActive} />
                       {isEditing ? (
                         <input 
                           ref={renameInputRef}
                           value={editPageName}
                           onChange={e => setEditPageName(e.target.value)}
                           onBlur={handleRenameFinish}
                           onKeyDown={e => {
                             if (e.key === 'Enter') handleRenameFinish();
                             if (e.key === 'Escape') setEditingPageId(null);
                           }}
                           className="flex-1 bg-white dark:bg-black border border-blue-500 rounded px-1 -ml-1 py-0.5 outline-none text-slate-900 dark:text-zinc-50 text-sm h-6"
                         />
                       ) : selectingIconId === page.id ? (
                          <input 
                            ref={iconInputRef}
                            value={editIcon}
                            onChange={e => setEditIcon(e.target.value)}
                            onBlur={handleIconFinish}
                            placeholder="Emoji ou Nome Lucide"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleIconFinish();
                              if (e.key === 'Escape') setSelectingIconId(null);
                            }}
                            className="flex-1 bg-white dark:bg-black border border-blue-500 rounded px-1 -ml-1 py-0.5 outline-none text-slate-900 dark:text-zinc-50 text-xs h-6 font-normal"
                          />
                       ) : (
                         <div
                           onClick={() => router.push(pageHref)} 
                           className="flex-1 truncate"
                         >
                           {page.title || "Sem título"}
                         </div>
                       )}
                     </div>
                   )
                })}
                {contentPages.length === 0 && (
                   <div className="px-3 py-2 text-xs text-slate-400 dark:text-zinc-500">Nenhum conteúdo criado.</div>
                )}
              </div>
            </div>
          ) : (
            <nav className="flex flex-col gap-1">
              {[
                { name: "Início", href: "/", icon: Home },
                { name: "Meus Módulos", href: "/modulos", icon: Grid },
              ].map((item) => {
                const isActive = pathname === item.href || (item.href === '/modulos' && pathname.startsWith('/modulos') && !moduleId);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-50"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-slate-900 dark:text-zinc-50" : "text-slate-400 dark:text-zinc-400"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
             <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">Aparência</span>
             <ThemeToggle />
          </div>
          
          {!loading && user && (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-zinc-900 p-3 border border-slate-100 dark:border-zinc-800">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Avatar" 
                className="h-8 w-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-medium text-slate-600 dark:text-zinc-400 text-sm shrink-0"
              />
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-50 truncate" title={user.displayName || "Usuário"}>{user.displayName || "Usuário"}</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 truncate" title={user.email || ""}>{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-500" onClick={logout} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Custom Context Menu Portal Overlay */}
      {contextMenu && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden isolate"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div 
            className="fixed z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl w-48 flex flex-col p-1 animate-fade-in-up"
            style={{ 
              top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 100 : contextMenu.y), 
              left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 200 : contextMenu.x) 
            }}
            onClick={e => e.stopPropagation()}
            onContextMenu={e => e.preventDefault()}
          >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1 flex justify-between items-center bg-slate-50 dark:bg-zinc-950/50 rounded-t-lg">
               <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">{contextMenu.name}</span>
               <button onClick={() => setContextMenu(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100"><X className="w-3 h-3" /></button>
            </div>
            <button 
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              onClick={() => {
                setEditPageName(contextMenu.name);
                setEditingPageId(contextMenu.id);
                setContextMenu(null);
              }}
            >
              <Edit2 className="w-4 h-4" /> Renomear
            </button>
            <button 
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              onClick={() => {
                setEditIcon(contextMenu.icon || "");
                setSelectingIconId(contextMenu.id);
                setContextMenu(null);
              }}
            >
              <Smile className="w-4 h-4" /> Alterar Ícone
            </button>
            <button 
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              onClick={async () => {
                const isFirst = contentPages[0]?.id === contextMenu.id;
                if (!isFirst) {
                   const index = contentPages.findIndex(p => p.id === contextMenu.id);
                   const prev = contentPages[index - 1];
                   if (prev && contextMenu.id && prev.id) {
                      await updateContentPagesOrder([{ id: contextMenu.id, order: index - 1 }, { id: prev.id, order: index }]);
                      const updated = await getContentPagesForModule(moduleId!);
                      setContentPages(updated);
                   }
                }
                setContextMenu(null);
              }}
            >
              <ArrowUp className="w-4 h-4" /> Mover para Cima
            </button>
            <button 
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              onClick={async () => {
                const isLast = contentPages[contentPages.length - 1]?.id === contextMenu.id;
                if (!isLast) {
                   const index = contentPages.findIndex(p => p.id === contextMenu.id);
                   const next = contentPages[index + 1];
                   if (next && contextMenu.id && next.id) {
                      await updateContentPagesOrder([{ id: contextMenu.id, order: index + 1 }, { id: next.id, order: index }]);
                      const updated = await getContentPagesForModule(moduleId!);
                      setContentPages(updated);
                   }
                }
                setContextMenu(null);
              }}
            >
              <ArrowDown className="w-4 h-4" /> Mover para Baixo
            </button>
            <button 
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
              onClick={() => {
                handleDeleteContent(contextMenu.id);
                setContextMenu(null);
              }}
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          </div>
        </div>
      )}
    </>
  );
}
