import type { StudyModuleDTO } from "./types";

export const MOCK_RECENT_MODULES: StudyModuleDTO[] = [
  {
    id: "m-1",
    title: "Introdução ao Clean Architecture",
    description: "Conceitos fundamentais sobre arquitetura de software limpa, separação de preocupações e design patterns estruturais.",
    progress: 35,
    totalTopics: 12,
    completedTopics: 4,
    lastAccessed: new Date().toISOString(),
    coverColor: "bg-blue-500",
  },
  {
    id: "m-2",
    title: "Princípios Avançados de Next.js",
    description: "Estudo profundo sobre Server e Client Components, sistema de cache, mutations e performance de roteamento.",
    progress: 80,
    totalTopics: 5,
    completedTopics: 4,
    lastAccessed: new Date(Date.now() - 86400000).toISOString(),
    coverColor: "bg-indigo-500",
  },
  {
    id: "m-3",
    title: "Design de APIs e GraphQL",
    description: "Análise comparativa e melhores práticas para construção de interfaces no modelo RESTful versus subgrafos.",
    progress: 0,
    totalTopics: 8,
    completedTopics: 0,
    lastAccessed: new Date(Date.now() - 86400000 * 3).toISOString(),
    coverColor: "bg-emerald-500",
  }
];
