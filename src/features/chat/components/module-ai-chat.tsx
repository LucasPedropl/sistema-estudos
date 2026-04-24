"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Sparkles, X, Send, BotMessageSquare, Loader2, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";

import { getModuleById, getContentPagesForModule, getQuizzesForModule, getNotesForModule } from "@/src/features/modules/services/module.service";

type Role = "user" | "model";
interface ChatMessage {
  role: Role;
  text: string;
}

export function ModuleAIChat({ moduleId }: { moduleId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Context Selection
  const [contextMode, setContextMode] = useState<"all" | "current" | "contents" | "quizzes" | "notes">("all");
  const pathname = usePathname();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function gatherContext() {
    let contextStr = `Módulo ID: ${moduleId}\n\n`;

    try {
      const moduleData = await getModuleById(moduleId);
      contextStr += `Nome do Módulo: ${moduleData?.name}\n`;
      contextStr += `Descrição: ${moduleData?.description}\n\n`;

      const fetchContents = async () => {
         const cp = await getContentPagesForModule(moduleId);
         let s = "--- PÁGINAS DE CONTEÚDO ---\n";
         cp.forEach(c => { s += `Título: ${c.title}\nConteúdo:\n${c.content}\n\n`; });
         return s;
      };

      const fetchQuizzes = async () => {
         const qz = await getQuizzesForModule(moduleId);
         let s = "--- QUIZZES ---\n";
         qz.forEach(q => { s += `Quiz: ${q.title}\nJSON das Perguntas:\n${q.questionsJson}\n\n`; });
         return s;
      };

      const fetchNotes = async () => {
         const nt = await getNotesForModule(moduleId);
         let s = "--- ANOTAÇÕES PESSOAIS ---\n";
         nt.forEach(n => { s += `Título: ${n.title}\nNota:\n${n.content}\n\n`; });
         return s;
      };

      if (contextMode === "all") {
         contextStr += await fetchContents();
         contextStr += await fetchQuizzes();
         contextStr += await fetchNotes();
      } else if (contextMode === "contents") {
         contextStr += await fetchContents();
      } else if (contextMode === "quizzes") {
         contextStr += await fetchQuizzes();
      } else if (contextMode === "notes") {
         contextStr += await fetchNotes();
      } else if (contextMode === "current") {
         // Auto-detect based on pathname
         if (pathname.includes("/conteudo/")) {
            const pageId = pathname.split("/").pop();
            const cp = await getContentPagesForModule(moduleId);
            const found = cp.find(c => c.id === pageId);
            if (found) {
               contextStr += `--- CONTEÚDO ATUAL ---\nTítulo: ${found.title}\nConteúdo:\n${found.content}\n`;
            } else {
               contextStr += "(Nenhum conteúdo específico detectado na tela atual)";
            }
         } else if (pathname.includes("/quizzes")) {
            contextStr += await fetchQuizzes();
         } else if (pathname.includes("/anotacoes")) {
            contextStr += await fetchNotes();
         } else {
            // Default fallback if they select current but are not in a deep page
            contextStr += await fetchContents();
         }
      }

    } catch (e) {
      console.error("Context fetch error", e);
    }

    return contextStr;
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
       const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
       
       const contextData = await gatherContext();
       const systemInstruction = `Você é um tutor de inteligência artificial auxiliar para este módulo de estudos. 
Ajude o usuário com base no conhecimento do módulo atual se pertinente.
CONHECIMENTO DO MÓDULO (Fornecido em tempo real):\n${contextData}

Responda em Markdown. Seja conciso e educado.`;

       // Format chat history
       const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
       
       // Use the recommended model for text tasks
       const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
             ...history,
             { role: "user", parts: [{ text: userMsg }] }
          ],
          config: {
             systemInstruction: systemInstruction,
             temperature: 0.7,
          }
       });

       const responseText = response.text || "Desculpe, não consegui processar sua resposta.";
       
       setMessages(prev => [...prev, { role: "model", text: responseText }]);
    } catch (e: any) {
       console.error("IA Chat Error:", e);
       setMessages(prev => [...prev, { role: "model", text: "Ocorreu um erro ao conectar com o agente de IA." }]);
    } finally {
       setIsTyping(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-transform active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up transition-all duration-300 ${isExpanded ? 'inset-4 md:inset-10 lg:inset-20' : 'bottom-24 right-6 w-[90vw] max-w-[400px] h-[600px] max-h-[75vh]'}`}>
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white shrink-0 flex flex-col gap-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <BotMessageSquare className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Tutor com IA</h3>
               </div>
               <div className="flex items-center gap-1">
                 <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-blue-700 rounded transition-colors text-blue-100 hover:text-white" title={isExpanded ? "Restaurar tamanho" : "Expandir"}>
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                 </button>
                 <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-blue-700 rounded transition-colors text-blue-100 hover:text-white" title="Fechar">
                    <X className="w-4 h-4" />
                 </button>
               </div>
             </div>
             
             {/* Context Selector */}
             <div className="relative group">
                <select 
                  value={contextMode}
                  onChange={(e) => setContextMode(e.target.value as any)}
                  className="w-full appearance-none bg-blue-700/50 hover:bg-blue-700 text-white text-xs px-3 py-2 border border-blue-500 rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">Todo o conhecimento do Módulo</option>
                  <option value="current">Apenas o Contexto da Página Atual</option>
                  <option value="contents">Apenas Páginas de Conteúdo</option>
                  <option value="quizzes">Apenas Quizzes</option>
                  <option value="notes">Apenas Anotações</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-2.5 pointer-events-none opacity-70" />
             </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-zinc-950">
             {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-4">
                   <Sparkles className="w-12 h-12 text-blue-500 mb-4 opacity-50" />
                   <p className="text-sm text-slate-600 dark:text-zinc-400">
                      Olá! Eu sou sua IA de assistência. Altere o contexto acima e pergunte algo sobre seus estudos!
                   </p>
                </div>
             )}
             
             {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-bl-sm'}`}>
                     {msg.role === 'model' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                           <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                     ) : (
                        msg.text
                     )}
                   </div>
                </div>
             ))}

             {isTyping && (
                <div className="flex justify-start">
                   <div className="max-w-[80%] rounded-2xl p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-bl-sm">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                   </div>
                </div>
             )}
             
             <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 shrink-0">
             <form 
               onSubmit={e => { e.preventDefault(); handleSend(); }}
               className="flex items-center gap-2"
             >
                <input 
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Pergunte sobre seus estudos..."
                  disabled={isTyping}
                  className="flex-1 bg-slate-100 dark:bg-zinc-800 px-4 py-2.5 rounded-full text-sm outline-none border border-transparent focus:border-blue-500 disabled:opacity-50"
                />
                <Button 
                   type="submit" 
                   disabled={!input.trim() || isTyping} 
                   size="icon" 
                   className="rounded-full w-10 h-10 shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                >
                   <Send className="w-4 h-4" />
                </Button>
             </form>
          </div>
        </div>
      )}
    </>
  );
}
