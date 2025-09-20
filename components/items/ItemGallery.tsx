"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Search } from "lucide-react";

interface ItemGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ItemGallery({ images, alt, className = "" }: ItemGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxPosition, setLightboxPosition] = useState({ x: 0, y: 0 });

  const displayImages = images;

  console.log("ItemGallery 렌더링:", {
    images,
    displayImages,
    imagesLength: displayImages.length,
    alt,
  });

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

  const openLightbox = (image: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setLightboxPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setLightboxImage(image);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const openFullscreen = () => {
    console.log("풀스크린 열기 클릭됨");
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    console.log("마우스 호버 시작", { isHovering: true });
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    console.log("마우스 호버 끝", { isHovering: false });
    setIsHovering(false);
  };

  if (displayImages.length === 0) {
    return (
      <div
        className={`aspect-square bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="text-6xl mb-2">🎵</div>
          <p className="text-gray-500">이미지 없음</p>
          <p className="text-xs text-gray-400 mt-2">
            상품 등록 시 이미지를 업로드해주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 메인 갤러리 */}
      <div className={`relative ${className}`}>
        {/* 메인 이미지 */}
        <div
          className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={displayImages[currentIndex]}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-300 cursor-pointer focus:outline-none"
            style={{
              transform: isHovering ? `scale(2)` : `scale(1)`,
              transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
            }}
            onDoubleClick={e => e.preventDefault()}
            onClick={openFullscreen}
            tabIndex={0}
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
          <div className="flex space-x-3 mt-4 overflow-x-auto">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={e => {
                  e.preventDefault();
                  openLightbox(image, e);
                }}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  index === currentIndex
                    ? "border-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                title="클릭하여 원본 이미지 보기"
              >
                <img
                  src={image}
                  alt={`${alt} ${index + 1}`}
                  className="w-full h-full object-contain bg-gray-100"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 풀스크린 모달 */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center">
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

      {/* 라이트박스 팝업 */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] cursor-pointer flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl max-w-2xl max-h-[80vh] p-4 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            {/* 이미지 */}
            <img
              src={lightboxImage}
              alt={alt}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </>
  );
}
