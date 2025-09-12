"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import {
  X,
  CreditCard,
  Shield,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Product } from "../../data/types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onPaymentSuccess: (transactionId: string) => void;
}

type PaymentStep = "info" | "payment" | "processing" | "success" | "error";

export function PaymentModal({
  isOpen,
  onClose,
  product,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("info");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    setError("");
    setCurrentStep("processing");

    try {
      // 플레이스홀더 결제 처리
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기

      // 실제로는 createPayment API 호출
      const response = await fetch("/api/transactions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          amount: product.price,
          paymentMethod,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentStep("success");
        onPaymentSuccess(result.data.id);
      } else {
        setError(result.error || "결제에 실패했습니다.");
        setCurrentStep("error");
      }
    } catch (err) {
      setError("결제 처리 중 오류가 발생했습니다.");
      setCurrentStep("error");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep("info");
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setCardholderName("");
    setError("");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const renderStep = () => {
    switch (currentStep) {
      case "info":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                안전결제 (에스크로)
              </h2>
              <p className="text-gray-600">
                구매자와 판매자 모두를 보호하는 안전한 결제 시스템입니다.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">결제 플로우</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      1
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">
                    결제 완료 후 에스크로로 보관
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      2
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">
                    판매자가 상품 배송
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      3
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">
                    배송 완료 확인 후 판매자에게 정산
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">결제 금액</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                에스크로 수수료 포함 (무료)
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={() => setCurrentStep("payment")}
                className="flex-1"
              >
                결제 진행
              </Button>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900">
                결제 정보 입력
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카드 번호
                </label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    만료일
                  </label>
                  <Input
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <Input
                    placeholder="123"
                    value={cvv}
                    onChange={e => setCvv(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카드 소유자명
                </label>
                <Input
                  placeholder="홍길동"
                  value={cardholderName}
                  onChange={e => setCardholderName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("info")}
                className="flex-1"
              >
                이전
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!cardNumber || !expiryDate || !cvv || !cardholderName}
                className="flex-1"
              >
                결제하기
              </Button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              결제 처리 중...
            </h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              결제 완료!
            </h2>
            <p className="text-gray-600 mb-6">
              안전결제가 완료되었습니다. 에스크로로 보관됩니다.
            </p>
            <Button onClick={handleClose} className="w-full">
              확인
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">결제 실패</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("payment")}
                className="flex-1"
              >
                다시 시도
              </Button>
              <Button onClick={handleClose} className="flex-1">
                닫기
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">안전결제</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>
    </div>
  );
}

