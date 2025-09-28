"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import { getItem } from "../../lib/api/products";
import { SellItem } from "../../data/types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import ProductDetailModal from "../product/ProductDetailModal";
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

interface TransactionPageClientProps {
  item: SellItem;
}

export function TransactionPageClient({ item }: TransactionPageClientProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [sellerLoading, setSellerLoading] = useState(true);

  // 판매자 정보 가져오기
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!item?.sellerUid) {
        console.log("판매자 ID가 없습니다:", item);
        return;
      }
      
      console.log("판매자 프로필 로드 시작:", item.sellerUid);
      
      try {
        setSellerLoading(true);
        const result = await getUserProfile(item.sellerUid);
        console.log("판매자 프로필 API 결과:", result);
        
        if (result && result.success && result.data) {
          console.log("판매자 프로필 로드 성공:", result.data);
          setSellerProfile(result.data);
        } else {
          console.warn("판매자 프로필을 찾을 수 없습니다:", item.sellerUid, result);
        }
      } catch (error) {
        console.error("판매자 프로필 로드 실패:", error);
      } finally {
        setSellerLoading(false);
      }
    };

    fetchSellerProfile();
  }, [item?.sellerUid]);

  const handleStartChat = () => {
    if (item?.sellerUid) {
      router.push(`/chat?itemId=${item.id}&sellerId=${item.sellerUid}`);
    }
  };

  const handleCancelPurchase = async () => {
    if (!item.id) return;

    const confirmed = window.confirm("정말 구매를 취소하시겠습니까?");
    if (!confirmed) return;

    try {
      setLoading(true);
      // 상품 상태를 다시 active로 변경하고 buyerId 제거
      const { updateItemStatus } = await import("../../lib/api/products");
      const result = await updateItemStatus(item.id, "active");

      if (result.success) {
        toast.success("구매가 취소되었습니다.");
        router.push("/profile");
      } else {
        toast.error("구매 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("구매 취소 실패:", error);
      toast.error("구매 취소 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    try {
      // ISO 문자열이거나 Date 객체인 경우 처리
      const dateObj =
        typeof date === "string"
          ? new Date(date)
          : date.toDate
            ? date.toDate()
            : new Date(date);
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">인증 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">로그인이 필요합니다.</p>
          <Button onClick={() => router.push("/auth/login")}>로그인</Button>
        </div>
      </div>
    );
  }

  const isBuyer = user?.uid !== item.sellerId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>뒤로</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isBuyer ? "구매한 상품" : "판매한 상품"}
              </h1>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">
                거래중
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 구매한 상품과 판매자 정보 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">구매한 상품</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 상품 썸네일 카드 */}
            <div className="lg:col-span-1">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => {
                setShowProductModal(true);
              }}>
                {/* 상품 이미지 */}
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-3 relative">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title || `${item.brand} ${item.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                      🎵
                    </div>
                  )}
                  
                  {/* 거래중 배지 */}
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                    거래중
                  </div>
                </div>

                {/* 상품 정보 */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {item.title || `${item.brand} ${item.model}`}
                  </h3>
                  
                  <div className="text-lg font-bold text-blue-600">
                    {formatPrice(item.price)}
                  </div>

                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {item.region}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      {item.category || "기타"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* 판매자 정보 */}
            <div className="lg:col-span-1">
              <Card className="p-6 h-full">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  판매자 정보
                </h2>

                {sellerLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                    <span className="text-gray-600">판매자 정보를 불러오는 중...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 프로필 */}
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {sellerProfile?.profileImage || sellerProfile?.photoURL ? (
                          <img 
                            src={sellerProfile.profileImage || sellerProfile.photoURL} 
                            alt={sellerProfile?.nickname || "판매자"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center">
                            {sellerProfile?.nickname?.charAt(0)?.toUpperCase() || sellerProfile?.username?.charAt(0)?.toUpperCase() || item.sellerUid?.charAt(0)?.toUpperCase() || "S"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-lg">{sellerProfile?.nickname || "판매자"}</p>
                        <p className="text-sm text-gray-500">{sellerProfile?.region || item.region || "지역 미설정"}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">{sellerProfile?.averageRating?.toFixed(1) || "0.0"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">거래 {sellerProfile?.tradesCount || 0}회</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 판매자 상세 정보 */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">등급</p>
                          <p className="text-sm font-medium text-gray-900">{sellerProfile?.grade || "Bronze"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">인증 상태</p>
                          <p className="text-sm font-medium text-green-600">
                            {sellerProfile?.isPhoneVerified ? "✓ 인증완료" : "미인증"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 버튼들 */}
                    <div className="pt-4 space-y-3">
                      <Button
                        onClick={handleStartChat}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>판매자와 채팅하기</span>
                      </Button>

                      {isBuyer && (
                        <Button
                          onClick={handleCancelPurchase}
                          variant="outline"
                          className="w-full flex items-center justify-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                          disabled={loading}
                        >
                          <X className="w-5 h-5" />
                          <span>{loading ? "취소 중..." : "구매취소"}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* 거래 진행 상황 */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            거래 진행 상황
          </h2>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                1
              </div>
              <div>
                <p className="font-medium text-gray-800">거래 시작</p>
                <p className="text-sm text-gray-600">
                  {isBuyer
                    ? "상품 구매 요청을 완료했습니다."
                    : "상품 구매 요청을 받았습니다."}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center mr-3">
                2
              </div>
              <div>
                <p className="font-medium text-gray-800">거래 진행중</p>
                <p className="text-sm text-gray-600">
                  채팅을 통해 거래를 협의 중입니다.
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center mr-3">
                3
              </div>
              <div>
                <p className="font-medium text-gray-800">거래 완료</p>
                <p className="text-sm text-gray-600">
                  아직 거래가 완료되지 않았습니다.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 안전 거래 안내 */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            안전 거래 안내
          </h2>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  거래 전 확인사항
                </p>
                <p className="text-sm text-blue-700">
                  상품 상태와 거래 조건을 정확히 확인하세요.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  채팅을 통한 소통
                </p>
                <p className="text-sm text-blue-700">
                  모든 거래 관련 대화는 채팅에서 진행하세요.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">안전한 결제</p>
                <p className="text-sm text-blue-700">
                  직거래 시 만나서 거래하고, 택배 시 안전거래를 이용하세요.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 상품 상세 모달 */}
      {showProductModal && (
        <ProductDetailModal
          item={item}
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
        />
      )}
    </div>
  );
}
