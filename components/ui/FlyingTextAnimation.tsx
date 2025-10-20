"use client";

import { useState, useEffect } from "react";

interface TextTransition {
  text: string;
  pause: number; // 다음 텍스트로 넘어가기 전 대기 시간
}

interface FlyingTextAnimationProps {
  transitions: TextTransition[];
  className?: string;
  characterDelay?: number; // 각 글자가 나타나는 간격
}

export function FlyingTextAnimation({
  transitions,
  className = "",
  characterDelay = 100,
}: FlyingTextAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState(transitions[0]?.text || "");
  const [animatingChars, setAnimatingChars] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (currentIndex >= transitions.length - 1) {
      return;
    }

    const timer = setTimeout(() => {
      const nextText = transitions[currentIndex + 1].text;
      setDisplayText(nextText);

      // 모든 글자에 애니메이션 효과
      const chars = new Set(
        Array.from({ length: nextText.length }, (_, i) => i)
      );
      setAnimatingChars(chars);

      // 애니메이션 완료 후 상태 초기화
      setTimeout(
        () => {
          setAnimatingChars(new Set());
          setCurrentIndex(currentIndex + 1);
        },
        nextText.length * characterDelay + 500
      );
    }, transitions[currentIndex].pause);

    return () => clearTimeout(timer);
  }, [currentIndex, transitions, characterDelay]);

  return (
    <span className={`inline-block ${className}`}>
      {displayText.split("").map((char, index) => (
        <span
          key={`${currentIndex}-${index}`}
          className={`inline-block ${
            animatingChars.has(index) ? "animate-fly-in" : ""
          }`}
          style={{
            animationDelay: animatingChars.has(index)
              ? `${index * characterDelay}ms`
              : "0ms",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
