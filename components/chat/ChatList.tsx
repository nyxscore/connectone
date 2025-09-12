"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatWithDetails } from "../../data/chat/types";
import { getUserChats } from "../../lib/chat/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Loader2, MessageCircle, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface ChatListProps {
  onChatSelect?: (chatId: string) => void;
}

export function ChatList({ onChatSelect }: ChatListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState("");

  const loadChats = useCallback(
    async (isLoadMore = false) => {
      if (!user) return;

      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setChats([]);
          setLastDoc(null);
          setHasMore(true);
        }

        const result = await getUserChats(user.uid, lastDoc, 20);

        if (result.success && result.chats) {
          if (isLoadMore) {
            setChats(prev => [...prev, ...result.chats!]);
          } else {
            setChats(result.chats);
          }
          setLastDoc(result.lastDoc);
          setHasMore(result.chats.length === 20);
        } else {
          setError(result.error || "채팅 목록을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("채팅 목록 로드 실패:", err);
        setError("채팅 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, lastDoc]
  );

  useEffect(() => {
    loadChats();
  }, [user]);

  const handleChatClick = (chatId: string) => {
    console.log("채팅 클릭:", chatId);
    if (!chatId || chatId === "undefined") {
      console.error("잘못된 채팅 ID:", chatId);
      return;
    }
    if (onChatSelect) {
      onChatSelect(chatId);
    } else {
      router.push(`/chat/${chatId}`);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadChats(true);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">채팅 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => loadChats()}>다시 시도</Button>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          아직 채팅이 없습니다
        </h3>
        <p className="text-gray-600 mb-4">
          상품에 관심이 있으시면 판매자와 채팅을 시작해보세요!
        </p>
        <Button onClick={() => router.push("/list")}>상품 둘러보기</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chats.map(chat => {
        console.log("채팅 렌더링:", chat.id, chat);
        return (
          <Card
            key={chat.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => handleChatClick(chat.id)}
          >
            <div className="flex items-start space-x-3">
              {/* 상대방 프로필 이미지 */}
              <div className="flex-shrink-0">
                {chat.otherUser.profileImage ? (
                  <img
                    src={chat.otherUser.profileImage}
                    alt={chat.otherUser.nickname}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* 채팅 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {chat.otherUser.nickname}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {chat.unreadCount > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {chat.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* 아이템 정보 */}
                <div className="flex items-center space-x-2 mb-2">
                  {chat.item.imageUrl && (
                    <img
                      src={chat.item.imageUrl}
                      alt={chat.item.title}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">
                      {chat.item.title}
                    </p>
                    <p className="text-xs font-medium text-gray-900">
                      {chat.item.price.toLocaleString()}원
                    </p>
                  </div>
                </div>

                {/* 마지막 메시지 */}
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          </Card>
        );
      })}

      {/* 더보기 버튼 */}
      {hasMore && (
        <div className="text-center py-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />더 불러오는
                중...
              </>
            ) : (
              "더 보기"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
