"use client";

import React, { useEffect, useState } from "react";
import { getModuleById, ModuleData } from "@/src/features/modules/services/module.service";
import { useAuth } from "@/src/components/auth-provider";
import { useParams } from "next/navigation";
import { ModuleAIChat } from "@/src/features/chat/components/module-ai-chat";

export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const params = useParams();
  const moduleId = params.moduleId as string;
  const [mod, setMod] = useState<ModuleData | null>(null);

  useEffect(() => {
    if (user && moduleId) {
      getModuleById(moduleId).then(setMod);
    }
  }, [user, moduleId]);

  if (!mod) {
     return <div className="p-8 text-center text-slate-500">Carregando módulo...</div>;
  }

  return (
    <div className="animate-fade-in-up pb-10 relative">
      {/* Tab Content - Navigation is now entirely in Sidebar */}
      <div className="pt-2">
        {children}
      </div>
      
      {/* Floating AI Assistant for Modules */}
      <ModuleAIChat moduleId={moduleId} />
    </div>
  );
}
