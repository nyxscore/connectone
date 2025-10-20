"use client";

import { SequentialTypingAnimation } from "./SequentialTypingAnimation";

interface BrandNameAnimationProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  loop?: boolean;
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

export function BrandNameAnimation({
  className = "",
  size = "lg",
  loop = false,
}: BrandNameAnimationProps) {
  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <SequentialTypingAnimation
        sequences={[
          { text: "Connect On", pause: 1500, eraseSpeed: 80 },
          { text: "Connect One", pause: 1500, eraseSpeed: 80 },
          { text: "ConnecTone", pause: 3000, eraseSpeed: 0 }, // 최종 이름은 유지
        ]}
        typingSpeed={100}
        loop={loop}
        showCursor={true}
        cursorClassName="animate-pulse text-blue-600"
      />
    </div>
  );
}

// 간단한 버전 - 단순히 ConnecTone만 타이핑
export function SimpleConnecToneAnimation({
  className = "",
  size = "lg",
}: Omit<BrandNameAnimationProps, "loop">) {
  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <SequentialTypingAnimation
        sequences={[{ text: "ConnecTone", pause: 0, eraseSpeed: 0 }]}
        typingSpeed={100}
        loop={false}
        showCursor={true}
        cursorClassName="animate-pulse text-blue-600"
      />
    </div>
  );
}

// 영웅 섹션용 - 더 화려한 애니메이션
export function HeroBrandAnimation({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <div className="inline-block">
        <SequentialTypingAnimation
          sequences={[
            { text: "Connect On", pause: 1200 },
            { text: "Connect One", pause: 1200 },
            {
              text: "ConnecTone",
              pause: 5000,
              eraseSpeed: 0,
            },
          ]}
          typingSpeed={120}
          loop={false}
          className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          showCursor={true}
          cursorClassName="animate-pulse text-blue-600 ml-1"
        />
      </div>
      <p className="mt-6 text-xl text-gray-600 animate-fade-in">
        음악을 연결하다, 사람을 연결하다
      </p>
    </div>
  );
}
