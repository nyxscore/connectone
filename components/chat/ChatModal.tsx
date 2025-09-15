"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import toast from "react-hot-toast";
import { Message } from "../../data/chat/types";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  sellerUid?: string;
  chatId?: string;
  onChatDeleted?: () => void;
}

export function ChatModal({
  isOpen,
  onClose,
  itemId,
  sellerUid,
  chatId,
  onChatDeleted,
}: ChatModalProps) {
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

  useEffect(() => {
    if (isOpen && user) {
      console.log("ChatModal 열림 - loadChatData 호출");
      loadChatData();
    }
  }, [isOpen, user, itemId, sellerUid, chatId]);

  useEffect(() => {
    if (chatData?.chatId) {
      console.log("chatData 변경됨 - 메시지 로드:", chatData.chatId);
      loadMessages(chatData.chatId);
    }
  }, [chatData?.chatId]);

  const loadChatData = async () => {
    try {
      console.log("loadChatData 시작:", { chatId, itemId, sellerUid });
      setLoading(true);
      setError("");

      if (!user) {
        setError("로그인이 필요합니다.");
        return;
      }

      // chatId가 있으면 기존 채팅 정보 로드
      if (chatId) {
        console.log("기존 채팅 로드:", chatId);
        try {
          // 채팅 정보 가져오기
          const chatRef = doc(db, "chats", chatId);
          const chatSnap = await getDoc(chatRef);

          if (!chatSnap.exists()) {
            setError("채팅을 찾을 수 없습니다.");
            return;
          }

          const chatData = chatSnap.data();

          // 상대방 UID 찾기
          const otherUid =
            chatData.buyerUid === user.uid
              ? chatData.sellerUid
              : chatData.buyerUid;

          // 상대방 정보 가져오기
          console.log("상대방 UID:", otherUid);
          const otherUser = await getUserProfile(otherUid);
          console.log("상대방 사용자 정보:", otherUser);

          // 아이템 정보 가져오기 (itemId가 unknown이 아닌 경우에만)
          let itemResult = null;
          if (chatData.itemId && chatData.itemId !== "unknown") {
            itemResult = await getItem(chatData.itemId);
            console.log("아이템 정보:", itemResult);
          } else {
            console.log("itemId가 unknown이므로 아이템 정보를 가져오지 않음");
          }

          // 사용자 정보가 없어도 채팅은 진행할 수 있도록 수정
          const userData =
            otherUser?.success && otherUser.data
              ? otherUser.data
              : {
                  nickname: "알 수 없음",
                  photoURL: undefined,
                };
          console.log("최종 사용자 데이터:", userData);

          const itemData =
            itemResult?.success && itemResult.item
              ? itemResult.item
              : {
                  id: chatData.itemId || "unknown",
                  brand: "알 수 없음",
                  model: "",
                  price: 0,
                  images: [],
                };

          setChatData({
            chatId,
            otherUser: {
              uid: otherUid,
              nickname: userData.nickname,
              profileImage: userData.photoURL,
            },
            item: {
              id: itemData.id,
              title: `${itemData.brand} ${itemData.model}`,
              price: itemData.price,
              imageUrl: itemData.images?.[0],
            },
          });

          // 메시지는 useEffect에서 자동으로 로드됨
        } catch (error) {
          console.error("채팅 정보 로드 실패:", error);
          setError("채팅 정보를 불러오는데 실패했습니다.");
        }
        return;
      }

      // 새로운 채팅 생성 (itemId와 sellerUid가 있을 때)
      console.log("새 채팅 생성:", { itemId, sellerUid });
      if (!itemId || !sellerUid) {
        setError("채팅 정보가 부족합니다.");
        return;
      }

      // 현재 사용자가 참여자인지 확인
      if (user.uid !== user.uid && user.uid !== sellerUid) {
        setError("이 채팅방에 접근할 권한이 없습니다.");
        return;
      }

      // 상대방 정보 가져오기
      const otherUid = user.uid === user.uid ? sellerUid : user.uid;
      const otherUser = await getUserProfile(otherUid);

      // 아이템 정보 가져오기
      const itemResult = await getItem(itemId);

      if (
        !otherUser ||
        !otherUser.success ||
        !otherUser.data ||
        !itemResult.success ||
        !itemResult.item
      ) {
        setError("채팅 정보를 불러올 수 없습니다.");
        return;
      }

      // 채팅 ID 생성
      const newChatId = `${user.uid}_${otherUid}_${itemId}`;

      setChatData({
        chatId: newChatId,
        otherUser: {
          uid: otherUid,
          nickname: otherUser.data.nickname,
          profileImage: otherUser.data.photoURL,
        },
        item: {
          id: itemResult.item.id,
          title: `${itemResult.item.brand} ${itemResult.item.model}`,
          price: itemResult.item.price,
          imageUrl: itemResult.item.images?.[0],
        },
      });

      // 메시지는 useEffect에서 자동으로 로드됨
    } catch (err) {
      console.error("채팅 데이터 로드 실패:", err);
      setError("채팅 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId?: string) => {
    const targetChatId = chatId || chatData?.chatId;
    console.log("loadMessages 호출됨:", {
      chatId,
      targetChatId,
      chatDataChatId: chatData?.chatId,
    });

    if (!targetChatId) {
      console.log("targetChatId가 없어서 메시지 로드 중단");
      return;
    }

    try {
      setMessagesLoading(true);
      console.log("메시지 로드 시작:", targetChatId);
      const result = await getChatMessages(targetChatId);
      console.log("메시지 로드 결과:", result);

      if (result.success && result.messages) {
        console.log("메시지 설정 전 현재 messages:", messages.length);
        setMessages(result.messages);
        console.log("메시지 설정 완료:", result.messages.length, "개");
        console.log("설정된 메시지들:", result.messages);
      } else {
        console.log("메시지 로드 실패 또는 메시지 없음:", result);
      }
    } catch (error) {
      console.error("메시지 로드 실패:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const handleDeleteChat = async () => {
    if (!user || !chatData?.chatId) return;

    const confirmed = window.confirm(
      "정말로 이 채팅방을 삭제하시겠습니까? 삭제된 채팅방은 복구할 수 없습니다."
    );

    if (!confirmed) return;

    try {
      const result = await deleteChat(chatData.chatId, user.uid);
      if (result.success) {
        toast.success("채팅방이 삭제되었습니다.");
        // 전역 이벤트 발생시켜서 ChatList가 새로고침되도록 함
        window.dispatchEvent(new CustomEvent("chatDeleted"));
        onChatDeleted?.(); // 채팅 목록 새로고침
        onClose();
      } else {
        toast.error(result.error || "채팅방 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("채팅방 삭제 실패:", error);
      toast.error("채팅방 삭제에 실패했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {chatData?.otherUser.profileImage ? (
                  <img
                    src={chatData.otherUser.profileImage}
                    alt={chatData.otherUser.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {chatData?.otherUser.nickname || "상대방"}
                </h2>
                <p className="text-sm text-gray-500">
                  {chatData?.item.title || "상품"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOtherProfileModal(true)}
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteChat}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 상품 정보 */}
        {chatData?.item && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              {chatData.item.imageUrl && (
                <img
                  src={chatData.item.imageUrl}
                  alt={chatData.item.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {chatData.item.title}
                </h3>
                <p className="text-lg font-bold text-blue-600">
                  {formatPrice(chatData.item.price)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 채팅 내용 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">채팅을 불러오는 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">메시지를 불러오는 중...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>채팅을 시작해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {console.log("메시지 렌더링:", messages.length, "개", messages)}
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderUid === user?.uid
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderUid === user?.uid
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="메시지 이미지"
                        className="w-full h-48 object-cover rounded mb-2"
                      />
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.createdAt?.toDate
                        ? formatDistanceToNow(message.createdAt.toDate(), {
                            addSuffix: true,
                            locale: ko,
                          })
                        : "방금 전"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 메시지 입력 */}
        <div className="p-4 border-t">
          <MessageInput
            chatId={chatData?.chatId || ""}
            senderUid={user?.uid || ""}
            itemId={itemId || "unknown"}
            sellerUid={sellerUid || "unknown"}
            onMessageSent={() => {
              console.log("메시지 전송 완료 - 새로고침 시작");
              toast.success("메시지가 전송되었습니다!");
              // 메시지 목록 새로고침
              if (chatData?.chatId) {
                console.log("메시지 새로고침 호출:", chatData.chatId);
                loadMessages(chatData.chatId);
              } else {
                console.log("chatData.chatId가 없음:", chatData);
              }
            }}
          />
        </div>
      </div>

      {/* 상대방 프로필 모달 */}
      {chatData && (
        <OtherUserProfileModal
          isOpen={showOtherProfileModal}
          onClose={() => setShowOtherProfileModal(false)}
          otherUser={chatData.otherUser}
        />
      )}
    </div>
  );
}
