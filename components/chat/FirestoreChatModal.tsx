"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { MessageInput } from "./MessageInput";
import { OtherUserProfileModal } from "./OtherUserProfileModal";
import { SellItem } from "../../data/types";
import { UserProfile } from "../../data/profile/types";
import { getUserProfile } from "../../lib/profile/api";
import { getItem } from "../../lib/api/products";
import {
  getOrCreateChat,
  getChatMessages,
  subscribeToMessages,
  deleteChat,
  markChatAsRead,
  Chat,
  Message,
} from "../../lib/chat/api";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/api/firebase";
import {
  ArrowLeft,
  X,
  User,
  Star,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  MessageCircle,
  Trash2,
  Package,
} from "lucide-react";
// date-fns 제거 - 간단한 시간 표시로 변경
import toast from "react-hot-toast";

interface FirestoreChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  sellerUid?: string;
  chatId?: string;
  onChatDeleted?: () => void;
}

export function FirestoreChatModal({
  isOpen,
  onClose,
  itemId,
  sellerUid,
  chatId,
  onChatDeleted,
}: FirestoreChatModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatData, setChatData] = useState<{
    chatId: string;
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
  const [showOtherProfileModal, setShowOtherProfileModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      console.log("FirestoreChatModal 열림 - loadChatData 호출");
      loadChatData();
    }
  }, [isOpen, user, itemId, sellerUid, chatId]);

  // 메시지 변경 시 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatData?.chatId) {
      console.log("chatData 변경됨 - 메시지 로드:", chatData.chatId);
      loadMessages(chatData.chatId);

      // 실시간 메시지 구독
      const unsubscribe = subscribeToMessages(
        chatData.chatId,
        messages => {
          console.log("실시간 메시지 업데이트:", messages.length, "개");
          setMessages(messages);

          // 메시지가 로드된 후 읽음 처리 (카카오톡처럼)
          if (messages.length > 0 && user) {
            setTimeout(async () => {
              const markReadResult = await markChatAsRead(
                chatData.chatId,
                user.uid
              );
              if (markReadResult.success) {
                console.log("채팅 읽음 처리 완료");
              } else {
                console.error("채팅 읽음 처리 실패:", markReadResult.error);
              }
            }, 2000); // 2초 후 읽음 처리 (실제로 메시지를 봤을 때)
          }
        },
        error => {
          console.error("실시간 메시지 구독 오류:", error);
        }
      );

      return () => {
        console.log("메시지 구독 해제");
        unsubscribe();
      };
    }
  }, [chatData?.chatId, user]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      setError("");

      if (chatId) {
        // 기존 채팅 로드
        console.log("기존 채팅 로드:", chatId);
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          setError("채팅을 찾을 수 없습니다.");
          return;
        }

        const chatData = chatSnap.data() as Chat;
        const otherUid =
          chatData.buyerUid === user?.uid
            ? chatData.sellerUid
            : chatData.buyerUid;

        // 상대방 정보 가져오기
        const otherUserResult = await getUserProfile(otherUid);
        console.log("상대방 사용자 정보 결과:", otherUserResult);

        const otherUser = otherUserResult.success ? otherUserResult.data : null;
        console.log("상대방 사용자 데이터:", otherUser);
        console.log(
          "상대방 닉네임:",
          otherUser?.nickname,
          otherUser?.displayName
        );
        console.log(
          "상대방 프로필 이미지:",
          otherUser?.photoURL,
          otherUser?.profileImage
        );

        // 아이템 정보 가져오기
        let itemResult = null;
        if (chatData.itemId && chatData.itemId !== "unknown") {
          itemResult = await getItem(chatData.itemId);
          console.log("아이템 정보:", itemResult);
        }

        setChatData({
          chatId,
          otherUser: {
            uid: otherUid,
            nickname:
              otherUser?.nickname || otherUser?.displayName || "알 수 없음",
            profileImage: otherUser?.photoURL || otherUser?.profileImage,
          },
          item: {
            id: chatData.itemId || "unknown",
            title: itemResult?.title || "상품 정보 없음",
            price: itemResult?.price || 0,
            imageUrl: itemResult?.imageUrl,
          },
        });

        console.log("최종 사용자 데이터:", {
          uid: otherUid,
          nickname: otherUser?.nickname || "알 수 없음",
          profileImage: otherUser?.profileImage,
        });
      } else if (itemId && sellerUid) {
        // 새 채팅 생성
        console.log("새 채팅 생성:", { itemId, sellerUid });
        try {
          // 상품 정보 가져오기
          const itemInfo = await getItem(itemId);
          const itemTitle =
            itemInfo.success && itemInfo.item
              ? itemInfo.item.title ||
                itemInfo.item.brand + " " + itemInfo.item.model
              : itemId;

          const result = await getOrCreateChat(
            itemId,
            user.uid,
            sellerUid,
            `${itemTitle}에 대해 문의드립니다.`
          );

          if (!result.success || !result.chatId) {
            setError(result.error || "채팅을 생성할 수 없습니다.");
            return;
          }

          // 상대방 정보 가져오기
          const otherUserResult = await getUserProfile(sellerUid);
          console.log("상대방 사용자 정보 결과:", otherUserResult);

          const otherUser = otherUserResult.success
            ? otherUserResult.data
            : null;
          console.log("상대방 사용자 데이터:", otherUser);
          console.log(
            "상대방 닉네임:",
            otherUser?.nickname,
            otherUser?.displayName
          );
          console.log(
            "상대방 프로필 이미지:",
            otherUser?.photoURL,
            otherUser?.profileImage
          );

          // 아이템 정보 가져오기
          const itemResult = await getItem(itemId);
          console.log("아이템 정보:", itemResult);

          setChatData({
            chatId: result.chatId,
            otherUser: {
              uid: sellerUid,
              nickname:
                otherUser?.nickname || otherUser?.displayName || "알 수 없음",
              profileImage: otherUser?.photoURL || otherUser?.profileImage,
            },
            item: {
              id: itemId,
              title: itemResult?.title || "상품 정보 없음",
              price: itemResult?.price || 0,
              imageUrl: itemResult?.imageUrl,
            },
          });

          console.log("최종 사용자 데이터:", {
            uid: sellerUid,
            nickname: otherUser?.nickname || "알 수 없음",
            profileImage: otherUser?.profileImage,
          });
        } catch (error) {
          console.error("채팅 생성 실패:", error);
          setError("채팅을 생성하는데 실패했습니다.");
        }
      } else {
        setError("채팅 정보가 부족합니다.");
      }
    } catch (error) {
      console.error("loadChatData 실패:", error);
      setError("채팅을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      console.log("FirestoreChatModal 메시지 로드 시작:", chatId);
      setMessagesLoading(true);
      const result = await getChatMessages(chatId);
      console.log("FirestoreChatModal 메시지 로드 결과:", result);

      if (result.success && result.messages) {
        setMessages(result.messages);
        console.log(
          "FirestoreChatModal 메시지 설정 완료:",
          result.messages.length,
          "개"
        );
      } else {
        console.log(
          "FirestoreChatModal 메시지 로드 실패 또는 메시지 없음:",
          result
        );
      }
    } catch (error) {
      console.error("FirestoreChatModal 메시지 로드 실패:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTimeOnly = (timestamp: any) => {
    if (!timestamp) return "";
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const isSameDate = (date1: any, date2: any) => {
    if (!date1 || !date2) return false;
    let d1: Date, d2: Date;

    if (date1.toDate && typeof date1.toDate === "function") {
      d1 = date1.toDate();
    } else if (date1.seconds) {
      d1 = new Date(date1.seconds * 1000);
    } else {
      d1 = new Date(date1);
    }

    if (date2.toDate && typeof date2.toDate === "function") {
      d2 = date2.toDate();
    } else if (date2.seconds) {
      d2 = new Date(date2.seconds * 1000);
    } else {
      d2 = new Date(date2);
    }

    return d1.toDateString() === d2.toDateString();
  };

  const handleDeleteChat = async () => {
    if (!chatData?.chatId || !user?.uid) return;

    if (confirm("정말로 이 채팅을 삭제하시겠습니까?")) {
      try {
        console.log("채팅 삭제 시작:", {
          chatId: chatData.chatId,
          userId: user.uid,
        });
        const result = await deleteChat(chatData.chatId, user.uid);
        console.log("채팅 삭제 결과:", result);

        if (result.success) {
          toast.success("채팅이 삭제되었습니다.");

          // 전역 이벤트 발생으로 ChatList에 알림
          window.dispatchEvent(
            new CustomEvent("chatDeleted", {
              detail: { chatId: chatData.chatId },
            })
          );

          onChatDeleted?.();
          onClose();
        } else {
          toast.error(result.error || "채팅 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("채팅 삭제 실패:", error);
        toast.error("채팅 삭제에 실패했습니다.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md h-[600px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {chatData && (
              <div className="flex items-center space-x-3">
                {/* 상품 썸네일 */}
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                  {chatData.item.imageUrl ? (
                    <img
                      src={chatData.item.imageUrl}
                      alt={chatData.item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                {/* 상품명 */}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {chatData.item.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {chatData.item.price.toLocaleString()}원
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteChat}
              className="p-2 text-red-600 hover:text-red-700"
              title="채팅 삭제"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-700"
              title="창 닫기"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading || messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  {loading
                    ? "채팅을 불러오는 중..."
                    : "메시지를 불러오는 중..."}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadChatData}>다시 시도</Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">아직 메시지가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-2">
                  첫 메시지를 보내보세요!
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.senderUid === user?.uid;

              // 이전 메시지와 날짜가 다른지 확인
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDateSeparator =
                !prevMessage ||
                !isSameDate(message.createdAt, prevMessage.createdAt);

              return (
                <div key={message.id}>
                  {/* 날짜 구분선 */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* 메시지 */}
                  <div
                    className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
                  >
                    <div className="flex flex-col max-w-xs lg:max-w-md">
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwn
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            alt="첨부 이미지"
                            className="w-full h-48 object-cover rounded mb-2"
                          />
                        )}
                        {message.content && (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>

                      {/* 시간 - 메시지 버블 밖에 표시 */}
                      <div
                        className={`flex items-center mt-1 ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-xs text-gray-500">
                          {formatTimeOnly(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {/* 스크롤 타겟 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 */}
        {chatData && user && (
          <div className="p-4 border-t">
            <MessageInput
              chatId={chatData.chatId}
              senderUid={user.uid}
              itemId={chatData.item.id}
              sellerUid={chatData.otherUser.uid}
              onMessageSent={() => {
                console.log("메시지 전송 완료");
              }}
            />
          </div>
        )}

        {/* 상대방 프로필 모달 */}
        {showOtherProfileModal && chatData && (
          <OtherUserProfileModal
            isOpen={showOtherProfileModal}
            onClose={() => setShowOtherProfileModal(false)}
            userUid={chatData.otherUser.uid}
            userNickname={chatData.otherUser.nickname}
            userProfileImage={chatData.otherUser.profileImage}
            onBlocked={() => {
              // 차단 시 채팅 모달 닫기 및 채팅 목록 새로고침
              onClose();
              window.dispatchEvent(
                new CustomEvent("chatDeleted", {
                  detail: { chatId: chatData.chatId },
                })
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
