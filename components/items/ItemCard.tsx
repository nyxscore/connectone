"use client";

import { Card } from "../ui/Card";
import { SellItem } from "../../data/types";
import { INSTRUMENT_CATEGORIES } from "../../data/constants/index";
import { MapPin, Calendar } from "lucide-react";
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
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* 썸네일 */}
      <div className="aspect-square bg-gray-200 relative">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={`${item.brand} ${item.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {getCategoryIcon(item.category)}
          </div>
        )}

        {/* 옵션 배지들 - 사진 위에서 제거하고 깔끔하게 */}
      </div>

      {/* 상품 정보 */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base line-clamp-2">
          {item.title || `${item.brand} ${item.model}`}
        </h3>

        <div className="text-base sm:text-lg font-bold text-blue-600 mb-2">
          {formatPrice(item.price)}
        </div>

        <div className="flex items-center text-xs sm:text-sm text-gray-600 space-x-2 sm:space-x-4">
          <span className="flex items-center">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="truncate">{item.region}</span>
          </span>
          <span className="flex items-center">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="truncate">{formatDate(item.createdAt)}</span>
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <span className="text-xs sm:text-sm text-gray-500 truncate">
            {getCategoryIcon(item.category)} {getCategoryLabel(item.category)}
          </span>
          <span
            className={`text-xs sm:text-sm font-medium px-2 py-1 rounded ${
              item.condition === "A"
                ? "bg-blue-100 text-blue-800"
                : item.condition === "B"
                  ? "bg-green-100 text-green-800"
                  : item.condition === "C"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
            }`}
          >
            {item.condition}등급
          </span>
        </div>

        {/* 판매방법 표시 */}
        {item.shippingTypes && item.shippingTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.shippingTypes.map((type, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
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
