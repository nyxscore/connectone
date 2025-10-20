"use client";

import { useState, useEffect } from "react";

interface TextTransition {
  text: string;
  pause: number;
}

interface MorphingTextAnimationProps {
  transitions: TextTransition[];
  className?: string;
}

export function MorphingTextAnimation({
  transitions,
  className = "",
}: MorphingTextAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState(transitions[0]?.text || "");
  const [newCharIndices, setNewCharIndices] = useState<Set<number>>(new Set());
  const [waveEffect, setWaveEffect] = useState(false);

  useEffect(() => {
    // 첫 번째 텍스트는 전체를 애니메이션
    if (currentIndex === 0) {
      const allIndices = new Set(
        Array.from({ length: displayText.length }, (_, i) => i)
      );
      setNewCharIndices(allIndices);

      setTimeout(() => {
        setNewCharIndices(new Set());
      }, 800);
    }
  }, []);

  useEffect(() => {
    if (currentIndex >= transitions.length - 1) {
      // 마지막 텍스트가 완성되면 전체 출렁이는 효과
      if (currentIndex === transitions.length - 1 && !waveEffect) {
        setTimeout(() => {
          setWaveEffect(true);
          setTimeout(() => setWaveEffect(false), 1000);
        }, 100);
      }
      return;
    }

    const timer = setTimeout(() => {
      const currentText = transitions[currentIndex].text;
      const nextText = transitions[currentIndex + 1].text;

      // 변경되는 글자의 인덱스만 찾기 (정확한 위치 비교)
      const newIndices = new Set<number>();

      const minLength = Math.min(currentText.length, nextText.length);
      const maxLength = Math.max(currentText.length, nextText.length);

      // 기존 위치의 글자가 다른 경우
      for (let i = 0; i < minLength; i++) {
        if (currentText[i] !== nextText[i]) {
          newIndices.add(i);
        }
      }

      // 새로 추가되는 글자 (길이가 늘어나는 경우)
      if (nextText.length > currentText.length) {
        for (let i = minLength; i < nextText.length; i++) {
          newIndices.add(i);
        }
      }

      setNewCharIndices(newIndices);
      setDisplayText(nextText);

      // 애니메이션 완료 후
      setTimeout(() => {
        setNewCharIndices(new Set());
        setCurrentIndex(currentIndex + 1);
      }, 800);
    }, transitions[currentIndex].pause);

    return () => clearTimeout(timer);
  }, [currentIndex, transitions, waveEffect]);

  return (
    <span className={`inline-block ${className}`}>
      {displayText.split("").map((char, index) => (
        <span
          key={`${currentIndex}-${index}`}
          className={`inline-block ${
            newCharIndices.has(index)
              ? "animate-fade-in-smooth"
              : waveEffect
                ? "animate-wave"
                : "transition-all duration-300"
          }`}
          style={{
            animationDelay: newCharIndices.has(index)
              ? `${index * 40}ms`
              : waveEffect
                ? `${index * 30}ms`
                : "0ms",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
