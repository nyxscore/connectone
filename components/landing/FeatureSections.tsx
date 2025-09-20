"use client";

import { Truck, Award, Camera, TrendingUp, Shield, Users } from "lucide-react";

interface FeatureSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
  bgColor: string;
  iconColor: string;
}

const FeatureSection = ({
  id,
  icon,
  title,
  subtitle,
  bullets,
  bgColor,
  iconColor,
}: FeatureSectionProps) => {
  return (
    <section id={id} className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 왼쪽: 아이콘 + 제목 + 부제목 */}
          <div className="text-center lg:text-left">
            <div
              className={`${bgColor} w-24 h-24 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-8 shadow-lg`}
            >
              <div className={`${iconColor} text-4xl`}>{icon}</div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {title}
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-medium">
              {subtitle}
            </p>
          </div>

          {/* 오른쪽: 상세 내용 */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
            <div className="space-y-6">
              {bullets.map((bullet, index) => (
                <div key={index} className="flex items-start group">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 mt-1 shadow-md group-hover:scale-110 transition-transform duration-200">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export function FeatureSections() {
  const sections = [
    {
      id: "professional-shipping",
      icon: <Truck className="w-10 h-10" />,
      title: "전문 화물 연계 배송",
      subtitle:
        "무거운 악기도 걱정 끝 – 제휴 화물 운송으로 전국 어디든 안전·저렴 배송",
      bullets: [
        "피아노·드럼 등 대형 악기 전용 운송으로 안전하게 배송합니다.",
        "협력 물류사 단가 계약으로 비용을 절감하고, 픽업·포장·보험까지 일괄 지원합니다.",
        "전국 어디든 24-48시간 내 안전 배송으로 거리 걱정 없이 거래하세요.",
      ],
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: "expert-appraisal",
      icon: <Award className="w-10 h-10" />,
      title: "전문가 감정 서비스",
      subtitle: "명품 악기, 전문가가 직접 보증",
      bullets: [
        "고가 악기 대상으로 공인 감정사가 상태·진품·가치를 직접 인증합니다.",
        "거래 후 보증서를 발급해 재판매 가치를 유지하고 투자 가치를 보장합니다.",
        "전문가 인증을 받은 악기에는 특별 뱃지가 부여되어 신뢰도를 높입니다.",
      ],
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      id: "ai-image-inspection",
      icon: <Camera className="w-10 h-10" />,
      title: "AI 이미지 감정",
      subtitle: "사진 한 장으로 즉시 등급·상태 판정",
      bullets: [
        "업로드 즉시 AI가 흠집·마모·변색을 정밀하게 탐지하고 상태를 분석합니다.",
        "워터마크 인증 이미지를 자동 생성해 조작 방지와 신뢰성을 보장합니다.",
        "초보자도 전문가 수준의 상태 평가를 받을 수 있어 안심하고 거래하세요.",
      ],
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      id: "real-time-pricing",
      icon: <TrendingUp className="w-10 h-10" />,
      title: "실시간 시세 서비스",
      subtitle: "모델별 최근 거래가 한눈에 (Coming Soon)",
      bullets: [
        "ConnecTone 거래 DB와 제휴 악기사 매입가를 기반으로 정확한 시세를 제공합니다.",
        "브랜드·모델·연식별 가격 범위 차트로 시장 동향을 한눈에 파악하세요.",
        "합리적 거래가와 협상 포인트를 제시해 공정한 거래를 도와드립니다.",
      ],
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      id: "safe-payment",
      icon: <Shield className="w-10 h-10" />,
      title: "안전결제·에스크로",
      subtitle: "돈은 안전계좌에, 거래는 마음 놓고",
      bullets: [
        "제3자 에스크로 계좌에서 상품 확인 후 정산하는 안전한 결제 시스템입니다.",
        "카드·계좌·간편결제를 모두 지원하고, 분쟁·환불 정책과 영수증을 자동 발급합니다.",
        "구매자와 판매자 모두를 보호하는 중립적인 결제 시스템으로 안심하고 거래하세요.",
      ],
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      id: "musician-community",
      icon: <Users className="w-10 h-10" />,
      title: "뮤지션 커뮤니티 & 신뢰도 등급",
      subtitle: "음악인끼리, 믿고 만나는 공간",
      bullets: [
        "거래 횟수·후기·응답 속도를 반영한 등급(Chord~Bravura)으로 신뢰도를 확인하세요.",
        "레슨·협업·공연 네트워킹 허브로 음악인들만의 특별한 커뮤니티를 제공합니다.",
        "프로필에 등급·거래내역·후기가 표시되어 믿을 수 있는 상대를 쉽게 찾을 수 있습니다.",
      ],
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      {sections.map((section, index) => (
        <div
          key={section.id}
          className={
            index % 2 === 0
              ? "bg-white"
              : "bg-gradient-to-r from-blue-50/30 to-purple-50/30"
          }
        >
          <FeatureSection {...section} />
        </div>
      ))}
    </div>
  );
}
