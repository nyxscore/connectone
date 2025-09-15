import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../api/firebase";
import {
  PublicQuestion,
  PublicAnswer,
  CreatePublicQuestionInput,
  CreatePublicAnswerInput,
  QaListOptions,
  QaStats,
  PopularTag,
} from "../../data/qna/types";

export type { QaListOptions };

// 공개 질문 생성
export async function createPublicQuestion(
  input: CreatePublicQuestionInput
): Promise<{ success: boolean; questionId?: string; error?: string }> {
  try {
    const docRef = await addDoc(collection(db, "publicQuestions"), {
      ...input,
      views: 0,
      likes: 0,
      likedBy: [],
      answers: [],
      isResolved: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      questionId: docRef.id,
    };
  } catch (error) {
    console.error("공개 질문 생성 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "질문 생성에 실패했습니다.",
    };
  }
}

// 공개 질문 조회
export async function getPublicQuestion(
  questionId: string
): Promise<{ success: boolean; question?: PublicQuestion; error?: string }> {
  try {
    const docRef = doc(db, "publicQuestions", questionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        question: { id: docSnap.id, ...docSnap.data() } as PublicQuestion,
      };
    } else {
      return {
        success: false,
        error: "질문을 찾을 수 없습니다.",
      };
    }
  } catch (error) {
    console.error("공개 질문 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "질문 조회에 실패했습니다.",
    };
  }
}

// 공개 질문 목록 조회
export async function getPublicQuestions(options: QaListOptions = {}): Promise<{
  success: boolean;
  questions?: PublicQuestion[];
  lastDoc?: any;
  error?: string;
}> {
  try {
    const {
      limit: limitCount = 20,
      lastDoc,
      sortBy = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = options;

    let q = query(
      collection(db, "publicQuestions"),
      orderBy(sortBy, sortOrder),
      limit(limitCount)
    );

    // 필터 적용
    if (filters.isResolved !== undefined) {
      q = query(q, where("isResolved", "==", filters.isResolved));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const questions: PublicQuestion[] = [];
    let newLastDoc: any = null;

    querySnapshot.forEach(doc => {
      const questionData = { id: doc.id, ...doc.data() } as PublicQuestion;

      // 키워드 필터링 (클라이언트 사이드)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchesKeyword =
          questionData.title.toLowerCase().includes(keyword) ||
          questionData.content.toLowerCase().includes(keyword);

        if (matchesKeyword) {
          questions.push(questionData);
        }
      } else if (filters.tags && filters.tags.length > 0) {
        // 태그 필터링 (클라이언트 사이드)
        const hasMatchingTag = filters.tags.some(tag =>
          questionData.tags.includes(tag)
        );

        if (hasMatchingTag) {
          questions.push(questionData);
        }
      } else {
        questions.push(questionData);
      }
    });

    // 마지막 문서 저장
    if (querySnapshot.docs.length > 0) {
      newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    return {
      success: true,
      questions,
      lastDoc: newLastDoc,
    };
  } catch (error) {
    console.error("공개 질문 목록 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "질문 목록 조회에 실패했습니다.",
    };
  }
}

// 공개 질문 조회수 증가
export async function incrementQuestionViews(
  questionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, "publicQuestions", questionId);
    await updateDoc(docRef, {
      views: increment(1),
    });

    return { success: true };
  } catch (error) {
    console.error("조회수 증가 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "조회수 증가에 실패했습니다.",
    };
  }
}

// 공개 질문 좋아요 토글
export async function toggleQuestionLike(
  questionId: string,
  userId: string
): Promise<{ success: boolean; isLiked?: boolean; error?: string }> {
  try {
    const docRef = doc(db, "publicQuestions", questionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: "질문을 찾을 수 없습니다.",
      };
    }

    const question = docSnap.data() as PublicQuestion;
    const isLiked = question.likedBy.includes(userId);
    const newLikedBy = isLiked
      ? question.likedBy.filter(id => id !== userId)
      : [...question.likedBy, userId];

    await updateDoc(docRef, {
      likedBy: newLikedBy,
      likes: isLiked ? question.likes - 1 : question.likes + 1,
    });

    return {
      success: true,
      isLiked: !isLiked,
    };
  } catch (error) {
    console.error("좋아요 토글 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "좋아요 처리에 실패했습니다.",
    };
  }
}

