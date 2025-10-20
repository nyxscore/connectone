"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle, Home, Package, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { EnhancedChatModal } from "@/components/chat/EnhancedChatModal";
import { useAuth } from "@/lib/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb as getDb } from "@/lib/api/firebase-ultra-safe";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [orderInfo, setOrderInfo] = useState({
    orderId: "",
    amount: 0,
    escrow: false,
    itemId: "",
    sellerUid: "",
  });
  const [showChatModal, setShowChatModal] = useState(false);
  const [transactionSaved, setTransactionSaved] = useState(false);
  const [autoChatOpened, setAutoChatOpened] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const escrow = searchParams.get("escrow") === "true";
    const itemId = searchParams.get("itemId") || "";
    const sellerUid = searchParams.get("sellerUid") || "";

    console.log("결제 성공 페이지 파라미터:", {
      orderId,
      amount,
      escrow,
      itemId,
      sellerUid,
    });

    if (orderId && amount) {
      setOrderInfo({
        orderId,
        amount: parseInt(amount),
        escrow,
        itemId,
        sellerUid,
      });

      // 안전결제인 경우 즉시 채팅창 열기
      if (escrow && itemId && sellerUid) {
        console.log("안전결제 완료 - 즉시 채팅창 열기");
        setShowChatModal(true);
        setAutoChatOpened(true);
      }

      // 테스트 결제인 경우 조용히 처리
      if (orderId.startsWith("MOCK_ORDER_")) {
        console.log("테스트 결제 완료:", orderId);
      } else {
        toast.success("결제가 완료되었습니다!");
      }
    } else {
      console.error("결제 정보 없음 - 홈으로 리다이렉트");
      // 테스트 환경에서는 조용히 처리
      if (process.env.NODE_ENV === "development") {
        console.log("개발 환경: 결제 정보 없음");
      } else {
        toast.error("결제 정보를 찾을 수 없습니다.");
      }
      router.push("/");
    }
  }, [searchParams, router]);

  // Firestore에 거래 내역 저장
  useEffect(() => {
    if (!user || !orderInfo.orderId || transactionSaved) return;

    const saveTransaction = async () => {
      try {
        const db = await getDb();
        console.log("거래 내역 저장 시작:", {
          buyerUid: user.id,
          sellerUid: orderInfo.sellerUid,
          productId: orderInfo.itemId,
          amount: orderInfo.amount,
          escrow: orderInfo.escrow,
        });

        await addDoc(collection(db, "transactions"), {
          orderId: orderInfo.orderId,
          buyerUid: user.id,
          sellerUid: orderInfo.sellerUid,
          productId: orderInfo.itemId,
          amount: orderInfo.amount,
          status: orderInfo.escrow ? "paid_hold" : "pending",
          escrowEnabled: orderInfo.escrow,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 안전결제인 경우 상품 상태를 안전결제 완료로 업데이트
        if (orderInfo.escrow && orderInfo.itemId) {
          try {
            const { doc, updateDoc } = await import("firebase/firestore");
            const db = await getDb();

            const itemRef = doc(db, "items", orderInfo.itemId);
            await updateDoc(itemRef, {
              status: "escrow_completed", // 안전결제 완료 상태
              buyerUid: user.uid, // buyerId 대신 buyerUid 사용
              escrowCompletedAt: new Date(),
              updatedAt: new Date(),
            });

            console.log("안전결제 완료 상태로 업데이트됨");

            // 안전결제 완료 시스템 메시지는 API에서 처리하므로 여기서는 제거
            // (중복 알림 방지)
            try {
              const { getOrCreateChat } = await import("@/lib/chat/api");
              const chatResult = await getOrCreateChat(
                orderInfo.itemId,
                user.uid,
                orderInfo.sellerUid
                // 시스템 메시지는 제거 (API에서 처리)
              );

              if (chatResult.success) {
                console.log(
                  "채팅방 생성 완료 (시스템 메시지는 API에서 처리):",
                  chatResult.chatId
                );
              }
            } catch (error) {
              console.error("채팅방 생성 실패:", error);
            }

            // 상품 상태 변경 이벤트 발생
            window.dispatchEvent(
              new CustomEvent("itemStatusChanged", {
                detail: {
                  itemId: orderInfo.itemId,
                  status: "escrow_completed",
                },
              })
            );
          } catch (error) {
            console.error("안전결제 상태 업데이트 중 오류:", error);
          }
        }

        console.log("거래 내역 저장 완료");
        setTransactionSaved(true);
      } catch (error) {
        console.error("거래 내역 저장 실패:", error);
        // 테스트 결제인 경우 조용히 처리
        if (orderInfo.orderId.startsWith("MOCK_ORDER_")) {
          console.log("테스트 결제: 거래 내역 저장 실패 (무시됨)", error);
        } else {
          // 실제 결제에서는 오류 알림을 보여줄 수도 있지만, 현재는 조용히 처리
          console.log("실제 결제: 거래 내역 저장 실패", error);
        }
      }
    };

    saveTransaction();
  }, [user, orderInfo, transactionSaved, autoChatOpened]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button onClick={() => router.push("/")} variant="ghost" size="sm">
            <Home className="w-4 h-4 mr-2" />
            홈으로 가기
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 pt-12">
        <Card className="max-w-md w-full p-8">
          {/* 성공 아이콘 */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 완료</h1>
            <p className="text-gray-600">
              {orderInfo.escrow
                ? "안전거래로 결제가 완료되었습니다"
                : "결제가 성공적으로 완료되었습니다"}
            </p>
          </div>

          {/* 주문 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">주문번호</span>
              <span className="text-sm font-medium font-mono">
                {orderInfo.orderId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">결제금액</span>
              <span className="text-lg font-bold text-blue-600">
                {orderInfo.amount.toLocaleString()}원
              </span>
            </div>
            {orderInfo.escrow && (
              <div className="flex items-center justify-center pt-2 border-t border-gray-200">
                <span className="text-xs text-green-600 font-medium">
                  🛡️ 안전거래 - 상품 수령 확인 후 판매자에게 입금됩니다
                </span>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <Button
              onClick={() => {
                console.log("채팅하기 클릭 - orderInfo:", orderInfo);
                if (orderInfo.sellerUid && orderInfo.itemId) {
                  setShowChatModal(true);
                } else {
                  // 테스트 결제인 경우 조용히 처리
                  if (orderInfo.orderId.startsWith("MOCK_ORDER_")) {
                    console.log("테스트 결제: 채팅 정보 부족", {
                      sellerUid: orderInfo.sellerUid,
                      itemId: orderInfo.itemId,
                    });
                  } else {
                    toast.error(
                      `채팅 정보가 부족합니다. sellerUid: ${orderInfo.sellerUid}, itemId: ${orderInfo.itemId}`
                    );
                  }
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              판매자와 채팅하기
            </Button>
            <Button
              onClick={() => router.push("/profile/transactions")}
              variant="outline"
              className="w-full"
            >
              <Package className="w-5 h-5 mr-2" />
              거래 내역 보기
            </Button>
          </div>
        </Card>
      </div>

      {/* 채팅 모달 */}
      {showChatModal && orderInfo.sellerUid && orderInfo.itemId && (
        <EnhancedChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          sellerUid={orderInfo.sellerUid}
          itemId={orderInfo.itemId}
          tradeType={orderInfo.escrow ? "안전결제" : "직거래"}
          autoSendSystemMessage={
            orderInfo.escrow ? "escrow_completed" : undefined
          }
        />
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
