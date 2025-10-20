"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { ArrowLeft, CreditCard, Smartphone, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../lib/hooks/useAuth";
import toast from "react-hot-toast";
import Link from "next/link";

// Toss 클라이언트 키
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const [bookingData, setBookingData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mock">("card");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 예약 정보 가져오기
    const stored = localStorage.getItem("lessonBooking");
    if (stored) {
      setBookingData(JSON.parse(stored));
    } else {
      toast.error("예약 정보를 찾을 수 없습니다.");
      router.push("/lessons");
    }
  }, [router]);

  // Toss Payments 실제 결제
  const handleTossPayment = async () => {
    if (!bookingData) return;

    setIsProcessing(true);
    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

      await tossPayments.requestPayment("카드", {
        amount: bookingData.price,
        orderId: `lesson_${Date.now()}`,
        orderName: `${bookingData.lessonName} - ${bookingData.instructorName}`,
        customerName: user?.displayName || "사용자",
        successUrl: `${window.location.origin}/lessons/payment/success`,
        failUrl: `${window.location.origin}/lessons/payment/fail`,
      });
    } catch (error: any) {
      console.error("결제 실패:", error);
      toast.error(error.message || "결제에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock 테스트 결제
  const handleMockPayment = async () => {
    if (!bookingData) return;

    setIsProcessing(true);
    toast.loading("Mock 결제 처리 중...", { duration: 2000 });

    // 2초 딜레이 후 성공
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Mock 결제가 완료되었습니다!");

      // 성공 페이지로 이동
      router.push("/lessons/payment/success?mock=true");
    }, 2000);
  };

  const handlePayment = () => {
    if (paymentMethod === "card") {
      handleTossPayment();
    } else {
      handleMockPayment();
    }
  };

  if (loading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600 mb-6">결제를 하려면 로그인해주세요.</p>
          <Button onClick={() => router.push("/auth/login?next=/lessons")}>
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/lessons/book"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>예약 페이지로</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">결제하기</h1>
          <p className="text-gray-600">결제 방법을 선택해주세요</p>
        </div>

        {/* 예약 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">예약 정보</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">강사</span>
              <span className="font-semibold">
                {bookingData.instructorName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">레슨</span>
              <span className="font-semibold">{bookingData.lessonName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">날짜</span>
              <span className="font-semibold">
                {new Date(bookingData.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">시간</span>
              <span className="font-semibold">{bookingData.time}</span>
            </div>
            {bookingData.message && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">
                  강사에게 전달할 메시지
                </p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {bookingData.message}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 결제 방법 선택 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">결제 방법</h2>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                paymentMethod === "card"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Toss Payments (실제 결제)
                    </p>
                    <p className="text-sm text-gray-600">
                      신용카드로 안전하게 결제하세요
                    </p>
                  </div>
                </div>
                {paymentMethod === "card" && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("mock")}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                paymentMethod === "mock"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Mock 테스트 결제
                    </p>
                    <p className="text-sm text-gray-600">
                      테스트용 가상 결제 (실제 결제 없음)
                    </p>
                  </div>
                </div>
                {paymentMethod === "mock" && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* 결제 금액 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">
              총 결제 금액
            </span>
            <span className="text-3xl font-bold text-blue-600">
              {bookingData.price.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 결제 버튼 */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              처리 중...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              {paymentMethod === "card" ? "Toss로 결제하기" : "Mock 결제하기"}
            </>
          )}
        </Button>

        {/* 안내 문구 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">결제 안내</p>
              <ul className="space-y-1 text-blue-800">
                <li>• 결제 후 강사가 일정을 확정하면 예약이 완료됩니다.</li>
                <li>• 레슨 24시간 전까지 무료 취소가 가능합니다.</li>
                <li>• Mock 테스트는 실제 결제가 진행되지 않습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}


