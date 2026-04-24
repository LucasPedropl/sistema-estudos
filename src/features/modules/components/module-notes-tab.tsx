"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Trash2, FileText, Plus, Save, Bookmark, PenLine, Highlighter, Heading1, Heading2, Heading3, Quote, List, Link as LinkIcon, Code, Strikethrough } from "lucide-react";
import { addNoteToModule, getNotesForModule, updateNote, deleteNote, NoteData } from "@/src/features/modules/services/module.service";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/src/lib/utils";

export default function ModuleNotesTab({ moduleId }: { moduleId: string }) {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null);
  
  // Editor States
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: "add" | "remove", text: string } | null>(null);

  useEffect(() => {
    loadNotes();
  }, [moduleId]);
  
  useEffect(() => {
    function handleClick() { setContextMenu(null); }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  async function loadNotes() {
    const loaded = await getNotesForModule(moduleId);
    setNotes(loaded);
    // Auto select first note if we have one and none selected
    if (loaded.length > 0 && !selectedNote) {
       handleSelect(loaded[0]);
    } else if (loaded.length === 0) {
       setSelectedNote(null);
    } else if (selectedNote) {
       // Refresh selected note data
       const stillExists = loaded.find(n => n.id === selectedNote.id);
       if (stillExists) {
         setSelectedNote(stillExists);
       } else {
         handleSelect(loaded[0]);
       }
    }
  }

  function handleSelect(note: NoteData) {
     setSelectedNote(note);
     setEditTitle(note.title);
     setEditContent(note.content);
     setViewMode(true);
  }

  async function handleCreateNote() {
    setViewMode(false);
    const newId = await addNoteToModule(moduleId, "Nova Anotação", "");
    await loadNotes();
    const loaded = await getNotesForModule(moduleId);
    const created = loaded.find(n => n.id === newId);
    if (created) handleSelect(created);
    setViewMode(false);
  }

  async function handleSaveNote() {
    if (!selectedNote || !selectedNote.id) return;
    setIsSaving(true);
    await updateNote(selectedNote.id, editTitle, editContent);
    await loadNotes();
    setIsSaving(false);
  }

  async function handleDeleteNote(id: string) {
    // Removed window.confirm
    await deleteNote(id);
    loadNotes();
  }

  function insertMarkdown(prefix: string, suffix: string) {
    const textarea = document.getElementById("note-md-editor") as HTMLTextAreaElement;
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
    if (!viewMode) return; // Ignore if in edit mode
    
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
    if (!contextMenu || !selectedNote?.id) return;
    
    let newContent = editContent;
    if (contextMenu.type === "add") {
       newContent = editContent.replace(contextMenu.text, `==${contextMenu.text}==`);
    } else if (contextMenu.type === "remove") {
       newContent = editContent.replace(`==${contextMenu.text}==`, contextMenu.text);
    }
    
    setEditContent(newContent);
    await updateNote(selectedNote.id, editTitle, newContent);
    
    setContextMenu(null);
    window.getSelection()?.removeAllRanges();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
       {/* Notes List Sidebar - Technical and detailed */}
       <div className="w-full lg:w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/50">
           <span className="font-bold text-slate-900 dark:text-zinc-50 text-sm tracking-tight">Anotações <span className="text-blue-500 ml-1 opacity-70">({notes.length})</span></span>
           <Button size="icon" variant="ghost" onClick={handleCreateNote} className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
             <Plus className="w-5 h-5" />
           </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nenhuma nota</p>
            </div>
          )}
          {notes.map((note) => {
             const isSelected = selectedNote?.id === note.id;
             return (
               <div 
                 key={note.id} 
                 className={cn(
                    "group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer mb-1",
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                 )}
                 onClick={() => handleSelect(note)}
               >
                 <div className="flex flex-col overflow-hidden flex-1">
                   <div className="flex items-center gap-2">
                     <span className={cn(
                       "text-xs font-bold truncate leading-tight", 
                       isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'
                     )}>
                       {note.title || "Sem título"}
                     </span>
                   </div>
                   <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                     {new Date(note.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                   </span>
                 </div>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0" onClick={(e) => { e.stopPropagation(); note.id && handleDeleteNote(note.id); }}>
                   <Trash2 className="w-3.5 h-3.5" />
                 </Button>
               </div>
             )
          })}
        </div>
      </div>

      {/* Note Editor / View - Professional Grade Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden relative">
        {!selectedNote ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
              <FileText className="w-12 h-12 opacity-50 mb-2" />
              <p>Nenhuma anotação selecionada.</p>
              <Button onClick={handleCreateNote} className="mt-2 text-white bg-blue-600 hover:bg-blue-700">
                 Criar Anotação
              </Button>
            </div>
        ) : (
           <>
             <div className="flex items-center gap-4 border-b border-slate-100 dark:border-zinc-800 p-4">
               {viewMode ? (
                 <h2 className="flex-1 font-display text-2xl font-bold bg-transparent text-slate-900 dark:text-zinc-50 truncate">
                   {editTitle}
                 </h2>
               ) : (
                 <input 
                   value={editTitle}
                   onChange={e => setEditTitle(e.target.value)}
                   className="flex-1 font-display text-2xl font-bold bg-transparent outline-none text-slate-900 dark:text-zinc-50 border-none placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                   placeholder="Título da Anotação"
                 />
               )}
               <div className="flex gap-2">
                 {viewMode ? (
                   <Button onClick={() => setViewMode(false)} variant="outline" className="gap-2">
                     <PenLine className="w-4 h-4" /> Editar
                   </Button>
                 ) : (
                   <>
                     <Button onClick={() => setViewMode(true)} variant="ghost" className="text-slate-500">
                       Cancelar
                     </Button>
                     <Button onClick={handleSaveNote} disabled={isSaving} className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                       <Save className="w-4 h-4" />
                       {isSaving ? "Salvando..." : "Salvar"}
                     </Button>
                   </>
                 )}
               </div>
             </div>
             
             {!viewMode && (
                <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 flex gap-1 px-4 overflow-x-auto custom-scrollbar flex-nowrap shrink-0">
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

             <div className="flex-1 p-6 relative overflow-hidden flex flex-col bg-slate-50/50 dark:bg-zinc-950/50">
                {viewMode ? (
                   <div className="flex-1 overflow-y-auto" onContextMenu={handleContextMenu}>
                     <article className="prose prose-slate dark:prose-invert max-w-none">
                       <ReactMarkdown
                         remarkPlugins={[remarkGfm]}
                         rehypePlugins={[rehypeRaw]}
                       >
                         {editContent ? editContent.replace(/==([^=]+)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-500/30 text-inherit px-1 rounded cursor-pointer selection:bg-transparent" title="Clique com o botão direito para remover o marcador">$1</mark>') : "*Nota vazia...*"}
                       </ReactMarkdown>
                     </article>
                   </div>
                ) : (
                   <textarea 
                     id="note-md-editor"
                     value={editContent}
                     onChange={e => setEditContent(e.target.value)}
                     placeholder="Escreva seus resumos aqui em Markdown...&#10;&#10;**Negrito** e ==Destacado=="
                     className="w-full h-full resize-none outline-none text-slate-800 dark:text-zinc-200 bg-transparent font-mono text-sm leading-relaxed"
                   />
                )}
             </div>
           </>
        )}
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
    </div>
  );
}
