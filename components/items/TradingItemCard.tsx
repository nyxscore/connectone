"use client";

import { Card } from "../ui/Card";
import {
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { formatPrice, formatDate } from "../../lib/utils";

interface TradingItemCardProps {
  item: any;
  onClick: () => void;
  onMenuClick: () => void;
  showMenu: boolean;
  isSeller: boolean; // 판매자인지 구매자인지 구분
}

interface UserProfile {
  uid: string;
  nickname: string;
  profileImage?: string;
  grade: string;
  region: string;
}

export function TradingItemCard({
  item,
  onClick,
  onMenuClick,
  showMenu,
  isSeller,
}: TradingItemCardProps) {
  // 거래 상태에 따른 아이콘과 텍스트
  const getTransactionStatusInfo = () => {
    switch (item.status) {
      case "reserved":
        return {
          icon: <Clock className="w-4 h-4" />,
          text: "거래중",
          color: "text-yellow-600 bg-yellow-50",
          description: "거래가 예약되었습니다",
        };
      case "paid_hold":
        return {
          icon: <CreditCard className="w-4 h-4" />,
          text: "결제 완료",
          color: "text-blue-600 bg-blue-50",
          description: "결제가 완료되어 안전거래가 시작되었습니다",
        };
      case "shipped":
        return {
          icon: <Truck className="w-4 h-4" />,
          text: "배송중",
          color: "text-purple-600 bg-purple-50",
          description: "상품이 배송되었습니다",
        };
      case "delivered":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: "배송 완료",
          color: "text-green-600 bg-green-50",
          description: "상품이 배송 완료되었습니다",
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: "알 수 없음",
          color: "text-gray-600 bg-gray-50",
          description: "거래 상태를 확인해주세요",
        };
    }
  };

  const statusInfo = getTransactionStatusInfo();

  // 거래 시작일 계산
  const getTransactionStartDate = () => {
    if (item.reservedAt) {
      return new Date(item.reservedAt.seconds * 1000);
    } else if (item.createdAt) {
      return new Date(item.createdAt.seconds * 1000);
    }
    return null;
  };

  const transactionStartDate = getTransactionStartDate();

  // 카드 클릭 시 채팅으로 이동하는 함수
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const buyerUid = item.buyerId || item.buyerUid;
    const sellerUid = item.sellerUid;

    console.log("카드 클릭:", {
      itemId: item.id,
      isSeller,
      buyerUid,
      sellerUid,
      buyerId: item.buyerId,
      buyerUid_field: item.buyerUid,
    });

    if (!buyerUid || !sellerUid) {
      console.error("채팅 ID 생성 실패: buyerUid 또는 sellerUid가 없습니다");
      alert("채팅 정보를 찾을 수 없습니다.");
      return;
    }

    // 채팅 ID 생성: buyerUid_sellerUid_itemId 형식
    const chatId = `${buyerUid}_${sellerUid}_${item.id}`;
    console.log("생성된 채팅 ID:", chatId);

    // 새 탭에서 채팅 열기
    window.open(`/chat?chatId=${chatId}`, "_blank");
  };

  return (
    <Card className="p-3 hover:shadow-lg hover:bg-blue-50 transition-all cursor-pointer group">
      <div onClick={handleCardClick} className="relative">
        {/* 상품 이미지 */}
        <div className="relative w-full h-32 sm:h-36 rounded-lg overflow-hidden bg-gray-200 mb-3">
          {item.images && item.images.length > 0 ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-xs">이미지 없음</span>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
            {item.title}
          </h3>
          <p className="text-base font-bold text-blue-600">
            {formatPrice(item.price)}
          </p>

          {/* 거래 상태 버튼 */}
          <div className="w-full">
            <div
              className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium w-full ${statusInfo.color}`}
            >
              {statusInfo.icon}
              <span className="ml-2">{statusInfo.text}</span>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="space-y-2">
          {/* 지역 및 시간 정보 */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <span>📍</span>
              <span>{item.region || "지역 정보 없음"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>📅</span>
              <span>
                {transactionStartDate
                  ? formatDate(transactionStartDate)
                  : "알 수 없음"}
              </span>
            </div>
          </div>

          {/* 카테고리 정보 */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <span>🎵</span>
            <span>{item.category || "카테고리 정보 없음"}</span>
          </div>

          {/* 거래 옵션 */}
          {item.shippingTypes && item.shippingTypes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.shippingTypes.map((type, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  {type === "direct"
                    ? "직거래"
                    : type === "courier"
                      ? "택배"
                      : type}
                </span>
              ))}
            </div>
          )}

          {/* 채팅 안내 */}
          <div className="text-center pt-2 border-t border-gray-100">
            <span className="text-xs text-blue-600 font-medium">
              💬 클릭하여 채팅하기
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
