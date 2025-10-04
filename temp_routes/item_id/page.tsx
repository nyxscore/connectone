"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ItemGallery } from "../../../components/items/ItemGallery";
import { PurchaseCTA } from "../../../components/items/PurchaseCTA";
import { StatusTimeline } from "../../../components/items/StatusTimeline";
import { LogisticsQuoteModal } from "../../../components/ui/LogisticsQuoteModal";
import { getItem, deleteItem } from "../../../lib/api/products";
import { useAuth } from "../../../lib/hooks/useAuth";
import { SellItem } from "../../../data/types";
import { getUserProfile } from "../../../lib/profile/api";
import { UserProfile } from "../../../data/profile/types";
import { SellerProfileModal } from "../../../components/profile/SellerProfileModal";
import { CreateLogisticsOrderInput } from "../../../data/types/logistics";
import {
  CONDITION_GRADES,
  INSTRUMENT_CATEGORIES,
} from "../../../data/constants";
import {
  MapPin,
  Calendar,
  Share2,
  ArrowLeft,
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

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<SellItem | null>(null);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [showSellerProfileModal, setShowSellerProfileModal] = useState(false);

  const itemId = params.id as string;

  useEffect(() => {
    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  useEffect(() => {
    if (item?.sellerUid) {
      loadSellerProfile();
    }
  }, [item?.sellerUid]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const result = await getItem(itemId);

      if (result.success && result.item) {
        console.log("상품 데이터:", result.item);
        console.log("카테고리:", result.item.category);
        setItem(result.item as any);
      } else {
        setError(result.error || "상품을 찾을 수 없습니다.");
      }
    } catch (err) {
      setError("상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadSellerProfile = async () => {
    if (!item?.sellerUid) return;

    try {
      const result = await getUserProfile(item.sellerUid);
      if (result.success && result.data) {
        setSellerProfile(result.data);
      }
    } catch (error) {
      console.error("판매자 프로필 로드 실패:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item?.brand} ${item?.model}`,
          text: `${item?.category} - ${item?.condition}등급`,
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
    console.log("getCategoryInfo 호출:", category);
    const result = INSTRUMENT_CATEGORIES.find(c => c.key === category);
    console.log("카테고리 정보 찾기 결과:", result);
    return result;
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
      default:
        return type;
    }
  };

  const handleLogisticsQuote = () => {
    if (!user) {
      router.push("/auth/login");
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

  const handleDeleteItem = async () => {
    if (!user || !item) return;

    const confirmed = window.confirm(
      "정말로 이 상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다."
    );

    if (!confirmed) return;

    try {
      const result = await deleteItem(item.id, user.uid);

      if (result.success) {
        toast.success("상품이 삭제되었습니다.");
        router.push("/list");
      } else {
        toast.error(result.error || "상품 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("상품 삭제 실패:", error);
      toast.error("상품 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            상품을 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/list")}>
            상품 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const conditionInfo = getConditionInfo(item.condition);
  const categoryInfo = getCategoryInfo(item.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 이미지 갤러리 */}
          <div className="lg:col-span-1">
            <ItemGallery
              images={item.images || []}
              alt={`${item.brand} ${item.model}`}
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
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {item.brand} {item.model}
                      </h1>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                      {user && user.uid === item.sellerUid && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/item/${itemId}/edit`)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteItem}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-4xl font-bold text-blue-600">
                    {formatPrice(item.price)}
                  </div>

                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        conditionInfo?.color || "text-gray-600"
                      }`}
                    >
                      {conditionInfo?.label}
                    </span>
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
                          브랜드
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {item.brand}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm font-medium text-gray-500">
                          모델
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {item.model}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm font-medium text-gray-500">
                          연식
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {item.year}년
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm font-medium text-gray-500">
                          상태
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              item.condition === "A"
                                ? "bg-blue-100 text-blue-800"
                                : item.condition === "B"
                                  ? "bg-green-100 text-green-800"
                                  : item.condition === "C"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {conditionInfo?.label}
                          </span>
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
                          {sellerProfile?.grade || "신규"} 등급
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Truck className="w-4 h-4 mr-1" />
                {getShippingTypeLabel(item.shippingType)}
              </span>
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
              onPurchase={async () => {
                // 구매하기 클릭 시 상품 상태를 reserved로 변경하고 거래 관리 페이지로 이동
                try {
                  const { updateItemStatus } = await import(
                    "../../../lib/api/products"
                  );
                  const result = await updateItemStatus(
                    item.id,
                    "reserved",
                    user?.uid
                  );

                  if (result.success) {
                    // 거래 관리 페이지로 이동
                    window.location.href = `/transaction/${item.id}`;
                  } else {
                    console.error("상품 상태 변경 실패:", result.error);
                  }
                } catch (error) {
                  console.error("구매 처리 실패:", error);
                }
              }}
              onLogisticsQuote={handleLogisticsQuote}
            />
          </div>
        </div>

        {/* 상태 타임라인 */}
        <div className="mt-12">
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
            shippingInfo={item.shippingInfo}
            currentUserId={user?.uid}
            buyerUid={item.buyerUid}
          />
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
