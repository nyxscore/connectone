"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { ChatList } from "../../components/chat/ChatList";
import { EnhancedChatModal } from "../../components/chat/EnhancedChatModal";
import { ProtectedRoute } from "../../lib/auth/ProtectedRoute";
import { MessageCircle, Plus, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";

function ChatPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  console.log("ChatPage 렌더링:", {
    user: user?.uid,
    selectedChatId,
    showChatModal,
  });

  // URL에서 chatId를 가져와서 자동으로 채팅 모달 열기
  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (chatId && user) {
      console.log("URL에서 chatId 발견:", chatId);
      setSelectedChatId(chatId);
      setShowChatModal(true);
    }
  }, [searchParams, user]);

  const handleChatSelect = (chatId: string) => {
    console.log("ChatPage: handleChatSelect 호출됨", { chatId });
    setSelectedChatId(chatId);
    setShowChatModal(true);
    console.log("ChatPage: 모달 상태 업데이트됨", {
      selectedChatId: chatId,
      showChatModal: true,
    });
  };

  const handleCloseModal = () => {
    setShowChatModal(false);
    setSelectedChatId(null);
  };

  const handleChatDeleted = () => {
    // 채팅 목록 새로고침을 위해 ChatList에 전달
    // ChatList는 자체적으로 새로고침하므로 여기서는 모달만 닫기
    setShowChatModal(false);
    setSelectedChatId(null);
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                채팅
              </h1>
            </div>
            <Button
              onClick={() => router.push("/list")}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">상품 둘러보기</span>
              <span className="sm:hidden">둘러보기</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 채팅 목록 */}
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        <ChatList
          onChatSelect={handleChatSelect}
          onChatDeleted={handleChatDeleted}
        />
      </div>

      {/* 채팅 모달 */}
      {selectedChatId && (
        <EnhancedChatModal
          isOpen={showChatModal}
          onClose={handleCloseModal}
          chatId={selectedChatId}
          onChatDeleted={handleChatDeleted}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
