export type StudyModuleDTO = {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalTopics: number;
  completedTopics: number;
  lastAccessed: string;
  coverColor?: string; // Tailwind class name or hex for design variation
};
