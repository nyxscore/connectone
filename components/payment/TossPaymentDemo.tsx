"use client";

import { useEffect, useRef } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { Button } from "../ui/Button";
import { CreditCard, Shield } from "lucide-react";
import toast from "react-hot-toast";

/**
 * 토스페이먼츠 결제 데모 컴포넌트
 *
 * @description
 * - 토스페이먼츠 SDK를 사용한 카드 결제 시뮬레이션
 * - 테스트 모드에서 결제창 팝업 및 성공/실패 처리
 * - 실제 결제는 이루어지지 않음 (테스트 키 사용)
 *
 * @features
 * - 카드 결제 흐름 시뮬레이션
 * - 랜덤 주문번호 생성
 * - 성공/실패 콜백 핸들러
 * - 안전거래 수수료 자동 계산
 */

interface TossPaymentDemoProps {
  amount: number; // 결제 금액 (상품 금액)
  orderName: string; // 주문명 (상품명)
  customerName?: string; // 고객명
  escrowEnabled?: boolean; // 안전거래 활성화 여부
  itemId?: string; // 상품 ID
  sellerUid?: string; // 판매자 UID
  onSuccess?: (orderId: string, amount: number) => void; // 성공 콜백
  onFail?: (error: string) => void; // 실패 콜백
}

