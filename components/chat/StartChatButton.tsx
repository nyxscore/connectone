"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { MessageCircle } from "lucide-react";

interface StartChatButtonProps {
  itemId: string;
  sellerUid: string;
  className?: string;
}

export function StartChatButton({
  itemId,
  sellerUid,
  className,
}: StartChatButtonProps) {
  const { user } = useAuth();
  const router = useRouter();

  const startChat = async () => {
    if (!user) {
      router.push(`/auth/login?next=/item/${itemId}`);
      return;
    }

    try {
      const chatId = `${user.uid}_${sellerUid}_${itemId}`;

      // 채팅 시작 API 호출
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          itemId,
          sellerUid,
          buyerUid: user.uid,
          firstMessage: `${itemId}에 대해 문의드립니다.`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/chat/${result.chatId || chatId}`);
      } else {
        console.error("채팅 시작 실패:", result.error);
        // 실패해도 채팅방으로 이동 시도
        router.push(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error("채팅 시작 오류:", error);
      // 오류가 발생해도 채팅방으로 이동 시도
      const chatId = `${user.uid}_${sellerUid}_${itemId}`;
      router.push(`/chat/${chatId}`);
    }
  };

  return (
    <Button
      onClick={startChat}
      className={`w-full bg-green-600 hover:bg-green-700 text-white ${className || ""}`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      1:1 채팅하기
    </Button>
  );
}
