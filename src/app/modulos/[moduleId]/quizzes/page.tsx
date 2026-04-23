import React from "react";
import ModuleQuizzesTab from "@/src/features/modules/components/module-quizzes-tab";

export default async function ModuloQuizzesRoute({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  return <ModuleQuizzesTab moduleId={moduleId} />;
}
