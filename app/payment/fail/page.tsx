"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { XCircle, Home, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderInfo, setOrderInfo] = useState({
    orderId: "",
    message: "",
  });

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const message = searchParams.get("message") || "결제에 실패했습니다.";

    if (orderId) {
      setOrderInfo({
        orderId,
        message,
      });
      toast.error("결제가 실패했습니다.");
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        {/* 실패 아이콘 */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
          <p className="text-gray-600">{orderInfo.message}</p>
        </div>

        {/* 주문 정보 */}
        {orderInfo.orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">주문번호</span>
              <span className="text-sm font-medium font-mono">
                {orderInfo.orderId}
              </span>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="space-y-3">
          <Button onClick={() => router.back()} className="w-full">
            <RotateCcw className="w-5 h-5 mr-2" />
            다시 시도하기
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            홈으로 가기
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
