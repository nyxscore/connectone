"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { MessageCircle } from "lucide-react";
import { FirestoreChatModal } from "./FirestoreChatModal";

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
  const [showChatModal, setShowChatModal] = useState(false);

  const startChat = async () => {
    if (!user) {
      router.push(`/auth/login`);
      return;
    }

    // 채팅 모달 열기
    setShowChatModal(true);
  };

  return (
    <>
      <Button
        onClick={startChat}
        className={`w-full bg-green-600 hover:bg-green-700 text-white ${className || ""}`}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        1:1 채팅하기
      </Button>

      {/* 채팅 모달 */}
      <FirestoreChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        itemId={itemId}
        sellerUid={sellerUid}
      />
    </>
  );
}
