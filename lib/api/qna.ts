import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { getDb } from "./firebase";

export interface Question {
  id: string;
  itemId: string;
  authorId: string;
  authorName: string;
  content: string;
  answer?: string;
  answeredAt?: any;
  isAnswered: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface CreateQuestionInput {
  itemId: string;
  authorId: string;
  authorName: string;
  content: string;
}

// 질문 생성
export async function createQuestion(
  input: CreateQuestionInput
): Promise<{ success: boolean; questionId?: string; error?: string }> {
  const db = await getDb();
  try {
    const docRef = await addDoc(collection(db, "questions"), {
      ...input,
      isAnswered: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      questionId: docRef.id,
    };
  } catch (error) {
    console.error("질문 생성 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "질문 생성에 실패했습니다.",
    };
  }
}

// 질문 삭제
export async function deleteQuestion(
  questionId: string,
  authorId: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  try {
    const docRef = doc(db, "questions", questionId);
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    console.error("질문 삭제 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "질문 삭제에 실패했습니다.",
    };
  }
}

// 답변 추가
export async function addAnswer(
  questionId: string,
  answer: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  try {
    const docRef = doc(db, "questions", questionId);
    await updateDoc(docRef, {
      answer,
      isAnswered: true,
      answeredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("답변 추가 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "답변 추가에 실패했습니다.",
    };
  }
}

// 상품별 질문 목록 조회
export async function getQuestionsByItem(
  itemId: string
): Promise<{ success: boolean; questions?: Question[]; error?: string }> {
  const db = await getDb();
  try {
    const q = query(
      collection(db, "questions"),
      where("itemId", "==", itemId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];

    querySnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() } as Question);
    });

    return {
      success: true,
      questions,
    };
  } catch (error) {
    console.error("질문 목록 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "질문 목록 조회에 실패했습니다.",
    };
  }
}

// 실시간 질문 구독
export function subscribeToQuestions(
  itemId: string,
  callback: (questions: Question[]) => void
): () => void {
  const q = query(
    collection(db, "questions"),
    where("itemId", "==", itemId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, querySnapshot => {
    const questions: Question[] = [];
    querySnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() } as Question);
    });
    callback(questions);
  });
}
