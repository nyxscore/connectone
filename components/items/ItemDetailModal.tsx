"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ItemGallery } from "./ItemGallery";
import { PurchaseCTA } from "./PurchaseCTA";
import { StatusTimeline } from "./StatusTimeline";
import { LogisticsQuoteModal } from "../ui/LogisticsQuoteModal";
import { useAuth } from "../../lib/hooks/useAuth";
import { SellItem } from "../../data/types";
import { getUserProfile, getGradeInfo } from "../../lib/profile/api";
import { UserProfile } from "../../data/profile/types";
import { SellerProfileModal } from "../profile/SellerProfileModal";
import { CreateLogisticsOrderInput } from "../../data/types/logistics";
import {
  CONDITION_GRADES,
  INSTRUMENT_CATEGORIES,
} from "../../data/constants/index";
import {
  MapPin,
  Calendar,
  Share2,
  X,
  AlertCircle,
  Loader2,
  User,
  Star,
  Shield,
  Truck,
  Trash2,
  Edit,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import toast from "react-hot-toast";

interface ItemDetailModalProps {
  item: SellItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
}: ItemDetailModalProps) {
  const { user } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [showSellerProfileModal, setShowSellerProfileModal] = useState(false);

  // 디버깅: item 객체 확인
  console.log("ItemDetailModal - item 객체:", {
    id: item?.id,
    sellerUid: item?.sellerUid,
    brand: item?.brand,
    model: item?.model,
  });

  useEffect(() => {
    if (item?.sellerUid) {
      loadSellerProfile();
    }
  }, [item?.sellerUid]);

  const loadSellerProfile = async () => {
    if (!item?.sellerUid) return;

    try {
      setLoading(true);
      const result = await getUserProfile(item.sellerUid);
      if (result.success && result.data) {
        setSellerProfile(result.data);
      }
    } catch (error) {
      console.error("판매자 프로필 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title:
            item?.title ||
            `${item?.brand || ""} ${item?.model || ""}`.trim() ||
            "상품명 없음",
          text: `${categoryInfo?.label || item?.category}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("공유 취소됨");
      }
    } else {
      // 클립보드에 URL 복사
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다!");
    }
  };

  const getConditionInfo = (condition: string) => {
    return CONDITION_GRADES.find(c => c.key === condition);
  };

  const getCategoryInfo = (category: string) => {
    return INSTRUMENT_CATEGORIES.find(c => c.key === category);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
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
      default:
        return type;
    }
  };

  const handleLogisticsQuote = () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setShowLogisticsModal(true);
  };

  const handleLogisticsOrderCreate = async (
    orderData: CreateLogisticsOrderInput
  ) => {
    try {
      // TODO: 실제로는 logisticsOrders 컬렉션에 문서 생성
      console.log("운송 주문 생성:", orderData);
      toast.success("운송 견적이 확정되었습니다!");
      setShowLogisticsModal(false);
    } catch (error) {
      console.error("운송 주문 생성 실패:", error);
      toast.error("운송 주문 생성에 실패했습니다.");
    }
  };

  if (!isOpen) return null;

  const conditionInfo = getConditionInfo(item.condition);
  const categoryInfo = getCategoryInfo(item.category);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            상품 상세 정보
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 이미지 갤러리 */}
            <div className="lg:col-span-1">
              <ItemGallery
                images={item.images || []}
                alt={
                  item.title ||
                  `${item.brand || ""} ${item.model || ""}`.trim() ||
                  "상품명 없음"
                }
              />
            </div>

            {/* 오른쪽: 상품 정보 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 기본 정보 */}
              <Card>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          {item.title ||
                            `${item.brand || ""} ${item.model || ""}`.trim() ||
                            "상품명 없음"}
                        </h1>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShare}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-3xl font-bold text-blue-600">
                      {formatPrice(item.price)}
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {categoryInfo?.icon} {categoryInfo?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 상세 정보 테이블 */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    상품 상세 정보
                  </h2>
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-3 px-4 text-sm font-medium text-gray-500 w-1/3">
                            카테고리
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {categoryInfo?.icon} {categoryInfo?.label}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-sm font-medium text-gray-500">
                            상품명
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {item.title ||
                              `${item.brand || ""} ${item.model || ""}`.trim() ||
                              "상품명 없음"}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-sm font-medium text-gray-500">
                            지역
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {item.region}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-sm font-medium text-gray-500">
                            가격
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 font-semibold">
                            {formatPrice(item.price)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              {/* 상품 설명 */}
              {item.description && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      상품 설명
                    </h2>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* 판매자 카드 */}
              <Card>
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setShowSellerProfileModal(true)}
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    판매자 정보
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {sellerProfile?.photoURL ? (
                          <img
                            src={sellerProfile.photoURL}
                            alt={sellerProfile.nickname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {sellerProfile?.nickname || "판매자"}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            {(() => {
                              const grade = sellerProfile?.grade || "C";
                              const gradeInfo = getGradeInfo(grade);
                              return gradeInfo.displayName;
                            })()}
                          </div>
                          {sellerProfile?.region && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-1" />
                              {sellerProfile.region}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">거래 횟수</span>
                        <p className="font-semibold">
                          {sellerProfile?.tradesCount || 0}회
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">받은 후기</span>
                        <p className="font-semibold">
                          {sellerProfile?.reviewsCount || 0}개
                        </p>
                      </div>
                    </div>

                    {sellerProfile?.introShort && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          {sellerProfile.introShort}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 text-center pt-2">
                      클릭하여 상세 프로필 보기
                    </div>
                  </div>
                </div>
              </Card>

              {/* 옵션 배지들 */}
              <div className="flex flex-wrap gap-2">
                {item.escrowEnabled && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Shield className="w-4 h-4 mr-1" />
                    안전거래 가능
                  </span>
                )}
                {/* 배송 방법들 */}
                <div className="flex flex-wrap gap-2">
                  {item.shippingTypes && item.shippingTypes.length > 0 ? (
                    item.shippingTypes.map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        {getShippingTypeLabel(type)}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Truck className="w-4 h-4 mr-1" />
                      {getShippingTypeLabel(item.shippingType || "direct")}
                    </span>
                  )}
                </div>
              </div>

              {/* 구매 CTA */}
              <PurchaseCTA
                status={
                  item.status as
                    | "active"
                    | "reserved"
                    | "paid_hold"
                    | "shipped"
                    | "sold"
                }
                escrowEnabled={item.escrowEnabled}
                isLoggedIn={!!user}
                itemId={item.id}
                sellerUid={item.sellerUid}
                buyerUid={user?.uid}
                currentUserId={user?.uid}
                onLogisticsQuote={handleLogisticsQuote}
              />
            </div>
          </div>

          {/* 상태 타임라인 */}
          <div className="mt-6">
            <StatusTimeline
              status={
                item.status as
                  | "active"
                  | "reserved"
                  | "paid_hold"
                  | "shipped"
                  | "sold"
              }
              statusLog={[]}
            />
          </div>
        </div>
      </div>

      {/* 운송 견적 모달 */}
      <LogisticsQuoteModal
        isOpen={showLogisticsModal}
        onClose={() => setShowLogisticsModal(false)}
        itemId={item.id}
        buyerUid={user?.uid || ""}
        sellerUid={item.sellerUid}
        onQuoteSelect={handleLogisticsOrderCreate}
      />

      {/* 판매자 프로필 모달 */}
      <SellerProfileModal
        isOpen={showSellerProfileModal}
        onClose={() => setShowSellerProfileModal(false)}
        sellerProfile={sellerProfile}
      />
    </div>
  );
}
