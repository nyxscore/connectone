"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MessageSquare,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../lib/hooks/useAuth";
import toast from "react-hot-toast";
import Link from "next/link";

// Mock 강사 데이터 (실제로는 Firestore에서 가져옴)
const MOCK_INSTRUCTORS: any = {
  "1": {
    id: "1",
    name: "김민수",
    photo: "https://i.pravatar.cc/300?img=12",
    pricePerHour: 50000,
  },
  "2": {
    id: "2",
    name: "이지은",
    photo: "https://i.pravatar.cc/300?img=5",
    pricePerHour: 60000,
  },
  "3": {
    id: "3",
    name: "박준혁",
    photo: "https://i.pravatar.cc/300?img=33",
    pricePerHour: 45000,
  },
  "4": {
    id: "4",
    name: "최서연",
    photo: "https://i.pravatar.cc/300?img=9",
    pricePerHour: 55000,
  },
  "5": {
    id: "5",
    name: "정우성",
    photo: "https://i.pravatar.cc/300?img=60",
    pricePerHour: 48000,
  },
  "6": {
    id: "6",
    name: "강혜진",
    photo: "https://i.pravatar.cc/300?img=23",
    pricePerHour: 65000,
  },
};

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const instructorId = searchParams?.get("instructor") || "1";
  const lessonName = searchParams?.get("lesson") || "1:1 개인 레슨";
  const instructor = MOCK_INSTRUCTORS[instructorId];

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [message, setMessage] = useState("");

  // 사용 가능한 날짜 (오늘부터 30일)
  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.setDate(date.getDate() + i));
    return date;
  });

  // 사용 가능한 시간
  const availableTimes = [
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("날짜와 시간을 선택해주세요.");
      return;
    }

    // 다음 단계: 결제 페이지로 이동
    const bookingData = {
      instructorId,
      instructorName: instructor.name,
      lessonName,
      date: selectedDate.toISOString(),
      time: selectedTime,
      message,
      price: instructor.pricePerHour,
    };

    // 로컬 스토리지에 임시 저장
    localStorage.setItem("lessonBooking", JSON.stringify(bookingData));

    toast.success("예약 정보가 저장되었습니다. 결제를 진행해주세요.");
    router.push(`/lessons/payment?instructor=${instructorId}`);
  };

  if (loading) {
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
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600 mb-6">
            레슨 예약을 하려면 로그인해주세요.
          </p>
          <Button
            onClick={() =>
              router.push(
                `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`
              )
            }
          >
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            강사를 찾을 수 없습니다
          </h2>
          <Link href="/lessons" className="text-blue-600 hover:underline">
            ← 강사 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/lessons"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>강사 목록으로</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">레슨 예약</h1>
          <p className="text-gray-600">날짜와 시간을 선택해주세요</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* 왼쪽: 예약 폼 */}
          <div className="md:col-span-2 space-y-6">
            {/* 강사 정보 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                강사 정보
              </h2>
              <div className="flex items-center space-x-4">
                <img
                  src={instructor.photo}
                  alt={instructor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {instructor.name}
                  </p>
                  <p className="text-sm text-gray-600">{lessonName}</p>
                  <p className="text-sm font-bold text-blue-600">
                    {instructor.pricePerHour.toLocaleString()}원/시간
                  </p>
                </div>
              </div>
            </div>

            {/* 날짜 선택 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                날짜 선택
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {availableDates.slice(0, 21).map((date, idx) => {
                  const isSelected =
                    selectedDate?.toDateString() === date.toDateString();
                  const isPast = date < new Date();

                  return (
                    <button
                      key={idx}
                      onClick={() => !isPast && setSelectedDate(date)}
                      disabled={isPast}
                      className={`p-3 rounded-lg text-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold"
                          : isPast
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-50 hover:bg-blue-50 text-gray-900"
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {date.toLocaleDateString("ko-KR", { weekday: "short" })}
                      </div>
                      <div className="text-sm font-semibold">
                        {date.getDate()}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedDate && (
                <p className="mt-4 text-sm text-gray-600">
                  선택한 날짜:{" "}
                  {selectedDate.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </p>
              )}
            </div>

            {/* 시간 선택 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                시간 선택
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedTime === time
                        ? "bg-blue-600 text-white font-bold"
                        : "bg-gray-50 hover:bg-blue-50 text-gray-900"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* 메시지 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                강사에게 전달할 메시지 (선택사항)
              </h2>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="레슨 관련 질문이나 요청사항을 남겨주세요..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* 오른쪽: 예약 요약 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                예약 요약
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">강사</span>
                  <span className="font-semibold">{instructor.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">레슨</span>
                  <span className="font-semibold">{lessonName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">날짜</span>
                  <span className="font-semibold">
                    {selectedDate
                      ? selectedDate.toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })
                      : "미선택"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">시간</span>
                  <span className="font-semibold">
                    {selectedTime || "미선택"}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold">총 금액</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {instructor.pricePerHour.toLocaleString()}원
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBooking}
                className="w-full"
                size="lg"
                disabled={!selectedDate || !selectedTime}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                결제하기
              </Button>

              <p className="text-xs text-gray-500 text-center mt-3">
                예약 확정 후 강사와 일정 조율이 진행됩니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
