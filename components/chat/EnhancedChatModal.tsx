"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { MessageInput } from "./MessageInput";
import { SellerProfileModal } from "../profile/SellerProfileModal";
import { SellerProfileCard } from "../profile/SellerProfileCard";
import { UserProfile } from "../../data/profile/types";
import ProductDetailModal from "../product/ProductDetailModal";
import { getUserProfile } from "../../lib/profile/api";
import { getItem } from "../../lib/api/products";
import ShippingAddressSelectionModal from "./ShippingAddressSelectionModal";
import { ShippingAddress } from "../../lib/schemas";
import {
  getOrCreateChat,
  getChatMessages,
  subscribeToMessages,
  deleteChat,
  reportUser,
  blockUser,
  sendMessage,
} from "../../lib/chat/api";
import { Chat, Message } from "../../data/chat/types";
import { getFirebaseDb as getDb } from "../../lib/api/firebase-ultra-safe";
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  ArrowLeft,
  X,
  MapPin,
  Loader2,
  AlertCircle,
  MessageCircle,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  ChevronDown,
  ChevronRight,
  User,
  Plus,
  Star,
  Image as ImageIcon,
  Camera,
  RotateCcw,
  UserX,
  LogOut,
  MessageSquare,
  PlayCircle,
  Edit,
  Package,
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
  // 디버깅: onClose 함수 확인
  console.log("EnhancedChatModal 렌더링:", {
    isOpen,
    onClose: typeof onClose,
    chatId,
  });

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
  const [messagesLoaded, setMessagesLoaded] = useState(false);
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  // const [showShippingModal, setShowShippingModal] = useState(false);
  const [isRegisteringShipping, setIsRegisteringShipping] = useState(false);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showShippingTrackingModal, setShowShippingTrackingModal] =
    useState(false);
  const [showShippingEditModal, setShowShippingEditModal] = useState(false);
  const [showBuyerShippingInfoModal, setShowBuyerShippingInfoModal] =
    useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [systemMessagesInitialized, setSystemMessagesInitialized] =
    useState(false);
  const [showShippingAddressModal, setShowShippingAddressModal] =
    useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isShippingInfoExpanded, setIsShippingInfoExpanded] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showTradeStatusDropdown, setShowTradeStatusDropdown] = useState(false);
  const [showStepDropdown, setShowStepDropdown] = useState(false);
  const [currentStepDropdown, setCurrentStepDropdown] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedShippingAddresses, setExpandedShippingAddresses] = useState<
    Set<string>
  >(new Set());

  // 화면 크기 변경 감지하여 사이드바 자동 조절
  useEffect(() => {
    const handleResize = () => {
      // 모바일에서 데스크톱으로 전환 시에만 사이드바 자동 표시
      if (window.innerWidth >= 768 && !showSidebar) {
        setShowSidebar(true);
      }
      // 데스크톱에서 모바일로 전환 시 사이드바 숨김
      if (window.innerWidth < 768 && showSidebar) {
        setShowSidebar(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showSidebar]);

  // 메시지 변경 시 자동 스크롤
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 채팅창이 열릴 때 자동 스크롤 (더 강력하게)
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      // 여러 번 시도하여 확실히 스크롤
      const scrollToBottom = () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      };

      // 즉시 스크롤
      scrollToBottom();

      // 지연 후 다시 스크롤 (DOM 렌더링 완료 후)
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 150);
    }
  }, [isOpen, messages.length]);

  // 메시지 로드 완료 후 자동 스크롤
  useEffect(() => {
    if (!messagesLoading && messages.length > 0 && isOpen) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    }
  }, [messagesLoading, messages.length, isOpen]);

  // 상태 변경 시 시스템 메시지로 알림 추가
  const addStatusSystemMessage = async (
    type: "escrow_completed" | "reserved" | "shipping" | "sold"
  ) => {
    console.log(`🔔 addStatusSystemMessage 호출됨: ${type}`);
    console.log(`현재 거래 유형: ${chatData?.tradeType}`);

    // 거래 유형에 따른 메시지 분기
    const getSystemMessage = (
      type: string,
      tradeType?: string,
      isSeller?: boolean
    ) => {
      const isEscrow = tradeType?.includes("안전결제");

      switch (type) {
        case "escrow_completed":
          // 안전결제인 경우에만 결제 완료 메시지 표시
          if (isEscrow) {
            return "🎉 구매자가 안전결제를 완료했습니다!\n거래를 진행해주세요.";
          } else {
            // 직거래/택배인 경우 결제 완료 단계가 없으므로 메시지 없음
            return "";
          }
        case "reserved":
          // 거래 시작 메시지 (판매자/구매자 구분)
          if (isEscrow) {
            // 안전거래
            if (isSeller) {
              return "🚀 거래가 시작되었습니다!\n\n📦 구매자의 배송지 정보 확인 후 상품 발송을 준비해주세요.";
            } else {
              return "🚀 거래가 시작되었습니다!\n\n📍 배송지 정보를 입력하고 판매자의 발송을 기다려주세요.";
            }
          } else if (
            tradeType?.includes("택배") &&
            !tradeType?.includes("안전결제")
          ) {
            // 일반 택배거래
            if (isSeller) {
              return "🚀 택배거래가 시작되었습니다!\n\n📦 상품 발송 준비를 해주세요.";
            } else {
              return "🚀 택배거래가 시작되었습니다!\n\n📍 배송지 정보를 판매자에게 알려주세요.";
            }
          } else {
            // 직거래
            if (isSeller) {
              return "🚀 직거래가 시작되었습니다!\n\n📍 구매자와 만날 장소와 시간을 조율해주세요.";
            } else {
              return "🚀 직거래가 시작되었습니다!\n\n📍 판매자와 만날 장소와 시간을 조율해주세요.";
            }
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

    // 판매자인지 구매자인지 확인
    const currentUserIsSeller = user?.uid === chatData?.item?.sellerUid;

    const message = getSystemMessage(
      type,
      chatData?.tradeType,
      currentUserIsSeller
    );
    console.log(`📝 생성된 메시지: "${message}"`);

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
      console.log(`📝 현재 메시지 개수: ${messages.length}`);
      console.log(`📝 검색할 메시지: "${message}"`);

      const isDuplicate = messages.some(
        msg => msg.senderUid === "system" && msg.content === message
      );

      if (isDuplicate) {
        console.log(`⏭️ 중복 시스템 메시지 감지: ${type}, 전송하지 않음`);
        console.log(
          `📝 기존 시스템 메시지들:`,
          messages
            .filter(msg => msg.senderUid === "system")
            .map(msg => msg.content)
        );
        return;
      } else {
        console.log(`✅ 중복되지 않음, 시스템 메시지 전송 진행`);
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
          const db = getDb();

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

    // 배송지 정보 파싱
    const addressInfo: { [key: string]: string } = {};
    addressLines.forEach(line => {
      if (line.includes(":")) {
        const [key, value] = line.split(":", 2);
        addressInfo[key.trim()] = value.trim();
      }
    });

    return (
      <div>
        <p className="text-sm mb-2">{firstLine}</p>
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
          className={`flex items-center gap-1 text-xs mb-2 ${
            isOwn
              ? "text-white hover:text-gray-200"
              : "text-blue-500 hover:text-blue-600"
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          배송지 정보 보기
        </button>
        {isExpanded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-3">
              {addressInfo["수령인"] && (
                <div className="flex items-start">
                  <div className="w-16 text-gray-600 text-sm font-medium flex-shrink-0">
                    수령인
                  </div>
                  <div className="text-gray-900 text-sm">
                    {addressInfo["수령인"]}
                  </div>
                </div>
              )}
              {addressInfo["연락처"] && (
                <div className="flex items-start">
                  <div className="w-16 text-gray-600 text-sm font-medium flex-shrink-0">
                    연락처
                  </div>
                  <div className="text-gray-900 text-sm">
                    {addressInfo["연락처"]}
                  </div>
                </div>
              )}
              {addressInfo["주소"] && (
                <div className="flex items-start">
                  <div className="w-16 text-gray-600 text-sm font-medium flex-shrink-0">
                    주소
                  </div>
                  <div className="text-gray-900 text-sm leading-relaxed">
                    {addressInfo["주소"]}
                  </div>
                </div>
              )}
              {addressInfo["배송 메모"] && (
                <div className="flex items-start">
                  <div className="w-16 text-gray-600 text-sm font-medium flex-shrink-0">
                    메모
                  </div>
                  <div className="text-gray-900 text-sm">
                    {addressInfo["배송 메모"]}
                  </div>
                </div>
              )}
            </div>
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

  // 이미지 업로드 처리 함수
  const handleImageUpload = async (files: FileList) => {
    if (!chatData?.chatId || !user?.uid) return;

    try {
      // FileList를 File 배열로 변환
      const fileArray = Array.from(files);

      // 이미지 업로드
      const { uploadImages } = await import("../../lib/api/storage");
      const uploadResult = await uploadImages(fileArray);

      if (uploadResult.success && uploadResult.urls) {
        // 각 이미지를 메시지로 전송
        for (const imageUrl of uploadResult.urls) {
          await sendMessage({
            chatId: chatData.chatId,
            senderUid: user.uid,
            content: "",
            imageUrl: imageUrl,
          });
        }
        toast.success("이미지가 전송되었습니다.");
      } else {
        toast.error("이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      toast.error("이미지 업로드 중 오류가 발생했습니다.");
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
          const addressMessage = `구매자 배송지 정보\n\n수령인: ${selectedAddress.recipientName}\n연락처: ${selectedAddress.phoneNumber}\n주소: ${selectedAddress.address}${selectedAddress.deliveryMemo ? `\n배송 메모: ${selectedAddress.deliveryMemo}` : ""}`;

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

  // 택배사별 배송 추적 URL 생성
  const getTrackingUrl = (courierCode: string, trackingNumber: string) => {
    const trackingUrls: { [key: string]: string } = {
      cj: `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingNumber}`,
      hanjin: `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${trackingNumber}`,
      lotte: `https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=${trackingNumber}`,
      logen: `https://www.logen.co.kr/trace?trackingNumber=${trackingNumber}`,
      kdexp: `https://www.kdexp.com/tracking?trackingNumber=${trackingNumber}`,
      epost: `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?displayHeader=N&sid1=${trackingNumber}`,
      dhl: `https://www.dhl.com/track?trackingNumber=${trackingNumber}`,
      fedex: `https://www.fedex.com/track?trackingNumber=${trackingNumber}`,
      ups: `https://www.ups.com/track?trackingNumber=${trackingNumber}`,
    };

    return (
      trackingUrls[courierCode] ||
      `https://www.google.com/search?q=${encodeURIComponent(getCourierName(courierCode) + " " + trackingNumber + " 배송추적")}`
    );
  };

  // 구매자 배송지 정보 확인 및 요청 (구매자용)
  const checkAndRequestShippingInfo = async () => {
    try {
      if (!chatData?.item?.id || !user?.uid) return;

      const { getShippingAddresses } = await import(
        "../../lib/api/shipping-address"
      );
      const addressResult = await getShippingAddresses(user.uid);

      if (
        addressResult.success &&
        addressResult.addresses &&
        addressResult.addresses.length > 0
      ) {
        // 배송지 정보가 있으면 판매자에게 표시
        await showBuyerShippingInfoToSeller();
      } else {
        // 배송지 정보가 없으면 구매자에게 입력 요청
        const { sendMessage } = await import("../../lib/chat/api");
        await sendMessage({
          chatId: chatData.chatId,
          senderUid: "system",
          content:
            "배송지 정보를 입력해주세요. 하단 '배송지 등록' 버튼을 클릭하세요.",
        });
        console.log("구매자에게 배송지 입력 요청 메시지 전송");
      }
    } catch (error) {
      console.error("배송지 정보 확인 실패:", error);
    }
  };

  // 구매자 배송지 정보를 판매자에게 표시
  const showBuyerShippingInfoToSeller = async () => {
    try {
      if (!chatData?.item?.id || !user?.uid) return;

      const { getShippingAddresses } = await import(
        "../../lib/api/shipping-address"
      );
      const addressResult = await getShippingAddresses(user.uid);

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
          const addressMessage = `구매자 배송지 정보\n\n수령인: ${selectedAddress.recipientName}\n연락처: ${selectedAddress.phoneNumber}\n주소: ${selectedAddress.address}${selectedAddress.deliveryMemo ? `\n배송 메모: ${selectedAddress.deliveryMemo}` : ""}`;

          const { sendMessage } = await import("../../lib/chat/api");
          await sendMessage({
            chatId: chatData.chatId,
            senderUid: "system",
            content: addressMessage,
          });

          console.log("구매자 배송지 정보를 판매자에게 표시 완료");
        }
      }
    } catch (error) {
      console.error("배송지 정보 표시 실패:", error);
    }
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
        console.log("🔍 저장된 상대방 정보:", storedOtherUser);
        console.log("🔍 otherUid:", otherUid);

        if (
          !storedOtherUser?.nickname ||
          (!storedOtherUser?.profileImage && !storedOtherUser?.photoURL)
        ) {
          console.log("🔍 상대방 프로필을 Firestore에서 가져오기:", otherUid);
          const otherUserResult = await getUserProfile(otherUid);
          console.log("🔍 상대방 프로필 로드 결과:", otherUserResult);
          otherUser =
            otherUserResult.success && otherUserResult.data
              ? otherUserResult.data
              : null;
          if (otherUser) {
            console.log("✅ 상대방 프로필 설정 완료:", otherUser);
            setOtherUserProfile(otherUser);
          } else {
            console.log("❌ 상대방 프로필 로드 실패");
          }
        } else {
          console.log("🔍 저장된 상대방 정보 사용:", storedOtherUser);
          // photoURL을 profileImage로 매핑
          const mappedUser = {
            ...storedOtherUser,
            profileImage:
              storedOtherUser.profileImage || storedOtherUser.photoURL,
          };
          console.log("✅ 매핑된 상대방 정보 설정:", mappedUser);
          setOtherUserProfile(mappedUser as UserProfile);
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
            profileImage:
              (otherUser as any)?.profileImage || (otherUser as any)?.photoURL,
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
          tradeType:
            chatData.tradeType ||
            tradeType ||
            (() => {
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
          sellerUid,
          undefined,
          tradeType || undefined
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
            profileImage:
              (otherUserResult.data as any)?.profileImage ||
              (otherUserResult.data as any)?.photoURL,
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
          tradeType:
            chatData.tradeType ||
            tradeType ||
            (() => {
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
    } else if (!isOpen) {
      // 채팅이 닫힐 때 상태 초기화
      setMessagesLoaded(false);
      setMessages([]);
    }
  }, [isOpen, user, itemId, sellerUid, chatId]);

  // 자동 시스템 메시지 전송 (autoSendSystemMessage가 있으면 이것만 실행)
  useEffect(() => {
    if (
      isOpen &&
      autoSendSystemMessage &&
      chatData?.chatId &&
      !systemMessagesInitialized // 초기화가 완료되지 않은 경우에만
    ) {
      console.log("🔔 자동 시스템 메시지 전송:", autoSendSystemMessage);

      // 시스템 메시지 즉시 전송 (구매자 채팅보다 먼저)
      addStatusSystemMessage(
        autoSendSystemMessage as
          | "escrow_completed"
          | "reserved"
          | "shipping"
          | "sold"
      );
      // 자동 메시지 전송 후 초기화 플래그 설정
      setSystemMessagesInitialized(true);
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

  // 초기 메시지 로드 (한 번만)
  useEffect(() => {
    if (chatData?.chatId && !messagesLoaded) {
      console.log("초기 메시지 로드:", chatData.chatId);
      loadMessages(chatData.chatId);
      setMessagesLoaded(true);
    }
  }, [chatData?.chatId, messagesLoaded]);

  // 실시간 메시지 구독 (항상 실행)
  useEffect(() => {
    if (chatData?.chatId) {
      console.log("실시간 메시지 구독 시작:", chatData.chatId);

      const unsubscribe = subscribeToMessages(
        chatData.chatId,
        messages => {
          console.log("실시간 메시지 업데이트:", messages.length, "개");
          setMessages(messages);

          // 새 메시지가 올 때마다 읽음 처리
          if (messages.length > 0 && user) {
            setTimeout(async () => {
              const { markMessageAsRead } = await import("../../lib/chat/api");

              // 상대방이 보낸 메시지 중 읽지 않은 것들을 읽음 처리
              const unreadMessages = messages.filter(
                msg =>
                  msg.senderUid !== user.uid && !msg.readBy.includes(user.uid)
              );

              console.log("읽지 않은 메시지 개수:", unreadMessages.length);

              // 읽지 않은 메시지들을 읽음 처리
              for (const message of unreadMessages) {
                console.log("메시지 읽음 처리:", message.id);
                await markMessageAsRead(message.id, user.uid);
              }

              // 채팅 리스트 업데이트를 위한 이벤트 발생
              window.dispatchEvent(
                new CustomEvent("chatReadStatusUpdated", {
                  detail: { chatId: chatData.chatId, userId: user.uid },
                })
              );
            }, 50);
          }
        },
        error => {
          console.error("실시간 메시지 구독 오류:", error);
        }
      );

      // 상품 상태 실시간 구독
      let itemUnsubscribe: (() => void) | null = null;
      if (chatData?.item?.id) {
        const db = getDb();
        if (db) {
          const itemRef = doc(db, "items", chatData.item.id);
          itemUnsubscribe = onSnapshot(
            itemRef,
            doc => {
              if (doc.exists()) {
                const itemData = doc.data();
                console.log("상품 상태 실시간 업데이트:", itemData.status);

                // chatData의 item 상태만 업데이트 (cancelRequest 포함)
                setChatData(prev => {
                  if (prev && prev.item) {
                    return {
                      ...prev,
                      item: {
                        ...prev.item,
                        status: itemData.status,
                        shippingInfo: itemData.shippingInfo,
                        cancelRequest: itemData.cancelRequest, // 취소 요청 상태 실시간 동기화
                        buyerShippingInfo: itemData.buyerShippingInfo, // 배송지 정보도 동기화
                        updatedAt: itemData.updatedAt,
                      },
                    };
                  }
                  return prev;
                });
              }
            },
            error => {
              console.error("상품 상태 실시간 구독 오류:", error);
            }
          );
        }
      }

      return () => {
        console.log("메시지 구독 해제");
        unsubscribe();
        if (itemUnsubscribe) {
          console.log("상품 상태 구독 해제");
          itemUnsubscribe();
        }
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

        // 채팅 전체를 읽음 처리
        if (user?.uid) {
          const { markChatAsRead } = await import("../../lib/chat/api");
          await markChatAsRead(chatId, user.uid);
        }
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
      // Cloud Function 호출로 안전하게 거래 시작
      // 클라이언트 사이드에서 직접 업데이트
      const { doc, updateDoc } = await import("firebase/firestore");
      const { getDb } = await import("@/lib/api/firebase-lazy");

      const db = getDb();
      const itemRef = doc(db, "items", chatData.item.id);

      await updateDoc(itemRef, {
        status: "reserved",
        buyerUid: chatData.otherUser.uid,
        buyerId: chatData.otherUser.uid,
        updatedAt: new Date(),
      });

      const result = { data: { success: true } };

      console.log("✅ 거래 시작 완료:", result.data);
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

      // 배송지 정보 처리 (택배 거래인 경우)
      if (
        chatData.tradeType?.includes("택배") ||
        chatData.tradeType?.includes("안전결제")
      ) {
        // 구매자의 배송지 정보를 확인하고 조건부로 처리
        await checkAndRequestShippingInfo();
      }

      // 안전결제인 경우에도 배송지 정보 조건부 처리 (중복 방지)
      // 이미 위에서 checkAndRequestShippingInfo()로 처리됨
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
        // 클라이언트 사이드에서 직접 업데이트
        const { doc, updateDoc } = await import("firebase/firestore");
        const { getDb } = await import("@/lib/api/firebase-lazy");

        const db = getDb();
        const itemRef = doc(db, "items", chatData.item.id);

        await updateDoc(itemRef, {
          status: "active",
          buyerUid: null,
          buyerId: null,
          cancelledAt: new Date(),
          cancelledBy: user.uid,
          updatedAt: new Date(),
        });

        console.log("✅ 거래 취소 완료");

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
      // 클라이언트 사이드에서 직접 Firestore 업데이트
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { getDb } = await import("@/lib/api/firebase-lazy");

      const db = getDb();

      const itemRef = doc(db, "items", chatData.item.id);

      // 취소 요청 상태로 업데이트 (즉시 취소하지 않음)
      await updateDoc(itemRef, {
        cancelRequest: {
          requestedBy: user.uid,
          requestedAt: serverTimestamp(),
          reason: cancelReason || "구매자 요청",
          status: "pending",
        },
        updatedAt: serverTimestamp(),
      });

      toast.success("취소 요청이 판매자에게 전달되었습니다.");
      setShowCancelModal(false);
      setCancelReason("");

      // 취소 요청 시스템 메시지 전송
      try {
        const { sendMessage } = await import("../../lib/chat/api");
        const cancelMessage = `🔄 구매자가 거래 취소를 요청했습니다.\n사유: ${cancelReason || "구매자 요청"}\n\n판매자의 승인을 기다리고 있습니다.`;

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
        console.error("취소 요청 시스템 메시지 전송 중 오류:", error);
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
        // 클라이언트 사이드에서 직접 Firestore 업데이트
        const { doc, updateDoc, serverTimestamp, deleteField } = await import(
          "firebase/firestore"
        );
        const { getFirebaseDb } = await import(
          "../../lib/api/firebase-ultra-safe"
        );

        const db = getFirebaseDb();
        if (!db) {
          toast.error("데이터베이스 연결에 실패했습니다.");
          return;
        }

        const itemRef = doc(db, "items", chatData.item.id);

        await updateDoc(itemRef, {
          status: "active", // 취소 시 다시 판매중으로
          buyerUid: deleteField(), // 구매자 정보 제거
          buyerId: deleteField(),
          cancelRequest: {
            ...chatData.item.cancelRequest,
            status: "approved",
            processedBy: user.uid,
            processedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });

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

        // 채팅 모달 닫기
        onClose();
      } catch (error) {
        console.error("취소 승인 실패:", error);
        toast.error("취소 승인 중 오류가 발생했습니다.");
      } finally {
        setIsApprovingCancel(false);
      }
    }
  };

  // 취소 요청 거절 함수
  const handleRejectCancel = async () => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    if (
      confirm("정말로 취소 요청을 거절하시겠습니까?\n거래가 계속 진행됩니다.")
    ) {
      setIsApprovingCancel(true);

      try {
        // 클라이언트 사이드에서 직접 Firestore 업데이트
        const { doc, updateDoc, serverTimestamp, deleteField } = await import(
          "firebase/firestore"
        );
        const { getFirebaseDb } = await import(
          "../../lib/api/firebase-ultra-safe"
        );

        const db = getFirebaseDb();
        if (!db) {
          toast.error("데이터베이스 연결에 실패했습니다.");
          return;
        }

        const itemRef = doc(db, "items", chatData.item.id);

        // 취소 거절 시 cancelRequest 필드를 완전히 삭제하여 UI가 정상 상태로 복구되도록 함
        await updateDoc(itemRef, {
          cancelRequest: deleteField(), // 취소 요청 기록 삭제
          updatedAt: serverTimestamp(),
        });

        toast.success("취소 요청이 거절되었습니다.");

        // 취소 거절 시스템 메시지 전송
        try {
          const { sendMessage } = await import("../../lib/chat/api");
          const cancelMessage =
            "❌ 판매자가 취소 요청을 거절했습니다. 거래가 계속 진행됩니다.";

          const result = await sendMessage({
            chatId: chatData.chatId,
            senderUid: "system",
            content: cancelMessage,
          });

          if (result.success) {
            console.log("취소 거절 시스템 메시지 전송 완료");
          } else {
            console.error("취소 거절 시스템 메시지 전송 실패:", result.error);
          }
        } catch (error) {
          console.error("취소 거절 시스템 메시지 전송 실패:", error);
        }
      } catch (error) {
        console.error("취소 거절 실패:", error);
        toast.error("취소 거절 중 오류가 발생했습니다.");
      } finally {
        setIsApprovingCancel(false);
      }
    }
  };

  // 송장번호 복사
  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success("송장번호가 복사되었습니다!");
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

      // 직접 Firestore 업데이트
      const db = getDb();
      const itemRef = doc(db, "items", chatData.item.id);

      // 기존 발송 정보가 있는지 확인 (송장 수정인지 새 발송인지 구분)
      const isShippingUpdate =
        chatData.item.shippingInfo &&
        (chatData.item.shippingInfo.courier !== shippingInfo.courier ||
          chatData.item.shippingInfo.trackingNumber !==
            shippingInfo.trackingNumber);

      // 상품 상태를 shipping으로 업데이트 (addStatusSystemMessage와 일치)
      await updateDoc(itemRef, {
        status: "shipping",
        shippingInfo: {
          courier: shippingInfo.courier,
          trackingNumber: shippingInfo.trackingNumber,
          shippedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // 상태 변경 시스템 메시지 전송
      if (!isShippingUpdate) {
        await addStatusSystemMessage("shipping");
      } else {
        // 송장 수정인 경우 시스템 메시지 제거 (불필요한 알림 방지)
        console.log(
          "송장 정보가 수정되었습니다. 시스템 메시지는 전송하지 않습니다."
        );
      }

      toast.success(
        isShippingUpdate
          ? "송장 정보가 수정되었습니다!"
          : "발송 정보가 등록되었습니다! 상품 상태가 '배송중'으로 변경됩니다."
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

      // 실시간 업데이트로 자동 반영되므로 loadChatData() 제거
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

    setIsCompletingPurchase(true);

    try {
      // 클라이언트 사이드에서 직접 Firestore 업데이트
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { getDb } = await import("@/lib/api/firebase-lazy");

      const db = getDb();
      const itemRef = doc(db, "items", chatData.item.id);

      await updateDoc(itemRef, {
        status: "sold",
        soldAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("구매가 완료되었습니다! 판매자에게 입금이 처리됩니다.");

      // 거래 완료 포인트 지급 (구매자 & 판매자 모두)
      try {
        const { grantTradeCompletePoints } = await import("@/lib/api/points");

        // 구매자 포인트 지급
        await grantTradeCompletePoints(user.uid, chatData.item.id);

        // 판매자 포인트 지급
        if (chatData.sellerUid) {
          await grantTradeCompletePoints(chatData.sellerUid, chatData.item.id);
        }

        toast.success("🎉 거래 완료 포인트 100P가 지급되었습니다!", {
          duration: 3000,
        });
      } catch (error) {
        console.error("포인트 지급 실패:", error);
        // 포인트 지급 실패해도 거래는 완료
      }

      // 전역 이벤트 발생으로 상품 목록 업데이트
      window.dispatchEvent(
        new CustomEvent("itemStatusChanged", {
          detail: { itemId: chatData.item.id, status: "sold" },
        })
      );

      // 거래 완료 알림 추가
      await addStatusSystemMessage("sold");
    } catch (error) {
      console.error("구매 완료 실패:", error);
      toast.error("구매 완료 중 오류가 발생했습니다.");
    } finally {
      setIsCompletingPurchase(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      // 클라이언트 사이드에서 직접 Firestore 업데이트
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { getDb } = await import("@/lib/api/firebase-lazy");

      const db = getDb();
      const itemRef = doc(db, "items", chatData.item.id);

      await updateDoc(itemRef, {
        returnRequest: {
          requestedBy: user.uid,
          requestedAt: serverTimestamp(),
          reason: "구매자 요청",
          status: "pending",
        },
        updatedAt: serverTimestamp(),
      });

      toast.success("반품 요청이 판매자에게 전달되었습니다.");

      // 반품 요청 시스템 메시지 전송
      try {
        const { sendMessage } = await import("../../lib/chat/api");
        const returnMessage = `🔄 구매자가 반품을 요청했습니다.\n사유: 구매자 요청\n\n판매자와 협의 후 진행됩니다.`;

        const result = await sendMessage({
          chatId: chatData.chatId,
          senderUid: "system",
          content: returnMessage,
        });

        if (result.success) {
          console.log("반품 요청 시스템 메시지 전송 완료");
        } else {
          console.error("반품 요청 시스템 메시지 전송 실패:", result.error);
        }
      } catch (error) {
        console.error("반품 요청 시스템 메시지 전송 실패:", error);
      }
    } catch (error) {
      console.error("반품 요청 실패:", error);
      toast.error("반품 요청 중 오류가 발생했습니다.");
    }
  };

  const handleApproveReturn = async () => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      // 클라이언트 사이드에서 직접 Firestore 업데이트
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { getDb } = await import("@/lib/api/firebase-lazy");

      const db = getDb();
      const itemRef = doc(db, "items", chatData.item.id);

      await updateDoc(itemRef, {
        returnRequest: {
          ...chatData.item.returnRequest,
          status: "approved",
          approvedBy: user.uid,
          approvedAt: serverTimestamp(),
        },
        status: "returned",
        updatedAt: serverTimestamp(),
      });

      toast.success("반품이 승인되었습니다.");

      // 반품 승인 시스템 메시지 전송
      try {
        const { sendMessage } = await import("../../lib/chat/api");
        const returnMessage = `✅ 판매자가 반품을 승인했습니다.\n\n반품 절차를 진행해주세요.`;

        const result = await sendMessage({
          chatId: chatData.chatId,
          senderUid: "system",
          content: returnMessage,
        });

        if (result.success) {
          console.log("반품 승인 시스템 메시지 전송 완료");
        } else {
          console.error("반품 승인 시스템 메시지 전송 실패:", result.error);
        }
      } catch (error) {
        console.error("반품 승인 시스템 메시지 전송 실패:", error);
      }
    } catch (error) {
      console.error("반품 승인 실패:", error);
      toast.error("반품 승인 중 오류가 발생했습니다.");
    }
  };

  const handleRejectReturn = async () => {
    if (!chatData?.item?.id || !user?.uid) {
      toast.error("거래 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      // 클라이언트 사이드에서 직접 Firestore 업데이트
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { getDb } = await import("@/lib/api/firebase-lazy");

      const db = getDb();
      const itemRef = doc(db, "items", chatData.item.id);

      await updateDoc(itemRef, {
        returnRequest: {
          ...chatData.item.returnRequest,
          status: "rejected",
          rejectedBy: user.uid,
          rejectedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      toast.success("반품이 거절되었습니다.");

      // 반품 거절 시스템 메시지 전송
      try {
        const { sendMessage } = await import("../../lib/chat/api");
        const returnMessage = `❌ 판매자가 반품을 거절했습니다.\n\n추가 문의사항이 있으시면 채팅으로 연락해주세요.`;

        const result = await sendMessage({
          chatId: chatData.chatId,
          senderUid: "system",
          content: returnMessage,
        });

        if (result.success) {
          console.log("반품 거절 시스템 메시지 전송 완료");
        } else {
          console.error("반품 거절 시스템 메시지 전송 실패:", result.error);
        }
      } catch (error) {
        console.error("반품 거절 시스템 메시지 전송 실패:", error);
      }
    } catch (error) {
      console.error("반품 거절 실패:", error);
      toast.error("반품 거절 중 오류가 발생했습니다.");
    }
  };

  const handleSubmitReview = async () => {
    if (!chatData?.item?.id || !user?.uid || reviewRating === 0) {
      toast.error("별점을 선택해주세요.");
      return;
    }

    try {
      // 클라이언트 사이드에서 직접 Firestore 업데이트
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { getDb } = await import("@/lib/api/firebase-lazy");

      const db = getDb();
      const itemRef = doc(db, "items", chatData.item.id);

      // 아이템에 후기 저장
      await updateDoc(itemRef, {
        review: {
          rating: reviewRating,
          comment: reviewComment,
          reviewerUid: user.uid,
          reviewedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // 상대방 프로필에 후기 저장 및 평점 업데이트
      const otherUserUid =
        user.uid === chatData.sellerUid
          ? chatData.buyerUid
          : chatData.sellerUid;

      console.log("=== 후기 저장 시작 ===");
      console.log("현재 사용자:", user.uid);
      console.log("판매자:", chatData.sellerUid);
      console.log("구매자:", chatData.buyerUid);
      console.log("후기 받을 사람:", otherUserUid);
      console.log("후기 내용:", {
        rating: reviewRating,
        comment: reviewComment,
      });

      if (otherUserUid) {
        const { collection, addDoc } = await import("firebase/firestore");
        const reviewsRef = collection(db, "userReviews");

        const reviewData = {
          reviewedUserUid: otherUserUid,
          reviewerUid: user.uid,
          rating: reviewRating,
          comment: reviewComment,
          itemId: chatData.item.id,
          createdAt: serverTimestamp(),
        };

        console.log("Firestore에 저장할 후기 데이터:", reviewData);

        const docRef = await addDoc(reviewsRef, reviewData);

        console.log("후기 저장 완료! 문서 ID:", docRef.id);

        // 상대방 프로필의 평점 업데이트
        const { getDocs, query, where } = await import("firebase/firestore");
        const userReviewsQuery = query(
          collection(db, "userReviews"),
          where("reviewedUserUid", "==", otherUserUid)
        );
        const reviewsSnapshot = await getDocs(userReviewsQuery);

        console.log(
          "해당 사용자의 전체 후기 개수:",
          reviewsSnapshot.docs.length
        );

        if (!reviewsSnapshot.empty) {
          const reviews = reviewsSnapshot.docs.map(doc => doc.data());
          const totalRating = reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          const averageRating = totalRating / reviews.length;

          console.log("평균 평점 계산:", {
            totalRating,
            reviewCount: reviews.length,
            averageRating,
          });

          const userProfileRef = doc(db, "users", otherUserUid);
          await updateDoc(userProfileRef, {
            averageRating: averageRating,
            reviewCount: reviews.length,
            updatedAt: serverTimestamp(),
          });

          console.log("프로필 평점 업데이트 완료!");
        }
      }

      toast.success("거래 후기가 작성되었습니다.");

      // 후기 작성 포인트 지급
      try {
        const { grantReviewPoints } = await import("@/lib/api/points");
        await grantReviewPoints(user.uid, chatData.item.id);
        toast.success("🎉 후기 작성 포인트 50P가 지급되었습니다!", {
          duration: 3000,
        });
      } catch (error) {
        console.error("포인트 지급 실패:", error);
        // 포인트 지급 실패해도 후기는 작성됨
      }

      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment("");

      // 프로필 업데이트를 위한 알림 (시스템 메시지 없이)
      console.log("거래 후기 작성 완료 - 프로필 업데이트 필요");
    } catch (error) {
      console.error("후기 작성 실패:", error);
      toast.error("후기 작성 중 오류가 발생했습니다.");
    }
  };

  const handleBlockUser = async () => {
    if (!chatData?.otherUser?.uid || !user?.uid) {
      toast.error("차단할 사용자 정보를 찾을 수 없습니다.");
      return;
    }

    setIsBlocking(true);

    try {
      const result = await blockUser(user.uid, chatData.otherUser.uid);

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
  });

  if (!isOpen) {
    console.log("EnhancedChatModal: isOpen이 false이므로 null 반환", {
      isOpen,
    });
    return null;
  }

  console.log("EnhancedChatModal: 모달 렌더링 시작", { isOpen, chatId });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 md:p-4">
      <div className="bg-white md:rounded-lg w-full md:max-w-6xl h-full md:h-[90vh] flex">
        {/* 채팅 영역 */}
        <div
          className={`flex-1 flex flex-col ${showSidebar ? "mr-4" : "mr-0"} relative`}
        >
          {/* 헤더 - 모바일에서 고정 */}
          <div className="flex items-center justify-between p-2 border-b bg-gray-50 md:relative sticky top-0 z-50">
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("뒤로가기 버튼 클릭됨");
                  console.log("onClose 함수 타입:", typeof onClose);
                  if (typeof onClose === "function") {
                    console.log("onClose 함수 호출 중...");
                    onClose();
                  } else {
                    console.error("onClose가 함수가 아닙니다:", onClose);
                  }
                }}
                className="p-1 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {chatData && (
                <button
                  className="flex items-center space-x-1 hover:opacity-80 transition-opacity cursor-pointer flex-1 min-w-0"
                  onClick={() => {
                    // 상품 상세 모달 열기
                    setShowProductModal(true);
                  }}
                >
                  {/* 상품 썸네일 - 1.5배 크기 확대 */}
                  <div className="w-16 h-16 md:w-12 md:h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {chatData.item.imageUrl ? (
                      <img
                        src={chatData.item.imageUrl}
                        alt={chatData.item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MessageCircle className="w-7 h-7 md:w-6 md:h-6 text-gray-500" />
                    )}
                  </div>
                  {/* 상품명과 가격 */}
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base md:text-sm leading-tight">
                      {chatData.item.title.length >
                      (window.innerWidth < 768 ? 25 : 35)
                        ? `${chatData.item.title.substring(0, window.innerWidth < 768 ? 25 : 35)}...`
                        : chatData.item.title}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1">
                      {/* 가격과 거래 유형 */}
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">
                          {formatPrice(chatData.item.price)}
                        </p>
                        {/* 거래 유형 배지 - 가격 오른쪽으로 이동 */}
                        {chatData.tradeType && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                            {chatData.tradeType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-1"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {/* 드롭다운 메뉴 */}
                <AnimatePresence>
                  {showSettingsMenu && (
                    <>
                      {/* 배경 클릭 영역 */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowSettingsMenu(false)}
                      />

                      {/* 드롭다운 */}
                      <motion.div
                        className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-48 z-40"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* 상대방 정보 보기/숨기기 (웹에서만) */}
                        <button
                          onClick={() => {
                            setShowSidebar(!showSidebar);
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left hidden md:flex"
                        >
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-700">
                            {showSidebar
                              ? "상대방 정보 숨기기"
                              : "상대방 정보 보기"}
                          </span>
                        </button>

                        {/* 신고하기 */}
                        <button
                          onClick={() => {
                            setShowReportModal(true);
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-700">
                            신고하기
                          </span>
                        </button>

                        {/* 차단하기 */}
                        <button
                          onClick={() => {
                            setShowBlockModal(true);
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <UserX className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-700">
                            차단하기
                          </span>
                        </button>

                        {/* 구분선 */}
                        <div className="h-px bg-gray-200 my-1" />

                        {/* 채팅방 나가기 */}
                        <button
                          onClick={() => {
                            if (confirm("채팅방을 나가시겠습니까?")) {
                              onClose();
                            }
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            채팅방 나가기
                          </span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              {/* 채팅창 닫기 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("채팅창 닫기 버튼 클릭됨");
                  console.log("onClose 함수 타입:", typeof onClose);
                  if (typeof onClose === "function") {
                    console.log("onClose 함수 호출 중...");
                    onClose();
                  } else {
                    console.error("onClose가 함수가 아닙니다:", onClose);
                  }
                }}
                className="p-1"
                title="채팅창 닫기"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 진행 상태 바 (모바일 전용, 안전결제만) - 헤더 바로 아래 고정 */}
          {chatData?.tradeType === "안전결제" && (
            <div className="bg-white px-4 py-4 border-b md:hidden sticky top-[64px] z-40 shadow-lg">
              <div className="flex items-center justify-between relative">
                {(() => {
                  const status = chatData?.item?.status;

                  // 기본 단계들
                  const baseSteps = [
                    { key: "escrow_completed", label: "결제완료", icon: "💳" },
                    { key: "reserved", label: "거래중", icon: "🤝" },
                    { key: "shipping", label: "배송중", icon: "🚚" },
                    { key: "sold", label: "거래완료", icon: "✅" },
                  ];

                  // 취소된 거래일 때만 "거래취소" 단계 추가
                  const tradeSteps =
                    status === "cancelled"
                      ? [
                          ...baseSteps,
                          { key: "cancelled", label: "거래취소", icon: "❌" },
                        ]
                      : baseSteps;

                  const currentStepIndex = tradeSteps.findIndex(
                    step => step.key === status
                  );

                  return (
                    <>
                      {tradeSteps.map((step, index) => (
                        <div
                          key={step.key}
                          className="flex flex-col items-center flex-1 relative z-10"
                        >
                          <div className="relative">
                            <motion.div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
                                step.key === "cancelled"
                                  ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg"
                                  : index <= currentStepIndex
                                    ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg"
                                    : "bg-gray-200 text-gray-400"
                              } ${
                                index === currentStepIndex
                                  ? step.key === "cancelled"
                                    ? "ring-4 ring-red-300 ring-opacity-50"
                                    : "ring-4 ring-blue-300 ring-opacity-50"
                                  : ""
                              }`}
                              initial={{ scale: 0.8 }}
                              animate={{
                                scale: index === currentStepIndex ? 1.1 : 1,
                                boxShadow:
                                  index === currentStepIndex
                                    ? step.key === "cancelled"
                                      ? [
                                          "0 0 20px rgba(239, 68, 68, 0.5)",
                                          "0 0 30px rgba(220, 38, 38, 0.6)",
                                          "0 0 20px rgba(239, 68, 68, 0.5)",
                                        ]
                                      : [
                                          "0 0 20px rgba(59, 130, 246, 0.5)",
                                          "0 0 30px rgba(147, 51, 234, 0.6)",
                                          "0 0 20px rgba(59, 130, 246, 0.5)",
                                        ]
                                    : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              }}
                              transition={{
                                duration: 0.3,
                                boxShadow: {
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                },
                              }}
                            >
                              {step.icon}
                            </motion.div>
                            {/* 화살표 버튼 - 현재 단계에서만 표시 (취소된 거래 제외) */}
                            {index === currentStepIndex &&
                              step.key !== "cancelled" && (
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      const isSeller =
                                        user?.uid === chatData.sellerUid;
                                      setCurrentStepDropdown(step.key);
                                      setShowStepDropdown(!showStepDropdown);
                                    }}
                                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                                  >
                                    <ChevronDown className="w-3 h-3 text-gray-600" />
                                  </button>

                                  {/* 개별 단계 드롭다운 */}
                                  <AnimatePresence>
                                    {showStepDropdown &&
                                      currentStepDropdown === step.key && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => {
                                              setShowStepDropdown(false);
                                              setCurrentStepDropdown(null);
                                            }}
                                          />
                                          <motion.div
                                            className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-40 min-w-48"
                                            initial={{
                                              opacity: 0,
                                              y: -10,
                                              scale: 0.95,
                                            }}
                                            animate={{
                                              opacity: 1,
                                              y: 0,
                                              scale: 1,
                                            }}
                                            exit={{
                                              opacity: 0,
                                              y: -10,
                                              scale: 0.95,
                                            }}
                                            transition={{ duration: 0.15 }}
                                          >
                                            {(() => {
                                              const isSeller =
                                                user?.uid ===
                                                chatData.sellerUid;
                                              const status =
                                                chatData?.item?.status;

                                              // 판매자 액션들
                                              if (isSeller) {
                                                if (
                                                  step.key ===
                                                  "escrow_completed"
                                                ) {
                                                  return (
                                                    <>
                                                      <button
                                                        onClick={async () => {
                                                          try {
                                                            // 클라이언트 사이드에서 직접 Firestore 업데이트
                                                            const {
                                                              doc,
                                                              updateDoc,
                                                              serverTimestamp,
                                                            } = await import(
                                                              "firebase/firestore"
                                                            );
                                                            const {
                                                              getFirebaseDb,
                                                            } = await import(
                                                              "../../lib/api/firebase-ultra-safe"
                                                            );

                                                            const db =
                                                              getFirebaseDb();
                                                            if (!db) {
                                                              toast.error(
                                                                "데이터베이스 연결에 실패했습니다."
                                                              );
                                                              return;
                                                            }

                                                            const itemRef = doc(
                                                              db,
                                                              "items",
                                                              chatData.item.id
                                                            );
                                                            await updateDoc(
                                                              itemRef,
                                                              {
                                                                status:
                                                                  "reserved",
                                                                updatedAt:
                                                                  serverTimestamp(),
                                                              }
                                                            );

                                                            toast.success(
                                                              "거래가 시작되었습니다."
                                                            );
                                                            setShowStepDropdown(
                                                              false
                                                            );
                                                            setCurrentStepDropdown(
                                                              null
                                                            );
                                                          } catch (error) {
                                                            console.error(
                                                              "거래 시작 실패:",
                                                              error
                                                            );
                                                            toast.error(
                                                              "거래 시작 중 오류가 발생했습니다."
                                                            );
                                                          }
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                      >
                                                        거래 진행하기
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          setShowCancelModal(
                                                            true
                                                          );
                                                          setShowStepDropdown(
                                                            false
                                                          );
                                                          setCurrentStepDropdown(
                                                            null
                                                          );
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-red-600"
                                                      >
                                                        거래 취소하기
                                                      </button>
                                                    </>
                                                  );
                                                } else if (
                                                  step.key === "reserved" &&
                                                  !chatData.item.shippingInfo
                                                ) {
                                                  return (
                                                    <>
                                                      {/* 취소 요청이 있을 때만 승인/거절 버튼 표시 */}
                                                      {chatData.item
                                                        .cancelRequest
                                                        ?.status ===
                                                      "pending" ? (
                                                        <>
                                                          <button
                                                            onClick={() => {
                                                              handleApproveCancel();
                                                              setShowStepDropdown(
                                                                false
                                                              );
                                                              setCurrentStepDropdown(
                                                                null
                                                              );
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-green-600"
                                                          >
                                                            취소 요청 승인
                                                          </button>
                                                          <button
                                                            onClick={() => {
                                                              handleRejectCancel();
                                                              setShowStepDropdown(
                                                                false
                                                              );
                                                              setCurrentStepDropdown(
                                                                null
                                                              );
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-red-600"
                                                          >
                                                            취소 요청 거절
                                                          </button>
                                                        </>
                                                      ) : (
                                                        <>
                                                          {/* 배송지 정보 보기 (구매자가 입력한 경우) */}
                                                          {chatData.item
                                                            .buyerShippingInfo ? (
                                                            <div className="p-3 space-y-2">
                                                              <div className="text-xs text-gray-500 font-medium mb-2">
                                                                📍 배송지 정보
                                                              </div>
                                                              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                  <span className="text-xs text-gray-600">
                                                                    수령인
                                                                  </span>
                                                                  <span className="text-sm font-semibold">
                                                                    {
                                                                      chatData
                                                                        .item
                                                                        .buyerShippingInfo
                                                                        .recipientName
                                                                    }
                                                                  </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                  <span className="text-xs text-gray-600">
                                                                    연락처
                                                                  </span>
                                                                  <span className="text-sm font-mono font-semibold text-blue-600">
                                                                    {
                                                                      chatData
                                                                        .item
                                                                        .buyerShippingInfo
                                                                        .phoneNumber
                                                                    }
                                                                  </span>
                                                                </div>
                                                                <div className="flex items-start justify-between">
                                                                  <span className="text-xs text-gray-600">
                                                                    주소
                                                                  </span>
                                                                  <span className="text-sm font-semibold text-right flex-1 ml-2">
                                                                    {
                                                                      chatData
                                                                        .item
                                                                        .buyerShippingInfo
                                                                        .address
                                                                    }
                                                                  </span>
                                                                </div>
                                                                {chatData.item
                                                                  .buyerShippingInfo
                                                                  .deliveryMemo && (
                                                                  <div className="flex items-start justify-between">
                                                                    <span className="text-xs text-gray-600">
                                                                      배송메모
                                                                    </span>
                                                                    <span className="text-sm font-semibold text-right flex-1 ml-2">
                                                                      {
                                                                        chatData
                                                                          .item
                                                                          .buyerShippingInfo
                                                                          .deliveryMemo
                                                                      }
                                                                    </span>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          ) : (
                                                            <div className="px-4 py-3 text-sm text-gray-500">
                                                              배송지 정보가
                                                              없습니다.
                                                            </div>
                                                          )}

                                                          {/* 운송장 등록 */}
                                                          <button
                                                            onClick={() => {
                                                              setCourier("");
                                                              setTrackingNumber(
                                                                ""
                                                              );
                                                              setShowShippingEditModal(
                                                                true
                                                              );
                                                              setShowStepDropdown(
                                                                false
                                                              );
                                                              setCurrentStepDropdown(
                                                                null
                                                              );
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                          >
                                                            운송장 등록
                                                          </button>
                                                        </>
                                                      )}
                                                    </>
                                                  );
                                                } else if (
                                                  step.key === "shipping"
                                                ) {
                                                  return (
                                                    <button
                                                      onClick={() => {
                                                        setCourier(
                                                          chatData.item
                                                            .shippingInfo
                                                            ?.courier || ""
                                                        );
                                                        setTrackingNumber(
                                                          chatData.item
                                                            .shippingInfo
                                                            ?.trackingNumber ||
                                                            ""
                                                        );
                                                        setShowShippingEditModal(
                                                          true
                                                        );
                                                        setShowStepDropdown(
                                                          false
                                                        );
                                                        setCurrentStepDropdown(
                                                          null
                                                        );
                                                      }}
                                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                    >
                                                      운송장 수정
                                                    </button>
                                                  );
                                                }
                                              }
                                              // 구매자 액션들
                                              else {
                                                if (
                                                  step.key ===
                                                  "escrow_completed"
                                                ) {
                                                  return (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          setShowShippingAddressModal(
                                                            true
                                                          );
                                                          setShowStepDropdown(
                                                            false
                                                          );
                                                          setCurrentStepDropdown(
                                                            null
                                                          );
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                      >
                                                        배송지 입력
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          setShowCancelModal(
                                                            true
                                                          );
                                                          setShowStepDropdown(
                                                            false
                                                          );
                                                          setCurrentStepDropdown(
                                                            null
                                                          );
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-red-600"
                                                      >
                                                        거래 취소하기
                                                      </button>
                                                    </>
                                                  );
                                                } else if (
                                                  step.key === "reserved"
                                                ) {
                                                  return (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          setShowShippingAddressModal(
                                                            true
                                                          );
                                                          setShowStepDropdown(
                                                            false
                                                          );
                                                          setCurrentStepDropdown(
                                                            null
                                                          );
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                      >
                                                        배송지 입력
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          setShowCancelModal(
                                                            true
                                                          );
                                                          setShowStepDropdown(
                                                            false
                                                          );
                                                          setCurrentStepDropdown(
                                                            null
                                                          );
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-red-600"
                                                      >
                                                        거래 취소요청
                                                      </button>
                                                    </>
                                                  );
                                                } else if (
                                                  step.key === "shipping"
                                                ) {
                                                  return chatData.item
                                                    .shippingInfo ? (
                                                    <div className="p-3 space-y-2">
                                                      <div className="text-xs text-gray-500 font-medium mb-2">
                                                        📦 배송 정보
                                                      </div>
                                                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                                        <div className="flex items-center justify-between">
                                                          <span className="text-xs text-gray-600">
                                                            택배사
                                                          </span>
                                                          <span className="text-sm font-semibold">
                                                            {chatData.item
                                                              .shippingInfo
                                                              .courier === "cj"
                                                              ? "CJ대한통운"
                                                              : chatData.item
                                                                    .shippingInfo
                                                                    .courier ===
                                                                  "hanjin"
                                                                ? "한진택배"
                                                                : chatData.item
                                                                      .shippingInfo
                                                                      .courier ===
                                                                    "lotte"
                                                                  ? "롯데택배"
                                                                  : chatData
                                                                      .item
                                                                      .shippingInfo
                                                                      .courier}
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                          <span className="text-xs text-gray-600">
                                                            송장번호
                                                          </span>
                                                          <button
                                                            onClick={() =>
                                                              copyTrackingNumber(
                                                                chatData.item
                                                                  .shippingInfo!
                                                                  .trackingNumber
                                                              )
                                                            }
                                                            className="text-sm font-mono font-semibold text-blue-600 hover:text-blue-700 underline"
                                                          >
                                                            {
                                                              chatData.item
                                                                .shippingInfo
                                                                .trackingNumber
                                                            }
                                                          </button>
                                                        </div>
                                                      </div>
                                                      <button
                                                        onClick={() => {
                                                          const url =
                                                            getTrackingUrl(
                                                              chatData.item
                                                                .shippingInfo!
                                                                .courier,
                                                              chatData.item
                                                                .shippingInfo!
                                                                .trackingNumber
                                                            );
                                                          window.open(
                                                            url,
                                                            "_blank"
                                                          );
                                                          setShowStepDropdown(
                                                            false
                                                          );
                                                          setCurrentStepDropdown(
                                                            null
                                                          );
                                                        }}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                                                      >
                                                        🔍 운송장 조회하기
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="px-4 py-3 text-sm text-gray-500">
                                                      배송정보가 없습니다.
                                                    </div>
                                                  );
                                                } else if (
                                                  step.key === "sold"
                                                ) {
                                                  return (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          handleCompletePurchase();
                                                          setShowStepDropdown(
                                                            false
                                                          );
                                                          setCurrentStepDropdown(
                                                            null
                                                          );
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                      >
                                                        구매확인
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          toast.error(
                                                            "반품 신청"
                                                          );
                                                          setShowStepDropdown(
                                                            false
                                                          );
                                                          setCurrentStepDropdown(
                                                            null
                                                          );
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-red-600"
                                                      >
                                                        반품
                                                      </button>
                                                    </>
                                                  );
                                                }
                                              }

                                              return (
                                                <div className="px-4 py-3 text-gray-500 text-sm">
                                                  사용 가능한 액션이 없습니다.
                                                </div>
                                              );
                                            })()}
                                          </motion.div>
                                        </>
                                      )}
                                  </AnimatePresence>
                                </div>
                              )}
                          </div>
                          <span
                            className={`text-[10px] mt-1 font-medium ${
                              step.key === "cancelled"
                                ? "text-red-600"
                                : index <= currentStepIndex
                                  ? "text-blue-600"
                                  : "text-gray-400"
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
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 메시지 영역 */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-4 pb-32 md:pb-24 ${chatData?.tradeType === "안전결제" ? "pt-4" : ""}`}
          >
            {/* 플랫폼 안내 메시지 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    📢 플랫폼 안내
                  </p>
                  <p className="text-xs text-gray-600">
                    ConnectOne은 중개 플랫폼입니다. 거래는 사용자 간 직접
                    진행되며, 플랫폼은 거래에 대한 책임을 지지 않습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 안전 거래 가이드 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-600 mb-2">
                    안전 거래 가이드
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-700 font-semibold">
                      💡 직거래:
                    </p>
                    <p className="text-xs text-gray-600 ml-4">
                      • 공공장소(카페, 경찰서 앞 등)에서 거래하세요
                    </p>
                    <p className="text-xs text-gray-600 ml-4">
                      • 상품 확인 후 거래하세요
                    </p>
                    <p className="text-xs text-gray-700 font-semibold mt-2">
                      📦 택배거래:
                    </p>
                    <p className="text-xs text-gray-600 ml-4">
                      • 송장번호를 반드시 공유하세요
                    </p>
                    <p className="text-xs text-gray-600 ml-4">
                      • 수령 확인 후 거래완료 처리하세요
                    </p>
                    <p className="text-xs text-gray-600 ml-4">
                      • 시세보다 지나치게 저렴한 물건을 주의하세요
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

                  // 카카오톡 스타일: 같은 분의 마지막 메시지에만 시간 표시
                  const shouldShowTime = (() => {
                    // 다음 메시지 확인
                    const nextMessage =
                      index < messages.length - 1 ? messages[index + 1] : null;

                    // 모든 메시지에 대해 같은 분 마지막 메시지에만 시간 표시

                    // 다음 메시지가 없으면 (마지막 메시지) 시간 표시
                    if (!nextMessage) return true;

                    // 다음 메시지와 분이 다르면 (현재 메시지가 해당 분의 마지막) 시간 표시
                    const currentTime = message.createdAt?.toDate
                      ? message.createdAt.toDate()
                      : new Date(message.createdAt);
                    const nextTime = nextMessage.createdAt?.toDate
                      ? nextMessage.createdAt.toDate()
                      : new Date(nextMessage.createdAt);

                    return currentTime.getMinutes() !== nextTime.getMinutes();
                  })();

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
                          <div
                            className={`flex items-start ${isOwn ? "flex-row-reverse" : ""} space-x-2`}
                          >
                            {/* 상대방 프로필 사진 (카카오톡 스타일) */}
                            {!isOwn && (
                              <div className="flex-shrink-0 w-10 h-10">
                                <div
                                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-500 cursor-pointer hover:border-blue-600 transition-colors"
                                  onClick={() => setShowOtherProfileModal(true)}
                                >
                                  {chatData?.otherUser.profileImage ? (
                                    <img
                                      src={chatData.otherUser.profileImage}
                                      alt={chatData.otherUser.nickname}
                                      className="w-full h-full object-cover"
                                      onError={e => {
                                        console.log(
                                          "EnhancedChatModal 프로필 이미지 로드 실패:",
                                          chatData.otherUser.profileImage
                                        );
                                        e.currentTarget.style.display = "none";
                                      }}
                                      onLoad={() => {
                                        console.log(
                                          "EnhancedChatModal 프로필 이미지 로드 성공:",
                                          chatData.otherUser.profileImage
                                        );
                                      }}
                                    />
                                  ) : (
                                    <User className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-end max-w-xs lg:max-w-md">
                              {/* 내 메시지일 경우: 시간과 '1' 표시가 버블 왼쪽에 */}
                              {isOwn && (
                                <div className="flex items-center mr-2">
                                  {shouldShowTime && (
                                    <span className="text-xs text-gray-500 mr-1">
                                      {formatTimeOnly(message.createdAt)}
                                    </span>
                                  )}
                                  {message.readBy &&
                                    chatData?.otherUser.uid &&
                                    !message.readBy.includes(
                                      chatData.otherUser.uid
                                    ) && (
                                      <span className="text-xs text-purple-500">
                                        1
                                      </span>
                                    )}
                                </div>
                              )}

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

                              {/* 상대방 메시지일 경우: 시간 표시가 버블 오른쪽에 */}
                              {!isOwn && shouldShowTime && (
                                <div className="flex items-center ml-2">
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
              </>
            )}
            {/* 스크롤 자동 이동을 위한 참조점 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 판매자용 거래 진행 버튼 (escrow_completed 상태일 때만) */}
          {/* 구매확인 버튼 - 메시지 입력창 바로 위 (구매자만, 배송중 상태일 때) */}
          {chatData &&
            user &&
            user.uid === chatData.buyerUid &&
            (chatData.item.status === "shipped" ||
              chatData.item.status === "shipping") &&
            (() => {
              // 배송 시작 후 24시간 경과 확인
              if (!chatData.item.shippingInfo?.shippedAt) return false;

              const shippedAt =
                chatData.item.shippingInfo.shippedAt.toDate?.() ||
                new Date(chatData.item.shippingInfo.shippedAt.seconds * 1000);
              const now = new Date();
              const hoursSinceShipped =
                (now.getTime() - shippedAt.getTime()) / (1000 * 60 * 60);

              return hoursSinceShipped >= 24; // 24시간 이상 경과
            })() && (
              <div className="px-4 py-3 border-t border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="bg-white border-2 border-green-400 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="text-base font-bold text-green-900">
                          상품을 수령하셨나요?
                        </h4>
                      </div>
                      <p className="text-sm text-green-700">
                        구매확인을 누르면 거래가 완료되고 판매자에게 대금이
                        전달됩니다.
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (
                          confirm(
                            "상품을 수령하셨나요?\n구매확인 후 거래가 완료되고 판매자에게 대금이 전달됩니다."
                          )
                        ) {
                          try {
                            // 상품 상태를 'sold'로 변경
                            const db = getDb();
                            if (!db) {
                              toast.error("데이터베이스 연결 실패");
                              return;
                            }

                            const itemRef = doc(db, "items", chatData.item.id);
                            await updateDoc(itemRef, {
                              status: "sold",
                              soldAt: serverTimestamp(),
                              updatedAt: serverTimestamp(),
                            });

                            // 시스템 메시지 전송
                            const chatResult = await getOrCreateChat(
                              chatData.item.id,
                              chatData.item.buyerUid,
                              user.uid,
                              "구매확인이 완료되었습니다."
                            );

                            if (chatResult.success && chatResult.chatId) {
                              await sendMessage({
                                chatId: chatResult.chatId,
                                senderUid: "system",
                                content: `🎉 구매확인이 완료되었습니다!\n거래가 성공적으로 완료되었습니다.\n감사합니다!`,
                              });
                            }

                            // 판매자에게 알림 전송
                            try {
                              const { notificationTrigger } = await import(
                                "../../lib/notifications/trigger"
                              );

                              await notificationTrigger.triggerPurchaseConfirmation(
                                {
                                  userId: chatData.sellerUid,
                                  productTitle: chatData.item.title,
                                  buyerNickname: user.nickname || "구매자",
                                }
                              );

                              console.log(
                                "✅ 구매확인 알림 전송 완료 (판매자)"
                              );
                            } catch (notifError) {
                              console.error(
                                "❌ 구매확인 알림 전송 실패:",
                                notifError
                              );
                            }

                            toast.success(
                              "구매확인이 완료되었습니다! 거래가 완료되었습니다."
                            );

                            // 전역 이벤트 발생
                            window.dispatchEvent(
                              new CustomEvent("itemStatusChanged", {
                                detail: {
                                  itemId: chatData.item.id,
                                  status: "sold",
                                },
                              })
                            );
                          } catch (error) {
                            console.error("구매확인 처리 실패:", error);
                            toast.error(
                              "구매확인 처리 중 오류가 발생했습니다."
                            );
                          }
                        }
                      }}
                      className="ml-4 bg-green-600 hover:bg-green-700 text-white font-bold text-base px-6 py-3 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                      size="lg"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      구매확인
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* 메시지 입력 */}
          {chatData && user && (
            <div className="p-4 border-t bg-gray-50">
              <MessageInput
                chatId={chatData.chatId}
                senderUid={user.uid}
                itemId={chatData.item.id}
                sellerUid={chatData.otherUser.uid}
                onMessageSent={undefined}
                onPlusClick={() => setShowBottomSheet(true)}
              />
            </div>
          )}

          {/* Bottom Sheet (모바일 전용) */}
          <AnimatePresence>
            {showBottomSheet && chatData && user && (
              <>
                {/* 배경 오버레이 */}
                <motion.div
                  className="fixed inset-0 bg-black/40 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowBottomSheet(false)}
                />

                {/* Bottom Sheet (모바일) / Dropdown Menu (데스크톱) */}
                <motion.div
                  className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-w-[480px] mx-auto md:absolute md:bottom-20 md:left-4 md:right-auto md:w-auto md:rounded-xl md:shadow-lg"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  {/* 드래그 핸들 (모바일만) */}
                  <div className="flex justify-center pt-3 pb-2 md:hidden">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                  </div>

                  {/* 액션 그리드 */}
                  <div className="px-4 pb-6 pt-2 md:pb-3 md:pt-2">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3 md:hidden">
                      {user.uid === chatData.buyerUid
                        ? "구매자 메뉴"
                        : "판매자 메뉴"}
                    </h3>
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-2 md:gap-2">
                      {/* 앨범 (공통) */}
                      <motion.button
                        onClick={() => {
                          // 파일 입력 요소 생성
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.multiple = true;
                          input.onchange = e => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                              // 이미지 파일들을 MessageInput으로 전달
                              handleImageUpload(files);
                            }
                          };
                          input.click();
                          setShowBottomSheet(false);
                        }}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ImageIcon className="w-5 h-5 mb-2" />
                        <span className="text-xs font-medium">앨범</span>
                      </motion.button>

                      {/* 카메라 (공통) */}
                      <motion.button
                        onClick={() => {
                          // 카메라 입력 요소 생성
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.capture = "camera";
                          input.onchange = e => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                              // 이미지 파일들을 MessageInput으로 전달
                              handleImageUpload(files);
                            }
                          };
                          input.click();
                          setShowBottomSheet(false);
                        }}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Camera className="w-5 h-5 mb-2" />
                        <span className="text-xs font-medium">카메라</span>
                      </motion.button>

                      {/* 판매자 메뉴 (모바일만) */}
                      {user.uid === chatData.sellerUid && (
                        <div className="contents md:hidden">
                          {/* 결제완료 단계 */}
                          {chatData.item.status === "escrow_completed" && (
                            <>
                              {/* 거래 진행하기 */}
                              <motion.button
                                onClick={() => {
                                  handleStartTransaction();
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <PlayCircle className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  거래진행
                                </span>
                              </motion.button>

                              {/* 거래 취소하기 */}
                              <motion.button
                                onClick={() => {
                                  handleCancelTrade();
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircle className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  거래취소
                                </span>
                              </motion.button>
                            </>
                          )}

                          {/* 거래중 단계 */}
                          {chatData.item.status === "reserved" && (
                            <>
                              {/* 취소 요청이 있을 때만 승인/거절 버튼 표시 */}
                              {chatData.item.cancelRequest?.status ===
                              "pending" ? (
                                <>
                                  {/* 취소 요청 승인 */}
                                  <motion.button
                                    onClick={() => {
                                      handleApproveCancel();
                                      setShowBottomSheet(false);
                                    }}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <CheckCircle className="w-5 h-5 mb-2" />
                                    <span className="text-xs font-medium">
                                      취소승인
                                    </span>
                                  </motion.button>

                                  {/* 취소 요청 거절 */}
                                  <motion.button
                                    onClick={() => {
                                      handleRejectCancel();
                                      setShowBottomSheet(false);
                                    }}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <XCircle className="w-5 h-5 mb-2" />
                                    <span className="text-xs font-medium">
                                      취소거절
                                    </span>
                                  </motion.button>
                                </>
                              ) : (
                                <>
                                  {/* 운송장 등록 */}
                                  <motion.button
                                    onClick={() => {
                                      setCourier("");
                                      setTrackingNumber("");
                                      setShowShippingEditModal(true);
                                      setShowBottomSheet(false);
                                    }}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Truck className="w-5 h-5 mb-2" />
                                    <span className="text-xs font-medium">
                                      운송장등록
                                    </span>
                                  </motion.button>

                                  {/* 거래 취소하기 */}
                                  <motion.button
                                    onClick={() => {
                                      handleCancelTrade();
                                      setShowBottomSheet(false);
                                    }}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <XCircle className="w-5 h-5 mb-2" />
                                    <span className="text-xs font-medium">
                                      거래취소
                                    </span>
                                  </motion.button>
                                </>
                              )}
                            </>
                          )}

                          {/* 배송중 단계 - 송장수정 */}
                          {chatData.item.status === "shipping" && (
                            <>
                              <motion.button
                                onClick={() => {
                                  setCourier(
                                    chatData.item.shippingInfo?.courier || ""
                                  );
                                  setTrackingNumber(
                                    chatData.item.shippingInfo
                                      ?.trackingNumber || ""
                                  );
                                  setShowShippingEditModal(true);
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Edit className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  송장수정
                                </span>
                              </motion.button>
                            </>
                          )}

                          {/* 거래완료 단계 */}
                          {chatData.item.status === "sold" && (
                            <>
                              {/* 후기 작성 */}
                              <motion.button
                                onClick={() => {
                                  toast.success("후기 작성 기능 준비중");
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Star className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  후기작성
                                </span>
                              </motion.button>
                            </>
                          )}
                        </div>
                      )}

                      {/* 구매자 메뉴 (모바일만) */}
                      {user.uid === chatData.buyerUid && (
                        <div className="contents md:hidden">
                          {/* 결제완료 단계 */}
                          {chatData.item.status === "escrow_completed" && (
                            <>
                              {/* 배송지 입력 */}
                              <motion.button
                                onClick={() => {
                                  setShowShippingAddressModal(true);
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <MapPin className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  배송지입력
                                </span>
                              </motion.button>

                              {/* 거래 취소하기 */}
                              <motion.button
                                onClick={() => {
                                  setShowCancelModal(true);
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircle className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  거래취소
                                </span>
                              </motion.button>
                            </>
                          )}

                          {/* 거래중 단계 */}
                          {chatData.item.status === "reserved" && (
                            <>
                              {/* 배송지 입력 */}
                              <motion.button
                                onClick={() => {
                                  setShowShippingAddressModal(true);
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <MapPin className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  배송지입력
                                </span>
                              </motion.button>

                              {/* 거래 취소하기 */}
                              <motion.button
                                onClick={() => {
                                  setShowCancelModal(true);
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircle className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  거래취소
                                </span>
                              </motion.button>
                            </>
                          )}

                          {/* 배송중 단계 - 배송확인 (=구매확인) - 24시간 후 */}
                          {chatData.item.status === "shipping" &&
                            (() => {
                              // 배송 시작 후 24시간 경과 확인
                              if (!chatData.item.shippingInfo?.shippedAt)
                                return false;

                              const shippedAt =
                                chatData.item.shippingInfo.shippedAt.toDate?.() ||
                                new Date(
                                  chatData.item.shippingInfo.shippedAt.seconds *
                                    1000
                                );
                              const now = new Date();
                              const hoursSinceShipped =
                                (now.getTime() - shippedAt.getTime()) /
                                (1000 * 60 * 60);

                              return hoursSinceShipped >= 24; // 24시간 이상 경과
                            })() && (
                              <>
                                <motion.button
                                  onClick={() => {
                                    handleCompletePurchase();
                                    setShowBottomSheet(false);
                                  }}
                                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <CheckCircle className="w-5 h-5 mb-2" />
                                  <span className="text-xs font-medium">
                                    배송확인
                                  </span>
                                </motion.button>
                              </>
                            )}

                          {/* 거래완료 단계 - 반품만 */}
                          {chatData.item.status === "sold" && (
                            <>
                              {/* 반품 */}
                              <motion.button
                                onClick={() => {
                                  toast.error("반품 신청");
                                  setShowBottomSheet(false);
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <RotateCcw className="w-5 h-5 mb-2" />
                                <span className="text-xs font-medium">
                                  반품
                                </span>
                              </motion.button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 취소 버튼 */}
                    <button
                      onClick={() => setShowBottomSheet(false)}
                      className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors md:hidden"
                    >
                      닫기
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
              {/* 모바일에서만 닫기 버튼 표시 */}
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

              {/* 구매자 액션 버튼들 */}
              {user && chatData && user.uid === chatData.buyerUid && (
                <div className="mb-4 space-y-2">
                  {/* 배송지 입력 버튼 - 구매자이고 배송지가 없을 때만 */}
                  {(chatData.item.status === "escrow_completed" ||
                    chatData.item.status === "reserved") &&
                    !chatData.item.buyerShippingInfo && (
                      <Button
                        onClick={() => setShowShippingAddressModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
                      >
                        배송지 정보 입력하기
                      </Button>
                    )}
                </div>
              )}

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

                  {/* 거래 진행하기 버튼 - 판매자만, 안전결제 완료 또는 active 상태 */}
                  {user?.uid === chatData.sellerUid &&
                    (chatData.item.status === "active" ||
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
                            <label className="block text-base font-semibold text-gray-900 mb-3">
                              택배사 선택
                            </label>
                            <select
                              value={courier}
                              onChange={e => setCourier(e.target.value)}
                              className="w-full p-4 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                              style={{ fontSize: "18px" }}
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
                            <label className="block text-base font-semibold text-gray-900 mb-3">
                              송장번호
                            </label>
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={e => setTrackingNumber(e.target.value)}
                              placeholder="송장번호를 입력하세요"
                              className="w-full p-4 text-base font-medium border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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

                      {/* 배송지 정보 - 구매자와 판매자 모두에게 표시 */}
                      {(() => {
                        // 시스템 메시지에서 배송지 정보 찾기
                        const shippingMessage = messages.find(
                          msg =>
                            msg.senderUid === "system" &&
                            msg.content.includes("구매자 배송지 정보")
                        );

                        if (shippingMessage) {
                          const lines = shippingMessage.content.split("\n");
                          const addressInfo: { [key: string]: string } = {};

                          lines.forEach(line => {
                            if (line.includes(":")) {
                              const [key, value] = line.split(":", 2);
                              addressInfo[key.trim()] = value.trim();
                            }
                          });

                          // 구매자인지 판매자인지에 따라 제목과 색상 변경
                          const isBuyer = user?.uid === chatData?.buyerUid;
                          const title = isBuyer
                            ? "나의 배송지 정보"
                            : "구매자 배송지 정보";
                          const bgColor = isBuyer
                            ? "bg-blue-50 border-blue-200"
                            : "bg-green-50 border-green-200";
                          const textColor = isBuyer
                            ? "text-blue-700"
                            : "text-green-700";
                          const labelColor = isBuyer
                            ? "text-blue-600"
                            : "text-green-600";
                          const valueColor = isBuyer
                            ? "text-blue-900"
                            : "text-green-900";

                          return (
                            <div
                              className={`${bgColor} border rounded-lg mb-4`}
                            >
                              {/* 접기/펼치기 헤더 */}
                              <button
                                onClick={() =>
                                  setIsShippingInfoExpanded(
                                    !isShippingInfoExpanded
                                  )
                                }
                                className={`w-full p-4 text-left flex items-center justify-between hover:bg-opacity-80 transition-colors`}
                              >
                                <h4
                                  className={`text-sm font-medium ${textColor}`}
                                >
                                  {title}
                                </h4>
                                {isShippingInfoExpanded ? (
                                  <ChevronDown
                                    className={`w-4 h-4 ${textColor}`}
                                  />
                                ) : (
                                  <ChevronRight
                                    className={`w-4 h-4 ${textColor}`}
                                  />
                                )}
                              </button>

                              {/* 펼쳐진 내용 */}
                              {isShippingInfoExpanded && (
                                <div className="px-4 pb-4 space-y-2">
                                  {addressInfo["수령인"] && (
                                    <div className="flex justify-between items-center">
                                      <span className={`text-sm ${labelColor}`}>
                                        받는 사람:
                                      </span>
                                      <span
                                        className={`text-sm font-medium ${valueColor}`}
                                      >
                                        {addressInfo["수령인"]}
                                      </span>
                                    </div>
                                  )}
                                  {addressInfo["연락처"] && (
                                    <div className="flex justify-between items-center">
                                      <span className={`text-sm ${labelColor}`}>
                                        연락처:
                                      </span>
                                      <span
                                        className={`text-sm font-medium ${valueColor}`}
                                      >
                                        {addressInfo["연락처"]}
                                      </span>
                                    </div>
                                  )}
                                  {addressInfo["주소"] && (
                                    <div className="space-y-1">
                                      <span className={`text-sm ${labelColor}`}>
                                        배송 주소:
                                      </span>
                                      <p
                                        className={`text-sm font-medium ${valueColor}`}
                                      >
                                        {addressInfo["주소"]}
                                      </p>
                                    </div>
                                  )}
                                  {addressInfo["배송 메모"] && (
                                    <div className="space-y-1">
                                      <span className={`text-sm ${labelColor}`}>
                                        배송 메모:
                                      </span>
                                      <p
                                        className={`text-sm font-medium ${valueColor}`}
                                      >
                                        {addressInfo["배송 메모"]}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

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
                                  {/* 복사 버튼 */}
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
                                        toast.success(
                                          "송장번호가 복사되었습니다!"
                                        );
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="송장번호 복사"
                                  >
                                    <svg
                                      className="w-4 h-4 text-gray-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>
                                  {/* 배송 추적 링크 */}
                                  <button
                                    onClick={() => {
                                      if (
                                        chatData.item.shippingInfo?.courier &&
                                        chatData.item.shippingInfo
                                          ?.trackingNumber
                                      ) {
                                        const trackingUrl = getTrackingUrl(
                                          chatData.item.shippingInfo.courier,
                                          chatData.item.shippingInfo
                                            .trackingNumber
                                        );
                                        window.open(trackingUrl, "_blank");
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="배송 추적하기"
                                  >
                                    <svg
                                      className="w-4 h-4 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </button>
                                  {user?.uid === chatData?.sellerUid ? (
                                    <button
                                      onClick={() => {
                                        // 기존 값 로드
                                        if (chatData.item.shippingInfo) {
                                          setCourier(
                                            chatData.item.shippingInfo
                                              .courier || ""
                                          );
                                          setTrackingNumber(
                                            chatData.item.shippingInfo
                                              .trackingNumber || ""
                                          );
                                        }
                                        setShowShippingEditModal(true);
                                      }}
                                      className="text-orange-600 hover:text-orange-800 text-xs px-2 py-1 border border-orange-300 rounded hover:bg-orange-50"
                                    >
                                      송장수정
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const url = getTrackingUrl(
                                          chatData.item.shippingInfo.courier,
                                          chatData.item.shippingInfo
                                            .trackingNumber
                                        );
                                        window.open(url, "_blank");
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                    >
                                      운송장 조회
                                    </button>
                                  )}
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
                          {/* 배송 추적 버튼 */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => {
                                if (
                                  chatData.item.shippingInfo?.courier &&
                                  chatData.item.shippingInfo?.trackingNumber
                                ) {
                                  const trackingUrl = getTrackingUrl(
                                    chatData.item.shippingInfo.courier,
                                    chatData.item.shippingInfo.trackingNumber
                                  );
                                  window.open(trackingUrl, "_blank");
                                }
                              }}
                              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>배송 추적하기</span>
                            </button>
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

                  {/* 거래완료 상태 - 거래 후기 작성 버튼으로 교체 */}
                  {chatData.item.status === "sold" && (
                    <Button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                    >
                      <span className="text-2xl mr-2">✍️</span>
                      <span className="text-lg font-bold">
                        {user?.uid === chatData.sellerUid
                          ? "구매자 후기 작성"
                          : "판매자 후기 작성"}
                      </span>
                    </Button>
                  )}

                  {/* 거래 취소 버튼 - 결제완료/거래중 단계에서 판매자와 구매자 모두 */}
                  {user && chatData && (() => {
                    const showCancelButton = 
                      chatData.item.status === "escrow_completed" ||
                      chatData.item.status === "reserved" ||
                      autoSendSystemMessage === "escrow_completed";
                    
                    console.log("🔍 거래취소 버튼 조건 확인:", {
                      status: chatData.item.status,
                      autoSendSystemMessage,
                      showCancelButton,
                      user: user?.uid,
                      chatData: !!chatData
                    });
                    
                    return showCancelButton && (
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
                    );
                  })()}
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
                          chatData?.item?.status === "shipping" ||
                          chatData?.item?.status === "shipped"
                            ? "bg-blue-50 border-blue-300 text-blue-800"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">배송중</span>
                            {(chatData?.item?.status === "shipping" ||
                              chatData?.item?.status === "shipped") && (
                              <span className="text-blue-600">✅</span>
                            )}
                          </div>
                          {chatData?.item?.status === "shipping" ||
                          chatData?.item?.status === "shipped" ? (
                            <Truck className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Truck className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* 배송 정보 - 구매자와 판매자 모두에게 표시 */}
                        {(chatData?.item?.status === "shipping" ||
                          chatData?.item?.status === "shipped") &&
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
                                    {user?.uid === chatData?.sellerUid ? (
                                      <button
                                        onClick={() => {
                                          // 기존 값 로드
                                          if (chatData.item.shippingInfo) {
                                            setCourier(
                                              chatData.item.shippingInfo
                                                .courier || ""
                                            );
                                            setTrackingNumber(
                                              chatData.item.shippingInfo
                                                .trackingNumber || ""
                                            );
                                          }
                                          setShowShippingEditModal(true);
                                        }}
                                        className="text-orange-600 hover:text-orange-800 text-xs px-1 py-0.5 border border-orange-300 rounded hover:bg-orange-100"
                                      >
                                        송장수정
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          const url = getTrackingUrl(
                                            chatData.item.shippingInfo.courier,
                                            chatData.item.shippingInfo
                                              .trackingNumber
                                          );
                                          window.open(url, "_blank");
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs px-1 py-0.5 border border-blue-300 rounded hover:bg-blue-100"
                                      >
                                        운송장 조회
                                      </button>
                                    )}
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

                    {/* 거래완료 */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        chatData?.item?.status === "sold"
                          ? "bg-green-50 border-green-300 text-green-800"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">거래완료</span>
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

                    {/* 반품 승인/거절 버튼 - 판매자에게만 표시 (반품 요청이 있을 때) */}
                    {user &&
                      chatData &&
                      user.uid === chatData.sellerUid &&
                      chatData.item.returnRequest?.status === "pending" && (
                        <div className="mt-4 space-y-2">
                          <div className="text-xs text-gray-500 text-center mb-2">
                            구매자가 반품을 요청했습니다
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => {
                                if (
                                  confirm(
                                    "반품을 승인하시겠습니까?\n승인 후에는 취소할 수 없습니다."
                                  )
                                ) {
                                  handleApproveReturn();
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white h-10"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              반품 승인
                            </Button>
                            <Button
                              onClick={() => {
                                if (
                                  confirm(
                                    "반품을 거절하시겠습니까?\n거절 후에는 변경할 수 없습니다."
                                  )
                                ) {
                                  handleRejectReturn();
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white h-10"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              반품 거절
                            </Button>
                          </div>
                        </div>
                      )}

                    {/* 구매확정 버튼 - 구매자에게만 표시 (채팅창 사이드바) */}
                    {user &&
                      chatData &&
                      user.uid === chatData.buyerUid &&
                      chatData.item.status === "shipping" && (
                        <div className="mt-4 space-y-3">
                          <div className="text-xs text-gray-600 text-center leading-relaxed">
                            📦 상품을 수령하신 후<br />
                            <span className="font-semibold text-gray-800">
                              구매확정
                            </span>
                            을 눌러주세요
                          </div>
                          <Button
                            onClick={() => {
                              if (
                                confirm(
                                  "구매를 확정하시겠습니까?\n확정 후에는 취소할 수 없습니다."
                                )
                              ) {
                                handleCompletePurchase();
                              }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                            disabled={isCompletingPurchase}
                          >
                            {isCompletingPurchase ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                확정 중...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                구매 확정
                              </>
                            )}
                          </Button>
                          <div className="text-center">
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    "반품을 요청하시겠습니까?\n판매자와 협의 후 진행됩니다."
                                  )
                                ) {
                                  handleRequestReturn();
                                }
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                              반품 요청
                            </button>
                          </div>
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

        {/* 송장 수정 모달 */}
        {showShippingEditModal && chatData && user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    송장 정보 수정
                  </h3>
                  <button
                    onClick={() => setShowShippingEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      택배사 선택
                    </label>
                    <select
                      value={courier}
                      onChange={e => setCourier(e.target.value)}
                      className="w-full p-4 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      style={{ fontSize: "18px" }}
                    >
                      <option value="">택배사를 선택하세요</option>
                      <option value="cj">CJ대한통운</option>
                      <option value="hanjin">한진택배</option>
                      <option value="lotte">롯데택배</option>
                      <option value="kdexp">경동택배</option>
                      <option value="epost">우체국택배</option>
                      <option value="logen">로젠택배</option>
                      <option value="knet">KNET</option>
                      <option value="tnt">TNT</option>
                      <option value="ups">UPS</option>
                      <option value="fedex">FedEx</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      송장번호
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="송장번호를 입력하세요"
                      className="w-full p-4 text-base font-medium border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    onClick={() => setShowShippingEditModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </Button>
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
                      setShowShippingEditModal(false);
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={isRegisteringShipping}
                  >
                    {isRegisteringShipping ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        수정 중...
                      </>
                    ) : (
                      "송장 수정"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상품 상세 모달 */}
      {chatData?.item && (
        <ProductDetailModal
          item={chatData.item}
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
        />
      )}

      {/* 거래 후기 작성 모달 */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.uid === chatData?.sellerUid
                    ? "구매자 후기 작성"
                    : "판매자 후기 작성"}
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 별점 선택 */}
                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-3">
                    별점 평가
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`w-10 h-10 ${
                          star <= reviewRating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        } hover:text-yellow-400 transition-colors`}
                      >
                        <Star className="w-full h-full fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {reviewRating > 0
                      ? `${reviewRating}점 선택됨`
                      : "별점을 선택해주세요"}
                  </p>
                </div>

                {/* 후기 내용 */}
                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-3">
                    후기 내용 (선택사항)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="거래에 대한 후기를 작성해주세요..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {reviewComment.length}/500자
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setShowReviewModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={reviewRating === 0}
                >
                  후기 작성
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
