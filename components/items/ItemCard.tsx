"use client";

import { Card } from "../ui/Card";
import { SellItem } from "../../data/types";
import { INSTRUMENT_CATEGORIES } from "../../data/constants";
import { MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
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
      router.push(`/item/${item.id}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
  };

  const getCategoryIcon = (category: string) => {
    const categoryInfo = INSTRUMENT_CATEGORIES.find(c => c.key === category);
    return categoryInfo?.icon || "🎵";
  };

  const getShippingTypeLabel = (type: string) => {
    switch (type) {
      case "meetup":
      case "direct": // 기존 데이터 호환성
        return "직거래";
      case "cargo":
        return "화물";
      case "courier":
      case "parcel": // 기존 데이터 호환성
        return "택배";
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

        {/* 옵션 배지들 */}
        <div className="absolute top-2 right-2 flex flex-col space-y-1">
          {item.escrowEnabled && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              안전거래
            </span>
          )}
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {getShippingTypeLabel(item.shippingType)}
          </span>
        </div>
      </div>

      {/* 상품 정보 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">
          {item.brand} {item.model}
        </h3>

        <div className="text-lg font-bold text-blue-600 mb-2">
          {formatPrice(item.price)}
        </div>

        <div className="flex items-center text-sm text-gray-600 space-x-4">
          <span className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {item.region}
          </span>
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(item.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">
            {getCategoryIcon(item.category)} {item.category}
          </span>
          <span
            className={`text-sm font-medium px-2 py-1 rounded ${
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
      </div>
    </Card>
  );
}
