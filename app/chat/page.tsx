"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { ChatList } from "../../components/chat/ChatList";
import { EnhancedChatModal } from "../../components/chat/EnhancedChatModal";
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
            
            {/* 강제 모달 테스트 버튼 */}
            <div className="p-4 border-t bg-yellow-50">
              <button
                onClick={() => {
                  console.log("🚨 강제 모달 열기 버튼 클릭!");
                  setSelectedChatId("TEST_CHAT_ID");
                  setShowChatModal(true);
                }}
                className="w-full bg-red-500 text-white p-3 rounded-lg font-bold text-lg"
              >
                🚨 강제로 모달 열기 테스트
              </button>
            </div>
          </ErrorBoundary>
        </div>

        {/* 절대 간단한 모달 테스트 */}
        {(() => {
          console.log("🔍 모달 렌더링 조건 체크:", {
            selectedChatId,
            showChatModal,
            isClient,
            allTrue: selectedChatId && showChatModal && isClient,
          });
          return selectedChatId && showChatModal && isClient;
        })() && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(255, 0, 0, 0.9)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "50px",
                borderRadius: "20px",
                textAlign: "center",
                border: "5px solid #ff0000",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              <h1 style={{ color: "#ff0000", marginBottom: "20px" }}>
                🚨 모달이 열렸습니다! 🚨
              </h1>
              <p style={{ marginBottom: "20px" }}>
                채팅 ID: {selectedChatId}
              </p>
              <button
                onClick={handleCloseModal}
                style={{
                  backgroundColor: "#ff0000",
                  color: "white",
                  border: "none",
                  padding: "15px 30px",
                  borderRadius: "10px",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            </div>
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
