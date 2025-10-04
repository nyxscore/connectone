"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { MessageInput } from "./MessageInput";
import { SellerProfileModal } from "../profile/SellerProfileModal";
import { SellerProfileCard } from "../profile/SellerProfileCard";
import { SellItem } from "../../data/types";
import { UserProfile } from "../../data/profile/types";
import { getUserProfile } from "../../lib/profile/api";
import { getItem } from "../../lib/api/products";
import ShippingAddressSelectionModal from "./ShippingAddressSelectionModal";
import { ShippingAddress } from "../../lib/schemas";
import {
  getOrCreateChat,
  getChatMessages,
  subscribeToMessages,
  deleteChat,
  markChatAsRead,
  reportUser,
  blockUser,
} from "../../lib/chat/api";
import { Chat, Message } from "../../data/chat/types";
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
  Truck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { ShippingTrackingModal } from "../shipping/ShippingTrackingModal";
import BuyerShippingInfoModal from "../shipping/BuyerShippingInfoModal";

interface EnhancedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  sellerUid?: string;
  chatId?: string;
  tradeType?: string;
  onChatDeleted?: () => void;
}

export function EnhancedChatModal({
  isOpen,
  onClose,
  itemId,
  sellerUid,
  chatId,
  tradeType,
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
      status?: string;
      buyerUid?: string;
      transactionCancelledAt?: any;
      shippingInfo?: any;
      buyerShippingInfo?: any;
    };
    tradeType?: string;
    sellerUid?: string;
    buyerUid?: string;
  } | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(
    null
  );
  const [showOtherProfileModal, setShowOtherProfileModal] = useState(false);
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
  const [showShippingTrackingModal, setShowShippingTrackingModal] =
    useState(false);
  const [showBuyerShippingInfoModal, setShowBuyerShippingInfoModal] =
    useState(false);
  const [showShippingAddressModal, setShowShippingAddressModal] =
    useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedShippingAddresses, setExpandedShippingAddresses] = useState<
    Set<string>
  >(new Set());

  // 배송지 메시지 렌더링 함수
  const renderShippingAddressMessage = (
    content: string,
    messageId: string,
    isOwn: boolean
  ) => {
    const lines = content.split("\n");
    const firstLine = lines[0]; // "배송지 정보가 전달되었습니다."

    const startIndex = lines.findIndex(line =>
      line.includes("---SHIPPING_ADDRESS_START---")
    );
    const endIndex = lines.findIndex(line =>
      line.includes("---SHIPPING_ADDRESS_END---")
    );

    if (startIndex === -1 || endIndex === -1) {
      // 일반 메시지로 렌더링
      return <p className="text-sm">{content}</p>;
    }

    const addressLines = lines.slice(startIndex + 1, endIndex);
    const isExpanded = expandedShippingAddresses.has(messageId);

    return (
      <div>
        <p className="text-sm">{firstLine}</p>
        <button
          onClick={() => {
            setExpandedShippingAddresses(prev => {
              const newSet = new Set(prev);
              if (newSet.has(messageId)) {
                newSet.delete(messageId);
              } else {
                newSet.add(messageId);
              }
              return newSet;
            });
          }}
          className={`flex items-center gap-1 text-xs mt-1 ${
            isOwn
              ? "text-white hover:text-gray-200"
              : "text-gray-900 hover:text-gray-700"
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          배송지 정보 확인하기
        </button>
        {isExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-900">
            {addressLines.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 배송지 전달 함수
  const handleSendShippingAddress = async (address: ShippingAddress) => {
    if (!chatId || !user?.uid) return;

    try {
      // 배송지 정보를 특별한 형식으로 전송 (접기/펼치기 가능)
      const addressMessage = `배송지 정보가 전달되었습니다.\n\n---SHIPPING_ADDRESS_START---\n수령인: ${address.recipientName}\n연락처: ${address.phoneNumber}\n주소: ${address.address}${address.deliveryMemo ? `\n배송 메모: ${address.deliveryMemo}` : ""}\n---SHIPPING_ADDRESS_END---`;

      const { sendMessage } = await import("../../lib/chat/api");
      await sendMessage({
        chatId,
        senderUid: user.uid,
        content: addressMessage,
      });

      toast.success("배송지 정보가 판매자에게 전달되었습니다.");
    } catch (error) {
      console.error("배송지 전달 실패:", error);
      toast.error("배송지 전달에 실패했습니다.");
    }
  };

  // 택배사 코드를 한글 이름으로 변환
  const getCourierName = (courierCode: string) => {
    const courierMap: { [key: string]: string } = {
      cj: "CJ대한통운",
      hanjin: "한진택배",
      lotte: "롯데택배",
      kdexp: "경동택배",
      epost: "우체국택배",
      logen: "로젠택배",
      ktx: "KTX물류",
      dhl: "DHL",
      fedex: "FedEx",
      ups: "UPS",
      ems: "EMS",
      cvs: "편의점택배",
    };
    return courierMap[courierCode] || courierCode;
  };

  // 메시지가 변경될 때마다 스크롤을 최하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && user) {
      loadChatData();
    }
  }, [isOpen, user, itemId, sellerUid, chatId]);

  // 상품 상태 변경 이벤트 감지
  useEffect(() => {
    const handleItemStatusChanged = async (event: CustomEvent) => {
      const { itemId: changedItemId, status } = event.detail;
      if (chatData?.item?.id === changedItemId) {
        console.log("상품 상태 변경 감지:", status);
        // 상품 상태 업데이트 (shippingInfo도 함께 업데이트)
        if (status === "shipping") {
          // 배송중으로 변경될 때 최신 상품 정보 다시 가져오기
          const itemResult = await getItem(changedItemId);
          if (itemResult?.success && itemResult?.item) {
            setChatData(prev =>
              prev
                ? {
                    ...prev,
                    item: {
                      ...prev.item,
                      status,
                      shippingInfo: itemResult.item.shippingInfo,
                    },
                  }
                : null
            );
          }
        } else {
          setChatData(prev =>
            prev
              ? {
                  ...prev,
                  item: {
                    ...prev.item,
                    status: status,
                  },
                }
              : null
          );
        }
      }
    };

    window.addEventListener(
      "itemStatusChanged",
      handleItemStatusChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        "itemStatusChanged",
        handleItemStatusChanged as EventListener
      );
    };
  }, [chatData?.item?.id]);

  useEffect(() => {
    if (chatData?.chatId) {
      console.log("chatData 변경됨 - 메시지 로드:", chatData.chatId);
      console.log("=== chatData 상태 변경 감지 ===");
      console.log("chatData.item:", chatData.item);
      console.log("chatData.item.shippingInfo:", chatData.item?.shippingInfo);
      console.log("chatData.item.status:", chatData.item?.status);
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
        console.log("채팅 데이터:", chatData);
        console.log("현재 사용자 UID:", user?.uid);
        console.log("채팅의 buyerUid:", chatData.buyerUid);
        console.log("채팅의 sellerUid:", chatData.sellerUid);

        const otherUid =
          chatData.buyerUid === user?.uid
            ? chatData.sellerUid
            : chatData.buyerUid;

        console.log("계산된 otherUid:", otherUid);
        console.log("구매자 확인:", user?.uid === chatData.buyerUid);
        console.log("판매자 확인:", user?.uid === chatData.sellerUid);

        // 채팅 문서에 이미 저장된 otherUser 정보 사용 (우선순위)
        const storedOtherUser = chatData.otherUser;

        // 없으면 Firestore에서 가져오기
        let otherUser = null;
        console.log("저장된 상대방 정보:", storedOtherUser);

        if (!storedOtherUser?.nickname || !storedOtherUser?.profileImage) {
          console.log("상대방 프로필을 Firestore에서 가져오기:", otherUid);
          const otherUserResult = await getUserProfile(otherUid);
          console.log("상대방 프로필 로드 결과:", otherUserResult);
          otherUser = otherUserResult.success ? otherUserResult.data : null;
          setOtherUserProfile(otherUser);
        } else {
          console.log("저장된 상대방 정보 사용:", storedOtherUser);
          setOtherUserProfile(storedOtherUser as any);
        }

        // 아이템 정보 가져오기
        let itemResult = null;
        if (chatData.itemId && chatData.itemId !== "unknown") {
          itemResult = await getItem(chatData.itemId);
          console.log("아이템 정보 로드 결과:", itemResult);
          console.log("아이템 상태:", itemResult?.item?.status);
        }

        // 거래 유형 추론 (상품 상태 기반)
        let inferredTradeType = "직거래";
        if (itemResult?.success && itemResult?.item) {
          console.log("상품 상태:", itemResult.item.status);
          console.log("거래 옵션:", itemResult.item.tradeOptions);

          const tradeOptions = itemResult.item.tradeOptions || [];

          // 안전결제 감지: 상태가 escrow_completed, shipping이거나 tradeOptions에 안전결제 관련 옵션이 있으면
          const isEscrow =
            itemResult.item.status === "escrow_completed" ||
            itemResult.item.status === "shipping" ||
            tradeOptions.includes("안전결제") ||
            tradeOptions.includes("안전거래") ||
            tradeOptions.includes("escrow");

          // 택배 감지: tradeOptions에 택배 관련 옵션이 있으면
          const isDelivery =
            tradeOptions.includes("택배") || tradeOptions.includes("parcel");

          console.log("상품 상태:", itemResult.item.status);
          console.log("거래 옵션:", tradeOptions);
          console.log("안전결제 여부:", isEscrow);
          console.log("택배 여부:", isDelivery);

          // 배송중 상태는 안전결제로 간주 (이미 결제가 완료된 상태)
          if (itemResult.item.status === "shipping") {
            if (isDelivery) {
              inferredTradeType = "택배 + 안전결제";
            } else {
              inferredTradeType = "안전결제";
            }
          } else if (isEscrow && isDelivery) {
            inferredTradeType = "택배 + 안전결제";
          } else if (isEscrow) {
            inferredTradeType = "안전결제";
          } else if (isDelivery) {
            inferredTradeType = "택배";
          }
        }
        console.log("추론된 거래 유형:", inferredTradeType);

        console.log("=== loadChatData에서 setChatData 호출 ===");
        console.log(
          "itemResult.item.shippingInfo:",
          itemResult.item.shippingInfo
        );
        console.log("itemResult.item.status:", itemResult.item.status);
        console.log("itemResult.item 전체 데이터:", itemResult.item);

        setChatData({
          chatId,
          sellerUid: chatData.sellerUid, // sellerUid 추가!
          otherUser: {
            uid: otherUid,
            nickname:
              storedOtherUser?.nickname ||
              otherUser?.nickname ||
              otherUser?.displayName ||
              "알 수 없음",
            profileImage:
              storedOtherUser?.profileImage ||
              otherUser?.profileImage ||
              otherUser?.photoURL,
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
            status:
              itemResult?.success && itemResult?.item
                ? itemResult.item.status
                : "active",
            transactionCancelledAt:
              itemResult?.success && itemResult?.item
                ? itemResult.item.transactionCancelledAt
                : null,
            shippingInfo:
              itemResult?.success && itemResult?.item
                ? itemResult.item.shippingInfo
                : null,
          },
          tradeType: tradeType || chatData.tradeType || inferredTradeType, // 전달받은 거래 유형 우선 사용
          buyerUid: chatData.buyerUid, // buyerUid 명시적으로 유지
        });

        console.log("=== setChatData 호출 완료 ===");
        console.log(
          "setChatData에 전달된 shippingInfo:",
          itemResult.item.shippingInfo
        );
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
            "" // 자동 메시지 제거
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

          // 새 채팅용 거래 유형 추론
          let newInferredTradeType = "직거래";
          if (itemResult?.success && itemResult?.item) {
            const tradeOptions = itemResult.item.tradeOptions || [];

            const isEscrow =
              itemResult.item.status === "escrow_completed" ||
              itemResult.item.status === "shipping" ||
              tradeOptions.includes("안전결제") ||
              tradeOptions.includes("안전거래") ||
              tradeOptions.includes("escrow");

            const isDelivery =
              tradeOptions.includes("택배") || tradeOptions.includes("parcel");

            if (itemResult.item.status === "shipping") {
              if (isDelivery) {
                newInferredTradeType = "택배 + 안전결제";
              } else {
                newInferredTradeType = "안전결제";
              }
            } else if (isEscrow && isDelivery) {
              newInferredTradeType = "택배 + 안전결제";
            } else if (isEscrow) {
              newInferredTradeType = "안전결제";
            } else if (isDelivery) {
              newInferredTradeType = "택배";
            }
          }

          setChatData({
            chatId: result.chatId,
            sellerUid: sellerUid,
            otherUser: {
              uid: sellerUid,
              nickname:
                otherUser?.nickname || otherUser?.displayName || "알 수 없음",
              profileImage: otherUser?.profileImage || otherUser?.photoURL,
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
              status:
                itemResult?.success && itemResult?.item
                  ? itemResult.item.status
                  : "active",
              transactionCancelledAt:
                itemResult?.success && itemResult?.item
                  ? itemResult.item.transactionCancelledAt
                  : null,
              shippingInfo:
                itemResult?.success && itemResult?.item
                  ? itemResult.item.shippingInfo
                  : null,
            },
            tradeType: tradeType || newInferredTradeType, // 전달받은 거래 유형 우선, 없으면 추론된 유형 사용
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

        // 신고 후 차단 여부 묻기
        setShowBlockModal(true);
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

  const handleStartTransaction = async () => {
    if (!chatData?.otherUser?.uid || !user?.uid || !chatData?.item?.id) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    // 현재 상품 상태 확인
    console.log("현재 상품 상태:", chatData.item.status);
    console.log("상품 ID:", chatData.item.id);
    console.log("구매자 UID:", chatData.otherUser.uid);
    console.log("판매자 UID:", user.uid);

    // 이미 거래중인지 확인
    if (chatData.item.status === "reserved") {
      toast.error("이미 거래가 진행중입니다.");
      return;
    }

    // 거래 가능한 상태인지 확인 (취소 이력 무시)
    if (
      chatData.item.status !== "active" &&
      chatData.item.status !== "escrow_completed"
    ) {
      toast.error("거래할 수 없는 상품 상태입니다.");
      return;
    }

    // 재거래 가능 - 취소 이력이 있어도 상관없음

    setIsStartingTransaction(true);

    try {
      // 상품 상태를 '거래중'으로 변경하고 구매자 지정
      const response = await fetch("/api/products/start-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: chatData.item.id,
          buyerUid: chatData.otherUser.uid,
          sellerUid: user.uid,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("거래가 시작되었습니다!");

        // chatData의 item.status를 "reserved"로 업데이트
        setChatData(prev =>
          prev
            ? {
                ...prev,
                item: {
                  ...prev.item,
                  status: "reserved",
                },
              }
            : null
        );

        // 전역 이벤트 발생으로 상품 목록 업데이트
        window.dispatchEvent(
          new CustomEvent("itemStatusChanged", {
            detail: { itemId: chatData.item.id, status: "reserved" },
          })
        );
      } else {
        toast.error(result.error || "거래 시작에 실패했습니다.");
      }
    } catch (error) {
      console.error("거래 시작 실패:", error);
      toast.error("거래 시작 중 오류가 발생했습니다.");
    } finally {
      setIsStartingTransaction(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    const isEscrowCompleted = chatData.item.status === "escrow_completed";
    const confirmMessage = isEscrowCompleted
      ? "정말로 거래를 취소하시겠습니까?\n안전결제가 취소되고 환불이 처리됩니다."
      : "정말로 거래를 취소하시겠습니까?\n상품 상태가 '판매중'으로 변경됩니다.";

    if (confirm(confirmMessage)) {
      setIsCancelingTransaction(true);

      try {
        // 상품 상태를 '판매중'으로 변경하고 구매자 정보 제거
        const response = await fetch("/api/products/cancel-transaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: chatData.item.id,
            userId: user.uid,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // 안전결제 취소인지 확인
          if (result.escrowCancelled) {
            toast.success("안전결제가 취소되었습니다! 환불이 처리됩니다.");
          } else {
            toast.success("거래가 취소되었습니다!");
          }

          // 전역 이벤트 발생으로 상품 목록 업데이트
          window.dispatchEvent(
            new CustomEvent("itemStatusChanged", {
              detail: { itemId: chatData.item.id, status: "active" },
            })
          );
        } else {
          toast.error(result.error || "거래 취소에 실패했습니다.");
        }
      } catch (error) {
        console.error("거래 취소 실패:", error);
        toast.error("거래 취소 중 오류가 발생했습니다.");
      } finally {
        setIsCancelingTransaction(false);
      }
    }
  };

  const handleRequestCancel = async () => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    setIsRequestingCancel(true);

    try {
      const response = await fetch("/api/products/request-cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: chatData.item.id,
          buyerUid: user.uid,
          reason: cancelReason || "구매자 요청",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("취소 요청이 전송되었습니다!");
        setShowCancelModal(false);
        setCancelReason("");

        // 전역 이벤트 발생으로 상품 목록 업데이트
        window.dispatchEvent(
          new CustomEvent("itemStatusChanged", {
            detail: { itemId: chatData.item.id, status: "cancel_requested" },
          })
        );
      } else {
        toast.error(result.error || "취소 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error("취소 요청 실패:", error);
      toast.error("취소 요청 중 오류가 발생했습니다.");
    } finally {
      setIsRequestingCancel(false);
    }
  };

  const handleApproveCancel = async () => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    if (
      confirm(
        "정말로 취소 요청을 승인하시겠습니까?\n상품이 다시 판매중으로 변경됩니다."
      )
    ) {
      setIsApprovingCancel(true);

      try {
        const response = await fetch("/api/products/approve-cancel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: chatData.item.id,
            sellerUid: user.uid,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success("취소 요청이 승인되었습니다!");

          // 전역 이벤트 발생으로 상품 목록 업데이트
          window.dispatchEvent(
            new CustomEvent("itemStatusChanged", {
              detail: { itemId: chatData.item.id, status: "active" },
            })
          );
        } else {
          toast.error(result.error || "취소 승인에 실패했습니다.");
        }
      } catch (error) {
        console.error("취소 승인 실패:", error);
        toast.error("취소 승인 중 오류가 발생했습니다.");
      } finally {
        setIsApprovingCancel(false);
      }
    }
  };

  const handleRegisterShipping = async (shippingInfo: {
    courier: string;
    trackingNumber: string;
  }) => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      setIsRegisteringShipping(true);

      const response = await fetch("/api/products/register-shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: chatData.item.id,
          sellerUid: user.uid,
          courier: shippingInfo.courier,
          trackingNumber: shippingInfo.trackingNumber,
        }),
      });

      const result = await response.json();
      console.log("송장 등록 API 응답:", result);

      if (result.success) {
        toast.success(
          "발송 정보가 등록되었습니다! 상품 상태가 '배송중'으로 변경됩니다."
        );

        // 상품 상태를 shipping으로 업데이트
        setChatData(prev =>
          prev
            ? {
                ...prev,
                item: { ...prev.item, status: "shipping" },
              }
            : null
        );

        console.log("상품 상태를 shipping으로 변경:", chatData.item.id);

        // 전역 이벤트 발생으로 상품 목록 업데이트
        window.dispatchEvent(
          new CustomEvent("itemStatusChanged", {
            detail: { itemId: chatData.item.id, status: "shipping" },
          })
        );

        // 송장 등록 모달 닫기
        setShowShippingModal(false);

        // 채팅 데이터 새로고침 (shippingInfo 포함)
        await loadChatData();
      } else {
        toast.error(result.error || "발송 정보 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("발송 정보 등록 실패:", error);
      toast.error("발송 정보 등록 중 오류가 발생했습니다.");
    } finally {
      setIsRegisteringShipping(false);
    }
  };

  const handleCompletePurchase = async () => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    if (
      confirm(
        "정말로 구매를 완료하시겠습니까?\n상품 상태가 '판매완료'로 변경되고 판매자에게 입금이 처리됩니다."
      )
    ) {
      setIsCompletingPurchase(true);

      try {
        const response = await fetch("/api/products/complete-purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: chatData.item.id,
            buyerUid: user.uid,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success("구매가 완료되었습니다! 판매자에게 입금이 처리됩니다.");

          // 전역 이벤트 발생으로 상품 목록 업데이트
          window.dispatchEvent(
            new CustomEvent("itemStatusChanged", {
              detail: { itemId: chatData.item.id, status: "sold" },
            })
          );
        } else {
          toast.error(result.error || "구매 완료에 실패했습니다.");
        }
      } catch (error) {
        console.error("구매 완료 실패:", error);
        toast.error("구매 완료 중 오류가 발생했습니다.");
      } finally {
        setIsCompletingPurchase(false);
      }
    }
  };

  const handleBlockUser = async () => {
    if (!chatData?.otherUser?.uid || !user?.uid) {
      toast.error("차단할 사용자 정보를 찾을 수 없습니다.");
      return;
    }

    setIsBlocking(true);

    try {
      const response = await fetch("/api/users/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          targetUserId: chatData.otherUser.uid,
          action: "block",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("사용자가 차단되었습니다.");
        setShowBlockModal(false);

        // 채팅 모달 닫기
        onClose();
      } else {
        toast.error(result.error || "차단에 실패했습니다.");
      }
    } catch (error) {
      console.error("차단 실패:", error);
      toast.error("차단 중 오류가 발생했습니다.");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleSkipBlock = () => {
    setShowBlockModal(false);
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
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex">
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
                  {/* 상품 썸네일 */}
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {chatData.item.imageUrl ? (
                      <img
                        src={chatData.item.imageUrl}
                        alt={chatData.item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MessageCircle className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  {/* 상품명과 가격 */}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {chatData.item.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatPrice(chatData.item.price)}
                    </p>
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
                      • 연락처, 주소 등 개인정보를 함부로 공유하지 마세요.
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
                    {message.senderUid === "system" ? (
                      // 시스템 메시지 (공지사항 스타일)
                      <div className="flex justify-center mb-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 max-w-sm">
                          <div className="flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <p className="text-sm text-blue-800 font-medium text-center">
                              {message.content}
                            </p>
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 일반 메시지
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
                            {message.content &&
                              (message.content.includes(
                                "---SHIPPING_ADDRESS_START---"
                              ) ? (
                                renderShippingAddressMessage(
                                  message.content,
                                  message.id ||
                                    `${message.createdAt}_${message.senderUid}`,
                                  isOwn
                                )
                              ) : (
                                <p className="text-sm">{message.content}</p>
                              ))}
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
                    )}
                  </div>
                );
              })
            )}
            {/* 스크롤 자동 이동을 위한 참조점 */}
            <div ref={messagesEndRef} />
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
          <div className="w-80 bg-gray-50 border-l flex flex-col h-full">
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

            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
              {/* 상대방 프로필 */}
              {chatData && otherUserProfile && (
                <div className="pb-6 border-b">
                  <SellerProfileCard
                    sellerProfile={otherUserProfile}
                    seller={{
                      displayName: chatData.otherUser.nickname,
                    }}
                    region="서울시 강남구" // 기본값
                    onClick={() => setShowOtherProfileModal(true)}
                    showClickable={true}
                  />
                </div>
              )}

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

              {/* 판매자 액션 버튼들 */}
              {user && chatData && user.uid === chatData.sellerUid && (
                <div className="mb-4 space-y-2">
                  {/* 거래 진행하기 버튼 */}
                  {(chatData.item.status === "active" ||
                    chatData.item.status === "escrow_completed") && (
                    <Button
                      onClick={() => {
                        if (
                          confirm(
                            `${chatData.otherUser.nickname}님과 거래를 시작하시겠습니까?\n상품 상태가 '거래중'으로 변경됩니다.`
                          )
                        ) {
                          handleStartTransaction();
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-10"
                      disabled={isStartingTransaction}
                    >
                      {isStartingTransaction ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          거래 진행 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          거래 진행하기
                        </>
                      )}
                    </Button>
                  )}

                  {/* 거래중 상태 - 택배 발송 정보 입력 */}
                  {(chatData.item.status === "reserved" ||
                    chatData.item.status === "escrow_completed") && (
                    <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="text-lg font-bold text-orange-600">
                          거래중
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            택배사
                          </label>
                          <select
                            value={courier}
                            onChange={e => setCourier(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">택배사를 선택하세요</option>
                            <option value="cj">CJ대한통운</option>
                            <option value="hanjin">한진택배</option>
                            <option value="lotte">롯데택배</option>
                            <option value="kdexp">경동택배</option>
                            <option value="epost">우체국택배</option>
                            <option value="logen">로젠택배</option>
                            <option value="dongbu">동부택배</option>
                            <option value="kg">KG로지스</option>
                            <option value="kgm">KGB택배</option>
                            <option value="inno">이노지스</option>
                            <option value="slx">SLX택배</option>
                            <option value="fedex">FedEx</option>
                            <option value="ups">UPS</option>
                            <option value="dhl">DHL</option>
                            <option value="other">기타</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            송장번호
                          </label>
                          <input
                            type="text"
                            value={trackingNumber}
                            onChange={e => setTrackingNumber(e.target.value)}
                            placeholder="송장번호를 입력하세요"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>

                        <Button
                          onClick={() => {
                            if (!courier) {
                              toast.error("택배사를 선택해주세요.");
                              return;
                            }
                            if (!trackingNumber.trim()) {
                              toast.error("송장번호를 입력해주세요.");
                              return;
                            }
                            handleRegisterShipping({
                              courier,
                              trackingNumber: trackingNumber.trim(),
                            });
                          }}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                          disabled={isRegisteringShipping}
                        >
                          {isRegisteringShipping ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              등록 중...
                            </>
                          ) : (
                            <>
                              <Truck className="w-4 h-4 mr-2" />
                              발송완료
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 배송중 상태 */}
                  {chatData.item.status === "shipping" && (
                    <div className="space-y-3">
                      <div className="w-full h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center">
                        <Truck className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="text-lg font-bold text-blue-600">
                          배송중
                        </span>
                      </div>

                      {/* 구매자 배송지 정보 */}
                      {chatData.item.buyerShippingInfo && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-green-700 mb-2">
                            구매자 배송지 정보
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600">
                                받는 사람:
                              </span>
                              <span className="text-sm font-medium text-green-900">
                                {chatData.item.buyerShippingInfo.recipientName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600">
                                연락처:
                              </span>
                              <span className="text-sm font-medium text-green-900">
                                {chatData.item.buyerShippingInfo.phoneNumber}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm text-green-600">
                                배송 주소:
                              </span>
                              <p className="text-sm font-medium text-green-900">
                                {chatData.item.buyerShippingInfo.address}
                              </p>
                            </div>
                            {chatData.item.buyerShippingInfo.deliveryMemo && (
                              <div className="space-y-1">
                                <span className="text-sm text-green-600">
                                  배송 메모:
                                </span>
                                <p className="text-sm font-medium text-green-900">
                                  {chatData.item.buyerShippingInfo.deliveryMemo}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 송장번호 정보 */}
                      {/* 배송 정보 (택배사, 송장번호) - 구매자와 판매자 모두에게 표시 */}
                      {chatData?.item?.shippingInfo &&
                      (user?.uid === chatData?.buyerUid ||
                        user?.uid === chatData?.sellerUid) ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            배송 정보
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                택배사:
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {chatData.item.shippingInfo?.courier
                                  ? getCourierName(
                                      chatData.item.shippingInfo.courier
                                    )
                                  : "정보 없음"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                송장번호:
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 font-mono">
                                  {chatData.item.shippingInfo?.trackingNumber ||
                                    "정보 없음"}
                                </span>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => {
                                      if (
                                        chatData.item.shippingInfo
                                          ?.trackingNumber
                                      ) {
                                        navigator.clipboard.writeText(
                                          chatData.item.shippingInfo
                                            .trackingNumber
                                        );
                                      }
                                      toast.success(
                                        "송장번호가 복사되었습니다."
                                      );
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                  >
                                    복사
                                  </button>
                                  <button
                                    onClick={() =>
                                      setShowShippingTrackingModal(true)
                                    }
                                    className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                                  >
                                    배송조회
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                발송일:
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {chatData.item.shippingInfo.shippedAt
                                  ? new Date(
                                      chatData.item.shippingInfo.shippedAt
                                        .seconds * 1000
                                    ).toLocaleDateString("ko-KR")
                                  : "정보 없음"}
                              </span>
                            </div>
                            {chatData.item.shippingInfo.deliveredAt && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  배송완료:
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  {new Date(
                                    chatData.item.shippingInfo.deliveredAt
                                      .seconds * 1000
                                  ).toLocaleDateString("ko-KR")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (chatData?.item?.status === "shipping" ||
                          chatData?.item?.status === "escrow_completed") &&
                        (user?.uid === chatData?.buyerUid ||
                          user?.uid === chatData?.sellerUid) &&
                        !chatData?.item?.shippingInfo ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">
                              배송 정보가 없습니다
                            </span>
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">
                            판매자가 배송 정보를 등록하지 않았습니다.
                          </p>
                          <Button
                            onClick={async () => {
                              if (chatData?.item?.id) {
                                console.log(
                                  "배송 정보 새로고침 시도:",
                                  chatData.item.id
                                );
                                const itemResult = await getItem(
                                  chatData.item.id
                                );
                                console.log("새로고침 결과:", itemResult);
                                if (itemResult?.success && itemResult?.item) {
                                  setChatData(prev =>
                                    prev
                                      ? {
                                          ...prev,
                                          item: {
                                            ...prev.item,
                                            shippingInfo:
                                              itemResult.item.shippingInfo,
                                          },
                                        }
                                      : null
                                  );
                                }
                              }
                            }}
                            className="mt-2 text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            배송정보 새로고침
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* 거래완료 상태 */}
                  {chatData.item.status === "sold" && (
                    <div className="w-full h-12 bg-green-100 border border-green-300 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      <span className="text-lg font-bold text-green-600">
                        거래완료
                      </span>
                    </div>
                  )}

                  {/* 거래 취소 버튼 */}
                  {chatData.item.status === "escrow_completed" && (
                    <Button
                      onClick={handleCancelTransaction}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 h-10"
                      disabled={isCancelingTransaction}
                    >
                      {isCancelingTransaction ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          취소 처리 중...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          거래 취소하기
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* 거래 취소된 상품 안내 - 재거래 가능하도록 제거 */}

              {/* 거래 취소 버튼 (거래중일 때만, 판매자와 구매자 모두) */}
              {user && chatData && chatData.item.status === "reserved" && (
                <div className="mb-4">
                  <Button
                    onClick={handleCancelTransaction}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={isCancelingTransaction}
                  >
                    {isCancelingTransaction ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        거래 취소 중...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        거래 취소하기
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* 구매자 액션 버튼들 - 디버깅용 */}
              {console.log("구매자 버튼 전체 조건 체크:", {
                userExists: !!user,
                chatDataExists: !!chatData,
                otherUserExists: !!chatData?.otherUser,
                userId: user?.uid,
                buyerUid: chatData?.buyerUid,
                isBuyer: user?.uid === chatData?.buyerUid,
                itemExists: !!chatData?.item,
                allConditions: !!(
                  user &&
                  chatData &&
                  chatData.otherUser &&
                  user.uid === chatData.buyerUid &&
                  chatData.item
                ),
              })}

              {user &&
                chatData &&
                chatData.otherUser &&
                user.uid === chatData.buyerUid &&
                chatData.item && (
                  <div className="mb-4 space-y-2">
                    {/* 안전결제 완료 상태에서의 버튼들 */}
                    {chatData.item.status === "escrow_completed" && (
                      <>
                        {/* 배송지 정보 입력 버튼 (구매자만) - 맨 위 */}
                        {user && chatData && user.uid === chatData.buyerUid && (
                          <Button
                            onClick={() => setShowShippingAddressModal(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            배송지 정보 입력
                          </Button>
                        )}

                        {/* 거래 취소하기 버튼 - 아래 */}
                        <Button
                          onClick={handleCancelTransaction}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 h-10"
                          disabled={isCancelingTransaction}
                        >
                          {isCancelingTransaction ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              취소 처리 중...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              취소하기
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {/* 거래중 상태 - 구매자는 거래 진행 상태만 확인 */}
                    {chatData.item.status === "reserved" &&
                      !chatData.item.transactionCancelledAt && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <span className="text-lg font-bold text-orange-600">
                              거래 진행중
                            </span>
                          </div>
                          <p className="text-sm text-orange-700">
                            판매자가 거래를 진행하고 있습니다.
                            <br />
                            배송 정보가 업데이트되면 알려드리겠습니다.
                          </p>
                        </div>
                      )}
                  </div>
                )}

              {/* 판매자 취소 요청 승인 버튼 */}
              {user &&
                chatData &&
                chatData.item.status === "cancel_requested" &&
                user.uid === chatData.sellerUid && (
                  <div className="mb-4">
                    <Button
                      onClick={handleApproveCancel}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={isApprovingCancel}
                    >
                      {isApprovingCancel ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          승인 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          취소 요청 승인
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      구매자의 취소 요청을 승인합니다
                    </p>
                  </div>
                )}

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
                {/* 거래 유형 표시 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    거래 유형
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const tradeTypes = [];
                      const currentTradeType = chatData?.tradeType || "직거래";

                      console.log("현재 거래 유형:", currentTradeType); // 디버그용

                      // 복합 거래 유형 처리
                      if (currentTradeType === "택배 + 안전결제") {
                        tradeTypes.push(
                          <span
                            key="delivery"
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            택배
                          </span>
                        );
                        tradeTypes.push(
                          <span
                            key="escrow"
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
                          >
                            안전결제
                          </span>
                        );
                      } else {
                        // 단일 거래 유형 처리
                        if (currentTradeType.includes("직거래")) {
                          tradeTypes.push(
                            <span
                              key="direct"
                              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                            >
                              직거래
                            </span>
                          );
                        }
                        if (
                          currentTradeType.includes("택배") &&
                          !currentTradeType.includes("안전결제")
                        ) {
                          tradeTypes.push(
                            <span
                              key="delivery"
                              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              택배
                            </span>
                          );
                        }
                        if (
                          (currentTradeType.includes("안전거래") ||
                            currentTradeType.includes("안전결제")) &&
                          !currentTradeType.includes("택배")
                        ) {
                          tradeTypes.push(
                            <span
                              key="escrow"
                              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
                            >
                              안전결제
                            </span>
                          );
                        }
                      }
                      return tradeTypes;
                    })()}
                  </div>
                </div>

                {/* 거래 상태 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    거래 상태
                  </h4>
                  <div className="space-y-2">
                    {/* 거래 대기 / 결제 완료 */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        chatData?.item?.status === "active"
                          ? "bg-green-50 border-green-300 text-green-800"
                          : chatData?.item?.status === "reserved" ||
                              chatData?.item?.status === "escrow_completed"
                            ? "bg-blue-50 border-blue-300 text-blue-800"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {chatData?.item?.status === "reserved" ||
                          chatData?.item?.status === "escrow_completed"
                            ? "결제 완료"
                            : "거래 대기"}
                        </span>
                        {chatData?.item?.status === "active" && (
                          <span className="text-green-600">✅</span>
                        )}
                        {(chatData?.item?.status === "reserved" ||
                          chatData?.item?.status === "escrow_completed") && (
                          <span className="text-blue-600">💳</span>
                        )}
                      </div>
                      {chatData?.item?.status === "active" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : chatData?.item?.status === "reserved" ||
                        chatData?.item?.status === "escrow_completed" ? (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* 거래중 */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        chatData?.item?.status === "reserved"
                          ? "bg-orange-50 border-orange-300 text-orange-800"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">거래중</span>
                        {chatData?.item?.status === "reserved" && (
                          <span className="text-orange-600">✅</span>
                        )}
                      </div>
                      {chatData?.item?.status === "reserved" ? (
                        <Clock className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* 배송중 */}
                    <div
                      className={`p-3 rounded-lg border-2 ${
                        chatData?.item?.status === "shipping"
                          ? "bg-blue-50 border-blue-300 text-blue-800"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">배송중</span>
                          {chatData?.item?.status === "shipping" && (
                            <span className="text-blue-600">✅</span>
                          )}
                        </div>
                        {chatData?.item?.status === "shipping" ? (
                          <Truck className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Truck className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* 배송 정보 - 구매자와 판매자 모두에게 표시 */}
                      {chatData?.item?.status === "shipping" &&
                        chatData?.item?.shippingInfo &&
                        (user?.uid === chatData?.buyerUid ||
                          user?.uid === chatData?.sellerUid) && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-blue-700">
                                  택배사:
                                </span>
                                <span className="text-xs font-medium text-blue-900">
                                  {(() => {
                                    const courierMap: {
                                      [key: string]: string;
                                    } = {
                                      cj: "CJ대한통운",
                                      hanjin: "한진택배",
                                      lotte: "롯데택배",
                                      kdexp: "경동택배",
                                      epost: "우체국택배",
                                      logen: "로젠택배",
                                      dongbu: "동부택배",
                                      kg: "KG로지스",
                                      kgm: "KGB택배",
                                      inno: "이노지스",
                                      slx: "SLX택배",
                                      fedex: "FedEx",
                                      ups: "UPS",
                                      dhl: "DHL",
                                      other: "기타",
                                    };
                                    return (
                                      courierMap[
                                        chatData.item.shippingInfo.courier
                                      ] || chatData.item.shippingInfo.courier
                                    );
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-blue-700">
                                  송장번호:
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs font-mono font-medium text-blue-900">
                                    {chatData.item.shippingInfo.trackingNumber}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        chatData.item.shippingInfo
                                          .trackingNumber
                                      );
                                      toast.success(
                                        "송장번호가 복사되었습니다."
                                      );
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs px-1 py-0.5 border border-blue-300 rounded hover:bg-blue-100"
                                  >
                                    복사
                                  </button>
                                </div>
                              </div>
                              {chatData.item.shippingInfo.shippedAt && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-blue-700">
                                    발송일:
                                  </span>
                                  <span className="text-xs font-medium text-blue-900">
                                    {new Date(
                                      chatData.item.shippingInfo.shippedAt
                                        .seconds * 1000
                                    ).toLocaleDateString("ko-KR")}
                                  </span>
                                </div>
                              )}
                              {chatData.item.shippingInfo.deliveredAt && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-green-700">
                                    배송완료:
                                  </span>
                                  <span className="text-xs font-medium text-green-900">
                                    {new Date(
                                      chatData.item.shippingInfo.deliveredAt
                                        .seconds * 1000
                                    ).toLocaleDateString("ko-KR")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* 판매완료 */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        chatData?.item?.status === "sold"
                          ? "bg-green-50 border-green-300 text-green-800"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">판매완료</span>
                        {chatData?.item?.status === "sold" && (
                          <span className="text-green-600">✅</span>
                        )}
                      </div>
                      {chatData?.item?.status === "sold" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* 구매확정 버튼 - 구매자에게만 표시 (채팅창 사이드바) */}
                    {user &&
                      chatData &&
                      user.uid === chatData.buyerUid &&
                      chatData.item.status === "shipping" && (
                        <div className="mt-4">
                          <Button
                            onClick={() => {
                              if (
                                confirm(
                                  "상품을 수령하셨나요?\n구매 확정 후에는 취소할 수 없습니다."
                                )
                              ) {
                                handleCompletePurchase();
                              }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-10"
                            disabled={isCompletingPurchase}
                          >
                            {isCompletingPurchase ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                확정 중...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                구매 확정
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상대방 프로필 모달 */}
        {showOtherProfileModal && chatData && otherUserProfile && (
          <SellerProfileModal
            isOpen={showOtherProfileModal}
            onClose={() => setShowOtherProfileModal(false)}
            sellerProfile={otherUserProfile}
          />
        )}

        {/* 배송조회 모달 */}
        {showShippingTrackingModal &&
          chatData?.item?.shippingInfo &&
          (user?.uid === chatData?.buyerUid ||
            user?.uid === chatData?.sellerUid) && (
            <ShippingTrackingModal
              isOpen={showShippingTrackingModal}
              onClose={() => setShowShippingTrackingModal(false)}
              courier={chatData.item.shippingInfo.courier}
              trackingNumber={chatData.item.shippingInfo.trackingNumber}
            />
          )}

        {/* 구매자 배송지 정보 입력 모달 */}
        {showBuyerShippingInfoModal && chatData?.item?.id && user && (
          <BuyerShippingInfoModal
            isOpen={showBuyerShippingInfoModal}
            onClose={() => setShowBuyerShippingInfoModal(false)}
            itemId={chatData.item.id}
            buyerUid={user.uid}
            onSuccess={() => {
              // 성공 시 채팅 데이터 새로고침
              if (chatData?.item?.id) {
                loadChatData(chatData.item.id);
              }
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

        {/* 취소 요청 모달 */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  구매 취소 요청
                </h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                취소 사유를 입력해주세요. (선택사항)
              </p>

              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력하세요..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 mb-4"
              />

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleRequestCancel}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={isRequestingCancel}
                >
                  {isRequestingCancel ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      요청 중...
                    </>
                  ) : (
                    "요청 보내기"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 차단 확인 모달 */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  사용자 차단
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {chatData?.otherUser?.nickname}님을 차단하시겠습니까?
                  <br />
                  차단된 사용자와는 더 이상 채팅할 수 없습니다.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSkipBlock}
                    variant="outline"
                    className="flex-1"
                    disabled={isBlocking}
                  >
                    아니오
                  </Button>
                  <Button
                    onClick={handleBlockUser}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isBlocking}
                  >
                    {isBlocking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        차단 중...
                      </>
                    ) : (
                      "네, 차단합니다"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 배송지 선택 및 전달 모달 */}
        {showShippingAddressModal && user && (
          <ShippingAddressSelectionModal
            isOpen={showShippingAddressModal}
            onClose={() => setShowShippingAddressModal(false)}
            userId={user.uid}
            onAddressSelect={address => {
              // 선택된 배송지를 판매자에게 전달
              handleSendShippingAddress(address);
              setShowShippingAddressModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
