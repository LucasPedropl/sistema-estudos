"use client";

import React, { useEffect, useState } from "react";
import { getContentPagesForModule, ContentPageData, updateContentPage, deleteContentPage } from "@/src/features/modules/services/module.service";
import { Button } from "@/src/components/ui/button";
import { Save, Trash2, Edit3, Eye, ArrowLeft, ArrowRight, Bookmark, Highlighter, Heading1, Heading2, Heading3, Quote, List, Link as LinkIcon, Code, Strikethrough } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import * as LucideIcons from "lucide-react";
import { cn } from "@/src/lib/utils";
import { File } from "lucide-react";

// Helper component for content icons
const PageIcon = ({ icon, className, isActive }: { icon?: string, className?: string, isActive?: boolean }) => {
  if (!icon) return <File className={cn(className, isActive ? "text-slate-900 dark:text-zinc-50" : "text-slate-400 dark:text-zinc-500")} />;
  
  // Simple check for Emoji (regex for emoji range)
  const isEmoji = icon.length <= 8 && /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(icon);
  if (isEmoji) return <span className={cn(className, "flex items-center justify-center text-lg")}>{icon}</span>;

  // Try to find Lucide Icon
  const IconComponent = (LucideIcons as any)[icon];
  if (IconComponent) return <IconComponent className={cn(className, isActive ? "text-slate-900 dark:text-zinc-50" : "text-slate-400 dark:text-zinc-500")} />;

  return <span className={cn(className, "flex items-center justify-center")}>{icon}</span>;
};

