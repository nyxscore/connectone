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
  sendMessage,
  Chat,
  Message,
} from "../../lib/chat/api";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb as getDb } from "../../lib/api/firebase-ultra-safe";
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
  Edit,
} from "lucide-react";
import ShippingAddressSelectionModal from "./ShippingAddressSelectionModal";
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
  const [showPriceEdit, setShowPriceEdit] = useState(false);
  const [newPrice, setNewPrice] = useState<string>("");
  const [showShippingAddressModal, setShowShippingAddressModal] =
    useState(false);

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
          const db = await getDb();
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
          console.log("otherUser 원본 데이터:", otherUser);

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
              profileImage: userData.profileImage || userData.photoURL,
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

  const shouldShowTime = (message: Message, prevMessage: Message | null) => {
    if (!prevMessage) return true;

    const currentTime = message.createdAt?.toDate
      ? message.createdAt.toDate()
      : new Date(message.createdAt);
    const prevTime = prevMessage.createdAt?.toDate
      ? prevMessage.createdAt.toDate()
      : new Date(prevMessage.createdAt);

    // 분이 다르면 시간 표시
    return (
      currentTime.getMinutes() !== prevTime.getMinutes() ||
      currentTime.getHours() !== prevTime.getHours()
    );
  };

  const shouldShowProfile = (
    message: Message,
    prevMessage: Message | null,
    isOwn: boolean
  ) => {
    if (isOwn) return false; // 내 메시지에는 프로필 표시 안함
    if (!prevMessage) return true; // 첫 번째 메시지는 프로필 표시

    const currentTime = message.createdAt?.toDate
      ? message.createdAt.toDate()
      : new Date(message.createdAt);
    const prevTime = prevMessage.createdAt?.toDate
      ? prevMessage.createdAt.toDate()
      : new Date(prevMessage.createdAt);

    // 5분 이상 차이나거나 다른 사람의 메시지면 프로필 표시
    const timeDiff = Math.abs(currentTime.getTime() - prevTime.getTime());
    const isDifferentSender = message.senderUid !== prevMessage.senderUid;

    return timeDiff > 5 * 60 * 1000 || isDifferentSender;
  };

  // 배송지 전달 함수
  const handleSendShippingAddress = async (address: any) => {
    if (!chatData?.chatId || !user) return;

    try {
      // 배송지 정보를 깔끔하게 정렬하여 전송
      const addressMessage = `배송지 정보가 전달되었습니다.\n\n📦 수령인: ${address.recipientName}\n\n📞 연락처: ${address.phoneNumber}\n\n📍 주소: ${address.address}${address.deliveryMemo ? `\n\n📝 배송 메모: ${address.deliveryMemo}` : ""}`;

      await sendMessage({
        chatId: chatData.chatId,
        senderUid: user.uid,
        content: addressMessage,
      });

      toast.success("배송지 정보가 판매자에게 전달되었습니다.");
    } catch (error) {
      console.error("배송지 전달 실패:", error);
      toast.error("배송지 전달에 실패했습니다.");
    }
  };

  const isSameDate = (date1: any, date2: any) => {
    if (!date1 || !date2) return false;
    const d1 = date1.toDate ? date1.toDate() : new Date(date1);
    const d2 = date2.toDate ? date2.toDate() : new Date(date2);
    return d1.toDateString() === d2.toDateString();
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
        window.dispatchEvent(
          new CustomEvent("chatDeleted", {
            detail: { chatId: chatData.chatId },
          })
        );
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

  const handlePriceUpdate = async () => {
    if (!user || !chatData?.item.id || !newPrice) return;

    const priceValue = parseInt(newPrice.replace(/[^0-9]/g, ""), 10);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("올바른 가격을 입력해주세요.");
      return;
    }

    try {
      const db = await getDb();
      const oldPrice = chatData.item.price;

      // 상품 가격 업데이트
      const itemRef = doc(db, "items", chatData.item.id);
      await updateDoc(itemRef, {
        price: priceValue,
        updatedAt: serverTimestamp(),
      });

      // 시스템 메시지로 가격 변경 알림 전송
      const priceChangeMessage = `💰 가격이 ${formatPrice(oldPrice)}에서 ${formatPrice(priceValue)}으로 수정되었습니다.`;

      await sendMessage({
        chatId: chatData.chatId,
        senderUid: "system",
        content: priceChangeMessage,
      });

      // 로컬 상태 업데이트
      setChatData({
        ...chatData,
        item: {
          ...chatData.item,
          price: priceValue,
        },
      });

      toast.success("가격이 수정되었습니다.");
      setShowPriceEdit(false);
      setNewPrice("");

      // 메시지 새로고침
      loadMessages(chatData.chatId);
    } catch (error) {
      console.error("가격 수정 실패:", error);
      toast.error("가격 수정에 실패했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white md:rounded-lg md:max-w-4xl w-full h-full md:max-h-[90vh] overflow-hidden flex flex-col"
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
            {/* 상대방 프로필 버튼 - 더 눈에 띄게 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOtherProfileModal(true)}
              className="bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
            >
              <User className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">프로필</span>
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
                {showPriceEdit ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      value={newPrice}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setNewPrice(
                          value ? parseInt(value, 10).toLocaleString() : ""
                        );
                      }}
                      placeholder="새 가격"
                      className="px-2 py-1 border rounded text-sm w-32"
                    />
                    <Button
                      size="sm"
                      onClick={handlePriceUpdate}
                      className="bg-blue-600 text-white text-xs px-2 py-1"
                    >
                      확인
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowPriceEdit(false);
                        setNewPrice("");
                      }}
                      className="text-xs px-2 py-1"
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(chatData.item.price)}
                    </p>
                    {/* 판매자만 가격 수정 버튼 표시 */}
                    {user && sellerUid === user.uid && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowPriceEdit(true);
                          setNewPrice(chatData.item.price.toLocaleString());
                        }}
                        className="text-xs text-gray-600 hover:text-blue-600 p-1"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
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
              {messages.map((message, index) => {
                const isOwn = message.senderUid === user?.uid;
                const isSystem = message.senderUid === "system";

                // 이전 메시지와 날짜가 다른지 확인
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showDateSeparator =
                  !prevMessage ||
                  !isSameDate(message.createdAt, prevMessage.createdAt);

                // 시간 표시 여부 확인 (분단위가 달라질 때만)
                const showTime = shouldShowTime(message, prevMessage);
                // 프로필 표시 여부 확인 (카카오톡 스타일)
                const showProfile = shouldShowProfile(
                  message,
                  prevMessage,
                  isOwn
                );

                // 디버깅 로그
                console.log("메시지 프로필 디버깅:", {
                  messageId: message.id,
                  isOwn,
                  showProfile,
                  hasProfileImage: !!chatData?.otherUser.profileImage,
                  profileImageUrl: chatData?.otherUser.profileImage,
                  otherUser: chatData?.otherUser,
                });

                // 임시: 프로필 이미지가 없어도 강제로 표시 (디버깅용)
                const forceShowProfile = !isOwn; // 상대방 메시지면 무조건 프로필 표시

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

                    {/* 시스템 메시지 */}
                    {isSystem ? (
                      <div className="flex items-center justify-center my-3">
                        <div className="bg-amber-50 text-amber-800 text-sm px-4 py-2 rounded-lg border border-amber-200 max-w-md text-center">
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      /* 일반 메시지 */
                      <div
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
                      >
                        <div
                          className={`flex items-end ${isOwn ? "flex-row-reverse" : ""} ${
                            showProfile
                              ? "space-x-2"
                              : isOwn
                                ? "space-x-reverse space-x-2"
                                : "space-x-2"
                          }`}
                        >
                          {/* 상대방 프로필 사진 (카카오톡 스타일) - 임시로 강제 표시 */}
                          {forceShowProfile && (
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-red-500">
                                {chatData?.otherUser.profileImage ? (
                                  <img
                                    src={chatData.otherUser.profileImage}
                                    alt={chatData.otherUser.nickname}
                                    className="w-full h-full object-cover"
                                    onError={e => {
                                      console.log(
                                        "프로필 이미지 로드 실패:",
                                        chatData.otherUser.profileImage
                                      );
                                      e.currentTarget.style.display = "none";
                                    }}
                                    onLoad={() => {
                                      console.log(
                                        "프로필 이미지 로드 성공:",
                                        chatData.otherUser.profileImage
                                      );
                                    }}
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                  {showProfile ? "S" : "H"}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col max-w-xs lg:max-w-md">
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwn
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
                            </div>

                            {/* 시간 - 분단위가 달라질 때만 표시 */}
                            {showTime && (
                              <div
                                className={`flex items-center mt-1 ${
                                  isOwn ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span className="text-xs text-gray-500">
                                  {formatTimeOnly(message.createdAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 배송지 입력 버튼 - 구매자만 표시 */}
        {user && chatData?.chatId && user.uid !== sellerUid && (
          <div className="px-4 py-2 bg-blue-50 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 배송지 입력 모달 열기
                setShowShippingAddressModal(true);
              }}
              className="w-full bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
            >
              <MapPin className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">배송지 정보 입력</span>
            </Button>
          </div>
        )}

        {/* 메시지 입력 */}
        <div className="p-4 border-t">
          <MessageInput
            chatId={chatData?.chatId || ""}
            senderUid={user?.uid || ""}
            itemId={itemId || "unknown"}
            sellerUid={sellerUid || "unknown"}
            onMessageSent={() => {
              console.log("메시지 전송 완료 - 새로고침 시작");
              // 토스트 메시지 제거하고 조용히 새로고침
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

      {/* 배송지 선택 모달 */}
      {user && showShippingAddressModal && (
        <ShippingAddressSelectionModal
          isOpen={showShippingAddressModal}
          onClose={() => setShowShippingAddressModal(false)}
          userId={user.uid}
          onAddressSelect={address => {
            // 배송지 선택 시 판매자에게 전달하는 로직
            handleSendShippingAddress(address);
            setShowShippingAddressModal(false);
          }}
        />
      )}
    </div>
  );
}
