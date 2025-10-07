"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { getFirebaseDb } from "../../lib/api/firebase-ultra-safe";
import { doc, getDoc, collection, addDoc, updateDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { getOrCreateChat, getChatMessages, subscribeToMessages } from "../../lib/chat/api";
import { getItem } from "../../lib/api/products";
import { getUserProfile } from "../../lib/profile/api";
import {
  ArrowLeft,
  X,
  Loader2,
  AlertCircle,
  MessageCircle,
  Trash2,
  User,
  Star,
  MapPin,
  Calendar,
  MoreVertical,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Truck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface UltraSafeChatModalProps {
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

interface ChatData {
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
    buyerUid?: string;
    transactionCancelledAt?: any;
    shippingInfo?: any;
    buyerShippingInfo?: any;
  };
  tradeType?: string;
  sellerUid?: string;
  buyerUid?: string;
}

export function UltraSafeChatModal({
  isOpen,
  onClose,
  itemId,
  sellerUid,
  chatId,
  tradeType,
  onChatDeleted,
  autoSendSystemMessage,
}: UltraSafeChatModalProps) {
  // 모든 Hook을 컴포넌트 최상단에 선언
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isStartingTransaction, setIsStartingTransaction] = useState(false);
  const [isCancelingTransaction, setIsCancelingTransaction] = useState(false);
  const [isRequestingCancel, setIsRequestingCancel] = useState(false);
  const [isApprovingCancel, setIsApprovingCancel] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCompletingPurchase, setIsCompletingPurchase] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [isRegisteringShipping, setIsRegisteringShipping] = useState(false);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showShippingTrackingModal, setShowShippingTrackingModal] = useState(false);
  const [showBuyerShippingInfoModal, setShowBuyerShippingInfoModal] = useState(false);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [systemMessagesInitialized, setSystemMessagesInitialized] = useState(false);

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

  // 시스템 메시지 초기화
  useEffect(() => {
    if (
      isOpen &&
      chatData?.chatId &&
      autoSendSystemMessage &&
      !systemMessagesInitialized
    ) {
      setSystemMessagesInitialized(true);
      // 시스템 메시지 추가 로직
    }
  }, [
    isOpen,
    autoSendSystemMessage,
    chatData?.chatId,
    systemMessagesInitialized,
  ]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      setError("");

      if (chatId) {
        // 기존 채팅 로드
        console.log("기존 채팅 로드:", chatId);
        
        // Firebase에서 실제 채팅 데이터 로드
        const db = getFirebaseDb();
        if (db) {
          const chatDoc = await getDoc(doc(db, "chats", chatId));
          if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            
            // 실제 상품 정보 로드
            let itemData = null;
            if (chatData.itemId) {
              try {
                itemData = await getItem(chatData.itemId);
              } catch (error) {
                console.error("상품 정보 로드 실패:", error);
              }
            }
            
            // 실제 사용자 정보 로드
            let otherUserData = null;
            if (chatData.sellerUid && chatData.buyerUid) {
              const otherUid = chatData.sellerUid === user?.uid ? chatData.buyerUid : chatData.sellerUid;
              try {
                otherUserData = await getUserProfile(otherUid);
              } catch (error) {
                console.error("사용자 정보 로드 실패:", error);
              }
            }
            
            setChatData({
              chatId,
              otherUser: {
                uid: otherUserData?.uid || "unknown",
                nickname: otherUserData?.nickname || "알 수 없는 사용자",
                profileImage: otherUserData?.profileImage,
              },
              item: {
                id: itemData?.id || chatData.itemId || "unknown",
                title: itemData?.title || "상품 정보 없음",
                price: itemData?.price || 0,
                imageUrl: itemData?.imageUrl,
                status: itemData?.status || "unknown",
                buyerUid: chatData.buyerUid,
                transactionCancelledAt: itemData?.transactionCancelledAt,
                shippingInfo: itemData?.shippingInfo,
                buyerShippingInfo: itemData?.buyerShippingInfo,
              },
              tradeType: chatData.tradeType || "buy",
              sellerUid: chatData.sellerUid,
              buyerUid: chatData.buyerUid,
            });
            
            // 실제 메시지 로드
            loadMessages(chatId);
          } else {
            throw new Error("채팅을 찾을 수 없습니다.");
          }
        } else {
          throw new Error("Firebase가 초기화되지 않았습니다.");
        }
      } else if (itemId && sellerUid && user) {
        // 새 채팅 생성
        console.log("새 채팅 생성:", { itemId, sellerUid });
        
        try {
          // 실제 상품 정보 로드
          const itemData = await getItem(itemId);
          
          // 실제 사용자 정보 로드
          const sellerData = await getUserProfile(sellerUid);
          
          // 새 채팅 생성
          const newChatId = await getOrCreateChat(itemId, sellerUid, user.uid, tradeType);
          
          setChatData({
            chatId: newChatId,
            otherUser: {
              uid: sellerUid,
              nickname: sellerData?.nickname || "판매자",
              profileImage: sellerData?.profileImage,
            },
            item: {
              id: itemData?.id || itemId,
              title: itemData?.title || "상품 정보 없음",
              price: itemData?.price || 0,
              imageUrl: itemData?.imageUrl,
              status: itemData?.status || "active",
              buyerUid: user.uid,
              transactionCancelledAt: itemData?.transactionCancelledAt,
              shippingInfo: itemData?.shippingInfo,
              buyerShippingInfo: itemData?.buyerShippingInfo,
            },
            tradeType: tradeType || "buy",
            sellerUid,
            buyerUid: user.uid,
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
          
          // 메시지 구독 시작
          loadMessages(newChatId);
        } catch (error) {
          console.error("새 채팅 생성 실패:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("채팅 데이터 로드 실패:", error);
      setError("채팅을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      
      // Firebase에서 실제 메시지 로드
      const db = getFirebaseDb();
      if (db) {
        // 기존 메시지 로드
        const initialMessages = await getChatMessages(chatId);
        setMessages(initialMessages);
        
        // 실시간 메시지 구독
        subscribeToMessages(chatId, (newMessages) => {
          setMessages(newMessages);
        });
      }
    } catch (error) {
      console.error("메시지 로드 실패:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user || !chatData?.chatId) return;

    try {
      const db = getFirebaseDb();
      if (!db) {
        throw new Error("Firebase가 초기화되지 않았습니다.");
      }

      // Firebase에 실제 메시지 저장
      const messageData = {
        text: messageText.trim(),
        senderId: user.uid,
        timestamp: new Date(),
        type: "text",
      };

      await addDoc(collection(db, "chats", chatData.chatId, "messages"), messageData);
      
      console.log("메시지 전송 성공:", messageData);
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

  const handleStartTransaction = async () => {
    if (!chatData?.item.id || !user) return;

    try {
      setIsStartingTransaction(true);
      
      // Firebase에서 실제 거래 시작
      const db = getFirebaseDb();
      if (db) {
        // 상품 상태를 'reserved'로 변경
        await updateDoc(doc(db, "items", chatData.item.id), {
          status: "reserved",
          buyerUid: user.uid,
          reservedAt: new Date(),
        });
        
        // 시스템 메시지 전송
        const systemMessage = {
          text: `${user.uid === chatData.sellerUid ? '판매자' : '구매자'}가 거래를 시작했습니다.`,
          senderId: "system",
          timestamp: new Date(),
          type: "system",
        };
        
        await addDoc(collection(db, "chats", chatData.chatId, "messages"), systemMessage);
        
        console.log("거래 시작 성공:", chatData.item.id);
        toast.success("거래가 시작되었습니다.");
      }
    } catch (error) {
      console.error("거래 시작 실패:", error);
      toast.error("거래 시작에 실패했습니다.");
    } finally {
      setIsStartingTransaction(false);
    }
  };

  const handleCompletePurchase = async () => {
    if (!chatData?.item.id || !user) return;

    try {
      setIsCompletingPurchase(true);
      
      // Firebase에서 실제 구매 완료
      const db = getFirebaseDb();
      if (db) {
        // 상품 상태를 'sold'로 변경
        await updateDoc(doc(db, "items", chatData.item.id), {
          status: "sold",
          soldAt: new Date(),
        });
        
        // 시스템 메시지 전송
        const systemMessage = {
          text: `거래가 완료되었습니다.`,
          senderId: "system",
          timestamp: new Date(),
          type: "system",
        };
        
        await addDoc(collection(db, "chats", chatData.chatId, "messages"), systemMessage);
        
        console.log("구매 완료 성공:", chatData.item.id);
        toast.success("구매가 완료되었습니다.");
      }
    } catch (error) {
      console.error("구매 완료 실패:", error);
      toast.error("구매 완료에 실패했습니다.");
    } finally {
      setIsCompletingPurchase(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] flex">
        {/* 사이드바 */}
        {showSidebar && chatData && (
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* 상품 정보 */}
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg mb-2">상품 정보</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{chatData.item.title}</p>
                <p className="text-lg font-bold text-blue-600">
                  {chatData.item.price.toLocaleString()}원
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>상태: {chatData.item.status}</span>
                </div>
              </div>
            </div>

            {/* 거래 버튼들 */}
            <div className="p-4 space-y-2">
              <Button
                onClick={handleStartTransaction}
                disabled={isStartingTransaction || loading}
                className="w-full"
              >
                {isStartingTransaction ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                거래 시작
              </Button>
              
              <Button
                onClick={handleCompletePurchase}
                disabled={isCompletingPurchase || loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCompletingPurchase ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                구매 완료
              </Button>
            </div>

            {/* 사용자 정보 */}
            <div className="p-4 border-t mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{chatData.otherUser.nickname}</p>
                  <p className="text-sm text-gray-500">판매자</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 메인 채팅 영역 */}
        <div className="flex-1 flex flex-col">
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
                onClick={() => setShowSidebar(!showSidebar)}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                <Settings className="w-5 h-5" />
              </Button>
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
          <div className="flex-1 p-4 overflow-y-auto min-h-[400px]">
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
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === user?.uid
                          ? "bg-blue-500 text-white"
                          : message.senderId === "system"
                          ? "bg-gray-200 text-gray-700 text-center mx-auto"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(message.timestamp, "HH:mm", { locale: ko })}
                      </p>
                    </div>
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
    </div>
  );
}
