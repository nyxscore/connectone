"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatWithDetails } from "../../data/chat/types";
import { getUserChats, deleteChat } from "../../lib/chat/api";
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
import { getFirebaseDb as getDb } from "../../lib/api/firebase-ultra-safe";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { Loader2, MessageCircle, Clock, User, Trash2 } from "lucide-react";
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
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

    // 채팅 읽음 상태 업데이트 이벤트 처리
    const handleChatReadStatusUpdated = (event: CustomEvent) => {
      console.log(
        "ChatList: 채팅 읽음 상태 업데이트 이벤트 감지",
        event.detail
      );
      const { chatId, userId } = event.detail;

      if (chatId && userId === user?.uid) {
        // 해당 채팅의 안읽은 메시지 개수를 0으로 설정
        setUnreadCounts(prevCounts => ({
          ...prevCounts,
          [chatId]: 0,
        }));
        console.log("ChatList: 안읽은 메시지 개수 업데이트 완료", chatId);
      }
    };

    // 전역 이벤트 리스너 등록
    window.addEventListener("chatDeleted", handleChatDeleted as EventListener);
    window.addEventListener(
      "chatReadStatusUpdated",
      handleChatReadStatusUpdated as EventListener
    );

    return () => {
      window.removeEventListener(
        "chatDeleted",
        handleChatDeleted as EventListener
      );
      window.removeEventListener(
        "chatReadStatusUpdated",
        handleChatReadStatusUpdated as EventListener
      );
    };
  }, [user?.uid]);

  // 상품 상태 변경 이벤트 감지
  useEffect(() => {
    const handleItemStatusChanged = async (event: CustomEvent) => {
      const { itemId: changedItemId, status } = event.detail;
      console.log("ChatList: 상품 상태 변경 감지:", { changedItemId, status });

      // 배송중으로 변경될 때는 최신 상품 정보를 다시 가져와서 shippingInfo 포함
      if (status === "shipping") {
        try {
          const itemResult = await getItem(changedItemId);
          if (itemResult?.success && itemResult?.item) {
            setChats(prevChats =>
              prevChats.map(chat => {
                if (chat.itemId === changedItemId) {
                  return {
                    ...chat,
                    item: {
                      ...chat.item,
                      status: status,
                      shippingInfo: itemResult.item.shippingInfo,
                    },
                  };
                }
                return chat;
              })
            );
          }
        } catch (error) {
          console.error("상품 정보 업데이트 실패:", error);
        }
      } else {
        // 다른 상태 변경은 단순히 상태만 업데이트
        setChats(prevChats =>
          prevChats.map(chat => {
            if (chat.itemId === changedItemId) {
              return {
                ...chat,
                item: {
                  ...chat.item,
                  status: status,
                },
              };
            }
            return chat;
          })
        );
      }
    };

    window.addEventListener(
      "itemStatusChanged",
      handleItemStatusChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        "itemStatusChanged",
        handleItemStatusChanged as EventListener
      );
    };
  }, []);

  // 실시간으로 채팅 목록과 미읽음 메시지 수 업데이트
  useEffect(() => {
    if (!user) return;

    console.log("실시간 채팅 구독 시작:", user.uid);

    // 동기적으로 db를 가져와서 구독 설정
    try {
      const db = getDb();
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

        // 삭제된 채팅 필터링
        const filteredDocs = snapshot.docs.filter((doc: any) => {
          const chatData = doc.data();
          const userId = user?.uid;

          if (!userId) return false;

          // 현재 사용자가 삭제하지 않은 채팅만 표시
          if (chatData.buyerUid === userId) {
            return !chatData.deletedByBuyer;
          } else if (chatData.sellerUid === userId) {
            return !chatData.deletedBySeller;
          }
          return true;
        });

        console.log(
          `${isBuyer ? "Buyer" : "Seller"} 필터링 후:`,
          filteredDocs.length,
          "개"
        );

        const updatedChats: ChatWithDetails[] = [];

        // Promise.all을 사용하여 모든 프로필 정보를 병렬로 가져오기
        const profilePromises = filteredDocs.map(async (doc: any) => {
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
              shippingInfo: null,
            };

            if (itemResult?.success && itemResult?.item) {
              itemInfo = {
                id: itemResult.item.id,
                title: itemResult.item.title || "상품명 없음",
                price: itemResult.item.price || 0,
                imageUrl: itemResult.item.images?.[0] || null,
                status: itemResult.item.status || "unknown",
                shippingInfo: itemResult.item.shippingInfo || null,
              };
              console.log(`아이템 정보 생성 완료:`, itemInfo);
            } else {
              // 상품이 삭제되었거나 존재하지 않는 경우 기본값 사용
              console.log(`상품 정보를 가져올 수 없음 (상품 삭제됨):`, {
                itemId: chatData.itemId,
                error: itemResult?.error,
              });
              itemInfo = {
                id: chatData.itemId,
                title: "삭제된 상품",
                price: 0,
                imageUrl: null,
                status: "deleted",
                shippingInfo: null,
              };
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
    } catch (error) {
      console.error("❌ DB 초기화 오류:", error);
    }
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

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    if (!user?.uid) return;

    if (!confirm("정말로 이 채팅을 삭제하시겠습니까?")) return;

    setIsDeleting(chatId);

    try {
      const result = await deleteChat(chatId, user.uid);

      if (result.success) {
        toast.success("채팅이 삭제되었습니다.");

        // 채팅 목록에서 즉시 제거
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));

        // 전역 이벤트 발생
        window.dispatchEvent(
          new CustomEvent("chatDeleted", {
            detail: { chatId },
          })
        );

        onChatDeleted?.();
      } else {
        toast.error(result.error || "채팅 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("채팅 삭제 실패:", error);
      toast.error("채팅 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(null);
      setSwipedChatId(null);
    }
  };

  // 모바일 스와이프 처리
  const handleTouchStart = (e: React.TouchEvent, chatId: string) => {
    const touch = e.touches[0];
    const startX = touch.clientX;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const currentX = moveTouch.clientX;
      const diffX = startX - currentX;

      // 오른쪽에서 왼쪽으로 스와이프 (최소 50px)
      if (diffX > 50) {
        setSwipedChatId(chatId);
      } else if (diffX < -50) {
        setSwipedChatId(null);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
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
          <div
            key={chat.id}
            className="relative"
            onTouchStart={e => handleTouchStart(e, chat.id)}
          >
            {/* 모바일 스와이프 삭제 버튼 */}
            {swipedChatId === chat.id && (
              <div className="absolute right-0 top-0 bottom-0 bg-red-500 rounded-lg flex items-center justify-center px-4 z-10">
                <button
                  onClick={e => handleDeleteChat(chat.id, e)}
                  disabled={isDeleting === chat.id}
                  className="text-white p-2"
                >
                  {isDeleting === chat.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}

            <Card
              className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                swipedChatId === chat.id ? "transform -translate-x-16" : ""
              } ${
                (unreadCounts[chat.id] || 0) > 0 
                  ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-md" 
                  : ""
              }`}
              onClick={() => {
                // 다른 채팅이 스와이프되어 있으면 닫기
                if (swipedChatId && swipedChatId !== chat.id) {
                  setSwipedChatId(null);
                }
                // 현재 채팅이 스와이프되어 있으면 닫기
                if (swipedChatId === chat.id) {
                  setSwipedChatId(null);
                  return;
                }
                handleChatClick(chat.id);
              }}
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
                    <h3 className={`text-xs sm:text-sm font-semibold truncate ${
                      (unreadCounts[chat.id] || 0) > 0 
                        ? "text-blue-900 font-bold" 
                        : "text-gray-900"
                    }`}>
                      {chat.otherUser.nickname}
                    </h3>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {(unreadCounts[chat.id] || 0) > 0 && (
                        <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg animate-pulse border-2 border-white">
                          {unreadCounts[chat.id] > 9 ? "9+" : unreadCounts[chat.id]}
                        </span>
                      )}
                      {/* 웹에서 삭제 버튼 */}
                      <button
                        onClick={e => handleDeleteChat(chat.id, e)}
                        disabled={isDeleting === chat.id}
                        className="hidden sm:flex items-center justify-center w-6 h-6 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="채팅 삭제"
                      >
                        {isDeleting === chat.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
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
                          {chat.item.status === "deleted" ? (
                            <span className="text-red-500 italic">
                              삭제된 상품
                            </span>
                          ) : (
                            chat.item.title
                          )}
                        </p>
                        {/* 거래 상태 표시 */}
                        {chat.item.status === "reserved" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                            거래중
                          </span>
                        )}
                        {chat.item.status === "shipping" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            배송중
                          </span>
                        )}
                        {chat.item.status === "sold" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            거래완료
                          </span>
                        )}
                        {chat.item.status === "deleted" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            삭제됨
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
          </div>
        );
      })}
    </div>
  );
}
