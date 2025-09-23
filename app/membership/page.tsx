"use client";

import { useState } from "react";
import {
  MemberGradeSystem,
  GradeBenefitsSummary,
} from "@/components/ui/MemberGradeSystem";
import { UserGrade } from "@/data/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/hooks/useAuth";
import { Crown, Star, Gift, Truck } from "lucide-react";

export default function MembershipPage() {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<UserGrade | undefined>(
    user?.grade
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ConnecTone 회원 등급
          </h1>
          <p className="text-gray-600">
            악기 거래를 통해 더 많은 혜택을 받아보세요
          </p>
        </div>

        {/* 현재 등급 카드 */}
        {user && (
          <div className="mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    나의 회원 등급
                  </h2>
                  <GradeBenefitsSummary currentGrade={user.grade} />
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">
                    거래 누적금액
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {user.tradeCount > 0
                      ? `${(user.tradeCount * 50000).toLocaleString()}원`
                      : "0원"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    거래 {user.tradeCount}회 완료
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 등급별 혜택 비교 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            등급별 혜택 비교
          </h2>

          {/* 등급 필터 */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={selectedGrade ? "outline" : "default"}
                size="sm"
                onClick={() => setSelectedGrade(undefined)}
              >
                전체 보기
              </Button>
              {user && (
                <Button
                  variant={selectedGrade === user.grade ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGrade(user.grade)}
                >
                  내 등급
                </Button>
              )}
            </div>
          </div>

          <MemberGradeSystem
            currentGrade={user?.grade}
            showCurrentOnly={!!selectedGrade}
          />
        </div>

        {/* 등급 상승 가이드 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              등급 상승 방법
            </h3>
            <p className="text-gray-600 text-sm">
              악기 거래 누적금액을 기준으로 자동으로 등급이 상승됩니다. 더 많은
              악기 거래를 통해 더 많은 혜택을 받아보세요!
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              특별 혜택
            </h3>
            <p className="text-gray-600 text-sm">
              생일 축하 쿠폰, 무료배송, 포인트 적립, 상품 끌어올리기 등 악기
              거래에 특화된 혜택을 제공합니다.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              VIP 서비스
            </h3>
            <p className="text-gray-600 text-sm">
              고등급 회원을 위한 전용 상담사, 우선 배송, 신상품 우선 구매권,
              상품 끌어올리기 무제한 등 프리미엄 서비스를 제공합니다.
            </p>
          </Card>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center">
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              지금 바로 등급 혜택을 확인해보세요!
            </h2>
            <p className="text-gray-600 mb-6">
              ConnecTone에서 악기 거래와 함께하는 특별한 경험을 시작하세요.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg">악기 둘러보기</Button>
              <Button variant="outline" size="lg">
                거래 내역 확인
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
