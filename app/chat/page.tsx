"use client";

import { useAuth } from "../../lib/hooks/useAuth";
import { ChatList } from "../../components/chat/ChatList";
import { ProtectedRoute } from "../../lib/auth/ProtectedRoute";
import { MessageCircle, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return <ProtectedRoute />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">채팅</h1>
            </div>
            <Button
              onClick={() => router.push("/list")}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              상품 둘러보기
            </Button>
          </div>
        </div>
      </div>

      {/* 채팅 목록 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ChatList />
      </div>
    </div>
  );
}
