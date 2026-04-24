"use client";

import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/src/components/ui/button";
import { Plus, BrainCircuit, Trash2, Save, CheckCircle, XCircle, Code, Play, Flag, Edit2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getQuizzesForModule, createQuiz, updateQuiz, deleteQuiz, QuizData } from "@/src/features/modules/services/module.service";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const TEMPLATE_JSON = `[
  {
    "question": "Qual é a capital do Brasil?",
    "options": ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"],
    "correctIndex": 2,
    "explanation": "Brasília foi construída com esse objetivo e inaugurada em 1960."
  }
]`;

export default function ModuleQuizzesTab({ moduleId }: { moduleId: string }) {
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizData | null>(null);

  // Editor
  const [editTitle, setEditTitle] = useState("");
  const [editJson, setEditJson] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"play" | "edit">("play");

  // Player State
  const [parsedQuestions, setParsedQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // Flagging / Bookmarking Logic
  const [flaggedIndexes, setFlaggedIndexes] = useState<Set<number>>(new Set());
  const [reviewMode, setReviewMode] = useState(false);
  
  // Editable Sidebar rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadQuizzes();
  }, [moduleId]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
  }, [renamingId]);

  async function loadQuizzes() {
    const loaded = await getQuizzesForModule(moduleId);
    setQuizzes(loaded);
    if (loaded.length > 0 && !selectedQuiz) {
      handleSelect(loaded[0]);
    } else if (loaded.length === 0) {
      setSelectedQuiz(null);
    } else if (selectedQuiz) {
      const still = loaded.find(q => q.id === selectedQuiz.id);
      if (still) handleSelect(still);
    }
  }

  function handleSelect(quiz: QuizData) {
    if (renamingId) return; // Prevent selection change while renaming
    setSelectedQuiz(quiz);
    setEditTitle(quiz.title);
    setEditJson(quiz.questionsJson);
    resetPlayer(quiz.questionsJson);
    setMode("play");
  }

  function resetPlayer(jsonString: string) {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
    setReviewMode(false);
    setFlaggedIndexes(new Set());
    try {
      const parsed = JSON.parse(jsonString || "[]");
      if (Array.isArray(parsed)) {
        setParsedQuestions(parsed);
      } else {
        setParsedQuestions([]);
      }
    } catch (e) {
      setParsedQuestions([]);
    }
  }

  async function handleCreateQuiz() {
    const newId = await createQuiz(moduleId, "Novo Quiz", TEMPLATE_JSON);
    await loadQuizzes();
    const loaded = await getQuizzesForModule(moduleId);
    const created = loaded.find(q => q.id === newId);
    if (created) {
       handleSelect(created);
       setMode("edit");
    }
  }

  async function handleSaveQuiz() {
    if (!selectedQuiz?.id) return;
    try {
      JSON.parse(editJson); // Validate JSON before saving
    } catch (e) {
      alert("O formato JSON é inválido! Por favor corrija os erros de syntax antes de salvar.");
      return;
    }
    
    setIsSaving(true);
    await updateQuiz(selectedQuiz.id, editTitle.trim() || selectedQuiz.title, editJson);
    await loadQuizzes();
    setIsSaving(false);
    resetPlayer(editJson);
  }

  async function handleRenameSidebar(id: string, newTitle: string) {
    const q = quizzes.find(x => x.id === id);
    if (q && newTitle.trim()) {
       await updateQuiz(id, newTitle.trim(), q.questionsJson);
       if (selectedQuiz?.id === id) {
          setEditTitle(newTitle.trim());
       }
       await loadQuizzes();
    }
    setRenamingId(null);
  }

  async function handleDeleteQuiz(id: string) {
    // Removed window.confirm for iframe compatibility
    await deleteQuiz(id);
    if (selectedQuiz?.id === id) {
        setSelectedQuiz(null);
    }
    loadQuizzes();
  }

  function handleToggleFlag() {
    setFlaggedIndexes(prev => {
       const newSet = new Set(prev);
       if (newSet.has(currentQIndex)) newSet.delete(currentQIndex);
       else newSet.add(currentQIndex);
       return newSet;
    });
  }

  function handleAnswer(index: number) {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(index);
    if (index === parsedQuestions[currentQIndex].correctIndex) {
      setScore(s => s + 1);
    }
  }

  async function handleNextQuestion() {
    if (currentQIndex < parsedQuestions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      // Auto-create review quiz when finished if there are flagged items
      if (flaggedIndexes.size > 0 && selectedQuiz) {
         try {
           const flaggedQ = Array.from(flaggedIndexes).map(i => parsedQuestions[i]);
           const reviewTitle = `Revisão - ${selectedQuiz.title}`;
           const reviewJson = JSON.stringify(flaggedQ, null, 2);
           await createQuiz(moduleId, reviewTitle, reviewJson);
           await loadQuizzes();
         } catch(e) {
           console.error("Error generating review quiz", e);
         }
      }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
      {/* Sidebar List - More compact and specialized */}
      <div className="w-full lg:w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/50">
           <span className="font-bold text-slate-900 dark:text-zinc-50 text-sm tracking-tight">Meus Quizzes</span>
           <Button size="icon" variant="ghost" onClick={handleCreateQuiz} className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
             <Plus className="w-5 h-5" />
           </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {quizzes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <BrainCircuit className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nenhum quiz</p>
            </div>
          )}
          {quizzes.map((quiz) => {
             const isSelected = selectedQuiz?.id === quiz.id;
             const isRenaming = renamingId === quiz.id;
             
             return (
               <div 
                 key={quiz.id} 
                 className={cn(
                    "group flex items-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer mb-1",
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                 )}
                 onClick={() => handleSelect(quiz)}
               >
                 <div className="flex items-center gap-2.5 w-full overflow-hidden">
                   <div className={cn(
                     "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                     isSelected ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                   )}>
                     <BrainCircuit className="w-4 h-4" />
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     {isRenaming ? (
                        <input 
                           ref={renameInputRef}
                           defaultValue={quiz.title}
                           onBlur={(e) => handleRenameSidebar(quiz.id!, e.target.value)}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSidebar(quiz.id!, e.currentTarget.value);
                              if (e.key === 'Escape') setRenamingId(null);
                           }}
                           className="w-full bg-white dark:bg-black border border-blue-500 rounded px-1 text-xs font-semibold outline-none text-slate-900 dark:text-zinc-50"
                        />
                     ) : (
                        <span className={cn(
                          "text-xs font-bold truncate block leading-tight", 
                          isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'
                        )}>
                          {quiz.title}
                        </span>
                     )}
                   </div>
                   
                   {!isRenaming && (
                       <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-zinc-700" onClick={(e) => { e.stopPropagation(); setRenamingId(quiz.id!); }}>
                           <Edit2 className="w-3 h-3" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-700" onClick={(e) => { e.stopPropagation(); quiz.id && handleDeleteQuiz(quiz.id); }}>
                           <Trash2 className="w-3 h-3" />
                         </Button>
                       </div>
                   )}
                 </div>
               </div>
             )
          })}
        </div>
      </div>

      {/* Main Area - Maximized */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden relative">
        {!selectedQuiz ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 p-6 text-center">
              <BrainCircuit className="w-12 h-12 opacity-50 mb-2 text-blue-500" />
              <p>Nenhum Quiz selecionado. Escolha na barra lateral ou crie um novo.</p>
              <Button onClick={handleCreateQuiz} className="mt-2 text-white bg-blue-600 hover:bg-blue-700">
                 Criar Quiz
              </Button>
            </div>
        ) : (
           <>
             {/* Header */}
             <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <input 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={handleSaveQuiz}
                  className="flex-1 font-display text-2xl font-bold bg-transparent outline-none text-slate-900 dark:text-zinc-50 border-none placeholder:text-slate-300 dark:placeholder:text-zinc-700 truncate"
                  placeholder="Nome do Quiz"
                />
                
                <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0 w-full sm:w-auto justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setMode("play"); resetPlayer(editJson); }}
                    className={cn("text-xs gap-2 flex-1 sm:flex-none", mode === "play" && "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400")}
                  >
                    <Play className="w-3.5 h-3.5" /> Jogar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMode("edit")}
                    className={cn("text-xs gap-2 flex-1 sm:flex-none", mode === "edit" && "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400")}
                  >
                    <Code className="w-3.5 h-3.5" /> Editar JSON
                  </Button>
                </div>
             </div>
             
             {/* Body */}
             <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
               {mode === "edit" ? (
                 <div className="h-full flex flex-col md:flex-row flex-1 min-h-0">
                    <div className="flex-1 p-4 flex flex-col gap-2 min-h-0">
                       <div className="flex items-center justify-between shrink-0">
                         <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                           Banco de Perguntas (JSON Array)
                         </label>
                         <Button onClick={handleSaveQuiz} disabled={isSaving} size="sm" className="gap-2">
                           <Save className="w-3.5 h-3.5" /> {isSaving ? "..." : "Salvar Banco"}
                         </Button>
                       </div>
                       <textarea 
                         value={editJson}
                         onChange={e => setEditJson(e.target.value)}
                         className="flex-1 w-full p-4 font-mono text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl resize-none outline-none text-slate-800 dark:text-zinc-200"
                         spellCheck={false}
                       />
                    </div>
                    <div className="w-full md:w-80 bg-slate-50 dark:bg-zinc-950/50 p-6 border-t md:border-t-0 md:border-l border-slate-200 dark:border-zinc-800 overflow-y-auto shrink-0 md:block">
                       <h3 className="font-semibold text-slate-900 dark:text-zinc-50 mb-2">Formato Exigido</h3>
                       <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                         Para criar novas perguntas ou alterar este quiz, forneça um Array de Objetos JSON exato contendo: <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">question</code>, <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">options</code> (Array), <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">correctIndex</code> (posição começa no 0), e <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">explanation</code> (opcional).
                       </p>
                       <pre className="text-xs bg-slate-900 !text-green-400 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap word-break">
{`[
  {
    "question": "Pergunta 1?",
    "options": [
      "Opção A",
      "Opção B"
    ],
    "correctIndex": 1
  }
]`}
                       </pre>
                    </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/50 min-h-0 custom-scrollbar">
                    {parsedQuestions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
                         <BrainCircuit className="w-12 h-12 opacity-50 mb-4" />
                         <p>Nenhuma pergunta válida encontrada no JSON.</p>
                      </div>
                    ) : reviewMode ? (
                      <div className="max-w-3xl w-full mx-auto flex flex-col py-4 sm:py-8 animate-fade-in-up">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                             <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Avaliação de Destaques</h2>
                             <Button onClick={() => setReviewMode(false)} variant="outline" className="w-full sm:w-auto">Voltar ao Resultado</Button>
                         </div>
                         <div className="space-y-6">
                            {Array.from(flaggedIndexes).map(index => {
                               const q = parsedQuestions[index];
                               if (!q) return null;
                               return (
                                 <div key={index} className="bg-white dark:bg-zinc-900 border-2 border-yellow-300 dark:border-yellow-600/50 rounded-xl p-4 sm:p-6 shadow-sm">
                                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 mb-3">
                                       <Flag className="w-4 h-4 fill-current" />
                                       <span className="text-sm font-semibold uppercase tracking-wider">Pergunta {index + 1}</span>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-50 mb-4 break-words">{q.question}</h3>
                                    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-lg mb-4 border border-slate-200 dark:border-zinc-800">
                                       <span className="text-sm font-semibold text-slate-500 block mb-1">Resposta Correta:</span>
                                       <p className="text-green-700 dark:text-green-400 font-medium break-words">{q.options[q.correctIndex]}</p>
                                    </div>
                                    {q.explanation && (
                                       <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-blue-800 dark:text-blue-300">
                                          <span className="text-sm font-semibold block mb-1">Explicação:</span>
                                          <p className="text-sm break-words">{q.explanation}</p>
                                       </div>
                                    )}
                                 </div>
                               );
                            })}
                            {flaggedIndexes.size === 0 && (
                               <p className="text-slate-500 text-center py-10">Nenhuma pergunta destacada para revisão.</p>
                            )}
                         </div>
                      </div>
                    ) : isFinished ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up min-h-[300px]">
                         <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                           <span className="text-4xl font-display font-bold text-blue-600 dark:text-blue-400">
                             {score}/{parsedQuestions.length}
                           </span>
                         </div>
                         <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Quiz Concluído!</h2>
                         <p className="text-slate-500 mb-8 max-w-sm">Você finalizou com sucesso as perguntas deste banco.</p>
                         
                         {flaggedIndexes.size > 0 && (
                             <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-800 dark:text-yellow-500 max-w-md">
                               <p className="text-sm font-medium">
                                  Um novo quiz contendo apenas as <strong>{flaggedIndexes.size}</strong> perguntas destacadas foi gerado automaticamente e adicionado à sua barra lateral para revisão futura!
                               </p>
                             </div>
                         )}

                         <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                           <Button onClick={() => resetPlayer(editJson)} size="lg" className="w-full sm:flex-1">
                             Jogar Novamente
                           </Button>
                           {flaggedIndexes.size > 0 && (
                             <Button onClick={() => setReviewMode(true)} variant="outline" size="lg" className="w-full sm:flex-1 gap-2 border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30">
                               <Flag className="w-4 h-4 fill-current shrink-0" /> Ver Destaques
                             </Button>
                           )}
                         </div>
                      </div>
                    ) : (
                      <div className="max-w-3xl w-full mx-auto flex flex-col py-2 sm:py-8 animate-fade-in-up">
                         <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                            <div className="flex-1 w-full sm:w-auto">
                               <div className="flex justify-between items-center mb-1.5">
                                 <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
                                    Progresso do Quiz
                                 </span>
                                 <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                   {Math.round(((currentQIndex) / parsedQuestions.length) * 100)}%
                                 </span>
                               </div>
                               <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                    style={{ width: `${((currentQIndex) / parsedQuestions.length) * 100}%` }}
                                  />
                               </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className={cn("h-8 gap-2 border-slate-200 dark:border-zinc-700 text-xs", flaggedIndexes.has(currentQIndex) && "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border-yellow-300 dark:border-yellow-700")}
                                 onClick={handleToggleFlag}
                               >
                                  <Flag className={cn("w-3 h-3 shrink-0", flaggedIndexes.has(currentQIndex) && "fill-current")} /> 
                                  <span className="hidden xs:inline">Destacar</span>
                               </Button>
                               <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-700 shrink-0">
                                 {currentQIndex + 1} / {parsedQuestions.length}
                               </span>
                            </div>
                         </div>
                         
                         <div className="mb-8">
                            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-zinc-50 leading-tight break-words">
                              {parsedQuestions[currentQIndex]?.question}
                            </h2>
                         </div>
                         
                         <div className="flex flex-col gap-3">
                           {parsedQuestions[currentQIndex]?.options.map((opt, i) => {
                             const isCorrect = i === parsedQuestions[currentQIndex].correctIndex;
                             const isSelected = selectedOption === i;
                             const showResult = selectedOption !== null;
                             
                             let buttonClass = "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-700";
                             
                             if (showResult) {
                               if (isCorrect) buttonClass = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 z-10";
                               else if (isSelected && !isCorrect) buttonClass = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400";
                               else buttonClass = "opacity-50 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-slate-500";
                             }

                             return (
                               <button
                                 key={i}
                                 disabled={showResult}
                                 onClick={() => handleAnswer(i)}
                                 className={cn(
                                   "text-left p-3 sm:p-4 md:p-5 rounded-2xl border-2 transition-all font-medium flex items-center justify-between gap-4",
                                   buttonClass
                                 )}
                               >
                                 <span className="text-sm sm:text-base md:text-lg break-words w-full">{opt}</span>
                                 {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                                 {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                               </button>
                             );
                           })}
                         </div>
                         
                         {selectedOption !== null && (
                           <div className="mt-6 sm:mt-8 animate-fade-in-up">
                             {parsedQuestions[currentQIndex].explanation && (
                                <div className="p-4 bg-slate-100 dark:bg-zinc-800/50 rounded-xl mb-6 border border-slate-200 dark:border-zinc-800">
                                   <span className="font-semibold text-sm text-slate-700 dark:text-zinc-300 block mb-1">Explicação:</span>
                                   <p className="text-slate-600 dark:text-zinc-400 text-sm break-words">
                                     {parsedQuestions[currentQIndex].explanation}
                                   </p>
                                </div>
                             )}
                             <Button onClick={handleNextQuestion} size="lg" className="w-full text-base py-6">
                               {currentQIndex < parsedQuestions.length - 1 ? "Próxima Pergunta" : "Ver Resultados"}
                             </Button>
                           </div>
                         )}
                      </div>
                    )}
                 </div>
               )}
             </div>
           </>
        )}
      </div>
    </div>
  );
}