// 공개 답변 생성
export async function createPublicAnswer(
  input: CreatePublicAnswerInput
): Promise<{ success: boolean; answerId?: string; error?: string }> {
  try {
    const answerRef = await addDoc(collection(db, "publicAnswers"), {
      ...input,
      isAccepted: false,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 질문의 답변 배열에 추가
    const questionRef = doc(db, "publicQuestions", input.questionId);
    const questionSnap = await getDoc(questionRef);

    if (questionSnap.exists()) {
      const question = questionSnap.data() as PublicQuestion;
      await updateDoc(questionRef, {
        answers: [...question.answers, answerRef.id],
        updatedAt: serverTimestamp(),
      });
    }

    return {
      success: true,
      answerId: answerRef.id,
    };
  } catch (error) {
    console.error("공개 답변 생성 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "답변 생성에 실패했습니다.",
    };
  }
}

// 공개 답변 조회
export async function getPublicAnswer(
  answerId: string
): Promise<{ success: boolean; answer?: PublicAnswer; error?: string }> {
  try {
    const docRef = doc(db, "publicAnswers", answerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        answer: { id: docSnap.id, ...docSnap.data() } as PublicAnswer,
      };
    } else {
      return {
        success: false,
        error: "답변을 찾을 수 없습니다.",
      };
    }
  } catch (error) {
    console.error("공개 답변 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "답변 조회에 실패했습니다.",
    };
  }
}

// 공개 답변 좋아요 토글
export async function toggleAnswerLike(
  answerId: string,
  userId: string
): Promise<{ success: boolean; isLiked?: boolean; error?: string }> {
  try {
    const docRef = doc(db, "publicAnswers", answerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: "답변을 찾을 수 없습니다.",
      };
    }

    const answer = docSnap.data() as PublicAnswer;
    const isLiked = answer.likedBy.includes(userId);
    const newLikedBy = isLiked
      ? answer.likedBy.filter(id => id !== userId)
      : [...answer.likedBy, userId];

    await updateDoc(docRef, {
      likedBy: newLikedBy,
      likes: isLiked ? answer.likes - 1 : answer.likes + 1,
    });

    return {
      success: true,
      isLiked: !isLiked,
    };
  } catch (error) {
    console.error("답변 좋아요 토글 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "좋아요 처리에 실패했습니다.",
    };
  }
}

// Q&A 통계 조회
export async function getQaStats(): Promise<{
  success: boolean;
  stats?: QaStats;
  error?: string;
}> {
  try {
    const questionsSnapshot = await getDocs(collection(db, "publicQuestions"));
    const answersSnapshot = await getDocs(collection(db, "publicAnswers"));

    const questions: PublicQuestion[] = [];
    questionsSnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() } as PublicQuestion);
    });

    const totalQuestions = questions.length;
    const totalAnswers = answersSnapshot.size;
    const resolvedQuestions = questions.filter(q => q.isResolved).length;
    const unresolvedQuestions = totalQuestions - resolvedQuestions;

    // 인기 태그 계산
    const tagCount: { [key: string]: number } = {};
    questions.forEach(question => {
      question.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    const popularTags: PopularTag[] = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      success: true,
      stats: {
        totalQuestions,
        totalAnswers,
        resolvedQuestions,
        unresolvedQuestions,
        popularTags,
      },
    };
  } catch (error) {
    console.error("Q&A 통계 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "통계 조회에 실패했습니다.",
    };
  }
}

// 실시간 질문 구독
export function subscribeToPublicQuestions(
  callback: (questions: PublicQuestion[]) => void
): () => void {
  const q = query(
    collection(db, "publicQuestions"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, querySnapshot => {
    const questions: PublicQuestion[] = [];
    querySnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() } as PublicQuestion);
    });
    callback(questions);
  });
}
