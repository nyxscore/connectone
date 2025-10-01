"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "../../data/chat/types";
import {
  subscribeToMessages,
  markMessageAsRead,
  subscribeToUserOnlineStatus,
} from "../../lib/chat/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { MessageInput } from "./MessageInput";
import { OtherUserProfileModal } from "./OtherUserProfileModal";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Loader2, User, ArrowLeft, Package, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface ChatRoomProps {
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
  onBack?: () => void;
}

export function ChatRoom({ chatId, otherUser, item, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 메시지 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지 구독
  useEffect(() => {
    if (!chatId || !user) return;

    const unsubscribe = subscribeToMessages(
      chatId,
      newMessages => {
        setMessages(newMessages);
        setLoading(false);
        setError("");

        // 새 메시지가 있으면 스크롤을 맨 아래로
        setTimeout(scrollToBottom, 100);
      },
      error => {
        console.error("메시지 구독 오류:", error);
        setError("메시지를 불러오는데 실패했습니다.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId, user]);

  // 상대방 온라인 상태 구독
  useEffect(() => {
    if (!otherUser.uid) return;

    const unsubscribe = subscribeToUserOnlineStatus(otherUser.uid, isOnline => {
      setIsOtherUserOnline(isOnline);
    });

    return () => unsubscribe();
  }, [otherUser.uid]);

  // 메시지 읽음 처리
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const unreadMessages = messages.filter(
      message =>
        message.senderUid !== user.uid && !message.readBy.includes(user.uid)
    );

    // 읽지 않은 메시지들을 읽음 처리
    unreadMessages.forEach(async message => {
      await markMessageAsRead(message.id, user.uid);
    });
  }, [messages, user]);

  // 메시지 전송 완료 후 스크롤
  const handleMessageSent = () => {
    setTimeout(scrollToBottom, 100);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTimeOnly = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const isSameDate = (date1: any, date2: any) => {
    if (!date1 || !date2) return false;
    const d1 = date1.toDate ? date1.toDate() : new Date(date1);
    const d2 = date2.toDate ? date2.toDate() : new Date(date2);
    return d1.toDateString() === d2.toDateString();
  };

  const handleItemClick = () => {
    router.push(`/item/${item.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">메시지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          {/* 상품 정보 */}
          <div className="flex items-center space-x-3">
            {/* 상품 썸네일 */}
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {itemInfo?.images?.[0] ? (
                <img
                  src={itemInfo.images[0]}
                  alt={itemInfo.title || "상품"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-6 h-6 text-gray-500" />
              )}
            </div>
            {/* 상품명과 가격 */}
            <div>
              <h3 className="font-semibold text-gray-900">
                {itemInfo?.title || "상품 정보 없음"}
              </h3>
              <p className="text-sm text-gray-500">
                ₩{itemInfo?.price ? itemInfo.price.toLocaleString() : "0"}
              </p>
            </div>
          </div>
        </div>

        {/* 아이템 정보 */}
        <div
          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
          onClick={handleItemClick}
        >
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-8 h-8 rounded object-cover"
            />
          )}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 truncate max-w-32">
              {item.title}
            </p>
            <p className="text-xs text-gray-500">
              {item.price.toLocaleString()}원
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* 메시지 목록 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">아직 메시지가 없습니다.</p>
            <p className="text-sm text-gray-500">첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderUid === user?.uid;
            const isRead = message.readBy.length > 1; // 발신자 외에 읽은 사람이 있으면 읽음

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
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {/* 텍스트 메시지 */}
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}

                      {/* 이미지 메시지 */}
                      {message.imageUrl && (
                        <div className="mt-2">
                          <img
                            src={message.imageUrl}
                            alt="첨부 이미지"
                            className="max-w-full h-auto rounded"
                          />
                        </div>
                      )}
                    </div>

                    {/* 시간 및 읽음 상태 - 메시지 버블 밖에 표시 */}
                    <div
                      className={`flex items-center mt-1 ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">
                          {formatTimeOnly(message.createdAt)}
                        </span>
                        {isOwn && (
                          <span className="text-xs text-gray-500">
                            {isRead ? "읽음" : "전송됨"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      {user && (
        <MessageInput
          chatId={chatId}
          senderUid={user.uid}
          onMessageSent={handleMessageSent}
        />
      )}

      {/* 상대방 프로필 모달 */}
      <OtherUserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userUid={otherUser.uid}
        userNickname={otherUser.nickname}
        userProfileImage={otherUser.profileImage}
      />
    </div>
  );
}
