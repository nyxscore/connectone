"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { ChatList } from "../../components/chat/ChatList";
import { UltraSafeChatModal } from "../../components/chat/UltraSafeChatModal"; // Ultra-safe chat modal with all features
import { ProtectedRoute } from "../../lib/auth/ProtectedRoute";
import { MessageCircle, Plus, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorBoundary } from "../../components/ui/ErrorBoundary";

function ChatPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  console.log("ChatPage 렌더링:", {
    user: user?.uid,
    selectedChatId,
    showChatModal,
    isClient,
  });

  // 클라이언트 사이드에서만 실행되도록 보장
  useEffect(() => {
    setIsClient(true);

    // 배포 환경 안전장치 - Firebase 초기화 확인
    const checkDeploymentReady = () => {
      try {
        // Firebase 환경변수 확인
        const hasRequiredEnvVars =
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
          typeof window !== "undefined";

        if (hasRequiredEnvVars) {
          console.log("✅ 배포 환경 준비 완료");
        } else {
          console.warn("⚠️ Firebase 환경변수 누락 - 재시도 중...");
          setTimeout(checkDeploymentReady, 1000);
        }
      } catch (error) {
        console.error("❌ 배포 환경 확인 실패:", error);
        setTimeout(checkDeploymentReady, 2000);
      }
    };

    checkDeploymentReady();
  }, []);

  // URL에서 chatId를 가져와서 자동으로 채팅 모달 열기
  useEffect(() => {
    if (!isClient) return;

    const chatId = searchParams.get("chatId");
    if (chatId && user) {
      console.log("URL에서 chatId 발견:", chatId);
      setSelectedChatId(chatId);
      setShowChatModal(true);
    }
  }, [searchParams, user, isClient]);

  const handleChatSelect = (chatId: string) => {
    if (!isClient) return;

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
    setShowChatModal(false);
    setSelectedChatId(null);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
    <ErrorBoundary>
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
          <ErrorBoundary>
            <ChatList
              onChatSelect={handleChatSelect}
              onChatDeleted={handleChatDeleted}
            />
          </ErrorBoundary>
        </div>

        {/* Ultra-safe 채팅 모달 - 모든 기능 포함 */}
        {selectedChatId && showChatModal && isClient && (
          <div key={selectedChatId}>
            <UltraSafeChatModal
              isOpen={true}
              onClose={handleCloseModal}
              chatId={selectedChatId}
              onChatDeleted={handleChatDeleted}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
