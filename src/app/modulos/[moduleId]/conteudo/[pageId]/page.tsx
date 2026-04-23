import React from "react";
import ModuleContentPage from "@/src/features/modules/components/module-content-page";

export default async function ModuloConteudoRoute({ params }: { params: Promise<{ moduleId: string, pageId: string }> }) {
  const { moduleId, pageId } = await params;
  return <ModuleContentPage moduleId={moduleId} pageId={pageId} />;
}
