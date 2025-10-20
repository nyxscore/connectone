"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { db } from "../../../lib/api/firebase-ultra-safe";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

// Mock 강사 데이터 (실제로는 Firestore에서 가져옴)
const MOCK_INSTRUCTORS: any = {
  "1": { id: "1", name: "김민수", userId: "instructor1" },
  "2": { id: "2", name: "이지은", userId: "instructor2" },
  "3": { id: "3", name: "박준혁", userId: "instructor3" },
  "4": { id: "4", name: "최서연", userId: "instructor4" },
  "5": { id: "5", name: "정우성", userId: "instructor5" },
  "6": { id: "6", name: "강혜진", userId: "instructor6" },
};

function ConsultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      createConsultationChat();
    }
  }, [loading, user]);

  const createConsultationChat = async () => {
    if (isCreating) return;
    setIsCreating(true);

    const instructorId = searchParams?.get("instructor");
    const lessonTypeId = searchParams?.get("lessonType");

    if (!instructorId || !lessonTypeId || !user) {
      toast.error("상담 정보가 올바르지 않습니다.");
      router.push("/lessons");
      return;
    }

    const instructor = MOCK_INSTRUCTORS[instructorId];
    if (!instructor) {
      toast.error("강사를 찾을 수 없습니다.");
      router.push("/lessons");
      return;
    }

    try {
      // 1. 기존 채팅방이 있는지 확인
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(q);

      let existingChatId: string | null = null;

      querySnapshot.forEach(doc => {
        const chatData = doc.data();
        // 강사 UID가 참가자에 포함되어 있는지 확인
        if (chatData.participants.includes(instructor.userId)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        // 기존 채팅방이 있으면 시스템 메시지만 추가
        const messagesRef = collection(db, "chats", existingChatId, "messages");
        await addDoc(messagesRef, {
          type: "lesson_consultation",
          lessonTypeId,
          instructorId,
          instructorName: instructor.name,
          message: `${user.displayName || "학생"}님이 레슨 상담을 요청했습니다.`,
          timestamp: serverTimestamp(),
          isSystemMessage: true,
        });

        // 채팅방의 lastMessage 업데이트
        await updateDoc(doc(db, "chats", existingChatId), {
          lastMessage: "레슨 상담 요청",
          lastMessageTimestamp: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast.success("레슨 상담 요청이 전송되었습니다!");
        router.push(`/chat?chatId=${existingChatId}`);
      } else {
        // 새 채팅방 생성
        const newChat = await addDoc(chatsRef, {
          participants: [user.uid, instructor.userId],
          participantNames: {
            [user.uid]: user.displayName || "학생",
            [instructor.userId]: instructor.name,
          },
          lastMessage: "레슨 상담 요청",
          lastMessageTimestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 시스템 메시지 추가
        const messagesRef = collection(db, "chats", newChat.id, "messages");
        await addDoc(messagesRef, {
          type: "lesson_consultation",
          lessonTypeId,
          instructorId,
          instructorName: instructor.name,
          message: `${user.displayName || "학생"}님이 레슨 상담을 요청했습니다.`,
          timestamp: serverTimestamp(),
          isSystemMessage: true,
        });

        toast.success("레슨 상담 채팅방이 생성되었습니다!");
        router.push(`/chat?chatId=${newChat.id}`);
      }
    } catch (error) {
      console.error("❌ 채팅방 생성 실패:", error);
      toast.error("채팅방 생성에 실패했습니다.");
      router.push("/lessons");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? "로딩 중..." : "로그인이 필요합니다"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">채팅방을 생성하는 중...</p>
      </div>
    </div>
  );
}

export default function ConsultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ConsultContent />
    </Suspense>
  );
}


