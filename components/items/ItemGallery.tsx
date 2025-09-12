"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ItemGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ItemGallery({ images, alt, className = "" }: ItemGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const displayImages = images;

  const nextImage = () => {
    setCurrentIndex(prev => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      prev => (prev - 1 + displayImages.length) % displayImages.length
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  if (displayImages.length === 0) {
    return (
      <div
        className={`aspect-square bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="text-6xl mb-2">🎵</div>
          <p className="text-gray-500">이미지 없음</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 메인 갤러리 */}
      <div className={`relative ${className}`}>
        {/* 메인 이미지 */}
        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group">
          <img
            src={displayImages[currentIndex]}
            alt={alt}
            className="w-full h-full object-cover cursor-pointer"
            onClick={openFullscreen}
          />

          {/* 네비게이션 버튼 */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* 이미지 카운터 */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {displayImages.length}
          </div>
        </div>

        {/* 썸네일 */}
        {displayImages.length > 1 && (
          <div className="flex space-x-2 mt-4 overflow-x-auto">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  index === currentIndex
                    ? "border-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img
                  src={image}
                  alt={`${alt} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 풀스크린 모달 */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full p-4">
            {/* 닫기 버튼 */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* 풀스크린 이미지 */}
            <div className="relative">
              <img
                src={displayImages[currentIndex]}
                alt={alt}
                className="max-w-full max-h-[80vh] object-contain"
              />

              {/* 네비게이션 버튼 */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* 이미지 카운터 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                {currentIndex + 1} / {displayImages.length}
              </div>
            </div>

            {/* 풀스크린 썸네일 */}
            {displayImages.length > 1 && (
              <div className="flex justify-center space-x-2 mt-4">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-12 h-12 rounded overflow-hidden border-2 ${
                      index === currentIndex
                        ? "border-white"
                        : "border-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${alt} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
