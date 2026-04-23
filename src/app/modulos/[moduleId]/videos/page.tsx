import React from "react";
import ModuleVideosTab from "@/src/features/modules/components/module-videos-tab";

export default async function ModuloVideosPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  return <ModuleVideosTab moduleId={moduleId} />;
}
