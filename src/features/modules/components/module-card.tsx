import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import type { StudyModuleDTO } from "../types";
import { Play } from "lucide-react";

export function ModuleCard({ module }: { module: StudyModuleDTO }) {
  return (
    <Card className="flex flex-col h-full overflow-hidden group">
      {/* Visual Accent header */}
      <div className={`h-2 w-full ${module.coverColor || "bg-blue-500"}`} />
      
      <CardHeader className="flex-1 pb-4">
        <div className="flex justify-between items-start gap-4 mb-2">
          <CardTitle className="text-xl group-hover:text-blue-500 transition-colors">
            {module.title}
          </CardTitle>
        </div>
        <CardDescription className="text-sm">
          {module.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium tracking-wide uppercase">
            <span>Progresso</span>
            <span>{module.progress}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${module.coverColor || "bg-blue-500"} transition-all duration-500 ease-in-out`}
              style={{ width: `${module.progress}%` }} 
            />
          </div>
          <p className="text-xs text-zinc-400 text-right mt-1">
            {module.completedTopics} de {module.totalTopics} tópicos
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 pb-6">
        <Button className="w-full gap-2 transition-transform group-hover:-translate-y-0.5" variant={module.progress === 0 ? "default" : "secondary"}>
          <Play className="w-4 h-4" />
          {module.progress === 0 ? "Começar a Estudar" : "Continuar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
