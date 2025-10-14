"use client";

import { useState, useEffect, useRef } from "react";

interface PriceRangeSliderProps {
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min: number | undefined, max: number | undefined) => void;
}

export function PriceRangeSlider({
  minPrice = 0,
  maxPrice = 10000000,
  onPriceChange,
}: PriceRangeSliderProps) {
  const [minValue, setMinValue] = useState(minPrice);
  const [maxValue, setMaxValue] = useState(maxPrice);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const MIN_PRICE = 0;
  const MAX_PRICE = 10000000;
  const STEP = 10000;

  useEffect(() => {
    setMinValue(minPrice || 0);
    setMaxValue(maxPrice || 10000000);
  }, [minPrice, maxPrice]);

  const getPercentage = (value: number) => {
    return ((value - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  };

  const getValueFromPercentage = (percentage: number) => {
    return Math.round((percentage / 100) * (MAX_PRICE - MIN_PRICE) + MIN_PRICE);
  };

  const handleMouseDown = (type: "min" | "max") => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleTouchStart = (type: "min" | "max") => (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const updateSliderValue = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100)
    );
    const newValue = getValueFromPercentage(percentage);

    if (isDragging === "min") {
      const newMinValue = Math.min(newValue, maxValue - STEP);
      setMinValue(newMinValue);
      onPriceChange(newMinValue, maxValue);
    } else if (isDragging === "max") {
      const newMaxValue = Math.max(newValue, minValue + STEP);
      setMaxValue(newMaxValue);
      onPriceChange(minValue, newMaxValue);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updateSliderValue(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      updateSliderValue(e.touches[0].clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handleTouchEnd = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, minValue, maxValue]);

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return "1천만원 이상";
    } else if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}만원`;
    } else {
      return `${price.toLocaleString()}원`;
    }
  };

  // 특정 가격으로 이동하는 함수
  const handlePriceClick = (targetPrice: number) => {
    const targetPercentage = getPercentage(targetPrice);

    // 클릭한 가격이 현재 범위 내에 있는지 확인
    if (targetPrice >= minValue && targetPrice <= maxValue) {
      // 범위 내에 있으면 가장 가까운 핸들을 해당 위치로 이동
      const distanceToMin = Math.abs(targetPrice - minValue);
      const distanceToMax = Math.abs(targetPrice - maxValue);

      if (distanceToMin < distanceToMax) {
        // 최소값 핸들을 이동
        const newMinValue = Math.min(targetPrice, maxValue - STEP);
        setMinValue(newMinValue);
        onPriceChange(newMinValue, maxValue);
      } else {
        // 최대값 핸들을 이동
        const newMaxValue = Math.max(targetPrice, minValue + STEP);
        setMaxValue(newMaxValue);
        onPriceChange(minValue, newMaxValue);
      }
    } else if (targetPrice < minValue) {
      // 클릭한 가격이 현재 최소값보다 작으면 최소값으로 설정
      const newMinValue = Math.min(targetPrice, maxValue - STEP);
      setMinValue(newMinValue);
      onPriceChange(newMinValue, maxValue);
    } else if (targetPrice > maxValue) {
      // 클릭한 가격이 현재 최대값보다 크면 최대값으로 설정
      const newMaxValue = Math.max(targetPrice, minValue + STEP);
      setMaxValue(newMaxValue);
      onPriceChange(minValue, newMaxValue);
    }
  };

  const minPercentage = getPercentage(minValue);
  const maxPercentage = getPercentage(maxValue);

  return (
    <div className="w-full space-y-6">
      {/* 가격 범위 표시 */}
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">최소</div>
          <div className="text-lg font-semibold text-blue-600">
            {formatPrice(minValue)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">최대</div>
          <div className="text-lg font-semibold text-blue-600">
            {formatPrice(maxValue)}
          </div>
        </div>
      </div>

      {/* 듀얼 핸들 슬라이더 */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-200 rounded-lg cursor-pointer"
          onMouseDown={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percentage = ((e.clientX - rect.left) / rect.width) * 100;
            const clickValue = getValueFromPercentage(percentage);

            // 클릭한 위치가 어느 핸들에 더 가까운지 판단
            const distanceToMin = Math.abs(clickValue - minValue);
            const distanceToMax = Math.abs(clickValue - maxValue);

            if (distanceToMin < distanceToMax) {
              setIsDragging("min");
            } else {
              setIsDragging("max");
            }
          }}
          onTouchStart={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            const percentage = ((touch.clientX - rect.left) / rect.width) * 100;
            const clickValue = getValueFromPercentage(percentage);

            // 터치한 위치가 어느 핸들에 더 가까운지 판단
            const distanceToMin = Math.abs(clickValue - minValue);
            const distanceToMax = Math.abs(clickValue - maxValue);

            if (distanceToMin < distanceToMax) {
              setIsDragging("min");
            } else {
              setIsDragging("max");
            }
          }}
        >
          {/* 선택된 범위 표시 */}
          <div
            className="absolute h-2 bg-blue-500 rounded-lg pointer-events-none"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />

          {/* 최소값 핸들 */}
          <div
            className="absolute w-6 h-6 md:w-5 md:h-5 bg-white border-2 border-blue-500 rounded-full cursor-pointer shadow-lg transform -translate-x-1/2 -translate-y-2 md:-translate-y-1.5 touch-none"
            style={{ left: `${minPercentage}%` }}
            onMouseDown={handleMouseDown("min")}
            onTouchStart={handleTouchStart("min")}
          />

          {/* 최대값 핸들 */}
          <div
            className="absolute w-6 h-6 md:w-5 md:h-5 bg-white border-2 border-blue-500 rounded-full cursor-pointer shadow-lg transform -translate-x-1/2 -translate-y-2 md:-translate-y-1.5 touch-none"
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={handleMouseDown("max")}
            onTouchStart={handleTouchStart("max")}
          />
        </div>

        {/* 가격 눈금 */}
        <div className="relative mt-4">
          <div className="flex justify-between text-xs text-gray-500">
            <span
              className="cursor-pointer hover:text-blue-600 hover:font-medium transition-colors"
              onClick={() => handlePriceClick(0)}
            >
              0원
            </span>
            <span
              className="cursor-pointer hover:text-blue-600 hover:font-medium transition-colors"
              onClick={() => handlePriceClick(100000)}
            >
              10만원
            </span>
            <span
              className="cursor-pointer hover:text-blue-600 hover:font-medium transition-colors"
              onClick={() => handlePriceClick(500000)}
            >
              50만원
            </span>
            <span
              className="cursor-pointer hover:text-blue-600 hover:font-medium transition-colors"
              onClick={() => handlePriceClick(1000000)}
            >
              100만원
            </span>
            <span
              className="cursor-pointer hover:text-blue-600 hover:font-medium transition-colors"
              onClick={() => handlePriceClick(5000000)}
            >
              500만원
            </span>
            <span
              className="cursor-pointer hover:text-blue-600 hover:font-medium transition-colors"
              onClick={() => handlePriceClick(10000000)}
            >
              1000만원
            </span>
          </div>
          {/* 눈금 표시선 */}
          <div className="absolute top-0 left-0 w-full h-2 flex justify-between">
            {[0, 10, 50, 100, 500, 1000].map((value, index) => (
              <div
                key={index}
                className="w-px h-2 bg-gray-300"
                style={{
                  left: `${((value * 10000) / 10000000) * 100}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 직접 입력 필드 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            최소 가격 (원)
          </label>
          <input
            type="number"
            value={minValue}
            onChange={e => {
              const value = Math.max(
                0,
                Math.min(parseInt(e.target.value) || 0, maxValue - STEP)
              );
              setMinValue(value);
              onPriceChange(value, maxValue);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
            max={maxValue - STEP}
            step={STEP}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            최대 가격 (원)
          </label>
          <input
            type="number"
            value={maxValue}
            onChange={e => {
              const value = Math.min(
                MAX_PRICE,
                Math.max(parseInt(e.target.value) || MAX_PRICE, minValue + STEP)
              );
              setMaxValue(value);
              onPriceChange(minValue, value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={minValue + STEP}
            max={MAX_PRICE}
            step={STEP}
          />
        </div>
      </div>
    </div>
  );
}
