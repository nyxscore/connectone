"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { ChatList } from "../../components/chat/ChatList";
// import { SimpleChatModal } from "../../components/chat/SimpleChatModal";
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

        {/* 인라인 모달 - 오류 방지 */}
        {console.log("ChatPage: 모달 렌더링 조건 확인", {
          selectedChatId,
          showChatModal,
          isClient,
        })}
        {selectedChatId && showChatModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={handleCloseModal}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "900px",
                height: "85vh",
                overflow: "hidden",
                position: "relative",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "2px solid #e5e7eb",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h2
                    style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937" }}
                  >
                    🎉 채팅 모달이 열렸습니다!
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      fontSize: "24px",
                      color: "#6b7280",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 내용 */}
              <div
                style={{
                  padding: "24px",
                  height: "calc(100% - 80px)",
                  overflow: "auto",
                }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#059669",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    ✅ 모달이 성공적으로 열렸습니다!
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    <strong>채팅 ID:</strong> {selectedChatId}
                  </p>
                  <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                    이 모달이 보인다면 문제가 해결된 것입니다!
                  </p>
                </div>

                {/* 채팅 인터페이스 */}
                <div
                  style={{
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    height: "400px",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #e5e7eb",
                      backgroundColor: "#f1f5f9",
                      borderTopLeftRadius: "10px",
                      borderTopRightRadius: "10px",
                    }}
                  >
                    <h3 style={{ fontWeight: "600", color: "#374151" }}>💬 채팅방</h3>
                  </div>
                  <div style={{ flex: 1, padding: "16px", overflow: "auto" }}>
                    <div style={{ textAlign: "center", marginTop: "60px" }}>
                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: "16px",
                          marginBottom: "8px",
                        }}
                      >
                        채팅 내용이 여기에 표시됩니다
                      </p>
                      <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                        Chat ID: {selectedChatId}
                      </p>
                    </div>
                  </div>
                  <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <input
                        type="text"
                        placeholder="메시지를 입력하세요..."
                        style={{
                          flex: 1,
                          padding: "12px 16px",
                          border: "2px solid #d1d5db",
                          borderRadius: "8px",
                          outline: "none",
                          fontSize: "14px",
                        }}
                      />
                      <button
                        style={{
                          padding: "12px 20px",
                          backgroundColor: "#2563eb",
                          color: "white",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        전송
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
