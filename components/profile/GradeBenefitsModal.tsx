"use client";

import { useState } from "react";
import {
  MemberGradeSystem,
  GradeBenefitsSummary,
} from "../ui/MemberGradeSystem";
import { UserGrade } from "../../data/types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { X, Crown, Star, Gift } from "lucide-react";

interface GradeBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGrade?: UserGrade;
}

export function GradeBenefitsModal({
  isOpen,
  onClose,
  currentGrade,
}: GradeBenefitsModalProps) {
  const [selectedGrade, setSelectedGrade] = useState<UserGrade | undefined>(
    currentGrade
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                회원 등급 혜택
              </h2>
              <p className="text-sm text-gray-600">
                악기 거래를 통해 더 많은 혜택을 받아보세요
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 모달 내용 */}
          <div className="p-6">
            {/* 등급 필터 */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={selectedGrade ? "outline" : "default"}
                  size="sm"
                  onClick={() => setSelectedGrade(undefined)}
                  className={
                    !selectedGrade
                      ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                  }
                >
                  전체 보기
                </Button>
                {currentGrade && (
                  <Button
                    variant={
                      selectedGrade === currentGrade ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedGrade(currentGrade)}
                    className={
                      selectedGrade === currentGrade
                        ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                    }
                  >
                    내 등급
                  </Button>
                )}
              </div>
            </div>

            {/* 등급 시스템 */}
            <MemberGradeSystem
              currentGrade={currentGrade}
              showCurrentOnly={!!selectedGrade}
            />

            {/* 등급 상승 가이드 */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <Card className="p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  등급 상승 방법
                </h4>
                <p className="text-gray-600 text-xs">
                  악기 거래 누적금액을 기준으로 자동으로 등급이 상승됩니다.
                </p>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  특별 혜택
                </h4>
                <p className="text-gray-600 text-xs">
                  생일 축하 쿠폰, 무료배송, 포인트 적립 등 특화된 혜택을
                  제공합니다.
                </p>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  VIP 서비스
                </h4>
                <p className="text-gray-600 text-xs">
                  고등급 회원을 위한 전용 상담사, 우선 배송 등 프리미엄 서비스를
                  제공합니다.
                </p>
              </Card>
            </div>

            {/* 하단 버튼 */}
            <div className="flex justify-center mt-6">
              <Button onClick={onClose} size="lg">
                확인
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
