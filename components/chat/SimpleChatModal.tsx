"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { X, MessageCircle } from "lucide-react";

interface SimpleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  onChatDeleted?: () => void;
}

export function SimpleChatModal({
  isOpen,
  onClose,
  chatId,
  onChatDeleted,
}: SimpleChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      console.log("SimpleChatModal 열림:", { chatId, user: user.uid });
    }
  }, [isOpen, chatId, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      // 간단한 메시지 추가
      const message = {
        id: Date.now().toString(),
        text: newMessage,
        senderId: user.uid,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, message]);
      setNewMessage("");
      console.log("메시지 전송:", message);
    } catch (error) {
      console.error("메시지 전송 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white md:rounded-lg w-full md:max-w-md mx-0 md:mx-4 h-full md:max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">채팅</h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="p-1">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[200px]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>메시지를 입력해보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`p-2 rounded-lg max-w-[80%] ${
                    message.senderId === user?.uid
                      ? "bg-blue-500 text-white ml-auto"
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
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              size="sm"
            >
              {loading ? "전송중..." : "전송"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
