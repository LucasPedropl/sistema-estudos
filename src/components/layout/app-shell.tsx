"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/components/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [loading, user, pathname, router]);
  
  useEffect(() => {
    // Close mobile menu on navigation
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user && pathname === "/login") {
    return <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">{children}</div>;
  }

  if (!user) {
    return null; // Preventing flashes of app before push resolves
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex-col bg-white dark:bg-black transition-transform duration-300 ease-in-out md:flex md:translate-x-0 shadow-2xl md:shadow-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col md:pl-64 min-h-screen w-full">
        <MobileNav onOpenSidebar={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
