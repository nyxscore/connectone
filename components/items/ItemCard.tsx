"use client";

import { Card } from "../ui/Card";
import { SellItem } from "../../data/types";
import { INSTRUMENT_CATEGORIES } from "../../data/constants/index";
import { MapPin, Calendar, Brain } from "lucide-react";
import { WatermarkImage } from "../ui/WatermarkImage";
// date-fns 제거 - 성능 최적화
import { useRouter } from "next/navigation";

interface ItemCardProps {
  item: SellItem;
  onClick?: (item: SellItem) => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    } else {
      // 상품 상세 페이지로 이동
      router.push(`/product/${item.id}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (date: any) => {
    if (!date) return "";

    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      if (isNaN(dateObj.getTime())) return "";

      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return "방금 전";
      else if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
      else if (diffInHours < 24) return `${diffInHours}시간 전`;
      else if (diffInDays < 7) return `${diffInDays}일 전`;
      else return dateObj.toLocaleDateString("ko-KR");
    } catch (error) {
      return "";
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryInfo = INSTRUMENT_CATEGORIES.find(c => c.key === category);
    return categoryInfo?.icon || "🎵";
  };

  const getCategoryLabel = (category: string) => {
    const categoryInfo = INSTRUMENT_CATEGORIES.find(c => c.key === category);
    return categoryInfo?.label || category;
  };

  const getShippingTypeLabel = (type: string) => {
    switch (type) {
      case "direct":
        return "직거래";
      case "pickup":
        return "픽업";
      case "courier":
      case "parcel": // 기존 데이터 호환성
        return "택배";
      case "meetup": // meetup도 직거래로 처리
        return "직거래";
      case "escrow":
        return "안전거래";
      case "shipping":
        return "화물운송";
      default:
        return type;
    }
  };

  return (
    <Card className="overflow-hidden cursor-pointer" onClick={handleClick}>
      {/* 썸네일 */}
      <div className="aspect-square bg-gray-200 relative overflow-hidden">
        {item.images && item.images.length > 0 ? (
          <WatermarkImage
            src={item.images[0]}
            alt={`${item.brand} ${item.model}`}
            className="w-full h-full object-cover object-center"
            isAiProcessed={
              item.aiProcessedImages?.some(aiImg => aiImg.imageIndex === 0) ||
              false
            }
            showWatermark={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {getCategoryIcon(item.category)}
          </div>
        )}

        {/* AI 감정 라벨 (상품 목록용) - 2열에 맞게 조정 */}
        {item.aiProcessedImages && item.aiProcessedImages.length > 0 && (
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center space-x-0.5 sm:space-x-1 shadow-lg">
            <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-xs">AI</span>
          </div>
        )}

        {/* 옵션 배지들 - 사진 위에서 제거하고 깔끔하게 */}
      </div>

      {/* 상품 정보 - 2열 레이아웃 최적화 */}
      <div className="p-2 sm:p-3 md:p-4">
        <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm md:text-base line-clamp-2 leading-tight">
          {item.title || `${item.brand} ${item.model}`}
        </h3>

        <div className="text-sm sm:text-base md:text-lg font-bold text-blue-600 mb-1 sm:mb-2">
          {formatPrice(item.price)}
        </div>

        <div className="flex items-center text-xs text-gray-600 space-x-1 sm:space-x-2">
          <span className="flex items-center min-w-0">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{item.region}</span>
          </span>
          <span className="flex items-center min-w-0">
            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{formatDate(item.createdAt)}</span>
          </span>
        </div>

        <div className="flex items-center justify-between mt-1 sm:mt-2">
          <span className="text-xs text-gray-500 truncate">
            {getCategoryIcon(item.category)} {getCategoryLabel(item.category)}
          </span>
        </div>

        {/* 판매방법 표시 - 모든 거래 방식 표시 */}
        {item.shippingTypes && item.shippingTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
            {item.shippingTypes.map((type, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full whitespace-nowrap"
              >
                {getShippingTypeLabel(type)}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
