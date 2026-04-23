import React from "react";
import ModulePdfsTab from "@/src/features/modules/components/module-pdfs-tab";

export default async function ModuloPdfsPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  return <ModulePdfsTab moduleId={moduleId} />;
}
