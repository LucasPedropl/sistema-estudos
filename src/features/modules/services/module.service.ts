import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

export interface ModuleData {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface VideoMetadata {
  id?: string;
  moduleId: string;
  name: string;
  localHandleId: string; // The UUID tying this to idb-keyval mapping
  order: number;
}

export interface PDFMetadata {
  id?: string;
  moduleId: string;
  name: string;
  localHandleId: string;
  order: number;
}

export interface NoteData {
  id?: string;
  moduleId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isBookmarked?: boolean;
}

export interface ContentPageData {
  id?: string;
  moduleId: string;
  title: string;
  content: string;
  icon?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  isBookmarked?: boolean;
}

export const createModule = async (userId: string, name: string, description: string): Promise<string> => {
  const docRef = await addDoc(collection(db, "modules"), {
    userId,
    name,
    description,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const getModules = async (userId: string): Promise<ModuleData[]> => {
  const q = query(collection(db, "modules"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const modules: ModuleData[] = [];
  snapshot.forEach(doc => {
    modules.push({ id: doc.id, ...doc.data() } as ModuleData);
  });
  return modules.sort((a,b) => b.createdAt - a.createdAt);
};

export const getModuleById = async (moduleId: string): Promise<ModuleData | null> => {
  // Simplificação: num cenário real, faríamos um getDoc()
  // Para evitar chamadas isoladas extras se não tiver configurado security rules perfeitas, podemos buscar na listagem ou query
  const snapshot = await getDocs(query(collection(db, "modules")));
  let mod: ModuleData | null = null;
  snapshot.forEach(doc => {
    if (doc.id === moduleId) mod = { id: doc.id, ...doc.data() } as ModuleData;
  });
  return mod;
}

export const deleteModule = async (moduleId: string) => {
  await deleteDoc(doc(db, "modules", moduleId));
};

export const addVideoToModule = async (moduleId: string, name: string, localHandleId: string, order: number) => {
  const docRef = await addDoc(collection(db, "videos"), {
    moduleId,
    name,
    localHandleId,
    order
  });
  return docRef.id;
};

export const getVideosForModule = async (moduleId: string): Promise<VideoMetadata[]> => {
  const q = query(collection(db, "videos"), where("moduleId", "==", moduleId));
  const snapshot = await getDocs(q);
  const videos: VideoMetadata[] = [];
  snapshot.forEach(doc => videos.push({ id: doc.id, ...doc.data() } as VideoMetadata));
  return videos.sort((a,b) => a.order - b.order);
};

export const deleteVideoMetadata = async (videoId: string) => {
  await deleteDoc(doc(db, "videos", videoId));
};

export const addPdfToModule = async (moduleId: string, name: string, localHandleId: string, order: number) => {
  const docRef = await addDoc(collection(db, "pdfs"), {
    moduleId,
    name,
    localHandleId,
    order
  });
  return docRef.id;
};

export const getPdfsForModule = async (moduleId: string): Promise<PDFMetadata[]> => {
  const q = query(collection(db, "pdfs"), where("moduleId", "==", moduleId));
  const snapshot = await getDocs(q);
  const pdfs: PDFMetadata[] = [];
  snapshot.forEach(doc => pdfs.push({ id: doc.id, ...doc.data() } as PDFMetadata));
  return pdfs.sort((a,b) => a.order - b.order);
};

export const deletePdfMetadata = async (pdfId: string) => {
  await deleteDoc(doc(db, "pdfs", pdfId));
};

export const addNoteToModule = async (moduleId: string, title: string, content: string) => {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "notes"), {
    moduleId,
    title,
    content,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateNote = async (noteId: string, title: string, content: string) => {
  await updateDoc(doc(db, "notes", noteId), {
    title,
    content,
    updatedAt: Date.now()
  });
};

export const getNotesForModule = async (moduleId: string): Promise<NoteData[]> => {
  const q = query(collection(db, "notes"), where("moduleId", "==", moduleId));
  const snapshot = await getDocs(q);
  const notes: NoteData[] = [];
  snapshot.forEach(doc => notes.push({ id: doc.id, ...doc.data() } as NoteData));
  return notes.sort((a,b) => b.updatedAt - a.updatedAt);
};

export const deleteNote = async (noteId: string) => {
  await deleteDoc(doc(db, "notes", noteId));
};

export const createContentPage = async (moduleId: string, title: string, content: string, order: number) => {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "contentPages"), {
    moduleId,
    title,
    content,
    order,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateContentPage = async (pageId: string, title: string, content: string, isBookmarked?: boolean, icon?: string) => {
  const data: any = {
    title,
    content,
    updatedAt: Date.now()
  };
  if (isBookmarked !== undefined) {
    data.isBookmarked = isBookmarked;
  }
  if (icon !== undefined) {
    data.icon = icon;
  }
  await updateDoc(doc(db, "contentPages", pageId), data);
};

export const updateContentPagesOrder = async (updates: { id: string, order: number }[]) => {
  const promises = updates.map(u => updateDoc(doc(db, "contentPages", u.id), { order: u.order }));
  await Promise.all(promises);
};

export const getContentPagesForModule = async (moduleId: string): Promise<ContentPageData[]> => {
  const q = query(collection(db, "contentPages"), where("moduleId", "==", moduleId));
  const snapshot = await getDocs(q);
  const pages: ContentPageData[] = [];
  snapshot.forEach(doc => pages.push({ id: doc.id, ...doc.data() } as ContentPageData));
  return pages.sort((a,b) => a.order - b.order || a.createdAt - b.createdAt);
};

export const deleteContentPage = async (pageId: string) => {
  await deleteDoc(doc(db, "contentPages", pageId));
};

export interface QuizData {
  id?: string;
  moduleId: string;
  title: string;
  questionsJson: string;
  createdAt: number;
  updatedAt: number;
}

export const createQuiz = async (moduleId: string, title: string, questionsJson: string) => {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "quizzes"), {
    moduleId,
    title,
    questionsJson,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateQuiz = async (quizId: string, title: string, questionsJson: string) => {
  await updateDoc(doc(db, "quizzes", quizId), {
    title,
    questionsJson,
    updatedAt: Date.now()
  });
};

export const getQuizzesForModule = async (moduleId: string): Promise<QuizData[]> => {
  const q = query(collection(db, "quizzes"), where("moduleId", "==", moduleId));
  const snapshot = await getDocs(q);
  const quizzes: QuizData[] = [];
  snapshot.forEach(doc => quizzes.push({ id: doc.id, ...doc.data() } as QuizData));
  return quizzes.sort((a,b) => b.updatedAt - a.updatedAt);
};

export const deleteQuiz = async (quizId: string) => {
  await deleteDoc(doc(db, "quizzes", quizId));
};
