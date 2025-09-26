"use client";

import { useState, useRef, useEffect } from "react";
import { Brain } from "lucide-react";

interface WatermarkImageProps {
  src: string;
  alt: string;
  className?: string;
  isAiProcessed?: boolean;
  showWatermark?: boolean;
}

export const WatermarkImage = ({
  src,
  alt,
  className = "",
  isAiProcessed = false,
  showWatermark = true,
}: WatermarkImageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [watermarkedSrc, setWatermarkedSrc] = useState<string>(src);

  useEffect(() => {
    if (isAiProcessed && showWatermark) {
      addWatermark();
    } else {
      setWatermarkedSrc(src);
    }
  }, [src, isAiProcessed, showWatermark]);

  const addWatermark = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 캔버스 크기 설정
      canvas.width = img.width;
      canvas.height = img.height;

      // 원본 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 워터마크 추가
      const watermarkText = "AI";
      const fontSize = Math.max(img.width * 0.03, 12); // 이미지 크기에 비례한 폰트 크기

      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = "rgba(59, 130, 246, 0.8)"; // 파란색 반투명
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"; // 흰색 테두리
      ctx.lineWidth = 2;

      // 텍스트 크기 측정
      const textMetrics = ctx.measureText(watermarkText);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      // 워터마크 위치 (우하단)
      const x = img.width - textWidth - 10;
      const y = img.height - 10;

      // 배경 박스 그리기
      const padding = 8;
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        x - padding,
        y - textHeight - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      // 텍스트 그리기 (테두리 + 채우기)
      ctx.strokeText(watermarkText, x, y);
      ctx.fillStyle = "rgba(59, 130, 246, 1)";
      ctx.fillText(watermarkText, x, y);

      // AI 아이콘 추가
      const iconSize = textHeight * 0.8;
      const iconX = x - iconSize - 5;
      const iconY = y - textHeight + 2;

      // 아이콘 배경
      ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
      ctx.beginPath();
      ctx.arc(
        iconX + iconSize / 2,
        iconY + iconSize / 2,
        iconSize / 2 + 2,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // AI 아이콘 그리기 (간단한 브레인 모양)
      ctx.fillStyle = "white";
      ctx.font = `${iconSize}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(
        "🧠",
        iconX + iconSize / 2,
        iconY + iconSize / 2 + iconSize / 4
      );

      // 캔버스를 이미지로 변환
      const watermarkedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setWatermarkedSrc(watermarkedDataUrl);
    };

    img.src = src;
  };

  return (
    <div className="relative">
      <img src={watermarkedSrc} alt={alt} className={className} />
      {/* 숨겨진 캔버스 */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 추가 라벨 (이미지 위에 오버레이) */}
      {isAiProcessed && (
        <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg">
          <Brain className="w-3 h-3" />
          <span>AI</span>
        </div>
      )}
    </div>
  );
};
