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
    };
    tradeType?: string;
    sellerUid?: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지가 변경될 때마다 스크롤을 최하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && user) {
      console.log("EnhancedChatModal 열림 - loadChatData 호출");
      loadChatData();
    }
  }, [isOpen, user, itemId, sellerUid, chatId]);

  // 상품 상태 변경 이벤트 감지
  useEffect(() => {
    const handleItemStatusChanged = (event: CustomEvent) => {
      const { itemId: changedItemId, status } = event.detail;
      if (chatData?.item?.id === changedItemId) {
        console.log("상품 상태 변경 감지:", status);
        // 상품 상태 업데이트
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

        // 채팅 문서에 이미 저장된 otherUser 정보 사용 (우선순위)
        const storedOtherUser = chatData.otherUser;

        // 없으면 Firestore에서 가져오기
        let otherUser = null;
        if (!storedOtherUser?.nickname || !storedOtherUser?.profileImage) {
          const otherUserResult = await getUserProfile(otherUid);
          otherUser = otherUserResult.success ? otherUserResult.data : null;
          setOtherUserProfile(otherUser);
        } else {
          setOtherUserProfile(storedOtherUser as any);
        }

        // 아이템 정보 가져오기
        let itemResult = null;
        if (chatData.itemId && chatData.itemId !== "unknown") {
          itemResult = await getItem(chatData.itemId);
          console.log("아이템 정보 로드 결과:", itemResult);
        }

        // 거래 유형 추론 (상품 상태 기반)
        let inferredTradeType = "직거래";
        if (itemResult?.success && itemResult?.item) {
          console.log("상품 상태:", itemResult.item.status);
          console.log("거래 옵션:", itemResult.item.tradeOptions);
          if (itemResult.item.status === "escrow_completed") {
            // 안전결제 완료 상태라면 안전결제로 추론
            inferredTradeType = "안전결제";
          } else if (itemResult.item.tradeOptions?.includes("택배")) {
            inferredTradeType = "택배";
          }
        }
        console.log("추론된 거래 유형:", inferredTradeType);

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
          },
          tradeType: tradeType || chatData.tradeType || inferredTradeType, // 전달받은 거래 유형 우선 사용
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
            },
            tradeType: tradeType || "직거래", // 전달받은 거래 유형 사용
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
              {user &&
                chatData &&
                user.uid === chatData.sellerUid &&
                !chatData.item.transactionCancelledAt && (
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

                    {/* 거래 취소 버튼 */}
                    {chatData.item.status === "escrow_completed" && (
                      <Button
                        onClick={() => {
                          if (
                            confirm(
                              "정말로 거래를 취소하시겠습니까?\n안전결제가 취소되고 환불이 처리됩니다."
                            )
                          ) {
                            handleCancelTransaction();
                          }
                        }}
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

              {/* 거래 취소된 상품 안내 */}
              {user &&
                chatData &&
                user.uid === chatData.sellerUid &&
                chatData.item.transactionCancelledAt && (
                  <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        거래가 취소되었습니다
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      이 상품에 대한 거래는 이미 취소되었습니다.
                    </p>
                  </div>
                )}

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
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    거래를 취소하고 상품을 다시 판매중으로 변경합니다
                  </p>
                </div>
              )}

              {/* 구매자 액션 버튼들 */}
              {user &&
                chatData &&
                user.uid === chatData.otherUser.uid && (
                  <div className="mb-4 space-y-2">
                    {/* 구매 취소 요청 버튼 */}
                    {(chatData.item.status === "escrow_completed" || chatData.item.status === "reserved") && (
                      <Button
                        onClick={() => setShowCancelModal(true)}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 h-10"
                      >
                        <X className="w-4 h-4 mr-2" />
                        구매 취소 요청
                      </Button>
                    )}

                    {/* 구매 완료 버튼 */}
                    {chatData.item.status === "reserved" && (
                      <Button
                        onClick={handleCompletePurchase}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
                        disabled={isCompletingPurchase}
                      >
                        {isCompletingPurchase ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            완료 처리 중...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            구매 완료
                          </>
                        )}
                      </Button>
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
                      if (currentTradeType.includes("택배")) {
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
                        currentTradeType.includes("안전거래") ||
                        currentTradeType.includes("안전결제")
                      ) {
                        tradeTypes.push(
                          <span
                            key="safe"
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
                          >
                            안전결제
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
                    {/* 거래 대기 */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        chatData?.item?.status === "active"
                          ? "bg-green-50 border-green-300 text-green-800"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">거래 대기</span>
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

                    {/* 결제 완료 (안전결제인 경우만) */}
                    {(chatData?.tradeType?.includes("안전결제") ||
                      chatData?.tradeType?.includes("안전거래")) && (
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                          chatData?.item?.status === "escrow_completed"
                            ? "bg-green-50 border-green-300 text-green-800"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            안전결제 완료
                          </span>
                          {chatData?.item?.status === "escrow_completed" && (
                            <span className="text-green-600">✅</span>
                          )}
                        </div>
                        {chatData?.item?.status === "escrow_completed" ? (
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
                          ? "bg-blue-50 border-blue-300 text-blue-800"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">거래중</span>
                        {chatData?.item?.status === "reserved" && (
                          <span className="text-blue-600">🔄</span>
                        )}
                      </div>
                      {chatData?.item?.status === "reserved" ? (
                        <Clock className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
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
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
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
      </div>
    </div>
  );
}
