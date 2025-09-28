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
  markChatAsRead,
  reportUser,
  blockUser,
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
  MoreVertical,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";

interface EnhancedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  sellerUid?: string;
  chatId?: string;
  onChatDeleted?: () => void;
}

export function EnhancedChatModal({
  isOpen,
  onClose,
  itemId,
  sellerUid,
  chatId,
  onChatDeleted,
}: EnhancedChatModalProps) {
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
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(
    null
  );
  const [showOtherProfileModal, setShowOtherProfileModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      console.log("EnhancedChatModal 열림 - loadChatData 호출");
      loadChatData();
    }
  }, [isOpen, user, itemId, sellerUid, chatId]);

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

          // 메시지가 로드된 후 읽음 처리
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
            }, 2000);
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
        const otherUser = otherUserResult.success ? otherUserResult.data : null;
        setOtherUserProfile(otherUser);

        // 아이템 정보 가져오기
        let itemResult = null;
        if (chatData.itemId && chatData.itemId !== "unknown") {
          itemResult = await getItem(chatData.itemId);
          console.log("아이템 정보 로드 결과:", itemResult);
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
            title:
              itemResult?.success && itemResult?.item
                ? itemResult.item.title ||
                  `${itemResult.item.brand} ${itemResult.item.model}`
                : "상품 정보 없음",
            price:
              itemResult?.success && itemResult?.item
                ? itemResult.item.price
                : 0,
            imageUrl:
              itemResult?.success && itemResult?.item
                ? itemResult.item.images?.[0]
                : undefined,
          },
        });
      } else if (itemId && sellerUid) {
        // 새 채팅 생성
        console.log("새 채팅 생성:", { itemId, sellerUid });
        try {
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
          const otherUser = otherUserResult.success
            ? otherUserResult.data
            : null;
          setOtherUserProfile(otherUser);

          // 아이템 정보 가져오기
          const itemResult = await getItem(itemId);
          console.log("새 채팅 아이템 정보 로드 결과:", itemResult);

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
              title:
                itemResult?.success && itemResult?.item
                  ? itemResult.item.title ||
                    `${itemResult.item.brand} ${itemResult.item.model}`
                  : "상품 정보 없음",
              price:
                itemResult?.success && itemResult?.item
                  ? itemResult.item.price
                  : 0,
              imageUrl:
                itemResult?.success && itemResult?.item
                  ? itemResult.item.images?.[0]
                  : undefined,
            },
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
      console.log("EnhancedChatModal 메시지 로드 시작:", chatId);
      setMessagesLoading(true);
      const result = await getChatMessages(chatId);
      console.log("EnhancedChatModal 메시지 로드 결과:", result);

      if (result.success && result.messages) {
        setMessages(result.messages);
        console.log(
          "EnhancedChatModal 메시지 설정 완료:",
          result.messages.length,
          "개"
        );
      } else {
        console.log(
          "EnhancedChatModal 메시지 로드 실패 또는 메시지 없음:",
          result
        );
      }
    } catch (error) {
      console.error("EnhancedChatModal 메시지 로드 실패:", error);
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

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleReportSubmit = async (reason: string) => {
    if (!chatData?.otherUser?.uid || !user?.uid) {
      toast.error("신고할 사용자 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      const result = await reportUser(user.uid, chatData.otherUser.uid, reason);

      if (result.success) {
        toast.success("신고가 접수되었습니다.");
        setShowReportModal(false);
      } else {
        toast.error(result.error || "신고 접수에 실패했습니다.");
      }
    } catch (error) {
      console.error("신고 실패:", error);
      toast.error("신고 접수 중 오류가 발생했습니다.");
    }
  };

  const handleBlock = async () => {
    if (!chatData?.otherUser?.uid || !user?.uid) {
      toast.error("차단할 사용자 정보를 찾을 수 없습니다.");
      return;
    }

    if (
      confirm(
        "정말로 이 사용자를 차단하시겠습니까? 차단된 사용자와의 모든 채팅이 삭제됩니다."
      )
    ) {
      try {
        const result = await blockUser(user.uid, chatData.otherUser.uid);

        if (result.success) {
          toast.success("사용자가 차단되었습니다.");

          // 전역 이벤트 발생으로 ChatList에 알림
          window.dispatchEvent(
            new CustomEvent("chatDeleted", {
              detail: { chatId: chatData.chatId },
            })
          );

          onChatDeleted?.();
          onClose();
        } else {
          toast.error(result.error || "차단에 실패했습니다.");
        }
      } catch (error) {
        console.error("차단 실패:", error);
        toast.error("차단 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[700px] flex">
        {/* 채팅 영역 */}
        <div className={`flex-1 flex flex-col ${showSidebar ? "mr-4" : ""}`}>
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {chatData && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {chatData.otherUser.profileImage ? (
                      <img
                        src={chatData.otherUser.profileImage}
                        alt={chatData.otherUser.nickname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {chatData.otherUser.nickname}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{chatData.item.title}</span>
                      <span>•</span>
                      <span>{formatPrice(chatData.item.price)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>35분 전</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
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
            {/* 사기 경고 메시지 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-600 mb-2">
                    거래 사기 주의 해주세요!
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">
                      • 입금 요구가 있을 경우 거래를 중단하세요.
                    </p>
                    <p className="text-xs text-gray-600">
                      • 먼저 송금을 요청하는 경우 사기 가능성이 높습니다.
                    </p>
                    <p className="text-xs text-gray-600">
                      • 시세보다 비정상적으로 저렴한 물품은 주의하세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
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

                        {/* 시간 */}
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
          </div>

          {/* 메시지 입력 */}
          {chatData && user && (
            <div className="p-4 border-t bg-gray-50">
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
        </div>

        {/* 사이드바 */}
        {showSidebar && (
          <div className="w-80 bg-gray-50 border-l flex flex-col">
            {/* 사이드바 헤더 */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h3 className="font-semibold text-gray-900">상대방 정보</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 인증 상태 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  인증상태
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">신분증</span>
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">휴대폰</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">계좌</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReport}
                  className="flex items-center space-x-1 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>신고하기</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBlock}
                  className="flex items-center space-x-1 text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  <span>차단하기</span>
                </Button>
              </div>

              {/* 거래 상태 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  거래 상태
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
                    <span className="text-sm text-gray-600">거래 대기</span>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
                    <span className="text-sm text-gray-600">결제 완료</span>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    거래 완료
                  </Button>
                </div>
              </div>
            </div>
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
              onClose();
              window.dispatchEvent(
                new CustomEvent("chatDeleted", {
                  detail: { chatId: chatData.chatId },
                })
              );
            }}
          />
        )}

        {/* 신고 모달 */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  신고하기
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                신고 사유를 선택해주세요.
              </p>

              <div className="space-y-2">
                {[
                  "스팸/광고",
                  "부적절한 언어 사용",
                  "사기/피싱",
                  "성희롱/성추행",
                  "기타",
                ].map(reason => (
                  <button
                    key={reason}
                    onClick={() => handleReportSubmit(reason)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
