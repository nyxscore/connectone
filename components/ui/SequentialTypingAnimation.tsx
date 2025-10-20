"use client";

import { useState, useEffect } from "react";

interface TextSequence {
  text: string;
  pause?: number; // 다음 텍스트로 넘어가기 전 대기 시간
  eraseSpeed?: number; // 지우는 속도 (0이면 지우지 않음)
}

interface SequentialTypingAnimationProps {
  sequences: TextSequence[];
  typingSpeed?: number;
  defaultPause?: number;
  defaultEraseSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  cursorClassName?: string;
}

export function SequentialTypingAnimation({
  sequences,
  typingSpeed = 100,
  defaultPause = 2000,
  defaultEraseSpeed = 50,
  loop = false,
  className = "",
  showCursor = true,
  cursorClassName = "animate-pulse text-blue-600",
}: SequentialTypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isErasing, setIsErasing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (sequenceIndex >= sequences.length) {
      if (loop) {
        setSequenceIndex(0);
        setCharIndex(0);
        setDisplayedText("");
        setIsErasing(false);
      }
      return;
    }

    const currentSequence = sequences[sequenceIndex];
    const currentText = currentSequence.text;
    const pause = currentSequence.pause ?? defaultPause;
    const eraseSpeed = currentSequence.eraseSpeed ?? defaultEraseSpeed;

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        if (sequenceIndex < sequences.length - 1) {
          setIsErasing(true);
        }
      }, pause);
      return () => clearTimeout(pauseTimer);
    }

    if (isErasing) {
      if (displayedText.length > 0) {
        const eraseTimer = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, eraseSpeed);
        return () => clearTimeout(eraseTimer);
      } else {
        setIsErasing(false);
        setSequenceIndex(sequenceIndex + 1);
        setCharIndex(0);
      }
    } else {
      if (charIndex < currentText.length) {
        const typeTimer = setTimeout(() => {
          setDisplayedText(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, typingSpeed);
        return () => clearTimeout(typeTimer);
      } else {
        setIsPaused(true);
      }
    }
  }, [
    charIndex,
    sequenceIndex,
    isErasing,
    isPaused,
    displayedText,
    sequences,
    typingSpeed,
    defaultPause,
    defaultEraseSpeed,
    loop,
  ]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && <span className={cursorClassName}>|</span>}
    </span>
  );
}

// 사용 예시:
// <SequentialTypingAnimation
//   sequences={[
//     { text: "Connect On", pause: 1000 },
//     { text: "Connect One", pause: 1000 },
//     { text: "ConnecTone", pause: 3000, eraseSpeed: 0 }, // 마지막은 지우지 않음
//   ]}
//   typingSpeed={100}
//   loop={false}
// />
