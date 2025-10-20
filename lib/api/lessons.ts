import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../api/firebase-ultra-safe";
import { Instructor, Lesson, Review } from "../../data/types/lesson";

// ========================================
// 강사 관련 API
// ========================================

/**
 * 모든 강사 목록 조회
 */
export async function getAllInstructors(): Promise<Instructor[]> {
  try {
    const instructorsRef = collection(db, "instructors");
    const q = query(
      instructorsRef,
      where("isActive", "==", true),
      orderBy("rating", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Instructor;
    });
  } catch (error) {
    console.error("강사 목록 조회 실패:", error);
    return [];
  }
}

/**
 * 강사 상세 정보 조회
 */
export async function getInstructorById(
  instructorId: string
): Promise<Instructor | null> {
  try {
    const docRef = doc(db, "instructors", instructorId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Instructor;
  } catch (error) {
    console.error("강사 정보 조회 실패:", error);
    return null;
  }
}

/**
 * 악기별 강사 검색
 */
export async function getInstructorsByInstrument(
  instrument: string
): Promise<Instructor[]> {
  try {
    const instructorsRef = collection(db, "instructors");
    const q = query(
      instructorsRef,
      where("instruments", "array-contains", instrument),
      where("isActive", "==", true),
      orderBy("rating", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Instructor;
    });
  } catch (error) {
    console.error("악기별 강사 검색 실패:", error);
    return [];
  }
}

// ========================================
// 레슨 예약 관련 API
// ========================================

/**
 * 레슨 예약 생성
 */
export async function createLesson(
  lessonData: Omit<Lesson, "id" | "createdAt" | "updatedAt">
): Promise<string | null> {
  try {
    const lessonsRef = collection(db, "lessons");
    const docRef = await addDoc(lessonsRef, {
      ...lessonData,
      scheduledDate: Timestamp.fromDate(lessonData.scheduledDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("레슨 예약 생성 실패:", error);
    return null;
  }
}

/**
 * 사용자의 레슨 목록 조회
 */
export async function getUserLessons(userId: string): Promise<Lesson[]> {
  try {
    const lessonsRef = collection(db, "lessons");
    const q = query(
      lessonsRef,
      where("userId", "==", userId),
      orderBy("scheduledDate", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        scheduledDate: data.scheduledDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Lesson;
    });
  } catch (error) {
    console.error("사용자 레슨 조회 실패:", error);
    return [];
  }
}

/**
 * 강사의 레슨 목록 조회
 */
export async function getInstructorLessons(
  instructorId: string
): Promise<Lesson[]> {
  try {
    const lessonsRef = collection(db, "lessons");
    const q = query(
      lessonsRef,
      where("instructorId", "==", instructorId),
      orderBy("scheduledDate", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        scheduledDate: data.scheduledDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Lesson;
    });
  } catch (error) {
    console.error("강사 레슨 조회 실패:", error);
    return [];
  }
}

/**
 * 레슨 상태 업데이트
 */
export async function updateLessonStatus(
  lessonId: string,
  status: Lesson["status"]
): Promise<boolean> {
  try {
    const docRef = doc(db, "lessons", lessonId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("레슨 상태 업데이트 실패:", error);
    return false;
  }
}

/**
 * 레슨 결제 상태 업데이트
 */
export async function updateLessonPayment(
  lessonId: string,
  paymentId: string,
  paymentStatus: Lesson["paymentStatus"]
): Promise<boolean> {
  try {
    const docRef = doc(db, "lessons", lessonId);
    await updateDoc(docRef, {
      paymentId,
      paymentStatus,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("레슨 결제 업데이트 실패:", error);
    return false;
  }
}

// ========================================
// 리뷰 관련 API
// ========================================

/**
 * 리뷰 작성
 */
export async function createReview(
  reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">
): Promise<string | null> {
  try {
    const reviewsRef = collection(db, "reviews");
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 강사의 평점 업데이트
    await updateInstructorRating(reviewData.instructorId);

    return docRef.id;
  } catch (error) {
    console.error("리뷰 작성 실패:", error);
    return null;
  }
}

/**
 * 강사의 리뷰 목록 조회
 */
export async function getInstructorReviews(
  instructorId: string
): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("instructorId", "==", instructorId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Review;
    });
  } catch (error) {
    console.error("리뷰 조회 실패:", error);
    return [];
  }
}

/**
 * 강사 평점 업데이트 (리뷰 기반)
 */
async function updateInstructorRating(instructorId: string): Promise<void> {
  try {
    const reviews = await getInstructorReviews(instructorId);

    if (reviews.length === 0) {
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    const docRef = doc(db, "instructors", instructorId);
    await updateDoc(docRef, {
      rating: Math.round(avgRating * 10) / 10, // 소수점 1자리
      reviewCount: reviews.length,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("강사 평점 업데이트 실패:", error);
  }
}


