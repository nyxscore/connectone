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
          title: item?.title,
          text: item?.description,
          url: window.location.href,
        });
      } catch (err) {
        // 사용자가 공유를 취소한 경우 무시
      }
    } else {
      // 웹 브라우저에서 URL 복사
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("링크가 복사되었습니다!");
      } catch (err) {
        toast.error("링크 복사에 실패했습니다.");
      }
    }
  };

  const handleDelete = async () => {
    if (!item || !user) return;

    const confirmed = window.confirm("정말로 이 상품을 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      const result = await deleteItem(item.id);
      if (result.success) {
        toast.success("상품이 삭제되었습니다.");
        router.push("/list");
      } else {
        toast.error(result.error || "상품 삭제에 실패했습니다.");
      }
    } catch (error) {
      toast.error("상품 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleLogisticsQuote = async (data: CreateLogisticsOrderInput) => {
    try {
      // 실제 운송 견적 API 호출
      console.log("운송 견적 요청:", data);
      toast.success("운송 견적 요청이 접수되었습니다!");
      setShowLogisticsModal(false);
    } catch (error) {
      toast.error("운송 견적 요청에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
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

  // 거래중인 상품 권한 체크
  const isReservedOrEscrowCompleted =
    item.status === "reserved" || item.status === "escrow_completed";
  const isSeller = user?.uid === item.sellerUid;
  const isBuyer = user?.uid === item.buyerUid;
  const canViewItem = !isReservedOrEscrowCompleted || isSeller || isBuyer;

  if (!canViewItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            거래 중인 상품입니다
          </h2>
          <p className="text-gray-600 mb-4">
            이 상품은 현재 거래 중이어서 구매자와 판매자만 볼 수 있습니다.
          </p>
          <Button onClick={() => router.push("/list")}>
            상품 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>뒤로가기</span>
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-1"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">공유</span>
              </Button>

              {/* 판매자만 수정/삭제 버튼 표시 */}
              {isSeller && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/product/edit/${item.id}`)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">수정</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">삭제</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 상품 이미지 */}
            <Card className="overflow-hidden">
              <ItemGallery
                images={item.imageUrls || []}
                title={item.title}
                className="aspect-square"
              />
            </Card>

            {/* 상품 정보 */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {item.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDistanceToNow(item.createdAt.toDate(), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{item.region}</span>
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {item.price.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    상품 설명
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    상품 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">카테고리</span>
                      <p className="font-medium">
                        {INSTRUMENT_CATEGORIES.find(
                          cat => cat.key === item.category
                        )?.label || item.category}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">상태</span>
                      <p className="font-medium">
                        {CONDITION_GRADES.find(
                          grade => grade.key === item.condition
                        )?.label || item.condition}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 거래 옵션 */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    거래 방식
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.escrowEnabled && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <Shield className="w-4 h-4 mr-1" />
                        안전거래 가능
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Truck className="w-4 h-4 mr-1" />
                      {item.shippingType === "direct" ? "직거래" : "택배"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 거래 상태 타임라인 */}
            {item.status !== "active" && (
              <Card className="p-6">
                <StatusTimeline
                  status={item.status as any}
                  createdAt={item.createdAt}
                  updatedAt={item.updatedAt}
                />
              </Card>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 판매자 정보 */}
            {sellerProfile && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {sellerProfile.profileImageUrl ? (
                      <img
                        src={sellerProfile.profileImageUrl}
                        alt={sellerProfile.nickname}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {sellerProfile.nickname}
                    </h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {sellerProfile.rating?.toFixed(1) || "0.0"}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({sellerProfile.reviewsCount || 0}개 리뷰)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center border-t pt-4">
                  <div>
                    <span className="text-gray-500">판매 상품</span>
                    <p className="font-semibold">
                      {sellerProfile.itemsCount || 0}개
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">받은 후기</span>
                    <p className="font-semibold">
                      {sellerProfile.reviewsCount || 0}개
                    </p>
                  </div>
                </div>

                {sellerProfile.introShort && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      {sellerProfile.introShort}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-400 text-center pt-2">
                  클릭하여 상세 프로필 보기
                </div>
              </Card>
            )}

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
                    // 거래 시작 메시지 전송
                    if (item.sellerUid && user?.uid) {
                      try {
                        const { getOrCreateChat } = await import(
                          "../../../lib/chat/api"
                        );
                        const chatResult = await getOrCreateChat(
                          item.id,
                          user.uid, // 구매자 UID
                          item.sellerUid, // 판매자 UID
                          "거래가 시작되었습니다. 구매자와 소통을 시작해주세요."
                        );

                        if (chatResult.success) {
                          console.log(
                            "거래 시작 메시지 전송 완료:",
                            chatResult.chatId
                          );
                        }
                      } catch (error) {
                        console.error("거래 시작 메시지 전송 실패:", error);
                      }
                    }

                    // 거래 관리 페이지로 이동
                    window.location.href = `/transaction/${item.id}`;
                  } else {
                    toast.error(result.error || "거래 시작에 실패했습니다.");
                  }
                } catch (error) {
                  console.error("거래 시작 실패:", error);
                  toast.error("거래 시작 중 오류가 발생했습니다.");
                }
              }}
              onChat={() => {
                // 채팅 시작
                if (item.sellerUid && user?.uid) {
                  window.location.href = `/chat?itemId=${item.id}&sellerId=${item.sellerUid}`;
                }
              }}
              onSimilarItems={() => {
                // 유사 상품 보기
                router.push("/list");
              }}
              onLogisticsQuote={() => {
                // 운송 견적 요청
                setShowLogisticsModal(true);
              }}
            />

            {/* 운송 견적 요청 모달 */}
            {showLogisticsModal && (
              <LogisticsQuoteModal
                isOpen={showLogisticsModal}
                onClose={() => setShowLogisticsModal(false)}
                onSubmit={handleLogisticsQuote}
                item={{
                  id: item.id,
                  title: item.title,
                  price: item.price,
                  weight: 5, // 기본값
                  dimensions: {
                    length: 100,
                    width: 50,
                    height: 30,
                  },
                  pickupAddress: item.region,
                }}
              />
            )}

            {/* 판매자 프로필 모달 */}
            {showSellerProfileModal && sellerProfile && (
              <SellerProfileModal
                isOpen={showSellerProfileModal}
                onClose={() => setShowSellerProfileModal(false)}
                sellerProfile={sellerProfile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
