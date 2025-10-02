"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatWithDetails } from "../../data/chat/types";
import { getUserChats } from "../../lib/chat/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { getUserProfile } from "../../lib/profile/api";
import { getItem } from "../../lib/api/products";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
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
  const [error, setError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // 초기 로딩 상태 설정
  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  // 채팅이 삭제되었을 때 목록에서 제거
  useEffect(() => {
    const handleChatDeleted = (event: CustomEvent) => {
      console.log(
        "ChatList: 채팅 삭제 이벤트 감지 - 목록에서 제거",
        event.detail
      );
      const deletedChatId = event.detail?.chatId;

      if (deletedChatId) {
        // 삭제된 채팅을 목록에서 제거
        setChats(prevChats =>
          prevChats.filter(chat => chat.id !== deletedChatId)
        );
        console.log("ChatList: 삭제된 채팅 제거 완료", deletedChatId);
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
  }, []);

  // 실시간으로 채팅 목록과 미읽음 메시지 수 업데이트
  useEffect(() => {
    if (!user) return;

    console.log("실시간 채팅 구독 시작:", user.uid);

    // 사용자가 참여한 모든 채팅 구독
    const chatsRef = collection(db, "chats");
    const buyerQuery = query(chatsRef, where("buyerUid", "==", user.uid));
    const sellerQuery = query(chatsRef, where("sellerUid", "==", user.uid));

    let unsubscribers: (() => void)[] = [];

    const updateChatsFromSnapshot = (snapshot: any, isBuyer: boolean) => {
      console.log(
        `${isBuyer ? "Buyer" : "Seller"} 채팅 업데이트:`,
        snapshot.docs.length,
        "개"
      );

      const updatedChats: ChatWithDetails[] = [];

      // Promise.all을 사용하여 모든 프로필 정보를 병렬로 가져오기
      const profilePromises = snapshot.docs.map(async (doc: any) => {
        const chatData = { ...doc.data(), id: doc.id };
        const otherUid = isBuyer ? chatData.sellerUid : chatData.buyerUid;

        try {
          console.log(`상대방 프로필 정보 가져오기 시작: ${otherUid}`);
          console.log(`아이템 ID: ${chatData.itemId}`);
          
          const [otherUserResult, itemResult] = await Promise.all([
            getUserProfile(otherUid),
            getItem(chatData.itemId),
          ]);

          console.log(`상대방 프로필 정보 결과:`, otherUserResult);
          console.log(`아이템 정보:`, itemResult);
          console.log(`아이템 상태:`, itemResult?.item?.status);
          console.log(`아이템 성공 여부:`, itemResult?.success);

          const otherUser = otherUserResult.success
            ? otherUserResult.data
            : null;

          console.log(`상대방 사용자 데이터:`, {
            uid: otherUid,
            nickname: otherUser?.nickname,
            displayName: otherUser?.displayName,
            photoURL: otherUser?.photoURL,
            profileImage: otherUser?.profileImage,
          });

          // 상품 정보 처리 개선
          let itemInfo = {
            id: chatData.itemId,
            title: "상품 정보 없음",
            price: 0,
            imageUrl: null,
            status: "unknown",
          };

          if (itemResult?.success && itemResult?.item) {
            itemInfo = {
              id: itemResult.item.id,
              title: itemResult.item.title || "상품명 없음",
              price: itemResult.item.price || 0,
              imageUrl: itemResult.item.images?.[0] || null,
              status: itemResult.item.status || "unknown",
            };
          } else {
            console.warn(`상품 정보를 가져올 수 없음:`, {
              itemId: chatData.itemId,
              error: itemResult?.error,
            });
          }

          return {
            ...chatData,
            otherUser: {
              uid: otherUid,
              nickname:
                otherUser?.nickname || otherUser?.displayName || "알 수 없음",
              profileImage: otherUser?.photoURL || otherUser?.profileImage,
            },
            item: itemInfo,
            unreadCount: isBuyer
              ? chatData.buyerUnreadCount || 0
              : chatData.sellerUnreadCount || 0,
          };
        } catch (error) {
          console.error(`채팅 ${doc.id} 정보 로드 실패:`, error);
          console.error(`아이템 ID: ${chatData.itemId}`);
          return {
            ...chatData,
            otherUser: {
              uid: otherUid,
              nickname: "알 수 없음",
              profileImage: null,
            },
            item: {
              id: chatData.itemId,
              title: "상품 정보 없음",
              price: 0,
              imageUrl: null,
              status: "unknown",
            },
            unreadCount: isBuyer
              ? chatData.buyerUnreadCount || 0
              : chatData.sellerUnreadCount || 0,
          };
        }
      });

      // 모든 프로필 정보를 가져온 후 처리
      Promise.all(profilePromises).then(chatDetails => {
        console.log(`모든 채팅 데이터 로드 완료:`, chatDetails);

        // 시간순으로 정렬
        chatDetails.sort((a, b) => {
          const aTime = a.updatedAt?.seconds || 0;
          const bTime = b.updatedAt?.seconds || 0;
          return bTime - aTime;
        });

        // 채팅 목록 업데이트
        setChats(prevChats => {
          const allChats = [...prevChats];

          chatDetails.forEach(updatedChat => {
            const existingIndex = allChats.findIndex(
              chat => chat.id === updatedChat.id
            );
            if (existingIndex >= 0) {
              allChats[existingIndex] = updatedChat;
            } else {
              allChats.push(updatedChat);
            }
          });

          // 중복 제거 및 정렬
          const uniqueChats = allChats.filter(
            (chat, index, self) =>
              index === self.findIndex(c => c.id === chat.id)
          );

          return uniqueChats.sort((a, b) => {
            const aTime = a.updatedAt?.seconds || 0;
            const bTime = b.updatedAt?.seconds || 0;
            return bTime - aTime;
          });
        });

        // 미읽음 메시지 수 업데이트
        const counts: Record<string, number> = {};
        chatDetails.forEach(chat => {
          counts[chat.id] = isBuyer
            ? chat.buyerUnreadCount || 0
            : chat.sellerUnreadCount || 0;
        });

        setUnreadCounts(prevCounts => ({
          ...prevCounts,
          ...counts,
        }));
      });
    };

    const unsubscribeBuyer = onSnapshot(
      buyerQuery,
      snapshot => updateChatsFromSnapshot(snapshot, true),
      error => console.error("Buyer 채팅 구독 오류:", error)
    );

    const unsubscribeSeller = onSnapshot(
      sellerQuery,
      snapshot => updateChatsFromSnapshot(snapshot, false),
      error => console.error("Seller 채팅 구독 오류:", error)
    );

    unsubscribers.push(unsubscribeBuyer, unsubscribeSeller);

    return () => {
      console.log("채팅 구독 해제");
      unsubscribers.forEach(unsub => unsub());
    };
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
            className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => handleChatClick(chat.id)}
          >
            <div className="flex items-start space-x-2 sm:space-x-3">
              {/* 상대방 프로필 이미지 */}
              <div className="flex-shrink-0">
                {(() => {
                  console.log(`프로필 이미지 렌더링:`, {
                    chatId: chat.id,
                    nickname: chat.otherUser.nickname,
                    profileImage: chat.otherUser.profileImage,
                    hasProfileImage: !!chat.otherUser.profileImage,
                  });
                  return null;
                })()}
                {chat.otherUser.profileImage ? (
                  <img
                    src={chat.otherUser.profileImage}
                    alt={chat.otherUser.nickname}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    onError={e => {
                      console.error(
                        `프로필 이미지 로드 실패:`,
                        chat.otherUser.profileImage
                      );
                      e.currentTarget.style.display = "none";
                    }}
                    onLoad={() => {
                      console.log(
                        `프로필 이미지 로드 성공:`,
                        chat.otherUser.profileImage
                      );
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* 채팅 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                    {chat.otherUser.nickname}
                  </h3>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {(unreadCounts[chat.id] || 0) > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 shadow-sm">
                        {unreadCounts[chat.id]}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">
                        {formatTime(chat.updatedAt)}
                      </span>
                      <span className="sm:hidden">
                        {formatTime(chat.updatedAt)
                          .replace("시간", "시")
                          .replace("분", "분")}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 아이템 정보 */}
                <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                  {chat.item.imageUrl && (
                    <img
                      src={chat.item.imageUrl}
                      alt={chat.item.title}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-600 truncate">
                        {chat.item.title}
                      </p>
                      {/* 거래 상태 표시 */}
                      {chat.item.status === "reserved" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          거래중
                        </span>
                      )}
                      {chat.item.status === "escrow_completed" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          안전결제완료
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900">
                      {chat.item.price.toLocaleString()}원
                    </p>
                  </div>
                </div>

                {/* 마지막 메시지 */}
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
