"use client";

import { UserGrade } from "@/data/types";

interface GradeInfo {
  emoji: string;
  name: string;
  condition: string;
  benefits: string[];
  color: string;
  bgColor: string;
}

const GRADE_SYSTEM: Record<UserGrade, GradeInfo> = {
  C: {
    emoji: "🌱",
    name: "Chord",
    condition: "신규 회원",
    benefits: [
      "매월 AI 감정 촬영권 1장",
      "상품 등록 시 기본 검증 서비스",
      "악기 상태 체크리스트 제공",
    ],
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
  D: {
    emoji: "🎵",
    name: "Duo",
    condition: "거래 누적금액 10만원 이상",
    benefits: [
      "매월 AI 감정 촬영권 2장",
      "상품 등록 우선 노출",
      "악기 전문가 상담 서비스",
      "거래 완료 시 리뷰 우선 노출",
    ],
    color: "text-sky-600",
    bgColor: "bg-sky-50",
  },
  E: {
    emoji: "🎼",
    name: "Ensemble",
    condition: "거래 누적금액 30만원 이상",
    benefits: [
      "매월 AI 감정 촬영권 3장",
      "상품 끌어올리기 1회 무료",
      "악기 상태 전문 검증 서비스",
      "거래 완료 시 특별 배지 지급",
      "생일축하 AI 감정 촬영권 1장 추가",
    ],
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  F: {
    emoji: "🎹",
    name: "Forte",
    condition: "거래 누적금액 50만원 이상",
    benefits: [
      "매월 AI 감정 촬영권 5장",
      "상품 끌어올리기 3회 무료",
      "VIP 고객지원 + 전용 상담사",
      "악기 전문가 직접 검증 서비스",
      "생일축하 AI 감정 촬영권 2장 추가",
      "거래 완료 시 골드 배지 지급",
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  G: {
    emoji: "🎺",
    name: "Grand",
    condition: "거래 누적금액 100만원 이상",
    benefits: [
      "매월 AI 감정 촬영권 8장",
      "상품 끌어올리기 5회 무료",
      "전용 상담사 + 우선 고객지원",
      "악기 전문가 직접 검증 + 상태 보고서",
      "생일축하 AI 감정 촬영권 3장 추가",
      "신상품 우선 구매권 + 예약권",
      "거래 완료 시 플래티넘 배지 지급",
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  A: {
    emoji: "🎸",
    name: "Allegro",
    condition: "거래 누적금액 200만원 이상",
    benefits: [
      "매월 AI 감정 촬영권 12장",
      "상품 끌어올리기 무제한",
      "전용 상담사 + 우선 고객지원",
      "악기 전문가 직접 검증 + 상세 분석 보고서",
      "생일축하 AI 감정 촬영권 5장 추가",
      "신상품 우선 구매권 + 예약권",
      "개인 맞춤 악기 추천 서비스",
      "거래 완료 시 다이아몬드 배지 지급",
    ],
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  B: {
    emoji: "🎻",
    name: "Bravura",
    condition: "거래 누적금액 500만원 이상",
    benefits: [
      "매월 AI 감정 촬영권 무제한",
      "상품 끌어올리기 무제한 + 우선 노출",
      "전용 상담사 + 당일 고객지원",
      "악기 전문가 직접 검증 + 상세 분석 + 투자 가치 평가",
      "생일축하 AI 감정 촬영권 10장 추가",
      "신상품 우선 구매권 + 예약권 + 개인 맞춤 알림",
      "개인 맞춤 악기 추천 + 투자 가이드 서비스",
      "연간 감사 선물 + VIP 이벤트 초대",
      "거래 완료 시 레전드 배지 지급",
    ],
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
};

interface MemberGradeSystemProps {
  currentGrade?: UserGrade;
  showCurrentOnly?: boolean;
}

export const MemberGradeSystem = ({
  currentGrade,
  showCurrentOnly = false,
}: MemberGradeSystemProps) => {
  const grades =
    showCurrentOnly && currentGrade
      ? [currentGrade]
      : (Object.keys(GRADE_SYSTEM) as UserGrade[]);

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ConnecTone 회원 등급 시스템
        </h2>
        <p className="text-gray-600">
          악기 거래를 통해 더 많은 혜택을 받아보세요!
        </p>
      </div>

      <div className="grid gap-4">
        {grades.map(grade => {
          const gradeInfo = GRADE_SYSTEM[grade];
          const isCurrentGrade = currentGrade === grade;

          return (
            <div
              key={grade}
              className={`rounded-lg border-2 p-6 transition-all ${
                isCurrentGrade
                  ? "border-blue-500 bg-blue-50 shadow-lg"
                  : "border-gray-200 bg-white hover:shadow-md"
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* 이모지 */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full ${gradeInfo.bgColor} flex items-center justify-center text-3xl`}
                  >
                    {gradeInfo.emoji}
                  </div>
                </div>

                {/* 회원 등급 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className={`text-xl font-bold ${gradeInfo.color}`}>
                      {gradeInfo.name}
                    </h3>
                    {isCurrentGrade && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                        현재 등급
                      </span>
                    )}
                  </div>

                  {/* 등급 조건 */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      등급 조건:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {gradeInfo.condition}
                    </span>
                  </div>

                  {/* 등급 혜택 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      등급 혜택:
                    </h4>
                    <ul className="space-y-1">
                      {gradeInfo.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-sm text-gray-600">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showCurrentOnly && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">등급 상승 안내</h4>
          <p className="text-sm text-gray-600">
            • 등급은 악기 거래 누적금액을 기준으로 자동으로 상승됩니다.
            <br />
            • 등급 혜택은 등급 상승 즉시 적용됩니다.
            <br />• 거래 내역은 마이페이지에서 확인하실 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};

// 등급별 혜택 요약 컴포넌트
export const GradeBenefitsSummary = ({
  currentGrade,
}: {
  currentGrade?: UserGrade;
}) => {
  if (!currentGrade) return null;

  const gradeInfo = GRADE_SYSTEM[currentGrade];

  return (
    <div
      className={`p-4 rounded-lg ${gradeInfo.bgColor} border border-gray-200`}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="text-2xl">{gradeInfo.emoji}</div>
        <div>
          <h3 className={`font-bold ${gradeInfo.color}`}>
            {gradeInfo.name} 회원
          </h3>
          <p className="text-sm text-gray-600">{gradeInfo.condition}</p>
        </div>
      </div>

      <div className="space-y-1">
        {gradeInfo.benefits.slice(0, 3).map((benefit, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-green-500 text-xs">✓</span>
            <span className="text-sm text-gray-700">{benefit}</span>
          </div>
        ))}
        {gradeInfo.benefits.length > 3 && (
          <p className="text-xs text-gray-500">
            +{gradeInfo.benefits.length - 3}개 추가 혜택
          </p>
        )}
      </div>
    </div>
  );
};
