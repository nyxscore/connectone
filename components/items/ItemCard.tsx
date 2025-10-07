"use client";

import { Card } from "../ui/Card";
import { SellItem } from "../../data/types";
import { INSTRUMENT_CATEGORIES } from "../../data/constants/index";
import {
  MapPin,
  Calendar,
  Brain,
  Clock,
  Truck,
  Package,
  Shield,
} from "lucide-react";
import { WatermarkImage } from "../ui/WatermarkImage";
import { Button } from "../ui/Button";
// date-fns 제거 - 성능 최적화
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";

interface ItemCardProps {
  item: SellItem;
  onClick?: (item: SellItem) => void;
  isTradingTab?: boolean;
  currentUserId?: string;
  buyerUid?: string;
}

export function ItemCard({
  item,
  onClick,
  isTradingTab = false,
  currentUserId,
  buyerUid,
}: ItemCardProps) {
  const router = useRouter();
  const { user } = useAuth();

  // 구매자인지 확인
  const isBuyer = currentUserId && buyerUid && currentUserId === buyerUid;

  // 택배사 코드를 한글 이름으로 변환
  const getCourierName = (courierCode: string) => {
    const courierMap: { [key: string]: string } = {
      cj: "CJ대한통운",
      hanjin: "한진택배",
      lotte: "롯데택배",
      kdexp: "경동택배",
      epost: "우체국택배",
      logen: "로젠택배",
      ktx: "KTX물류",
      dhl: "DHL",
      fedex: "FedEx",
      ups: "UPS",
      ems: "EMS",
      cvs: "편의점택배",
    };
    return courierMap[courierCode] || courierCode;
  };

  const handleClick = async (hasTriedFix = false) => {
    console.log("🔍 ItemCard handleClick:", {
      itemId: item.id,
      itemStatus: item.status,
      currentUserId,
      buyerUid,
      itemBuyerUid: item.buyerUid,
      itemSellerUid: item.sellerUid,
      isBuyer: currentUserId && currentUserId === item.buyerUid,
      isSeller: currentUserId && currentUserId === item.sellerUid,
      hasTriedFix,
    });

    if (item.status === "sold") {
      alert("판매완료된 상품입니다.");
      return;
    }

    // 거래중인 상품인 경우, 구매자나 판매자만 접근 허용
    if (item.status === "reserved" || item.status === "escrow_completed") {
      const isSeller = currentUserId && currentUserId === item.sellerUid;
      const isBuyer = currentUserId && currentUserId === item.buyerUid;

      console.log("🔍 권한 체크:", {
        isSeller,
        isBuyer,
        currentUserId,
        sellerUid: item.sellerUid,
        buyerUid: item.buyerUid,
        status: item.status,
      });

      if (!isSeller && !isBuyer) {
        // buyerUid가 null이고 아직 수정을 시도하지 않은 경우에만 데이터 수정 시도
        if (item.buyerUid === null && !hasTriedFix) {
          console.log("⚠️ buyerUid가 null입니다. 디버깅 정보를 확인합니다.");

          try {
            // 먼저 디버깅 정보 확인
            const debugResponse = await fetch(
              `/api/debug-item?itemId=${item.id}`
            );
            const debugResult = await debugResponse.json();

            if (debugResult.success) {
              console.log("🔍 디버깅 정보:", debugResult.data.summary);

              // buyerId가 있으면 buyerUid로 복사
              if (
                debugResult.data.item.buyerId &&
                !debugResult.data.item.buyerUid
              ) {
                console.log(
                  "🔧 buyerId를 buyerUid로 복사합니다:",
                  debugResult.data.item.buyerId
                );

                const { fixBuyerUid } = await import(
                  "../../lib/api/fix-buyer-uid"
                );
                const fixResult = await fixBuyerUid(item.id);

                if (fixResult.success && fixResult.data.buyerUid) {
                  console.log("✅ buyerUid 수정 완료:", fixResult.data);
                  item.buyerUid = fixResult.data.buyerUid;
                  return handleClick(true);
                }
              }

              // 거래 내역에서 구매자 정보 찾기
              const firstTransaction =
                debugResult.data.summary.firstTransaction;
              if (firstTransaction && firstTransaction.buyerId) {
                console.log(
                  "🔧 거래 내역에서 buyerId 발견:",
                  firstTransaction.buyerId
                );

                const { fixBuyerUid } = await import(
                  "../../lib/api/fix-buyer-uid"
                );
                const fixResult = await fixBuyerUid(item.id);

                if (fixResult.success && fixResult.data.buyerUid) {
                  console.log("✅ buyerUid 수정 완료:", fixResult.data);
                  item.buyerUid = fixResult.data.buyerUid;
                  return handleClick(true);
                }
              }
            }

            console.error(
              "❌ buyerUid 수정 불가능 - 구매자 정보를 찾을 수 없습니다."
            );
          } catch (error) {
            console.error("❌ 디버깅 중 오류:", error);
          }
        }

        // 거래중인 상품은 판매자와 구매자만 접근 가능
        const isSeller = user?.uid === item.sellerUid;
        const isBuyer = user?.uid === item.buyerUid;

        if (!isSeller && !isBuyer) {
          alert("거래중인 상품은 판매자와 구매자만 볼 수 있습니다.");
          return;
        }

        console.log("거래중인 상품 클릭 - 판매자/구매자 접근 허용");
      }
    }

    console.log("✅ 클릭 허용됨");
    if (onClick) {
      onClick(item);
      return; // onClick prop이 있으면 여기서 종료
    }
    
    // onClick prop이 없을 때만 상품 상세 페이지로 이동
    router.push(`/item/${item.id}`);
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

  const isSold = item.status === "sold";
  const isReserved =
    (item.status === "reserved" || item.status === "escrow_completed") &&
    currentUserId &&
    currentUserId !== item.sellerUid &&
    currentUserId !== item.buyerUid;

  return (
    <Card
      className={`overflow-hidden ${
        isSold
          ? "opacity-60 cursor-not-allowed"
          : isReserved
            ? "opacity-75 cursor-not-allowed border-orange-200 bg-orange-50"
            : isTradingTab
              ? "cursor-pointer hover:shadow-lg hover:bg-blue-50 transition-all"
              : "cursor-pointer"
      }`}
      onClick={
        isSold
          ? undefined
          : e => {
              // 버튼이나 링크 클릭인 경우 상품 상세로 이동하지 않음
              const target = e.target as HTMLElement;
              if (target.closest("button") || target.closest("a")) {
                return;
              }
              handleClick();
            }
      }
    >
      {/* 썸네일 */}
      <div
        className={`aspect-square bg-gray-200 relative overflow-hidden ${isSold ? "grayscale" : ""}`}
      >
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

        {/* 거래중 상태 표시 */}
        {item.status === "reserved" && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-orange-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-bold shadow-lg">
            거래중
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

        {/* 배송 정보 표시 (구매자에게만) */}
        {item.status === "shipping" && item.shippingInfo && isBuyer && (
          <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-1 mb-1">
              <Truck className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">배송중</span>
            </div>
            <div className="text-xs text-blue-700">
              <div className="flex items-center justify-between">
                <span>{getCourierName(item.shippingInfo.courier)}</span>
                <span className="font-mono">
                  {item.shippingInfo.trackingNumber}
                </span>
              </div>
            </div>
          </div>
        )}

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

        {/* 거래중 상태 표시 */}
        {(item.status === "reserved" || item.status === "escrow_completed") && (
          <div className="w-full h-8 bg-orange-100 border border-orange-300 rounded-lg flex items-center justify-center mt-2">
            <Clock className="w-4 h-4 mr-1 text-orange-600" />
            <span className="text-sm font-bold text-orange-600">거래중</span>
          </div>
        )}

        {/* 거래완료 상태 표시 */}
        {item.status === "sold" && (
          <div className="w-full h-8 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mt-2">
            <span className="text-sm font-bold text-gray-600">거래완료</span>
          </div>
        )}

        {/* 판매방법 표시 - 모든 거래 방식 표시 */}
        <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
          {item.shippingTypes && item.shippingTypes.length > 0 && (
            <>
              {item.shippingTypes.map((type, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                >
                  {getShippingTypeLabel(type)}
                </span>
              ))}
            </>
          )}

          {/* 안전결제 가능 옵션 표시 */}
          {(item as any).escrowEnabled && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              안전결제
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
