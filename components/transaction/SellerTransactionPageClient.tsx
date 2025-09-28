"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import { getItem, getReservedItemsBySeller } from "../../lib/api/products";
import { SellItem } from "../../data/types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import ProductDetailModal from "../product/ProductDetailModal";
import { SellerProfileModal } from "../profile/SellerProfileModal";
import { getUserProfile } from "../../lib/profile/api";
import { UserProfile } from "../../data/profile/types";
import {
  ArrowLeft,
  MessageCircle,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

interface SellerTransactionPageClientProps {
  item: SellItem;
}

export function SellerTransactionPageClient({ item }: SellerTransactionPageClientProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState<UserProfile | null>(null);
  const [buyerLoading, setBuyerLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [sellingItems, setSellingItems] = useState<SellItem[]>([]);
  const [sellingItemsLoading, setSellingItemsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SellItem | null>(null);
  const [showBuyerProfileModal, setShowBuyerProfileModal] = useState(false);

  // 판매중인 모든 상품 가져오기
  useEffect(() => {
    const fetchSellingItems = async () => {
      if (!user?.uid) return;

      try {
        setSellingItemsLoading(true);
        const result = await getReservedItemsBySeller(user.uid);

        if (result.success && result.items) {
          console.log("판매중 상품들:", result.items);
          setSellingItems(result.items);
        } else {
          console.log("판매중 상품이 없습니다.");
          setSellingItems([]);
        }
      } catch (error) {
        console.error("판매중 상품 로드 실패:", error);
        setSellingItems([]);
      } finally {
        setSellingItemsLoading(false);
      }
    };

    fetchSellingItems();
  }, [user?.uid]);

  // 구매자 정보 가져오기 (선택된 상품 기준)
  useEffect(() => {
    const fetchBuyerProfile = async () => {
      const targetItem = selectedItem || item;
      if (!targetItem?.buyerId) {
        console.log("구매자 ID가 없습니다:", targetItem);
        return;
      }

      console.log("구매자 프로필 로드 시작:", targetItem.buyerId);

      try {
        setBuyerLoading(true);
        const result = await getUserProfile(targetItem.buyerId);
        console.log("구매자 프로필 API 결과:", result);

        if (result && result.success && result.data) {
          console.log("구매자 프로필 로드 성공:", result.data);
          console.log("자기소개 내용 (bio):", result.data.bio);
          console.log("자기소개 내용 (about):", result.data.about);
          console.log("자기소개 내용 (description):", result.data.description);
          console.log("닉네임:", result.data.nickname);
          console.log("등급:", result.data.grade);
          console.log(
            "전체 프로필 데이터:",
            JSON.stringify(result.data, null, 2)
          );
          setBuyerProfile(result.data);
        } else {
          console.warn(
            "구매자 프로필을 찾을 수 없습니다:",
            targetItem.buyerId,
            result
          );
        }
      } catch (error) {
        console.error("구매자 프로필 로드 실패:", error);
      } finally {
        setBuyerLoading(false);
      }
    };

    fetchBuyerProfile();
  }, [selectedItem?.buyerId, item?.buyerId]);

  const handleStartChat = () => {
    const targetItem = selectedItem || item;
    if (targetItem?.buyerId) {
      router.push(
        `/chat?userId=${targetItem.buyerId}&itemId=${targetItem.id}`
      );
    }
  };

  const handleCompleteSale = async () => {
    // 판매 완료 처리
    console.log("판매 완료 처리:", selectedItem || item);
    toast.success("판매가 완료되었습니다!");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      return dateObj.toLocaleDateString("ko-KR");
    } catch (error) {
      return "";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-600 mb-4">
            거래 관리 페이지를 이용하려면 로그인해주세요.
          </p>
          <Button onClick={() => router.push("/auth/login")}>
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>뒤로가기</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">판매 거래 관리</h1>
          </div>
        </div>

        {/* 판매중인 상품 목록 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            판매중인 상품 ({sellingItems.length}개)
          </h2>

          {sellingItemsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              <span className="text-gray-600">
                판매중인 상품을 불러오는 중...
              </span>
            </div>
          ) : sellingItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🛍️</div>
              <p className="text-gray-600">판매중인 상품이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sellingItems.map(sellingItem => (
                <Card
                  key={sellingItem.id}
                  className={`p-3 hover:shadow-lg transition-shadow cursor-pointer group ${
                    selectedItem?.id === sellingItem.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedItem(sellingItem);
                    console.log("상품 선택됨:", sellingItem);
                  }}
                >
                  {/* 상품 이미지 */}
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-3 relative">
                    {sellingItem.images && sellingItem.images.length > 0 ? (
                      <img
                        src={sellingItem.images[0]}
                        alt={
                          sellingItem.title ||
                          `${sellingItem.brand} ${sellingItem.model}`
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                        🎵
                      </div>
                    )}

                    {/* 거래중 배지 */}
                    <div className="absolute top-1 right-1 bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-bold shadow-lg">
                      거래중
                    </div>
                  </div>

                  {/* 상품 정보 */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {sellingItem.title ||
                        `${sellingItem.brand} ${sellingItem.model}`}
                    </h3>

                    <div className="text-base font-bold text-blue-600">
                      {formatPrice(sellingItem.price)}
                    </div>

                    <div className="flex items-center text-xs text-gray-500 space-x-2">
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {sellingItem.region}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(sellingItem.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {sellingItem.category || "기타"}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 상품의 구매자 정보 */}
        {selectedItem && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              선택된 상품의 구매자 정보
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 상품 썸네일 */}
              <div className="space-y-4">
                <div
                  className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowProductModal(true)}
                >
                  {selectedItem.images && selectedItem.images.length > 0 ? (
                    <img
                      src={selectedItem.images[0]}
                      alt={
                        selectedItem.title ||
                        `${selectedItem.brand} ${selectedItem.model}`
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                      🎵
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedItem.title ||
                      `${selectedItem.brand} ${selectedItem.model}`}
                  </h3>
                  <div className="text-xl font-bold text-blue-600">
                    {formatPrice(selectedItem.price)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedItem.region}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      {selectedItem.category || "기타"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 구매자 정보 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      console.log("구매자 프로필 클릭됨!");
                      setShowBuyerProfileModal(true);
                    }}
                  >
                    {buyerProfile?.profileImage ||
                    buyerProfile?.photoURL ? (
                      <img
                        src={
                          buyerProfile.profileImage ||
                          buyerProfile.photoURL
                        }
                        alt={buyerProfile?.nickname || "구매자"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center">
                        {buyerProfile?.nickname
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          buyerProfile?.username
                            ?.charAt(0)
                            ?.toUpperCase() ||
                          selectedItem.buyerId?.charAt(0)?.toUpperCase() ||
                          "B"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {buyerProfile?.nickname || "구매자"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {buyerProfile?.region || "지역 미설정"}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {buyerProfile?.grade || "C"}등급
                      </span>
                      <span className="text-xs text-gray-500">
                        {buyerProfile?.grade === "Bronze"
                          ? "Chord"
                          : buyerProfile?.grade === "Silver"
                            ? "Melody"
                            : buyerProfile?.grade === "Gold"
                              ? "Harmony"
                              : buyerProfile?.grade === "Platinum"
                                ? "Symphony"
                                : buyerProfile?.grade === "Diamond"
                                  ? "Concert"
                                  : "Chord"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 구매자 상세 정보 */}
                {buyerLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">
                      구매자 정보를 불러오는 중...
                    </span>
                  </div>
                ) : buyerProfile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">평균 평점</span>
                      <span className="font-medium">
                        {buyerProfile.averageRating?.toFixed(1) || "0.0"}점
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">거래 횟수</span>
                      <span className="font-medium">
                        {buyerProfile.tradesCount || 0}회
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">응답률</span>
                      <span className="font-medium">
                        {buyerProfile.responseRate || 0}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    구매자 정보를 불러올 수 없습니다.
                  </div>
                )}

                {/* 거래 진행 상황 */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">거래 진행 상황</h4>
                  <div className="flex items-center justify-between">
                    {/* 거래 시작 */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-1">
                        1
                      </div>
                      <span className="text-xs text-gray-600">거래 시작</span>
                    </div>
                    
                    {/* 연결선 */}
                    <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                    
                    {/* 거래 진행중 */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-1">
                        1
                      </div>
                      <span className="text-xs text-gray-600">거래 진행중</span>
                    </div>
                    
                    {/* 연결선 */}
                    <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                    
                    {/* 거래 완료 */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm mb-1">
                        3
                      </div>
                      <span className="text-xs text-gray-600">거래 완료</span>
                    </div>
                  </div>
                </div>

                {/* 안전 거래 안내 */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">안전 거래 안내</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-700">거래 전 확인사항</div>
                        <div className="text-xs text-gray-600">상품 상태와 거래 조건을 정확히 확인하세요.</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-700">채팅을 통한 소통</div>
                        <div className="text-xs text-gray-600">모든 거래 관련 대화는 채팅에서 진행하세요.</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-gray-700">안전한 결제</div>
                        <div className="text-xs text-gray-600">직거래 시 만나서 거래하고, 택배 시 안전거래를 이용하세요.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleStartChat}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    구매자와 채팅하기
                  </Button>
                  <Button
                    onClick={handleCompleteSale}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    판매 완료 처리
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상품 상세 모달 */}
        {showProductModal && selectedItem && (
          <ProductDetailModal
            item={selectedItem}
            isOpen={showProductModal}
            onClose={() => setShowProductModal(false)}
          />
        )}

        {/* 구매자 프로필 모달 */}
        <SellerProfileModal
          sellerProfile={buyerProfile}
          isOpen={showBuyerProfileModal}
          onClose={() => setShowBuyerProfileModal(false)}
          onStartChat={handleStartChat}
        />
      </div>
    </div>
  );
}
