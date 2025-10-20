"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import Link from "next/link";

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorMessage = searchParams?.get("message") || "결제에 실패했습니다.";

  useEffect(() => {
    console.error("결제 실패:", errorMessage);
  }, [errorMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* 실패 아이콘 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">결제 실패</h1>
          <p className="text-gray-600">결제 처리 중 문제가 발생했습니다.</p>
        </div>

        {/* 오류 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">오류 내용</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              이런 경우 확인해주세요
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>카드 한도가 충분한지 확인해주세요</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>카드 정보가 정확한지 확인해주세요</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>네트워크 연결 상태를 확인해주세요</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>문제가 계속되면 다른 결제 수단을 이용해주세요</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-4">
          <Button onClick={() => router.back()} className="w-full" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 시도하기
          </Button>

          <Button
            onClick={() => router.push("/lessons")}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            강사 목록으로 돌아가기
          </Button>

          <Link
            href="/chat"
            className="text-center text-sm text-gray-600 hover:text-gray-900 mt-2"
          >
            문제가 계속되나요? 고객센터에 문의하기 →
          </Link>
        </div>
      </div>
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
      <FailContent />
    </Suspense>
  );
}


