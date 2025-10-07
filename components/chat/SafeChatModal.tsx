"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import {
  ArrowLeft,
  X,
  Loader2,
  AlertCircle,
  MessageCircle,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

interface SafeChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  sellerUid?: string;
  chatId?: string;
  tradeType?: string;
  onChatDeleted?: () => void;
  autoSendSystemMessage?: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  type: string;
}

export function SafeChatModal({
  isOpen,
  onClose,
  itemId,
  sellerUid,
  chatId,
  tradeType,
  onChatDeleted,
  autoSendSystemMessage,
}: SafeChatModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
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
      status?: string;
    };
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 채팅 데이터 로드
  useEffect(() => {
    if (isOpen && user) {
      loadChatData();
    }
  }, [isOpen, user, chatId, itemId, sellerUid]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      setError("");

      if (chatId) {
        // 기존 채팅 로드
        console.log("기존 채팅 로드:", chatId);
        setChatData({
          chatId,
          otherUser: {
            uid: "temp",
            nickname: "임시 사용자",
            profileImage: undefined,
          },
          item: {
            id: "temp",
            title: "임시 상품",
            price: 0,
            imageUrl: undefined,
            status: "active",
          },
        });
        
        // 임시 메시지 추가
        setMessages([
          {
            id: "1",
            text: "안녕하세요! 상품에 대해 문의드립니다.",
            senderId: "temp",
            timestamp: new Date(Date.now() - 60000),
            type: "text",
          },
          {
            id: "2",
            text: "네, 무엇이 궁금하신가요?",
            senderId: user?.uid || "",
            timestamp: new Date(),
            type: "text",
          },
        ]);
      } else if (itemId && sellerUid && user) {
        // 새 채팅 생성
        console.log("새 채팅 생성:", { itemId, sellerUid });
        setChatData({
          chatId: "temp",
          otherUser: {
            uid: sellerUid,
            nickname: "임시 판매자",
            profileImage: undefined,
          },
          item: {
            id: itemId,
            title: "임시 상품",
            price: 0,
            imageUrl: undefined,
            status: "active",
          },
        });
        
        // 자동 시스템 메시지
        if (autoSendSystemMessage) {
          setMessages([
            {
              id: "system",
              text: autoSendSystemMessage,
              senderId: "system",
              timestamp: new Date(),
              type: "system",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("채팅 데이터 로드 실패:", error);
      setError("채팅을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user) return;

    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        senderId: user.uid,
        timestamp: new Date(),
        type: "text",
      };

      setMessages(prev => [...prev, newMessage]);
      console.log("메시지 전송:", newMessage);
      
      toast.success("메시지가 전송되었습니다.");
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      toast.error("메시지 전송에 실패했습니다.");
    }
  };

  const handleDeleteChat = async () => {
    if (!chatData?.chatId) return;

    try {
      setLoading(true);
      console.log("채팅 삭제:", chatData.chatId);
      toast.success("채팅이 삭제되었습니다.");
      onChatDeleted?.();
      onClose();
    } catch (error) {
      console.error("채팅 삭제 실패:", error);
      toast.error("채팅 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">
                {chatData?.otherUser?.nickname || "채팅"}
              </h2>
              <p className="text-sm text-gray-500">
                {chatData?.item?.title || "상품 정보 없음"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDeleteChat}
              variant="ghost"
              size="sm"
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                <p className="text-red-500">{error}</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>메시지를 입력해보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg max-w-[80%] ${
                    message.senderId === user?.uid
                      ? "bg-blue-500 text-white ml-auto"
                      : message.senderId === "system"
                      ? "bg-gray-200 text-gray-700 text-center mx-auto"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleSendMessage(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              disabled={loading}
            />
            <Button
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input');
                if (input?.value.trim()) {
                  handleSendMessage(input.value);
                  input.value = '';
                }
              }}
              disabled={loading}
              className="px-4"
            >
              전송
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}