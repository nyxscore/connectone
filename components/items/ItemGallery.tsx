"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Search, Brain } from "lucide-react";

interface ItemGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  aiProcessedImages?: Array<{ imageIndex: number; emotion: string }>;
  maxHeight?: string;
}

export function ItemGallery({
  images,
  alt,
  className = "",
  aiProcessedImages = [],
  maxHeight = "400px",
}: ItemGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxPosition, setLightboxPosition] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(
    new Set()
  );

  const displayImages = images;

  console.log("ItemGallery 렌더링:", {
    images,
    displayImages,
    imagesLength: displayImages.length,
    alt,
    currentIndex,
    showArrows: displayImages.length > 1,
    isFullscreen,
    aiProcessedImages,
    currentImageIsAi: aiProcessedImages.some(
      aiImg => aiImg.imageIndex === currentIndex
    ),
  });

  // 이미지 미리 로드
  const preloadImage = (index: number) => {
    if (preloadedImages.has(index) || !displayImages[index]) return;

    const img = new Image();
    img.onload = () => {
      setPreloadedImages(prev => new Set([...prev, index]));
    };
    img.src = displayImages[index];
  };

  // 인접한 이미지들 미리 로드
  useEffect(() => {
    if (displayImages.length <= 1) return;

    const prevIndex =
      (currentIndex - 1 + displayImages.length) % displayImages.length;
    const nextIndex = (currentIndex + 1) % displayImages.length;

    preloadImage(prevIndex);
    preloadImage(nextIndex);
  }, [currentIndex, displayImages.length]);

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % displayImages.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(
      prev => (prev - 1 + displayImages.length) % displayImages.length
    );
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToImage = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
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

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (displayImages.length <= 1) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          prevImage();
          break;
        case "ArrowRight":
          event.preventDefault();
          nextImage();
          break;
        case "Escape":
          if (isFullscreen) {
            closeFullscreen();
          }
          if (lightboxImage) {
            closeLightbox();
          }
          break;
        case " ": // 스페이스바로도 다음 이미지
          event.preventDefault();
          nextImage();
          break;
      }
    };

    // 풀스크린 모드일 때만 키보드 이벤트 리스너 추가
    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [displayImages.length, isFullscreen, lightboxImage]);

  // 터치 스와이프 기능
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && displayImages.length > 1) {
      nextImage();
    }
    if (isRightSwipe && displayImages.length > 1) {
      prevImage();
    }
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
      <div className={`relative group ${className}`}>
        {/* 메인 이미지 */}
        <div
          className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative"
          style={{ maxHeight }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={displayImages[currentIndex]}
            alt={alt}
            className="w-full h-full object-cover cursor-pointer focus:outline-none"
            onDoubleClick={e => e.preventDefault()}
            onClick={openFullscreen}
            tabIndex={0}
          />

          {/* 네비게이션 버튼 - 호버 시에만 표시 */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-50"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-50"
                aria-label="다음 이미지"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* AI 감정 라벨 */}
          {aiProcessedImages.some(
            aiImg => aiImg.imageIndex === currentIndex
          ) && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1 shadow-lg">
              <Brain className="w-3 h-3" />
              <span>AI</span>
            </div>
          )}

          {/* 이미지 카운터 */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg">
            {currentIndex + 1} / {displayImages.length}
          </div>
        </div>

        {/* 썸네일 */}
        {displayImages.length > 1 && (
          <div className="flex space-x-3 mt-4 overflow-x-auto pb-2">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 relative ${
                  index === currentIndex
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400 hover:ring-1 hover:ring-gray-200"
                }`}
                title={`이미지 ${index + 1}로 이동`}
              >
                <img
                  src={image}
                  alt={`${alt} ${index + 1}`}
                  className="w-full h-full object-cover bg-gray-100"
                />
                {/* 썸네일 AI 감정 표시 */}
                {aiProcessedImages.some(
                  aiImg => aiImg.imageIndex === index
                ) && (
                  <div className="absolute top-1 left-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center space-x-1 shadow-lg border border-white">
                    <Brain className="w-3 h-3" />
                    <span>AI</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 풀스크린 모달 */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <div
            className="relative w-full max-w-4xl max-h-full p-4"
            onClick={e => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-2 transition-colors"
              aria-label="모달 닫기"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 캐러셀 구조 */}
            <div className="carousel relative w-full h-full">
              {/* 이미지 슬라이드 */}
              <div className="slides relative overflow-hidden">
                <div
                  className="image-frame relative mx-auto bg-black rounded-lg overflow-hidden flex items-center justify-center"
                  style={{
                    width: "min(760px, 90vw)",
                    height: "80vh",
                  }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <img
                    src={displayImages[currentIndex]}
                    alt={alt}
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      isTransitioning
                        ? "opacity-0 scale-95"
                        : "opacity-100 scale-100"
                    }`}
                    key={currentIndex}
                    aria-current={true}
                    draggable={false}
                  />
                </div>
              </div>

              {/* 좌/우 화살표 버튼 */}
              {displayImages.length >= 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={isTransitioning || displayImages.length <= 1}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-50"
                    style={{
                      opacity:
                        isTransitioning || displayImages.length <= 1 ? 0.3 : 1,
                      cursor:
                        isTransitioning || displayImages.length <= 1
                          ? "not-allowed"
                          : "pointer",
                    }}
                    aria-label="이전 이미지"
                  >
                    <ChevronLeft className="w-12 h-12" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={isTransitioning || displayImages.length <= 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-50"
                    style={{
                      opacity:
                        isTransitioning || displayImages.length <= 1 ? 0.3 : 1,
                      cursor:
                        isTransitioning || displayImages.length <= 1
                          ? "not-allowed"
                          : "pointer",
                    }}
                    aria-label="다음 이미지"
                  >
                    <ChevronRight className="w-12 h-12" />
                  </button>
                </>
              )}

              {/* 페이지 도트 */}
              {displayImages.length > 1 && (
                <div className="dots flex justify-center space-x-2 mt-4">
                  {displayImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      disabled={isTransitioning}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentIndex
                          ? "bg-white"
                          : "bg-gray-400 hover:bg-gray-200"
                      } ${isTransitioning ? "opacity-50 cursor-not-allowed" : ""}`}
                      aria-label={`이미지 ${index + 1}로 이동`}
                      aria-current={index === currentIndex}
                    />
                  ))}
                </div>
              )}

              {/* 이미지 카운터 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {currentIndex + 1} / {displayImages.length}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    화살표 키 또는 스와이프로 이동
                  </div>
                </div>
              </div>
            </div>
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
