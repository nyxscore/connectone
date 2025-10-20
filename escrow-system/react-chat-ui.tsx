import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase-config";
import { Transaction, ChatMessage, TransactionStatus } from "./firebase-schema";
import { FirebaseEscrowStateMachine } from "./firebase-state-machine";

interface EscrowChatProps {
  chatId: string;
  transactionId: string;
  currentUserId: string;
  userRole: "buyer" | "seller";
}

export const EscrowChat: React.FC<EscrowChatProps> = ({
  chatId,
  transactionId,
  currentUserId,
  userRole,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingAction, setSendingAction] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 채팅 메시지 실시간 구독
  useEffect(() => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

    const unsubscribe = onSnapshot(q, snapshot => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];

      setMessages(newMessages);

      // 안읽은 메시지 읽음 처리
      snapshot.docs.forEach(doc => {
        const message = doc.data() as ChatMessage;
        if (
          message.senderUid !== currentUserId &&
          !message.readBy.includes(currentUserId)
        ) {
          updateDoc(doc.ref, {
            readBy: arrayUnion(currentUserId),
          });
        }
      });

      scrollToBottom();
    });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  // 거래 정보 실시간 구독
  useEffect(() => {
    const transactionRef = doc(db, "transactions", transactionId);

    const unsubscribe = onSnapshot(transactionRef, snapshot => {
      if (snapshot.exists()) {
        setTransaction({ id: snapshot.id, ...snapshot.data() } as Transaction);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [transactionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 액션 버튼 클릭 핸들러
  const handleActionClick = async (action: any) => {
    if (action.confirmMessage) {
      if (!confirm(action.confirmMessage)) {
        return;
      }
    }

    setSendingAction(true);

    try {
      // Firebase Cloud Function 호출
      const functionName = action.actionType;
      const callable = httpsCallable(functions, functionName);

      const result = await callable({
        transactionId,
        ...action.payload,
      });

      console.log("Action result:", result);

      // 성공 토스트 표시
      alert("처리되었습니다!");
    } catch (error) {
      console.error("Action error:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSendingAction(false);
    }
  };

  // 상태별 진행 바
  const renderProgressBar = () => {
    if (!transaction) return null;

    const statuses: TransactionStatus[] = [
      "INITIATED",
      "PAID",
      "IN_ESCROW",
      "AWAITING_SHIPMENT",
      "SHIPPED",
      "IN_TRANSIT",
      "DELIVERED",
      "BUYER_CONFIRMED",
    ];

    const currentIndex = statuses.indexOf(transaction.status);
    const isCancelled = transaction.status === "CANCELLED";
    const isRefunded = transaction.status === "REFUNDED";
    const isDispute = transaction.status === "DISPUTE";

    if (isCancelled || isRefunded || isDispute) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <span className="text-red-800 font-semibold">
              {FirebaseEscrowStateMachine.getStatusDisplayName(
                transaction.status
              )}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          {statuses.slice(0, 5).map((status, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={status} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  } ${isCurrent ? "ring-4 ring-blue-200" : ""}`}
                >
                  {isActive ? "✓" : index + 1}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    isActive ? "text-blue-600 font-medium" : "text-gray-400"
                  }`}
                >
                  {FirebaseEscrowStateMachine.getStatusDisplayName(status)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="relative mt-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded">
            <div
              className="h-full bg-blue-600 rounded transition-all duration-500"
              style={{
                width: `${((currentIndex + 1) / statuses.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // 거래 정보 카드
  const renderTransactionInfo = () => {
    if (!transaction) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-4">
          {transaction.listingImages &&
            transaction.listingImages.length > 0 && (
              <img
                src={transaction.listingImages[0]}
                alt={transaction.listingTitle}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {transaction.listingTitle}
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {transaction.amount.toLocaleString()}원
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  transaction.status === "BUYER_CONFIRMED"
                    ? "bg-green-100 text-green-800"
                    : transaction.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : transaction.status === "DISPUTE"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                }`}
              >
                {FirebaseEscrowStateMachine.getStatusDisplayName(
                  transaction.status
                )}
              </span>
              {transaction.escrowAmount > 0 && (
                <span className="text-xs text-gray-600">
                  에스크로 보관: {transaction.escrowAmount.toLocaleString()}원
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 메시지 렌더링
  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.senderUid === currentUserId;
    const isSystemMessage = message.senderType === "system";

    // 시스템 메시지
    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-6">
          <div className="max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
              {/* 상태 변경 배지 */}
              {message.statusChange && (
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {FirebaseEscrowStateMachine.getStatusDisplayName(
                      message.statusChange.from
                    )}
                  </span>
                  <span className="text-blue-600">→</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {FirebaseEscrowStateMachine.getStatusDisplayName(
                      message.statusChange.to
                    )}
                  </span>
                </div>
              )}

              {/* 메시지 내용 */}
              <p className="text-gray-800 text-center whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>

              {/* 액션 버튼들 */}
              {message.actions && message.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {message.actions.map((action, index) => {
                    const allowedActions =
                      FirebaseEscrowStateMachine.getAllowedActions(
                        transaction?.status || "INITIATED",
                        userRole
                      );

                    const isAllowed = allowedActions.includes(
                      action.actionType
                    );

                    if (!isAllowed && !action.disabled) {
                      return null;
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleActionClick(action)}
                        disabled={sendingAction || action.disabled}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          action.actionType === "approve_cancel" ||
                          action.actionType === "confirm_purchase"
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                            : action.actionType === "request_cancel" ||
                                action.actionType === "open_dispute"
                              ? "bg-red-600 hover:bg-red-700 text-white shadow-md"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                        } ${
                          sendingAction || action.disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-105"
                        }`}
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 타임스탬프 */}
              {message.createdAt && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  {new Date(message.createdAt.seconds * 1000).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 일반 메시지
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          <p className="break-words whitespace-pre-wrap">{message.content}</p>
          {message.createdAt && (
            <p
              className={`text-xs mt-1 ${
                isOwnMessage ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {new Date(message.createdAt.seconds * 1000).toLocaleTimeString(
                "ko-KR",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {userRole === "buyer" ? "판매자" : "구매자"}와의 안전거래
            </h2>
            <p className="text-sm text-gray-600">
              거래 ID: {transactionId.slice(0, 8)}...
            </p>
          </div>
          {transaction && (
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                transaction.status === "BUYER_CONFIRMED"
                  ? "bg-green-100 text-green-800"
                  : transaction.status === "CANCELLED"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {FirebaseEscrowStateMachine.getStatusDisplayName(
                transaction.status
              )}
            </span>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderProgressBar()}
        {renderTransactionInfo()}

        {/* 메시지 목록 */}
        <div className="space-y-2">
          {messages.map(message => renderMessage(message))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력창 (거래 진행 중일 때만) */}
      {transaction &&
        !["BUYER_CONFIRMED", "CANCELLED", "REFUNDED"].includes(
          transaction.status
        ) && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={e => {
                  if (e.key === "Enter") {
                    // 메시지 전송 로직
                  }
                }}
              />
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                전송
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default EscrowChat;












