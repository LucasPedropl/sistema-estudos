import React from "react";
import ModuleNotesTab from "@/src/features/modules/components/module-notes-tab";

export default async function ModuloNotesPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  return <ModuleNotesTab moduleId={moduleId} />;
}
