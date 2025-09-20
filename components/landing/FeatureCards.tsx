"use client";

import { Card } from "../ui/Card";
import { Truck, Award, Camera, TrendingUp, Shield, Users } from "lucide-react";

interface FeatureCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const FeatureCard = ({
  id,
  icon,
  title,
  description,
  href,
}: FeatureCardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(href.replace("#", ""));
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="block group"
      aria-label={`${title} 섹션으로 이동`}
    >
      <div className="gradient-border group">
        <Card className="relative p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-3 rounded-3xl shadow-xl hover-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-gradient-to-br from-white to-gray-50 particle-bg">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
            <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-lg font-medium text-slate-600 group-hover:text-slate-800 transition-colors leading-relaxed">
            {description}
          </p>
        </Card>
      </div>
    </a>
  );
};

export function FeatureCards() {
  const features = [
    {
      id: "professional-shipping",
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      title: "전문 화물 연계 배송",
      description:
        "무거운 악기도 걱정 끝 – 제휴 화물 운송으로 전국 어디든 안전·저렴 배송",
      href: "#professional-shipping",
    },
    {
      id: "expert-appraisal",
      icon: <Award className="w-8 h-8 text-green-600" />,
      title: "전문가 감정 서비스",
      description: "명품 악기, 전문가가 직접 보증",
      href: "#expert-appraisal",
    },
    {
      id: "ai-image-inspection",
      icon: <Camera className="w-8 h-8 text-purple-600" />,
      title: "AI 이미지 감정",
      description: "사진 한 장으로 즉시 등급·상태 판정",
      href: "#ai-image-inspection",
    },
    {
      id: "real-time-pricing",
      icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
      title: "실시간 시세 서비스",
      description: "모델별 최근 거래가 한눈에",
      href: "#real-time-pricing",
    },
    {
      id: "safe-payment",
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: "안전결제·에스크로",
      description: "돈은 안전계좌에, 거래는 마음 놓고",
      href: "#safe-payment",
    },
    {
      id: "musician-community",
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      title: "뮤지션 커뮤니티 & 신뢰도 등급",
      description: "음악인끼리, 믿고 만나는 공간",
      href: "#musician-community",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {features.map((feature, index) => (
        <div
          key={feature.id}
          className="animate-card-enter"
          style={{ animationDelay: `${index * 0.2}s` }}
        >
          <FeatureCard {...feature} />
        </div>
      ))}
    </div>
  );
}
