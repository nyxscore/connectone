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

export function MemberGradeSystem({ currentGrade }: MemberGradeSystemProps) {
  if (!currentGrade) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">등급 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const info = GRADE_SYSTEM[currentGrade];

  return (
    <div className={`p-4 rounded-lg border-2 ${info.bgColor} border-gray-200`}>
      <div className="flex items-center gap-8">
        {/* 왼쪽: 등급 정보 */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <div className="text-4xl">{info.emoji}</div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-xl font-bold ${info.color}`}>{info.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                현재 등급
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{info.condition}</p>
          </div>
        </div>

        {/* 오른쪽: 주요 혜택 (처음 3개만) */}
        <div className="hidden md:block flex-1">
          <ul className="space-y-1">
            {info.benefits.slice(0, 3).map((benefit, index) => (
              <li
                key={index}
                className="text-sm text-gray-700 flex items-center"
              >
                <span className="text-green-500 mr-2">✓</span>
                {benefit}
              </li>
            ))}
            {info.benefits.length > 3 && (
              <li className="text-xs text-gray-500 ml-4">
                +{info.benefits.length - 3}개 추가 혜택
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function GradeBenefitsSummary() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          회원 등급 시스템
        </h2>
        <p className="text-gray-600">
          Chord 테마의 등급 시스템으로 신뢰할 수 있는 거래를 만들어보세요!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(GRADE_SYSTEM).map(([grade, info]) => (
          <div
            key={grade}
            className={`p-6 rounded-lg border-2 ${info.bgColor} border-gray-200 hover:border-gray-300 transition-colors`}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{info.emoji}</div>
              <h3 className={`text-xl font-bold ${info.color}`}>{info.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{info.condition}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 text-sm">
                주요 혜택:
              </h4>
              <ul className="space-y-1">
                {info.benefits.slice(0, 3).map((benefit, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 flex items-start"
                  >
                    <span className="text-green-500 mr-2">✓</span>
                    {benefit}
                  </li>
                ))}
                {info.benefits.length > 3 && (
                  <li className="text-xs text-gray-500">
                    +{info.benefits.length - 3}개 추가 혜택
                  </li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          등급은 거래 누적금액, 평점, 분쟁 없음 등을 종합적으로 평가하여
          결정됩니다.
        </p>
      </div>
    </div>
  );
}
