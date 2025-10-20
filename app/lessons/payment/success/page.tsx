"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import Link from "next/link";
import toast from "react-hot-toast";
import { db } from "../../../../lib/api/firebase-ultra-safe";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../../lib/hooks/useAuth";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [bookingData, setBookingData] = useState<any>(null);
  const [isMock, setIsMock] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    const mock = searchParams?.get("mock") === "true";
    setIsMock(mock);

    // 로컬 스토리지에서 예약 정보 가져오기
    const stored = localStorage.getItem("lessonBooking");
    if (stored) {
      const data = JSON.parse(stored);
      setBookingData(data);

      // Firestore에 레슨 예약 저장
      saveLessonToFirestore(data, mock);
    }
  }, [searchParams]);

  const saveLessonToFirestore = async (data: any, isMockPayment: boolean) => {
    if (!user) return;

    try {
      const lessonsCollection = collection(db, "lessons");
      const newLesson = await addDoc(lessonsCollection, {
        instructorId: data.instructorId,
        instructorName: data.instructorName,
        userId: user.uid,
        userName: user.displayName || "사용자",
        userEmail: user.email,
        lessonName: data.lessonName,
        date: data.date,
        time: data.time,
        message: data.message || "",
        price: data.price,
        status: "pending", // pending, confirmed, completed, cancelled
        paymentMethod: isMockPayment ? "mock" : "toss",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setLessonId(newLesson.id);
      console.log("✅ 레슨 예약 저장 완료:", newLesson.id);

      // 로컬 스토리지 정리
      localStorage.removeItem("lessonBooking");

      toast.success("레슨 예약이 완료되었습니다!");
    } catch (error) {
      console.error("❌ 레슨 예약 저장 실패:", error);
      toast.error("예약 저장 중 오류가 발생했습니다.");
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">예약 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* 성공 아이콘 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isMock ? "Mock 결제 완료!" : "결제가 완료되었습니다!"}
          </h1>
          <p className="text-gray-600">
            레슨 예약이 성공적으로 등록되었습니다.
          </p>
        </div>

        {/* 예약 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">예약 정보</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">강사</p>
                <p className="font-semibold text-gray-900">
                  {bookingData.instructorName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {bookingData.lessonName}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">날짜</p>
                <p className="font-semibold text-gray-900">
                  {new Date(bookingData.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">시간</p>
                <p className="font-semibold text-gray-900">
                  {bookingData.time}
                </p>
              </div>
            </div>

            {bookingData.message && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  강사에게 전달한 메시지
                </p>
                <p className="text-sm text-gray-900">{bookingData.message}</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">결제 금액</span>
              <span className="text-2xl font-bold text-blue-600">
                {bookingData.price.toLocaleString()}원
              </span>
            </div>
            {isMock && (
              <p className="text-sm text-green-600 mt-2 text-right">
                ✓ Mock 테스트 (실제 결제 없음)
              </p>
            )}
          </div>
        </div>

        {/* 다음 단계 안내 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">다음 단계</h2>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-gray-700">
                강사가 예약을 확인하고 일정을 확정합니다.
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <p className="text-gray-700">
                예약이 확정되면 알림을 보내드립니다.
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <p className="text-gray-700">레슨 날짜에 맞춰 준비해주세요!</p>
            </li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => router.push("/profile")}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            내 예약 보기
          </Button>
          <Button
            onClick={() => router.push("/lessons")}
            className="flex-1"
            size="lg"
          >
            다른 강사 찾기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
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
      <SuccessContent />
    </Suspense>
  );
}


