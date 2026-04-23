"use client";

import { Menu } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/src/components/theme-toggle";

export function MobileNav() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-4 shadow-sm sm:gap-x-6 sm:px-6 md:hidden">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="-ml-2">
          <Menu className="h-5 w-5 text-slate-600 dark:text-zinc-400" />
        </Button>

        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            P.E.A
          </span>
        </Link>
      </div>
      <ThemeToggle />
    </header>
  );
}