export function TossPaymentDemo({
  amount,
  orderName,
  customerName = "구매자",
  escrowEnabled = false,
  itemId,
  sellerUid,
  onSuccess,
  onFail,
}: TossPaymentDemoProps) {
  const tossPaymentsRef = useRef<any>(null);

  // 안전거래 수수료 계산 (1.9%)
  const escrowFee = escrowEnabled ? Math.round(amount * 0.019) : 0;
  const totalAmount = amount + escrowFee;

  // 토스페이먼츠 SDK 초기화
  useEffect(() => {
    const initializeTossPayments = async () => {
      try {
        console.log("토스페이먼츠 SDK 초기화 시작...");
        const tossPayments = await loadTossPayments(
          "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq" // 테스트 클라이언트 키
        );
        tossPaymentsRef.current = tossPayments;
        console.log("토스페이먼츠 SDK 초기화 완료");
      } catch (error) {
        console.error("토스페이먼츠 SDK 초기화 실패:", error);

        // Mock 결제로 자동 전환
        console.log("Mock 결제 모드로 전환됨");
        toast.error(
          "결제 시스템 로딩 실패. 테스트 결제 모드로 진행합니다.",
          { duration: 3000 }
        );
      }
    };

    // 네트워크 상태 확인
    if (!navigator.onLine) {
      toast.error("인터넷 연결을 확인해주세요.");
      return;
    }

    initializeTossPayments();
  }, []);

  // 결제 요청 핸들러
  const handlePayment = async () => {
    if (!tossPaymentsRef.current) {
      toast.error(
        "결제 시스템이 준비되지 않았습니다. Mock 결제를 사용해주세요.",
        { duration: 2000 }
      );
      return;
    }

    try {
      // 랜덤 주문번호 생성 (timestamp + random)
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      console.log("결제 요청:", {
        orderId,
        amount: totalAmount,
        orderName,
        customerName,
        escrowEnabled,
      });

      // 결제창 띄우기
      await tossPaymentsRef.current.requestPayment("카드", {
        amount: totalAmount,
        orderId: orderId,
        orderName: orderName,
        customerName: customerName,
        successUrl: `${window.location.origin}/payment/success?orderId=${orderId}&amount=${totalAmount}&escrow=${escrowEnabled}`,
        failUrl: `${window.location.origin}/payment/fail?orderId=${orderId}`,
        // 안전거래(에스크로) 옵션
        ...(escrowEnabled && {
          escrow: true,
        }),
      });

      console.log("결제창이 열렸습니다.");
    } catch (error: any) {
      console.error("결제 요청 실패:", error);

      if (error.code === "USER_CANCEL") {
        toast("결제가 취소되었습니다.");
      } else {
        // 더 구체적인 에러 메시지 제공
        let errorMessage = "결제 요청에 실패했습니다.";

        if (error.code) {
          switch (error.code) {
            case "INVALID_CARD_COMPANY":
              errorMessage = "지원하지 않는 카드입니다.";
              break;
            case "INVALID_CARD_NUMBER":
              errorMessage = "카드 번호를 확인해주세요.";
              break;
            case "INVALID_CARD_EXPIRY":
              errorMessage = "카드 유효기간을 확인해주세요.";
              break;
            case "INVALID_CARD_PASSWORD":
              errorMessage = "카드 비밀번호를 확인해주세요.";
              break;
            case "PAY_PROCESS_CANCELED":
              errorMessage = "결제가 취소되었습니다.";
              break;
            case "PAY_PROCESS_ABORTED":
              errorMessage = "결제가 중단되었습니다.";
              break;
            case "REJECT_CARD_COMPANY":
              errorMessage = "해당 카드사에서는 결제를 거부했습니다.";
              break;
            case "INSUFFICIENT_BALANCE":
              errorMessage = "잔액이 부족합니다.";
              break;
            default:
              errorMessage =
                error.message || "결제 처리 중 오류가 발생했습니다.";
          }
        } else {
          errorMessage = error.message || "결제 처리 중 오류가 발생했습니다.";
        }

        toast.error(errorMessage);
        onFail?.(errorMessage);
      }
    }
  };

  // Mock 결제 (테스트용)
  const handleMockPayment = () => {
    const orderId = `MOCK_ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    console.log("Mock 결제 완료:", {
      orderId,
      amount: totalAmount,
      orderName,
      escrowEnabled,
      itemId,
      sellerUid,
    });

    toast.success("테스트 결제가 완료되었습니다!");

    // 성공 페이지로 이동
    const successUrl = `${window.location.origin}/payment/success?orderId=${orderId}&amount=${totalAmount}&escrow=${escrowEnabled}&itemId=${itemId || ""}&sellerUid=${sellerUid || ""}`;
    window.location.href = successUrl;
  };

  return (
    <div className="space-y-4">
      {/* 결제 정보 카드 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">상품 금액</span>
          <span className="text-base font-medium">
            {amount.toLocaleString()}원
          </span>
        </div>

        {escrowEnabled && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center">
              <Shield className="w-4 h-4 mr-1 text-green-600" />
              안전거래 수수료 (1.9%)
            </span>
            <span className="text-base font-medium text-red-600">
              +{escrowFee.toLocaleString()}원
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-lg font-semibold">총 결제 금액</span>
          <span className="text-2xl font-bold text-blue-600">
            {totalAmount.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 실제 토스 결제 버튼 */}
      <Button
        onClick={handlePayment}
        className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        토스페이먼츠로 결제하기
      </Button>

      {/* Mock 결제 버튼 (테스트용) */}
      <Button
        onClick={handleMockPayment}
        className={`w-full h-14 text-lg font-semibold ${
          escrowEnabled
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        <CreditCard className="w-5 h-5 mr-2" />
        {escrowEnabled ? "안전결제하기 (테스트)" : "결제하기 (테스트)"}
      </Button>

      {/* 안내 문구 */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>💳 테스트 모드로 실제 결제는 발생하지 않습니다</p>
        {escrowEnabled && (
          <p className="text-green-600 font-medium">
            🛡️ 안전거래: 상품 수령 확인 후 판매자에게 입금됩니다
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 사용 예시:
 *
 * <TossPaymentDemo
 *   amount={1200000}
 *   orderName="NI Komplete 88 마스터키보드"
 *   customerName="브루노마스"
 *   escrowEnabled={true}
 *   onSuccess={(orderId, amount) => {
 *     console.log("결제 성공!", orderId, amount);
 *   }}
 *   onFail={(error) => {
 *     console.log("결제 실패:", error);
 *   }}
 * />
 */
