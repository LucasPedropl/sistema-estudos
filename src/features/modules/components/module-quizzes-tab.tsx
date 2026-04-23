"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/src/components/ui/button";
import { Plus, BrainCircuit, Trash2, Edit3, Save, CheckCircle, XCircle, Code, Play, Flag } from "lucide-react";
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

  useEffect(() => {
    loadQuizzes();
  }, [moduleId]);

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
    await updateQuiz(selectedQuiz.id, editTitle, editJson);
    await loadQuizzes();
    setIsSaving(false);
    resetPlayer(editJson);
  }

  async function handleDeleteQuiz(id: string) {
    if (confirm("Quer mesmo deletar este quiz permanentemente?")) {
       await deleteQuiz(id);
       if (selectedQuiz?.id === id) {
         setSelectedQuiz(null);
       }
       loadQuizzes();
    }
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

  function handleNextQuestion() {
    if (currentQIndex < parsedQuestions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar List */}
      <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-14rem)]">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
           <span className="font-semibold text-slate-900 dark:text-zinc-50 text-sm">Meus Quizzes</span>
           <Button size="icon" variant="ghost" onClick={handleCreateQuiz} className="h-8 w-8 text-blue-600 dark:text-blue-400">
             <Plus className="w-5 h-5" />
           </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {quizzes.length === 0 && <p className="text-xs text-center text-slate-500 mt-4">Nenhum quiz.</p>}
          {quizzes.map((quiz) => {
             const isSelected = selectedQuiz?.id === quiz.id;
             return (
               <div 
                 key={quiz.id} 
                 className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                 onClick={() => handleSelect(quiz)}
               >
                 <div className="flex items-center gap-3 overflow-hidden">
                   <BrainCircuit className={cn("w-4 h-4 shrink-0", isSelected ? "text-blue-500" : "text-slate-400")} />
                   <span className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                     {quiz.title}
                   </span>
                 </div>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); quiz.id && handleDeleteQuiz(quiz.id); }}>
                   <Trash2 className="w-4 h-4" />
                 </Button>
               </div>
             )
          })}
        </div>
      </div>

      {/* Main Area */}
      <div className="lg:col-span-3 flex flex-col h-[calc(100vh-14rem)] bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {!selectedQuiz ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
              <BrainCircuit className="w-12 h-12 opacity-50 mb-2 text-blue-500" />
              <p>Nenhum Quiz selecionado.</p>
              <Button onClick={handleCreateQuiz} className="mt-2 text-white bg-blue-600 hover:bg-blue-700">
                 Criar Quiz
              </Button>
            </div>
        ) : (
           <>
             {/* Header */}
             <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4">
                <input 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="flex-1 font-display text-2xl font-bold bg-transparent outline-none text-slate-900 dark:text-zinc-50 border-none placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                  placeholder="Nome do Quiz"
                  disabled={mode === "play"}
                />
                
                <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setMode("play"); resetPlayer(editJson); }}
                    className={cn("text-xs gap-2", mode === "play" && "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400")}
                  >
                    <Play className="w-3.5 h-3.5" /> Jogar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMode("edit")}
                    className={cn("text-xs gap-2", mode === "edit" && "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400")}
                  >
                    <Code className="w-3.5 h-3.5" /> Editar JSON
                  </Button>
                </div>
             </div>
             
             {/* Body */}
             <div className="flex-1 overflow-hidden relative">
               {mode === "edit" ? (
                 <div className="h-full flex flex-col sm:flex-row">
                    <div className="flex-1 p-4 flex flex-col gap-2">
                       <div className="flex items-center justify-between">
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
                    <div className="w-full sm:w-80 bg-slate-50 dark:bg-zinc-950/50 p-6 border-l border-slate-200 dark:border-zinc-800 overflow-y-auto hidden md:block">
                       <h3 className="font-semibold text-slate-900 dark:text-zinc-50 mb-2">Formato Exigido</h3>
                       <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                         Para criar novas perguntas ou alterar este quiz, forneça um Array de Objetos JSON exato contendo: <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">question</code>, <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">options</code> (Array), <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">correctIndex</code> (posição começa no 0), e <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">explanation</code> (opcional).
                       </p>
                       <pre className="text-xs bg-slate-900 !text-green-400 p-4 rounded-xl overflow-x-auto">
{`[
  {
    "question": "Pergunta 1",
    "options": [
      "Opção A",
      "Opção B",
      "Opção C"
    ],
    "correctIndex": 1,
    "explanation": "Pois a opção B é..."
  }
]`}
                       </pre>
                    </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col p-6 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/50">
                    {parsedQuestions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                         <BrainCircuit className="w-12 h-12 opacity-50 mb-4" />
                         <p>Nenhuma pergunta válida encontrada no JSON.</p>
                      </div>
                    ) : reviewMode ? (
                      <div className="max-w-3xl w-full mx-auto flex flex-col py-8 animate-fade-in-up">
                         <div className="flex items-center justify-between mb-8">
                             <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Sua Revisão de Perguntas</h2>
                             <Button onClick={() => setReviewMode(false)} variant="outline">Voltar ao Resultado</Button>
                         </div>
                         <div className="space-y-6">
                            {Array.from(flaggedIndexes).map(index => {
                               const q = parsedQuestions[index];
                               if (!q) return null;
                               return (
                                 <div key={index} className="bg-white dark:bg-zinc-900 border-2 border-yellow-300 dark:border-yellow-600/50 rounded-xl p-6">
                                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 mb-3">
                                       <Flag className="w-4 h-4 fill-current" />
                                       <span className="text-sm font-semibold uppercase tracking-wider">Pergunta {index + 1}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-4">{q.question}</h3>
                                    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-lg mb-4 border border-slate-200 dark:border-zinc-800">
                                       <span className="text-sm font-semibold text-slate-500 block mb-1">Resposta Correta:</span>
                                       <p className="text-green-700 dark:text-green-400 font-medium">{q.options[q.correctIndex]}</p>
                                    </div>
                                    {q.explanation && (
                                       <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-blue-800 dark:text-blue-300">
                                          <span className="text-sm font-semibold block mb-1">Explicação:</span>
                                          <p className="text-sm">{q.explanation}</p>
                                       </div>
                                    )}
                                 </div>
                               );
                            })}
                         </div>
                      </div>
                    ) : isFinished ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
                         <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                           <span className="text-4xl font-display font-bold text-blue-600 dark:text-blue-400">
                             {score}/{parsedQuestions.length}
                           </span>
                         </div>
                         <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Quiz Concluído!</h2>
                         <p className="text-slate-500 mb-8 max-w-sm">Você finalizou com sucesso as perguntas deste banco.</p>
                         <div className="flex flex-col sm:flex-row gap-3">
                           <Button onClick={() => resetPlayer(editJson)} size="lg" className="w-full sm:w-auto">
                             Jogar Novamente
                           </Button>
                           {flaggedIndexes.size > 0 && (
                             <Button onClick={() => setReviewMode(true)} variant="outline" size="lg" className="w-full sm:w-auto gap-2 border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30">
                               <Flag className="w-4 h-4 fill-current" /> Revisar Destaques ({flaggedIndexes.size})
                             </Button>
                           )}
                         </div>
                      </div>
                    ) : (
                      <div className="max-w-3xl w-full mx-auto flex flex-col py-8 animate-fade-in-up">
                         <div className="flex justify-between items-center mb-8">
                            <span className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
                              Progresso
                            </span>
                            <div className="flex items-center gap-4">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className={cn("gap-2 border-slate-200 dark:border-zinc-700", flaggedIndexes.has(currentQIndex) && "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border-yellow-300 dark:border-yellow-700")}
                                 onClick={handleToggleFlag}
                               >
                                  <Flag className={cn("w-3.5 h-3.5", flaggedIndexes.has(currentQIndex) && "fill-current")} /> Destacar para Revisão
                               </Button>
                               <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-700 shadow-sm">
                                 Pergunta {currentQIndex + 1} de {parsedQuestions.length}
                               </span>
                            </div>
                         </div>
                         
                         <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-50 mb-10 leading-tight">
                           {parsedQuestions[currentQIndex]?.question}
                         </h2>
                         
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
                                   "text-left p-4 sm:p-5 rounded-2xl border-2 transition-all font-medium flex items-center justify-between",
                                   buttonClass
                                 )}
                               >
                                 <span className="text-base sm:text-lg">{opt}</span>
                                 {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                                 {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                               </button>
                             );
                           })}
                         </div>
                         
                         {selectedOption !== null && (
                           <div className="mt-8 animate-fade-in-up">
                             {parsedQuestions[currentQIndex].explanation && (
                                <div className="p-4 bg-slate-100 dark:bg-zinc-800/50 rounded-xl mb-6 border border-slate-200 dark:border-zinc-800">
                                   <span className="font-semibold text-sm text-slate-700 dark:text-zinc-300 block mb-1">Explicação:</span>
                                   <p className="text-slate-600 dark:text-zinc-400 text-sm">
                                     {parsedQuestions[currentQIndex].explanation}
                                   </p>
                                </div>
                             )}
                             <Button onClick={handleNextQuestion} size="lg" className="w-full text-base">
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
