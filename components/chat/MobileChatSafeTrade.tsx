"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Send,
  Image as ImageIcon,
  Camera,
  MapPin,
  CheckCircle,
  Package,
  RotateCcw,
  Truck,
  MessageSquare,
  MoreVertical,
  AlertTriangle,
  UserX,
  LogOut,
} from "lucide-react";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";

// 거래 단계 타입
type TradeStatus =
  | "payment_completed"
  | "in_transaction"
  | "shipping"
  | "completed";

// 메시지 타입
interface ChatMessage {
  id: string;
  type: "user" | "system";
  content: string;
  sender?: "buyer" | "seller";
  timestamp: Date;
  readBy?: string[];
}

// Bottom Sheet 액션 아이템
interface ActionItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}

export function MobileChatSafeTrade() {
  const [tradeStatus, setTradeStatus] =
    useState<TradeStatus>("payment_completed");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "system",
      content: "🎉 구매자가 안전결제를 완료했습니다!\n거래를 진행해주세요.",
      timestamp: new Date(Date.now() - 3600000),
      readBy: ["buyer", "seller"],
    },
    {
      id: "2",
      type: "user",
      content: "안녕하세요! 잘 부탁드립니다.",
      sender: "buyer",
      timestamp: new Date(Date.now() - 3000000),
      readBy: ["buyer", "seller"],
    },
    {
      id: "3",
      type: "user",
      content: "네, 확인했습니다. 내일 발송하겠습니다!",
      sender: "seller",
      timestamp: new Date(Date.now() - 2400000),
      readBy: ["seller"],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [userRole] = useState<"buyer" | "seller">("buyer"); // 테스트용
  const [currentUserId] = useState<string>("buyer"); // 테스트용
  const [otherUserId] = useState<string>("seller"); // 테스트용
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock 상품 정보
  const [itemInfo] = useState({
    id: "test-item-1",
    title: "Roland GO:KEYS 61건반 신디사이저",
    price: 190000,
    imageUrl: "https://via.placeholder.com/150", // 테스트용 이미지
    sellerNickname: "판매자닉네임",
  });

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 거래 단계 정보
  const tradeSteps = [
    { key: "payment_completed", label: "결제완료", icon: "💳" },
    { key: "in_transaction", label: "거래중", icon: "🤝" },
    { key: "shipping", label: "배송중", icon: "🚚" },
    { key: "completed", label: "거래완료", icon: "✅" },
  ];

  const currentStepIndex = tradeSteps.findIndex(
    step => step.key === tradeStatus
  );

  // Bottom Sheet 액션 (구매자용)
  const buyerActions: ActionItem[] = [
    {
      icon: <ImageIcon className="w-5 h-5" />,
      label: "앨범",
      onClick: () => {
        toast.success("앨범 열기");
        setShowBottomSheet(false);
      },
    },
    {
      icon: <Camera className="w-5 h-5" />,
      label: "카메라",
      onClick: () => {
        toast.success("카메라 열기");
        setShowBottomSheet(false);
      },
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "배송지 입력",
      onClick: () => {
        addSystemMessage("📦 구매자가 배송지를 입력했습니다.");
        setShowBottomSheet(false);
      },
      variant: "primary",
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "구매확인",
      onClick: () => {
        handleBuyerConfirm();
        setShowBottomSheet(false);
      },
      variant: "primary",
    },
    {
      icon: <RotateCcw className="w-5 h-5" />,
      label: "반품",
      onClick: () => {
        toast.error("반품 신청");
        setShowBottomSheet(false);
      },
      variant: "danger",
    },
  ];

  // Bottom Sheet 액션 (판매자용)
  const sellerActions: ActionItem[] = [
    {
      icon: <ImageIcon className="w-5 h-5" />,
      label: "앨범",
      onClick: () => {
        toast.success("앨범 열기");
        setShowBottomSheet(false);
      },
    },
    {
      icon: <Camera className="w-5 h-5" />,
      label: "카메라",
      onClick: () => {
        toast.success("카메라 열기");
        setShowBottomSheet(false);
      },
    },
    {
      icon: <Truck className="w-5 h-5" />,
      label: "운송장 등록",
      onClick: () => {
        handleShippingRegister();
        setShowBottomSheet(false);
      },
      variant: "primary",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "구매확인 요청",
      onClick: () => {
        addSystemMessage("💬 판매자가 구매확인을 요청했습니다.");
        setShowBottomSheet(false);
      },
      variant: "primary",
    },
  ];

  const actions = userRole === "buyer" ? buyerActions : sellerActions;

  // 시스템 메시지 추가
  const addSystemMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "system",
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // 사용자 메시지 전송
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      sender: userRole,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
  };

  // 거래 진행하기 (판매자)
  const handleStartTransaction = () => {
    setTradeStatus("in_transaction");
    addSystemMessage("🤝 판매자가 거래를 시작했습니다.");
  };

  // 운송장 등록 (판매자)
  const handleShippingRegister = () => {
    setTradeStatus("shipping");
    addSystemMessage(
      "🚚 판매자가 운송장을 등록했습니다. (CJ대한통운: 1234567890)"
    );
  };

  // 구매확인 (구매자)
  const handleBuyerConfirm = () => {
    setTradeStatus("completed");
    addSystemMessage("🎉 구매자가 구매를 확인했습니다. 거래가 완료되었습니다!");
  };

  // 시간 포맷 (기존 방식)
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

  // 날짜 포맷
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

  // 같은 시간인지 확인 (1분 이내)
  const isSameTime = (time1: any, time2: any) => {
    if (!time1 || !time2) return false;
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    return Math.abs(date1.getTime() - date2.getTime()) < 60000;
  };

  // 다른 날짜인지 확인
  const isDifferentDay = (time1: any, time2: any) => {
    if (!time1 || !time2) return false;
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    return date1.toDateString() !== date2.toDateString();
  };

  return (
    <div className="flex flex-col h-screen max-w-[480px] mx-auto bg-gradient-to-b from-purple-50 to-blue-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0">
            <X className="w-6 h-6" />
          </button>

          {/* 상품 썸네일 */}
          {itemInfo.imageUrl && (
            <img
              src={itemInfo.imageUrl}
              alt={itemInfo.title}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          )}

          {/* 상품명 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {itemInfo.title}
            </h3>
            <p className="text-xs text-gray-500">
              {new Intl.NumberFormat("ko-KR").format(itemInfo.price)}원
            </p>
          </div>
        </div>

        {/* 메뉴 버튼 */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenuSheet(!showMenuSheet)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {/* 드롭다운 메뉴 */}
          <AnimatePresence>
            {showMenuSheet && (
              <>
                {/* 배경 클릭 영역 */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenuSheet(false)}
                />

                {/* 드롭다운 */}
                <motion.div
                  className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-48 z-40"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* 신고하기 */}
                  <button
                    onClick={() => {
                      toast.error("신고하기 기능");
                      setShowMenuSheet(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700">신고하기</span>
                  </button>

                  {/* 차단하기 */}
                  <button
                    onClick={() => {
                      toast.error("차단하기 기능");
                      setShowMenuSheet(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <UserX className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-700">차단하기</span>
                  </button>

                  {/* 구분선 */}
                  <div className="h-px bg-gray-200 my-1" />

                  {/* 채팅방 나가기 */}
                  <button
                    onClick={() => {
                      toast.success("채팅방 나가기");
                      setShowMenuSheet(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">채팅방 나가기</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 진행 상태 바 */}
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between relative">
          {tradeSteps.map((step, index) => (
            <div
              key={step.key}
              className="flex flex-col items-center flex-1 relative z-10"
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
                  index <= currentStepIndex
                    ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg"
                    : "bg-gray-200 text-gray-400"
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: index === currentStepIndex ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              >
                {step.icon}
              </motion.div>
              <span
                className={`text-[10px] mt-1 font-medium ${
                  index <= currentStepIndex ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}

          {/* 연결선 */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: "0%" }}
              animate={{
                width: `${(currentStepIndex / (tradeSteps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showDateSeparator =
            !prevMessage ||
            isDifferentDay(prevMessage.timestamp, message.timestamp);
          const shouldShowTime =
            !prevMessage ||
            !isSameTime(prevMessage.timestamp, message.timestamp) ||
            prevMessage.sender !== message.sender;
          const isOwn = message.sender === userRole;

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 날짜 구분선 */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(message.timestamp)}
                  </div>
                </div>
              )}

              {message.type === "system" ? (
                // 시스템 메시지
                <div className="flex justify-center mb-3">
                  <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm max-w-[85%] text-center">
                    <p className="text-xs text-gray-700">{message.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatTimeOnly(message.timestamp)}
                    </p>
                  </div>
                </div>
              ) : (
                // 사용자 메시지
                <div
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
                >
                  <div
                    className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end max-w-[80%]`}
                  >
                    {/* 말풍선 */}
                    <div
                      className={`px-4 py-2 rounded-2xl shadow-sm ${
                        isOwn
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>

                    {/* 시간 및 읽음 표시 */}
                    {shouldShowTime && (
                      <div
                        className={`flex items-center ${isOwn ? "mr-2" : "ml-2"}`}
                      >
                        {isOwn && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {formatTimeOnly(message.timestamp)}
                            </span>
                            {/* 읽음/안읽음 표시 */}
                            {message.readBy &&
                              !message.readBy.includes(otherUserId) && (
                                <span className="text-xs text-purple-500 font-medium">
                                  1
                                </span>
                              )}
                          </div>
                        )}
                        {!isOwn && (
                          <span className="text-xs text-gray-500">
                            {formatTimeOnly(message.timestamp)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 하단 입력 영역 */}
      <div className="bg-white border-t border-gray-200 px-3 py-3">
        <div className="flex items-center space-x-2">
          {/* + 버튼 */}
          <button
            onClick={() => setShowBottomSheet(true)}
            className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* 입력창 */}
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSendMessage()}
            placeholder="메시지를 입력하세요"
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />

          {/* 전송 버튼 */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {showBottomSheet && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBottomSheet(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-w-[480px] mx-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* 드래그 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* 액션 그리드 */}
              <div className="px-4 pb-6 pt-2">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">
                  {userRole === "buyer" ? "구매자 메뉴" : "판매자 메뉴"}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {actions.map((action, index) => (
                    <motion.button
                      key={index}
                      onClick={action.onClick}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                        action.variant === "primary"
                          ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                          : action.variant === "danger"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="mb-2">{action.icon}</div>
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* 취소 버튼 */}
                <button
                  onClick={() => setShowBottomSheet(false)}
                  className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 개발용 테스트 버튼 (나중에 제거) */}
      <div className="fixed top-20 right-4 flex flex-col space-y-2 z-30">
        {tradeStatus === "payment_completed" && userRole === "seller" && (
          <Button
            onClick={handleStartTransaction}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-xs"
          >
            거래진행
          </Button>
        )}
      </div>
    </div>
  );
}
