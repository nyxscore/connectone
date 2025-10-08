"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { MessageInput } from "./MessageInput";
import { SellerProfileModal } from "../profile/SellerProfileModal";
import { SellerProfileCard } from "../profile/SellerProfileCard";
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
import { getFirebaseDb as getDb } from "../../lib/api/firebase-ultra-safe";
import {
  ArrowLeft,
  X,
  MapPin,
  Loader2,
  AlertCircle,
  MessageCircle,
  Trash2,
  MoreVertical,
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
  autoSendSystemMessage?: string;
}

export function EnhancedChatModal({
  isOpen,
  onClose,
  itemId,
  sellerUid,
  chatId,
  tradeType,
  onChatDeleted,
  autoSendSystemMessage,
}: EnhancedChatModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatData, setChatData] = useState<{
    chatId: string;
    itemId?: string;
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
    buyerUnreadCount?: number;
    sellerUnreadCount?: number;
  } | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(
    null
  );
  const [showOtherProfileModal, setShowOtherProfileModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  // 모바일에서는 사이드바 기본 숨김, 데스크톱에서는 표시
  const [showSidebar, setShowSidebar] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );
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
  // const [showShippingModal, setShowShippingModal] = useState(false);
  const [isRegisteringShipping, setIsRegisteringShipping] = useState(false);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showShippingTrackingModal, setShowShippingTrackingModal] =
    useState(false);
  const [showBuyerShippingInfoModal, setShowBuyerShippingInfoModal] =
    useState(false);
  const [systemMessagesInitialized, setSystemMessagesInitialized] =
    useState(false);
  const [showShippingAddressModal, setShowShippingAddressModal] =
    useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedShippingAddresses, setExpandedShippingAddresses] = useState<
    Set<string>
  >(new Set());

  // 화면 크기 변경 감지하여 사이드바 자동 조절
  useEffect(() => {
    const handleResize = () => {
      // 데스크톱(768px 이상)에서는 사이드바 자동 표시
      if (window.innerWidth >= 768 && !showSidebar) {
        setShowSidebar(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showSidebar]);

  // 상태 변경 시 시스템 메시지로 알림 추가
  const addStatusSystemMessage = async (
    type: "escrow_completed" | "reserved" | "shipping" | "sold"
  ) => {
    console.log(`🔔 addStatusSystemMessage 호출됨: ${type}`);
    console.log(`현재 거래 유형: ${chatData?.tradeType}`);

    // 거래 유형에 따른 메시지 분기
    const getSystemMessage = (type: string, tradeType?: string) => {
      const isEscrow = tradeType?.includes("안전결제");

      switch (type) {
        case "escrow_completed":
          // 안전결제인 경우에만 결제 완료 메시지 표시
          if (isEscrow) {
            return "🎉 안전결제가 완료되었습니다! 구매자가 안전결제를 완료했습니다.";
          } else {
            // 직거래/택배인 경우 결제 완료 단계가 없으므로 메시지 없음
            return "";
          }
        case "reserved":
          // 거래 시작 메시지 (모든 거래 유형 공통)
          if (isEscrow) {
            return "🚀 안전거래가 시작되었습니다!";
          } else if (
            tradeType?.includes("택배") &&
            !tradeType?.includes("안전결제")
          ) {
            return "🚀 택배거래가 시작되었습니다!";
          } else {
            return "🚀 직거래가 시작되었습니다!";
          }
        case "shipping":
          // 배송중 메시지 (안전결제인 경우에만 표시)
          if (isEscrow) {
            return "📦 상품이 발송되었습니다!";
          } else {
            // 직거래/택배인 경우 배송중 단계가 없으므로 메시지 없음
            return "";
          }
        case "sold":
          // 거래 완료 메시지 (모든 거래 유형 공통)
          return "🎊 거래가 완료되었습니다! 구매자가 상품 수령을 확인했습니다.";
        default:
          return "📢 거래 상태가 변경되었습니다.";
      }
    };

    const message = getSystemMessage(type, chatData?.tradeType);

    // 메시지가 비어있으면 전송하지 않음 (해당 거래 유형에서 발생하지 않는 단계)
    if (!message) {
      console.log(
        `⏭️ ${type} 단계는 현재 거래 유형(${chatData?.tradeType})에서 발생하지 않으므로 시스템 메시지를 전송하지 않습니다.`
      );
      return;
    }

    if (!chatData?.chatId) {
      console.error("채팅 ID가 없어서 시스템 메시지를 추가할 수 없습니다.");
      return;
    }

    // 시스템 메시지 중복 체크 (메시지 로드 완료 후에만)
    if (messages.length > 0) {
      const isDuplicate = messages.some(
        msg => msg.senderUid === "system" && msg.content === message
      );

      if (isDuplicate) {
        console.log(`⏭️ 중복 시스템 메시지 감지: ${type}, 전송하지 않음`);
        return;
      }
    } else {
      console.log("📝 메시지 목록이 아직 로드되지 않음, 중복 체크 건너뜀");
    }

    console.log("📤 시스템 메시지 전송:", type, message);

    try {
      // 시스템 메시지를 채팅에 추가
      const { sendMessage } = await import("../../lib/chat/api");
      const result = await sendMessage({
        chatId: chatData.chatId,
        senderUid: "system",
        content: message,
      });

      if (result.success) {
        console.log("✅ 시스템 메시지 추가 성공:", type);

        // 시스템 메시지 전송 후 채팅 알림 업데이트 (빨간점 표시)
        try {
          const { updateDoc, doc } = await import("firebase/firestore");
          const db = await getDb();

          const chatRef = doc(db, "chats", chatData.chatId);

          // 구매자와 판매자 모두에게 읽지 않음 카운트 증가
          const updateData: any = {
            lastMessage: message,
            updatedAt: new Date(),
          };

          // 구매자 읽지 않음 카운트 증가
          if (chatData.buyerUid) {
            updateData.buyerUnreadCount = (chatData.buyerUnreadCount || 0) + 1;
          }

          // 판매자 읽지 않음 카운트 증가
          if (chatData.sellerUid) {
            updateData.sellerUnreadCount =
              (chatData.sellerUnreadCount || 0) + 1;
          }

          await updateDoc(chatRef, updateData);
          console.log("✅ 채팅 알림 카운트 업데이트 완료");
        } catch (error) {
          console.error("❌ 채팅 알림 카운트 업데이트 실패:", error);
        }
      } else {
        console.error("❌ 시스템 메시지 추가 실패:", result.error);
      }
    } catch (error) {
      console.error("❌ 시스템 메시지 추가 중 오류:", error);
    }
  };

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
      // 배송지 정보를 깔끔하게 정렬하여 전송
      const addressMessage = `배송지 정보가 전달되었습니다.\n\n📦 수령인: ${address.recipientName}\n\n📞 연락처: ${address.phoneNumber}\n\n📍 주소: ${address.address}${address.deliveryMemo ? `\n\n📝 배송 메모: ${address.deliveryMemo}` : ""}`;

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

  // 거래 시작 시 구매자가 입력한 배송지 정보를 판매자에게 자동 표시
  const showShippingAddressToSeller = async () => {
    if (!chatData?.chatId || !chatData?.buyerUid) return;

    try {
      // 구매자의 최근 배송지 정보 가져오기
      const { getShippingAddresses } = await import(
        "../../lib/api/shipping-address"
      );
      const addressResult = await getShippingAddresses(chatData.buyerUid);

      if (
        addressResult.success &&
        addressResult.addresses &&
        addressResult.addresses.length > 0
      ) {
        // 기본 배송지 또는 첫 번째 배송지 사용
        const selectedAddress =
          addressResult.addresses.find(addr => addr.isDefault) ||
          addressResult.addresses[0];

        if (selectedAddress) {
          // 배송지 정보를 시스템 메시지로 전송
          const addressMessage = `🚚 구매자 배송지 정보\n\n📦 수령인: ${selectedAddress.recipientName}\n\n📞 연락처: ${selectedAddress.phoneNumber}\n\n📍 주소: ${selectedAddress.address}${selectedAddress.deliveryMemo ? `\n\n📝 배송 메모: ${selectedAddress.deliveryMemo}` : ""}`;

          const { sendMessage } = await import("../../lib/chat/api");
          await sendMessage({
            chatId: chatData.chatId,
            senderUid: "system",
            content: addressMessage,
          });

          console.log("구매자 배송지 정보를 판매자에게 자동 표시 완료");
        }
      } else {
        console.log("구매자의 배송지 정보가 없습니다.");
      }
    } catch (error) {
      console.error("배송지 정보 자동 표시 실패:", error);
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

  // loadChatData 함수 정의 (useEffect보다 먼저)
  const loadChatData = async () => {
    try {
      setLoading(true);
      setError("");

      if (chatId) {
        // 기존 채팅 로드
        console.log("기존 채팅 로드:", chatId);

        // 클라이언트 사이드에서만 실행
        if (typeof window === "undefined") {
          console.log("⚠️ 서버 사이드에서 loadChatData 실행 시도 - 건너뜀");
          setError("클라이언트 사이드에서만 실행 가능합니다.");
          return;
        }

        const db = getDb();
        if (!db) {
          console.log("⚠️ Firebase DB가 초기화되지 않음 - 재시도 중...");
          setTimeout(() => {
            loadChatData();
          }, 1000);
          return;
        }

        // 동적 import로 Firebase 함수 가져오기
        const { doc, getDoc } = await import("firebase/firestore");
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
        const storedOtherUser = (chatData as any).otherUser;

        // 없으면 Firestore에서 가져오기
        let otherUser: UserProfile | null = null;
        console.log("저장된 상대방 정보:", storedOtherUser);

        if (!storedOtherUser?.nickname || !storedOtherUser?.profileImage) {
          console.log("상대방 프로필을 Firestore에서 가져오기:", otherUid);
          const otherUserResult = await getUserProfile(otherUid);
          console.log("상대방 프로필 로드 결과:", otherUserResult);
          otherUser =
            otherUserResult.success && otherUserResult.data
              ? otherUserResult.data
              : null;
          if (otherUser) {
            setOtherUserProfile(otherUser);
          }
        } else {
          console.log("저장된 상대방 정보 사용:", storedOtherUser);
          setOtherUserProfile(storedOtherUser as UserProfile);
        }

        // 아이템 정보 가져오기
        console.log("아이템 정보 가져오기:", chatData.itemId);
        let itemResult = await getItem(chatData.itemId);
        console.log("아이템 로드 결과:", itemResult);

        if (!itemResult.success || !itemResult.item) {
          console.log("아이템 로드 실패, 기본값 사용");
          // 아이템 정보가 없으면 기본값 사용
          itemResult = {
            success: true,
            item: {
              id: chatData.itemId,
              title: "알 수 없는 상품",
              price: 0,
              brand: "알 수 없음",
              model: "",
              images: [],
            } as any,
          };
        }

        // buyerUid 우선순위로 설정
        const finalBuyerUid = itemResult.item?.buyerUid || chatData.buyerUid;

        console.log("최종 buyerUid 설정:", {
          itemBuyerUid: itemResult.item?.buyerUid,
          chatBuyerUid: chatData.buyerUid,
          finalBuyerUid,
        });

        setChatData({
          chatId,
          itemId: chatData.itemId,
          sellerUid: chatData.sellerUid,
          buyerUid: finalBuyerUid,
          otherUser: {
            uid: otherUid,
            nickname: otherUser?.nickname || "알 수 없음",
            profileImage: (otherUser as any)?.profileImage,
          },
          item: {
            ...itemResult.item,
            id: itemResult.item?.id || chatData.itemId,
            title: itemResult.item?.title || "알 수 없는 상품",
            price: itemResult.item?.price || 0,
            // imageUrl이 없으면 images 배열의 첫 번째 이미지 사용
            imageUrl:
              (itemResult.item as any)?.imageUrl ||
              (itemResult.item?.images && itemResult.item.images.length > 0
                ? itemResult.item.images[0]
                : undefined),
          },
          tradeType: (() => {
            // escrowEnabled가 true면 "안전결제"만 표시 (택배는 당연하니까)
            if (
              itemResult.item?.escrowEnabled ||
              itemResult.item?.status === "escrow_completed"
            ) {
              return "안전결제";
            }
            // 아니면 tradeOptions에서 가져오기
            const options = itemResult.item?.tradeOptions || ["직거래"];
            return options.join(" + ");
          })(),
        });

        // 메시지는 useEffect에서 자동으로 로드됨
      } else if (itemId && sellerUid) {
        // 새로운 채팅 생성
        console.log("새 채팅 생성:", { itemId, sellerUid, userUid: user?.uid });

        if (user?.uid === sellerUid) {
          setError("자신의 상품과는 채팅할 수 없습니다.");
          return;
        }

        // 채팅 생성 또는 기존 채팅 가져오기
        const chatResult = await getOrCreateChat(
          itemId,
          user?.uid || "",
          sellerUid
        );

        if (!chatResult.success || !chatResult.chatId) {
          console.error("채팅 생성 실패:", chatResult.error);
          setError("채팅을 생성하는데 실패했습니다.");
          return;
        }

        console.log("채팅 생성/조회 성공:", chatResult.chatId);

        // 이제 chatId를 사용하여 채팅 데이터 로드 (기존 로직 재사용)
        const { doc, getDoc } = await import("firebase/firestore");
        const db = getDb();
        if (!db) {
          setError("Firebase DB 초기화 실패");
          return;
        }

        const chatRef = doc(db, "chats", chatResult.chatId);
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
        if (!otherUserResult.success) {
          setError("상대방 정보를 가져올 수 없습니다.");
          return;
        }

        // 아이템 정보 가져오기
        const itemResult = await getItem(itemId);
        if (!itemResult.success || !itemResult.item) {
          setError("상품 정보를 가져올 수 없습니다.");
          return;
        }

        setChatData({
          chatId: chatResult.chatId,
          itemId,
          sellerUid: chatData.sellerUid,
          buyerUid: chatData.buyerUid,
          otherUser: {
            uid: otherUid,
            nickname: otherUserResult.data?.nickname || "알 수 없음",
            profileImage: (otherUserResult.data as any)?.profileImage,
          },
          item: {
            ...itemResult.item,
            id: itemResult.item?.id || itemId,
            title: itemResult.item?.title || "알 수 없는 상품",
            price: itemResult.item?.price || 0,
            // imageUrl이 없으면 images 배열의 첫 번째 이미지 사용
            imageUrl:
              (itemResult.item as any)?.imageUrl ||
              (itemResult.item?.images && itemResult.item.images.length > 0
                ? itemResult.item.images[0]
                : undefined),
          },
          tradeType: (() => {
            // escrowEnabled가 true면 "안전결제"만 표시 (택배는 당연하니까)
            if (
              itemResult.item?.escrowEnabled ||
              itemResult.item?.status === "escrow_completed"
            ) {
              return "안전결제";
            }
            // 아니면 tradeOptions에서 가져오기
            const options = itemResult.item?.tradeOptions || ["직거래"];
            return options.join(" + ");
          })(),
        });
      } else {
        setError("채팅 정보가 부족합니다.");
      }
    } catch (error) {
      console.error("채팅 데이터 로드 실패:", error);
      setError("채팅 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
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

  // 자동 시스템 메시지 전송 (autoSendSystemMessage가 있으면 이것만 실행)
  useEffect(() => {
    if (
      isOpen &&
      autoSendSystemMessage &&
      chatData?.chatId &&
      messages.length > 0 &&
      !systemMessagesInitialized // 초기화가 완료되지 않은 경우에만
    ) {
      console.log("🔔 자동 시스템 메시지 전송:", autoSendSystemMessage);

      // 시스템 메시지 전송 (채팅이 완전히 로드된 후)
      setTimeout(async () => {
        await addStatusSystemMessage(
          autoSendSystemMessage as
            | "escrow_completed"
            | "reserved"
            | "shipping"
            | "sold"
        );
        // 자동 메시지 전송 후 초기화 플래그 설정
        setSystemMessagesInitialized(true);
      }, 1000);
    }
  }, [
    isOpen,
    autoSendSystemMessage,
    chatData?.chatId,
    messages.length,
    systemMessagesInitialized,
  ]);

  // 시스템 메시지 초기화 플래그는 이미 최상단에 선언됨

  // 채팅 데이터 로드 시 상태별 알림 초기화 (autoSendSystemMessage가 없을 때만 실행)
  useEffect(() => {
    const initializeSystemMessages = async () => {
      if (
        chatData?.item?.status &&
        user &&
        messages.length > 0 &&
        !systemMessagesInitialized &&
        !autoSendSystemMessage
      ) {
        const currentStatus = chatData.item.status;

        console.log("🔔 알림 초기화 시작:", {
          currentStatus,
          userId: user.uid,
          isBuyer: user.uid === chatData.buyerUid,
          isSeller: user.uid === chatData.sellerUid,
          systemMessagesInitialized,
        });

        // 현재 상태에 맞는 알림들 추가 (시스템 메시지로) - 거래 유형에 따라 단계별로
        const isEscrow = chatData?.tradeType?.includes("안전결제");

        if (currentStatus === "escrow_completed") {
          // 안전결제인 경우에만 결제 완료 메시지 표시
          if (isEscrow) {
            console.log("✅ escrow_completed 시스템 메시지 추가 (안전결제)");
            await addStatusSystemMessage("escrow_completed");
          } else {
            console.log("⏭️ 직거래/택배 거래이므로 결제 완료 단계가 없음");
          }
        } else if (currentStatus === "reserved") {
          // 거래 시작 메시지 (모든 거래 유형 공통)
          console.log("✅ reserved 시스템 메시지 추가 (거래 시작)");
          await addStatusSystemMessage("reserved");

          // 안전결제인 경우 이전 단계(결제 완료)도 표시
          if (isEscrow) {
            console.log("✅ escrow_completed 시스템 메시지도 추가 (안전결제)");
            await addStatusSystemMessage("escrow_completed");
          }
        } else if (currentStatus === "shipping") {
          // 배송중 메시지 (안전결제인 경우에만 표시)
          if (isEscrow) {
            console.log("✅ shipping 시스템 메시지 추가 (안전결제 배송중)");
            await addStatusSystemMessage("shipping");
            await addStatusSystemMessage("escrow_completed");
            await addStatusSystemMessage("reserved");
          } else {
            console.log("⏭️ 직거래/택배 거래이므로 배송중 단계가 없음");
            // 직거래/택배인 경우 거래 시작 메시지만 표시
            await addStatusSystemMessage("reserved");
          }
        } else if (currentStatus === "sold") {
          // 거래 완료 메시지 (모든 거래 유형 공통)
          console.log("✅ sold 시스템 메시지 추가 (거래 완료)");
          await addStatusSystemMessage("sold");

          // 이전 단계들도 표시
          if (isEscrow) {
            // 안전결제: 결제완료 → 거래중 → 배송중 → 완료
            await addStatusSystemMessage("escrow_completed");
            await addStatusSystemMessage("reserved");
            await addStatusSystemMessage("shipping");
          } else {
            // 직거래/택배: 거래중 → 완료
            await addStatusSystemMessage("reserved");
          }
        }

        // 초기화 완료 플래그 설정
        setSystemMessagesInitialized(true);
      }
    };

    initializeSystemMessages();
  }, [
    chatData?.item?.status,
    user?.uid,
    messages.length,
    systemMessagesInitialized,
    autoSendSystemMessage,
  ]);

  // 채팅창이 닫히거나 채팅방이 변경되면 초기화 플래그 리셋
  useEffect(() => {
    if (!isOpen || chatData?.chatId !== chatId) {
      setSystemMessagesInitialized(false);
    }
  }, [isOpen, chatData?.chatId, chatId]);

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
      // Firestore에서 직접 상품 상태를 '거래중'으로 변경하고 구매자 지정
      const { doc, updateDoc } = await import("firebase/firestore");
      const db = getDb();
      if (!db) {
        toast.error("데이터베이스 초기화 실패");
        return;
      }

      const itemRef = doc(db, "items", chatData.item.id);
      await updateDoc(itemRef, {
        status: "reserved",
        buyerUid: chatData.otherUser.uid,
        buyerId: chatData.otherUser.uid, // 호환성을 위해
        updatedAt: new Date(),
      });

      console.log("✅ 상품 상태 업데이트 완료");
      toast.success("거래가 시작되었습니다!");

      // chatData의 item.status를 "reserved"로 업데이트
      setChatData(prev =>
        prev
          ? {
              ...prev,
              item: {
                ...prev.item,
                status: "reserved",
                buyerUid: chatData.otherUser.uid,
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

      // 거래 시작 알림 추가
      await addStatusSystemMessage("reserved");

      // 배송지 입력 요청 시스템 메시지 전송 (택배 거래인 경우)
      if (
        chatData.tradeType?.includes("택배") ||
        chatData.tradeType?.includes("안전결제")
      ) {
        try {
          const { sendMessage } = await import("../../lib/chat/api");
          const shippingRequestMessage =
            "📦 배송지 정보를 입력해주세요. 하단 '배송지 등록' 버튼을 클릭하세요.";

          const result = await sendMessage({
            chatId: chatData.chatId,
            senderUid: "system",
            content: shippingRequestMessage,
          });

          if (result.success) {
            console.log("배송지 입력 요청 시스템 메시지 전송 완료");
          } else {
            console.error(
              "배송지 입력 요청 시스템 메시지 전송 실패:",
              result.error
            );
          }
        } catch (error) {
          console.error("배송지 입력 요청 시스템 메시지 전송 실패:", error);
        }
      }

      // 안전결제인 경우 구매자가 입력한 배송지 정보를 판매자에게 자동 표시
      if (chatData.tradeType?.includes("안전결제")) {
        await showShippingAddressToSeller();
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
        // Firestore에서 직접 상품 상태를 '판매중'으로 변경하고 구매자 정보 제거
        const { doc, updateDoc, deleteField } = await import(
          "firebase/firestore"
        );
        const db = getDb();
        if (!db) {
          toast.error("데이터베이스 초기화 실패");
          return;
        }

        const itemRef = doc(db, "items", chatData.item.id);
        await updateDoc(itemRef, {
          status: "active",
          buyerUid: deleteField(),
          buyerId: deleteField(),
          transactionCancelledAt: new Date(),
          updatedAt: new Date(),
        });

        console.log("✅ 상품 거래 취소 완료");

        // 안전결제 취소인지 확인
        if (isEscrowCompleted) {
          toast.success("안전결제가 취소되었습니다! 환불이 처리됩니다.");
        } else {
          toast.success("거래가 취소되었습니다!");
        }

        // 거래 취소 시스템 메시지 전송 - 양측 모두에게 알림
        try {
          const { sendMessage } = await import("../../lib/chat/api");
          // 판매자/구매자 정확히 구분
          const isSeller = user?.uid === chatData.sellerUid;
          const cancelMessage = isSeller
            ? "❌ 판매자가 거래를 취소했습니다. 상품이 다시 판매중으로 변경되었습니다."
            : "❌ 구매자가 거래를 취소했습니다. 상품이 다시 판매중으로 변경되었습니다.";

          const result = await sendMessage({
            chatId: chatData.chatId,
            senderUid: "system",
            content: cancelMessage,
          });

          if (result.success) {
            console.log(
              "거래 취소 시스템 메시지 전송 완료 - 양측 모두에게 알림"
            );

            // chatData 업데이트하여 UI 즉시 반영
            setChatData(prev =>
              prev
                ? {
                    ...prev,
                    item: {
                      ...prev.item,
                      status: "active",
                      buyerUid: undefined,
                    },
                  }
                : null
            );
          } else {
            console.error("거래 취소 시스템 메시지 전송 실패:", result.error);
          }
        } catch (error) {
          console.error("거래 취소 시스템 메시지 전송 실패:", error);
        }

        // 전역 이벤트 발생으로 상품 목록 업데이트
        window.dispatchEvent(
          new CustomEvent("itemStatusChanged", {
            detail: { itemId: chatData.item.id, status: "active" },
          })
        );
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

        // 취소 요청 시스템 메시지 전송
        try {
          const { sendMessage } = await import("../../lib/chat/api");
          const cancelMessage =
            "📝 구매자가 거래 취소를 요청했습니다. 판매자의 승인을 기다리고 있습니다.";

          const result = await sendMessage({
            chatId: chatData.chatId,
            senderUid: "system",
            content: cancelMessage,
          });

          if (result.success) {
            console.log("취소 요청 시스템 메시지 전송 완료");
          } else {
            console.error("취소 요청 시스템 메시지 전송 실패:", result.error);
          }
        } catch (error) {
          console.error("취소 요청 시스템 메시지 전송 실패:", error);
        }

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

          // 취소 승인 시스템 메시지 전송
          try {
            const { sendMessage } = await import("../../lib/chat/api");
            const cancelMessage =
              "✅ 판매자가 취소 요청을 승인했습니다. 상품이 다시 판매중으로 변경되었습니다.";

            const result = await sendMessage({
              chatId: chatData.chatId,
              senderUid: "system",
              content: cancelMessage,
            });

            if (result.success) {
              console.log("취소 승인 시스템 메시지 전송 완료");
            } else {
              console.error("취소 승인 시스템 메시지 전송 실패:", result.error);
            }
          } catch (error) {
            console.error("취소 승인 시스템 메시지 전송 실패:", error);
          }

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

        // 배송 시작 알림 추가
        await addStatusSystemMessage("shipping");

        // 송장 등록 모달 닫기
        // setShowShippingModal(false);

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

          // 거래 완료 알림 추가
          await addStatusSystemMessage("sold");
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

  console.log("EnhancedChatModal 렌더링:", {
    isOpen,
    chatId,
    user: user?.uid,
    props: {
      isOpen,
      onClose,
      chatId,
      tradeType,
      onChatDeleted,
      autoSendSystemMessage,
    },
  });

  console.log("EnhancedChatModal: 렌더링 상태 확인", {
    isOpen,
    chatId,
    showChatModal: true, // 강제로 true로 설정
  });

  // 임시로 isOpen 조건을 제거하여 모달이 항상 렌더링되도록 함
  // if (!isOpen) {
  //   console.log("EnhancedChatModal: isOpen이 false이므로 null 반환", {
  //     isOpen,
  //   });
  //   return null;
  // }

  console.log("EnhancedChatModal: 모달 렌더링 시작", { isOpen, chatId });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex">
        {/* 채팅 영역 */}
        <div className={`flex-1 flex flex-col ${showSidebar ? "mr-4" : ""}`}>
          {/* 헤더 */}
          <div className="flex items-center justify-between p-2 border-b bg-gray-50">
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {chatData && (
                <button
                  className="flex items-center space-x-1 hover:opacity-80 transition-opacity cursor-pointer flex-1 min-w-0"
                  onClick={() => {
                    // 상품 상세 페이지로 이동
                    window.location.href = `/item/${chatData.item.id}`;
                  }}
                >
                  {/* 상품 썸네일 */}
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {chatData.item.imageUrl ? (
                      <img
                        src={chatData.item.imageUrl}
                        alt={chatData.item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  {/* 상품명과 가격 */}
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-xs leading-tight">
                      {chatData.item.title.length > 35 
                        ? `${chatData.item.title.substring(0, 35)}...` 
                        : chatData.item.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatPrice(chatData.item.price)}
                    </p>
                  </div>
                </button>
              )}
            </div>

            <div className="flex items-center flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-1"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 설정 메뉴 오버레이 */}
          {showSettingsMenu && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={() => setShowSettingsMenu(false)}
            />
          )}

          {/* 설정 메뉴 */}
          {showSettingsMenu && (
            <div className="bg-white border-b shadow-sm relative z-50">
              <div className="p-3 space-y-2">
                <button
                  onClick={() => {
                    setShowSidebar(true);
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>상대방 정보</span>
                </button>
                <button
                  onClick={() => {
                    setShowReportModal(true);
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>신고하기</span>
                </button>
                <button
                  onClick={() => {
                    setShowBlockModal(true);
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>차단하기</span>
                </button>
                <div className="px-3 py-2">
                  <div className="text-xs text-gray-500 mb-2">글자 크기</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFontSize('small')}
                      className={`px-2 py-1 text-xs rounded ${
                        fontSize === 'small' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      작게
                    </button>
                    <button
                      onClick={() => setFontSize('medium')}
                      className={`px-2 py-1 text-xs rounded ${
                        fontSize === 'medium' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      보통
                    </button>
                    <button
                      onClick={() => setFontSize('large')}
                      className={`px-2 py-1 text-xs rounded ${
                        fontSize === 'large' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      크게
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("채팅방을 나가시겠습니까?")) {
                      onClose();
                    }
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>채팅방 나가기</span>
                </button>
              </div>
            </div>
          )}

          {/* 메시지 영역 */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
            fontSize === 'small' ? 'text-sm' : 
            fontSize === 'large' ? 'text-lg' : 
            'text-base'
          }`}>
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
              <>
                {messages.map((message, index) => {
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
                            {/* 시스템 메시지 시간 */}
                            <div className="flex justify-center mt-2">
                              <span className="text-xs text-blue-600">
                                {formatTimeOnly(message.createdAt)}
                              </span>
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
                })}
              </>
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

        {/* 모바일 오버레이 */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* 사이드바 */}
        {showSidebar && (
          <div className="w-full md:w-80 bg-gray-50 border-l flex flex-col h-full absolute md:relative right-0 top-0 z-50 md:z-auto">
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
                  {/* 거래 취소 이력 안내 */}
                  {chatData.item.transactionCancelledAt &&
                    chatData.item.status === "active" && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <X className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-bold text-red-800">
                            거래 취소 이력 있음
                          </span>
                        </div>
                        <p className="text-xs text-red-700">
                          이 상품은 거래 취소 이력이 있어 재거래가 제한됩니다.
                        </p>
                      </div>
                    )}

                  {/* 거래 진행하기 버튼 - 취소 이력이 없을 때만 */}
                  {(chatData.item.status === "active" ||
                    chatData.item.status === "escrow_completed") &&
                    !chatData.item.transactionCancelledAt && (
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

                  {/* 거래중 상태 - 택배 발송 정보 입력 (안전결제인 경우에만) */}
                  {chatData.item.status === "reserved" &&
                    (chatData.tradeType?.includes("안전결제") ||
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

                  {/* 거래 취소 버튼 - 결제완료 단계에서 판매자와 구매자 모두 */}
                  {(chatData.item.status === "escrow_completed" ||
                    (autoSendSystemMessage === "escrow_completed" &&
                      chatData.tradeType?.includes("안전결제"))) &&
                    user &&
                    chatData && (
                      <div className="mt-4">
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
                      </div>
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

              {/* 구매자 액션 버튼들 - 채팅창 중앙에 표시 */}
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
                            onClick={() => {
                              // 안전결제 거래이고 결제 완료 상태일 때만 배송지 정보 입력 허용
                              if (
                                chatData.tradeType?.includes("안전결제") &&
                                chatData.item.status === "escrow_completed"
                              ) {
                                setShowShippingAddressModal(true);
                              } else {
                                toast.error(
                                  "안전결제가 완료된 후에만 배송지 정보를 입력할 수 있습니다."
                                );
                              }
                            }}
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
                              거래 취소하기
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

                      // 거래 유형 표시 (간단하게)
                      if (currentTradeType === "안전결제") {
                        // 안전결제만 표시 (택배는 당연하니까)
                        tradeTypes.push(
                          <span
                            key="escrow"
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
                          >
                            안전결제
                          </span>
                        );
                      } else if (currentTradeType.includes("직거래")) {
                        tradeTypes.push(
                          <span
                            key="direct"
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                          >
                            직거래
                          </span>
                        );
                      } else if (currentTradeType.includes("택배")) {
                        tradeTypes.push(
                          <span
                            key="delivery"
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            택배
                          </span>
                        );
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
                    {/* 안전결제 거래 상태 표시 */}
                    {(chatData?.tradeType?.includes("안전결제") ||
                      chatData?.item?.status === "escrow_completed") && (
                      <>
                        {/* 결제 완료 단계 */}
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                            chatData?.item?.status === "escrow_completed"
                              ? "bg-blue-50 border-blue-300 text-blue-800"
                              : chatData?.item?.status === "active"
                                ? "bg-green-50 border-green-300 text-green-800"
                                : "bg-gray-50 border-gray-200 text-gray-600"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {chatData?.item?.status === "escrow_completed"
                                ? "결제 완료"
                                : "거래 대기"}
                            </span>
                            {chatData?.item?.status === "escrow_completed" && (
                              <span className="text-blue-600">💳</span>
                            )}
                            {chatData?.item?.status === "active" && (
                              <span className="text-green-600">✅</span>
                            )}
                          </div>
                          {chatData?.item?.status === "escrow_completed" ? (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          ) : chatData?.item?.status === "active" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </>
                    )}

                    {/* 거래 대기 - 직거래/택배인 경우에만 표시 */}
                    {!chatData?.tradeType?.includes("안전결제") &&
                      chatData?.item?.status !== "escrow_completed" && (
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                            chatData?.item?.status === "active"
                              ? "bg-green-50 border-green-300 text-green-800"
                              : "bg-gray-50 border-gray-200 text-gray-600"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              거래 대기
                            </span>
                            {chatData?.item?.status === "active" && (
                              <span className="text-green-600">✅</span>
                            )}
                          </div>
                          {chatData?.item?.status === "active" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      )}

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

                    {/* 배송중 - 안전결제인 경우에만 표시 */}
                    {(chatData?.tradeType?.includes("안전결제") ||
                      chatData?.item?.status === "escrow_completed") && (
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
                                      {
                                        chatData.item.shippingInfo
                                          .trackingNumber
                                      }
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
                    )}

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
