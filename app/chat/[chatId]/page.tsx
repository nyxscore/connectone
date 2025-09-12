"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { ProtectedRoute } from "../../../lib/auth/ProtectedRoute";
import { ChatRoom } from "../../../components/chat/ChatRoom";
import { getItem } from "../../../lib/api/products";
import { getUserProfile } from "../../../lib/auth";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatId = params.chatId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatData, setChatData] = useState<{
    otherUser: {
      uid: string;
      nickname: string;
      profileImage?: string;
    };
    item: {
      id: string;
      title: string;
      price: number;
      imageUrl?: string;
    };
  } | null>(null);

  useEffect(() => {
    if (!user || !chatId) return;

    loadChatData();
  }, [user, chatId]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      setError("");

      // chatId에서 정보 추출: `${buyerUid}_${sellerUid}_${itemId}`
      const [buyerUid, sellerUid, itemId] = chatId.split("_");

      if (!buyerUid || !sellerUid || !itemId) {
        setError("잘못된 채팅 ID입니다.");
        return;
      }

      // 현재 사용자가 참여자인지 확인
      if (user.uid !== buyerUid && user.uid !== sellerUid) {
        setError("이 채팅방에 접근할 권한이 없습니다.");
        return;
      }

      // 상대방 정보 가져오기
      const otherUid = user.uid === buyerUid ? sellerUid : buyerUid;
      const otherUser = await getUserProfile(otherUid);

      // 아이템 정보 가져오기
      const itemResult = await getItem(itemId);

      if (!otherUser || !itemResult.success || !itemResult.item) {
        setError("채팅 정보를 불러올 수 없습니다.");
        return;
      }

      setChatData({
        otherUser: {
          uid: otherUid,
          nickname: otherUser.nickname,
          profileImage: otherUser.profileImage,
        },
        item: {
          id: itemResult.item.id,
          title: itemResult.item.title,
          price: itemResult.item.price,
          imageUrl: itemResult.item.images?.[0],
        },
      });
    } catch (err) {
      console.error("채팅 데이터 로드 실패:", err);
      setError("채팅 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/chat");
  };

  if (!user) {
    return <ProtectedRoute />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">채팅방을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              채팅 목록으로
            </Button>
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">채팅 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ChatRoom
        chatId={chatId}
        otherUser={chatData.otherUser}
        item={chatData.item}
        onBack={handleBack}
      />
    </div>
  );
}
