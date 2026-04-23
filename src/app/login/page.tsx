"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/src/components/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { BookOpen, LogIn } from "lucide-react";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500 text-white dark:text-zinc-50 shadow-lg">
            <BookOpen className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              P.E.A
            </h1>
            <p className="text-slate-500 dark:text-zinc-400">
              Plataforma de Estudos Acadêmicos
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 mb-4">
              Bem-vindo(a) estudante!
            </h2>
            <Button 
              onClick={login} 
              className="w-full py-6 text-base gap-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-slate-200 border-none transition-all shadow-md"
            >
              <LogIn className="w-5 h-5" />
              Entrar via Google
            </Button>
            <p className="mt-4 text-xs text-slate-400 dark:text-zinc-500">
              Ambiente de aprendizado restrito. Faça login para desbloquear a plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
