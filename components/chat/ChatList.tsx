"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatWithDetails } from "../../data/chat/types";
import { getUserChats } from "../../lib/chat/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/api/firebase";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Loader2, MessageCircle, Clock, User } from "lucide-react";
// date-fns 제거 - 간단한 시간 표시로 변경

interface ChatListProps {
  onChatSelect?: (chatId: string) => void;
  onChatDeleted?: () => void;
}

export function ChatList({ onChatSelect, onChatDeleted }: ChatListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const loadChats = useCallback(
    async (isLoadMore = false) => {
      if (!user) {
        console.log("ChatList: user가 없어서 로드 중단");
        return;
      }

      try {
        console.log("ChatList: loadChats 시작", {
          isLoadMore,
          userUid: user.uid,
        });

        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          // 채팅 삭제 후 새로고침이 아닌 경우에만 채팅 목록 초기화
          if (chats.length === 0) {
            setChats([]);
            setLastDoc(null);
            setHasMore(true);
          }
        }

        const result = await getUserChats(user.uid, lastDoc, 20);
        console.log("ChatList: getUserChats 결과", result);

        if (result.success && result.chats) {
          // unknown 채팅 필터링
          const filteredChats = result.chats.filter(
            chat => chat.itemId !== "unknown" && chat.sellerUid !== "unknown"
          );

          if (isLoadMore) {
            setChats(prev => [...prev, ...filteredChats]);
          } else {
            setChats(filteredChats);
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
    console.log("ChatList: useEffect 실행", { user: user?.uid });
    loadChats();
  }, [user]);

  // 채팅이 삭제되었을 때 목록 새로고침
  useEffect(() => {
    const handleChatDeleted = (event: CustomEvent) => {
      console.log(
        "ChatList: 채팅 삭제 이벤트 감지 - 목록 새로고침",
        event.detail
      );
      const deletedChatId = event.detail?.chatId;

      if (deletedChatId) {
        // 삭제된 채팅을 목록에서 제거
        setChats(prevChats =>
          prevChats.filter(chat => chat.id !== deletedChatId)
        );
        console.log("ChatList: 삭제된 채팅 제거 완료", deletedChatId);
      } else {
        // chatId가 없으면 전체 새로고침
        loadChats(false);
      }
    };

    // 전역 이벤트 리스너 등록
    window.addEventListener("chatDeleted", handleChatDeleted as EventListener);

    return () => {
      window.removeEventListener(
        "chatDeleted",
        handleChatDeleted as EventListener
      );
    };
  }, [loadChats]);

  // 실시간으로 미읽음 메시지 수 업데이트
  useEffect(() => {
    if (!user || chats.length === 0) return;

    const updateUnreadCounts = async () => {
      const counts: Record<string, number> = {};

      for (const chat of chats) {
        try {
          const messagesRef = collection(db, "messages");
          const q = query(messagesRef, where("chatId", "==", chat.id));

          const snapshot = await getDocs(q);
          let unreadCount = 0;

          snapshot.docs.forEach(doc => {
            const messageData = doc.data();
            if (
              messageData.senderUid !== user.uid &&
              !messageData.readBy.includes(user.uid)
            ) {
              unreadCount++;
            }
          });

          counts[chat.id] = unreadCount;
        } catch (error) {
          console.error(`채팅 ${chat.id} 미읽음 수 계산 실패:`, error);
          counts[chat.id] = 0;
        }
      }

      setUnreadCounts(counts);
    };

    updateUnreadCounts();

    // 5초마다 업데이트
    const interval = setInterval(updateUnreadCounts, 5000);

    return () => clearInterval(interval);
  }, [user, chats]);

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

    try {
      let date: Date;

      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        // Firestore Timestamp object
        date = new Date(timestamp.seconds * 1000);
      } else if (
        typeof timestamp === "string" ||
        typeof timestamp === "number"
      ) {
        // String or number timestamp
        date = new Date(timestamp);
      } else {
        console.warn("Unknown timestamp format:", timestamp);
        return "방금 전";
      }

      // 유효한 날짜인지 확인
      if (isNaN(date.getTime()) || !isFinite(date.getTime())) {
        console.warn("Invalid date:", date, "from timestamp:", timestamp);
        return "방금 전";
      }

      // 간단한 시간 표시로 변경 (formatDistanceToNow 대신)
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return "방금 전";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}분 전`;
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      } else if (diffInDays < 7) {
        return `${diffInDays}일 전`;
      } else {
        return date.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error("formatTime error:", error, "timestamp:", timestamp);
      return "방금 전";
    }
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
                    {(unreadCounts[chat.id] || 0) > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 shadow-sm">
                        {unreadCounts[chat.id]}
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