export default function ModuleContentPage({ moduleId, pageId }: { moduleId: string, pageId: string }) {
  const router = useRouter();
  const [pages, setPages] = useState<ContentPageData[]>([]);
  const [page, setPage] = useState<ContentPageData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: "add" | "remove", text: string } | null>(null);

  useEffect(() => {
    loadPage();
  }, [moduleId, pageId]);
  
  useEffect(() => {
    function handleClick() { setContextMenu(null); }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  async function loadPage() {
    const list = await getContentPagesForModule(moduleId);
    setPages(list);
    const found = list.find(p => p.id === pageId);
    if (found) {
      setPage(found);
      setEditTitle(found.title);
      setEditContent(found.content);
      // Auto enter edit mode if it's new
      if (!found.content && found.title === "Nova Página de Conteúdo") {
        setIsEditing(true);
      }
    } else {
      router.push(`/modulos/${moduleId}`);
    }
  }

  async function handleSave() {
    if (!page?.id) return;
    setIsSaving(true);
    await updateContentPage(page.id, editTitle, editContent, page.isBookmarked, page.icon);
    await loadPage();
    setIsSaving(false);
    setIsEditing(false);
  }

  async function handleToggleBookmark() {
    if (!page?.id) return;
    const newValue = !page.isBookmarked;
    await updateContentPage(page.id, editTitle, editContent, newValue, page.icon);
    // Optimistic update
    setPage(p => p ? { ...p, isBookmarked: newValue } : null);
  }

  async function handleDelete() {
    if (!page?.id) return;
    if (confirm("Deletar esta página de conteúdo permanentemente?")) {
      await deleteContentPage(page.id);
      router.push(`/modulos/${moduleId}`);
    }
  }

  function insertMarkdown(prefix: string, suffix: string) {
    const textarea = document.getElementById("md-editor") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editContent;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    setEditContent(before + prefix + selection + suffix + after);
    setTimeout(() => {
       textarea.focus();
       textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (isEditing) return; // Do not intercept if in edit mode
    
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'mark') {
       e.preventDefault();
       setContextMenu({ x: e.clientX, y: e.clientY, type: "remove", text: target.innerText });
       return;
    }

    const selection = window.getSelection()?.toString();
    if (selection && selection.trim().length > 0) {
       e.preventDefault();
       setContextMenu({ x: e.clientX, y: e.clientY, type: "add", text: selection });
    } else {
       setContextMenu(null);
    }
  }

  async function handleHighlightAction() {
    if (!contextMenu || !page?.id) return;
    
    let newContent = editContent;
    if (contextMenu.type === "add") {
       // Escape special regex chars from selection just in case, but simple string replace works for the first match
       newContent = editContent.replace(contextMenu.text, `==${contextMenu.text}==`);
    } else if (contextMenu.type === "remove") {
       newContent = editContent.replace(`==${contextMenu.text}==`, contextMenu.text);
    }
    
    setEditContent(newContent);
    setPage(p => p ? { ...p, content: newContent } : null);
    
    // Save to DB silently
    await updateContentPage(page.id, editTitle, newContent, page.isBookmarked, page.icon);
    
    setContextMenu(null);
    window.getSelection()?.removeAllRanges();
  }

  // Next and Prev Page Logic
  const currentIndex = pages.findIndex(p => p.id === pageId);
  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  if (!page) return <div className="p-8 text-center text-slate-500">Carregando...</div>;

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm min-h-[calc(100vh-8rem)] flex flex-col overflow-hidden relative">
        
        {/* Action Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-50 dark:bg-zinc-950/30">
         <div className="flex items-center gap-3">
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={handleToggleBookmark} 
               className={page.isBookmarked ? "text-yellow-500 hover:text-yellow-600 dark:text-yellow-400" : "text-slate-400 hover:text-slate-600 dark:text-zinc-500"}
               title="Marcar Página"
             >
               <Bookmark className="w-5 h-5" fill={page.isBookmarked ? "currentColor" : "none"} />
             </Button>
             
             {isEditing ? (
               <div className="flex items-center gap-2 flex-1 max-w-sm">
                 <PageIcon icon={page.icon} className="h-5 w-5 shrink-0" isActive={true} />
                 <input 
                   autoFocus
                   value={editTitle}
                   onChange={e => setEditTitle(e.target.value)}
                   className="flex-1 font-display text-xl font-bold bg-transparent outline-none text-slate-900 dark:text-zinc-50 border-b border-blue-500 pb-1"
                   placeholder="Título da Página"
                 />
               </div>
             ) : (
               <h1 className="font-display text-xl font-bold text-slate-900 dark:text-zinc-50 truncate max-w-2xl flex items-center gap-2">
                 <PageIcon icon={page.icon} className="h-6 w-6" isActive={true} />
                 {page.title}
               </h1>
             )}
         </div>
         
         <div className="flex items-center gap-2 shrink-0">
           {isEditing ? (
             <>
               <Button onClick={() => setIsEditing(false)} variant="ghost" className="text-slate-500">Cancelar</Button>
               <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                 <Save className="w-4 h-4" /> {isSaving ? "Salvando..." : "Salvar"}
               </Button>
             </>
           ) : (
             <>
               <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 bg-white dark:bg-zinc-900">
                 <Edit3 className="w-4 h-4" /> Editar Conteúdo
               </Button>
               <Button onClick={handleDelete} variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                 <Trash2 className="w-4 h-4" />
               </Button>
             </>
           )}
         </div>
      </div>

      {/* Editor Toolbar */}
      {isEditing && (
         <div className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 flex gap-1 px-4 overflow-x-auto custom-scrollbar flex-nowrap shrink-0">
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("**", "**")} title="Negrito" className="font-bold font-serif w-8 h-8 p-0 shrink-0">B</Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("*", "*")} title="Itálico" className="italic font-serif w-8 h-8 p-0 shrink-0">I</Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("~~", "~~")} title="Riscado" className="font-serif w-8 h-8 p-0 shrink-0"><Strikethrough className="w-4 h-4" /></Button>
            <div className="w-px bg-slate-200 dark:bg-zinc-800 mx-1 shrink-0"></div>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("- ", "")} title="Lista" className="w-8 h-8 p-0 shrink-0"><List className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("> ", "")} title="Citação" className="w-8 h-8 p-0 shrink-0"><Quote className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("```\n", "\n```")} title="Bloco de Código" className="w-8 h-8 p-0 shrink-0"><Code className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("[", "](url)")} title="Link" className="w-8 h-8 p-0 shrink-0"><LinkIcon className="w-4 h-4" /></Button>
            <div className="w-px bg-slate-200 dark:bg-zinc-800 mx-1 shrink-0"></div>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("# ", "")} title="Título 1" className="w-8 h-8 p-0 shrink-0"><Heading1 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("## ", "")} title="Título 2" className="w-8 h-8 p-0 shrink-0"><Heading2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("### ", "")} title="Título 3" className="w-8 h-8 p-0 shrink-0"><Heading3 className="w-4 h-4" /></Button>
            <div className="w-px bg-slate-200 dark:bg-zinc-800 mx-1 shrink-0"></div>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("==", "==")} title="Marcador de Texto" className="gap-1.5 text-yellow-600 dark:text-yellow-500 shrink-0">
              <Highlighter className="w-4 h-4" /> Destacar
            </Button>
         </div>
      )}

      {/* Body Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {isEditing ? (
          <textarea 
            id="md-editor"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            placeholder="Escreva em Markdown aqui...&#10;&#10;# Título Principal&#10;## Subtítulo&#10;- Tópico 1&#10;- Tópico 2&#10;&#10;**Negrito**, *Itálico* e ==Marcador de Texto=="
            className="flex-1 w-full bg-slate-50/50 dark:bg-zinc-950/50 p-6 sm:p-8 resize-none outline-none text-slate-700 dark:text-zinc-300 font-mono text-sm leading-relaxed"
          />
        ) : (
          <div className="flex-1 overflow-y-auto w-full" onContextMenu={handleContextMenu}>
             <div className="max-w-3xl mx-auto w-full p-6 sm:p-10 lg:p-12 min-h-[50vh]">
               {page.content ? (
                 <article className="prose prose-slate dark:prose-invert prose-headings:font-display prose-a:text-blue-600 dark:prose-a:text-blue-400 max-w-none">
                   <ReactMarkdown
                     remarkPlugins={[remarkGfm]}
                     rehypePlugins={[rehypeRaw]}
                   >
                     {page.content ? page.content.replace(/==([^=]+)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-500/30 text-inherit px-1 rounded cursor-pointer selection:bg-transparent" title="Clique com o botão direito para remover o marcador">$1</mark>') : ""}
                   </ReactMarkdown>
                 </article>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 mt-20">
                   <Bookmark className="w-12 h-12 opacity-20" />
                   <p>Ainda não há conteúdo de estudo aqui.</p>
                   <Button onClick={() => setIsEditing(true)} variant="outline">Começar a Escrever</Button>
                 </div>
               )}
             </div>

             {/* Footer Navigation */}
             <div className="max-w-3xl mx-auto w-full p-6 sm:px-10 border-t border-slate-100 dark:border-zinc-800/50 mt-10 mb-8 flex items-center justify-between gap-4">
                {prevPage ? (
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/modulos/${moduleId}/conteudo/${prevPage.id}`)}
                    className="flex-1 sm:flex-none justify-start px-4 py-6 h-auto"
                  >
                    <div className="flex flex-col items-start gap-1 text-left">
                       <span className="text-xs text-slate-400 flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Anterior</span>
                       <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{prevPage.title}</span>
                    </div>
                  </Button>
                ) : <div className="flex-1 sm:flex-none" />}
                
                {nextPage ? (
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/modulos/${moduleId}/conteudo/${nextPage.id}`)}
                    className="flex-1 sm:flex-none justify-end px-4 py-6 h-auto border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <div className="flex flex-col items-end gap-1 text-right">
                       <span className="text-xs text-slate-400 flex items-center gap-1">Próximo <ArrowRight className="w-3 h-3"/></span>
                       <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{nextPage.title}</span>
                    </div>
                  </Button>
                ) : <div className="flex-1 sm:flex-none" />}
             </div>
          </div>
        )}
      </div>
    </div>
    
    {contextMenu && (
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
           <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">Marcador</span>
        </div>
        <button 
          className={cn(
             "flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-md transition-colors",
             contextMenu.type === 'add' 
                ? "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800" 
                : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          )}
          onClick={handleHighlightAction}
        >
          <Highlighter className="w-4 h-4" /> 
          {contextMenu.type === 'add' ? "Destacar Seleção" : "Remover Marcação"}
        </button>
      </div>
    )}
    </>
  );
}
