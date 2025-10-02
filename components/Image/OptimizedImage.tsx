"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "../../lib/utils/cn";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  // 커스텀 props
  fallbackSrc?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = "empty",
  blurDataURL,
  sizes,
  fill = false,
  fallbackSrc = "/images/placeholder.jpg",
  loading = "lazy",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer를 사용한 lazy loading
  useEffect(() => {
    if (priority || loading === "eager") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setImageSrc(fallbackSrc);
    setIsLoading(false);
    onError?.();
  };

  // Cloudinary URL 변환 (CDN 최적화)
  const getOptimizedSrc = (originalSrc: string) => {
    // Cloudinary가 설정된 경우
    if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      // 이미 Cloudinary URL인 경우
      if (originalSrc.includes("cloudinary.com")) {
        return originalSrc;
      }

      // Firebase Storage URL을 Cloudinary로 변환
      if (originalSrc.includes("firebasestorage.googleapis.com")) {
        const fileName = originalSrc.split("/").pop()?.split("?")[0] || "";
        return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width || "auto"},h_${height || "auto"}/${fileName}`;
      }
    }

    // Next.js Image Optimization 사용
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(imageSrc);

  // 로딩 스켈레톤
  const LoadingSkeleton = () => (
    <div
      className={cn(
        "bg-gray-200 animate-pulse rounded-lg",
        fill ? "absolute inset-0" : "",
        className
      )}
      style={!fill ? { width, height } : undefined}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  // 에러 상태
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={cn(
          "bg-gray-100 flex items-center justify-center text-gray-400",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <div className="text-center">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs">이미지 로드 실패</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        fill ? "absolute inset-0" : "",
        className
      )}
      style={!fill ? { width, height } : undefined}
    >
      {isLoading && <LoadingSkeleton />}

      {isInView && (
        <Image
          src={optimizedSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes={sizes}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

// 상품 이미지 전용 컴포넌트
interface ProductImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
}

export function ProductImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false,
  quality = 80,
}: ProductImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("rounded-lg object-cover", className)}
      priority={priority}
      quality={quality}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      fallbackSrc="/images/product-placeholder.jpg"
    />
  );
}

// 아바타 이미지 전용 컴포넌트
interface AvatarImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
  priority = false,
}: AvatarImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      priority={priority}
      quality={90}
      sizes={`${size}px`}
      fallbackSrc="/images/avatar-placeholder.jpg"
    />
  );
}

// 썸네일 이미지 전용 컴포넌트
interface ThumbnailImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function ThumbnailImage({
  src,
  alt,
  width = 200,
  height = 150,
  className,
  priority = false,
}: ThumbnailImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("rounded object-cover", className)}
      priority={priority}
      quality={70}
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
      fallbackSrc="/images/thumbnail-placeholder.jpg"
    />
  );
}















