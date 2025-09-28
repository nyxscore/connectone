"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import {
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Minus,
  Plus,
  MessageCircle,
  CreditCard,
  Heart,
  X,
  User,
  Star,
  Edit,
  Clock,
  Trash2,
} from "lucide-react";
import { getProductDetail, getSellerInfo } from "@/lib/api/product-detail";
import { ProductDetail, SellerInfo, TradeOption } from "@/data/schemas/product";
import { SellItem } from "@/data/types";
import { INSTRUMENT_CATEGORIES } from "@/data/constants";
import { Button } from "@/components/ui/Button";
import { getGradeInfo } from "@/lib/profile/api";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";
import { Card } from "@/components/ui/Card";
import { FirestoreChatModal } from "@/components/chat/FirestoreChatModal";
import { getUserProfile } from "@/lib/profile/api";
import { UserProfile } from "@/data/profile/types";
import { SellerProfileModal } from "@/components/profile/SellerProfileModal";
import EditProductModal from "./EditProductModal";
import { useAuth } from "@/lib/hooks/useAuth";
import { ItemGallery } from "@/components/items/ItemGallery";

// 마그니파이어 이미지 컴포넌트
interface MagnifierImageProps {
  src: string;
  alt: string;
  onClick: () => void;
}

const MagnifierImage: React.FC<MagnifierImageProps> = ({
  src,
  alt,
  onClick,
}) => {
  return (
    <div className="aspect-square bg-gray-100" onClick={onClick}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover cursor-pointer"
      />
    </div>
  );
};

interface ProductDetailModalProps {
  productId?: string | null;
  item?: SellItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  productId,
  item,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);

  // item이 있으면 item.id를 productId로 사용
  const actualProductId = productId || item?.id;
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 거래 방식 및 구매 관련 상태
  const [selectedTradeMethod, setSelectedTradeMethod] =
    useState<TradeOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSellerProfileModal, setShowSellerProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // 본인 상품인지 확인
  const isOwnItem = user && product && user.uid === product.sellerId;

  // 찜한 상품 상태 초기화
  useEffect(() => {
    if (user?.uid && product?.id) {
      const wishlistKey = `wishlist_${user.uid}`;
      const existingWishlist = JSON.parse(
        localStorage.getItem(wishlistKey) || "[]"
      );
      setIsLiked(existingWishlist.includes(product.id));
    }
  }, [user?.uid, product?.id]);

  // 디버깅 로그
  console.log("ProductDetailModal 디버깅:", {
    user: user ? { uid: user.uid, nickname: user.nickname } : null,
    product: product
      ? { id: product.id, sellerId: product.sellerId, title: product.title }
      : null,
    isOwnItem,
  });

  // SellItem을 ProductDetail로 변환하는 함수
  const convertSellItemToProductDetail = (
    sellItem: SellItem
  ): ProductDetail => {
    // shippingTypes를 tradeOptions로 변환 (escrow는 제외)
    const tradeOptions = sellItem.shippingTypes
      .filter(type => type !== "escrow") // escrow 제외
      .map(type => {
        switch (type) {
          case "direct":
            return "직거래";
          case "pickup":
            return "직거래";
          case "courier":
          case "parcel":
            // 택배인 경우 parcelPaymentType에 따라 부담 방식 표시
            if (sellItem.parcelPaymentType === "seller") {
              return "택배 (판매자부담)";
            } else if (sellItem.parcelPaymentType === "buyer") {
              return "택배 (구매자부담)";
            } else {
              return "택배";
            }
          case "meetup":
            return "직거래";
          case "shipping":
            return "화물운송";
          default:
            return type;
        }
      });

    console.log("SellItem shippingTypes:", sellItem.shippingTypes);
    console.log("변환된 tradeOptions:", tradeOptions);

    return {
      id: sellItem.id,
      title:
        sellItem.title ||
        (sellItem.brand && sellItem.model
          ? `${sellItem.brand} ${sellItem.model}`
          : "상품명 없음"),
      price: sellItem.price,
      category: sellItem.category,
      region: sellItem.region,
      tradeOptions: tradeOptions,
      sellerId: sellItem.sellerUid,
      description: sellItem.description,
      images: sellItem.images,
      aiProcessedImages: sellItem.aiProcessedImages || [],
      createdAt: sellItem.createdAt,
      updatedAt: sellItem.updatedAt,
    };
  };

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);

          // item이 있으면 직접 변환, 없으면 productId로 조회
          if (item) {
            const productDetail = convertSellItemToProductDetail(item);
            setProduct(productDetail);

            // 판매자 정보 조회
            const sellerResult = await getSellerInfo(item.sellerUid);
            if (sellerResult.success && sellerResult.seller) {
              setSeller(sellerResult.seller);
            }

            // 판매자 프로필 정보 가져오기
            if (item.sellerUid) {
              try {
                console.log("판매자 프로필 조회 시작:", item.sellerUid);
                const profileResult = await getUserProfile(item.sellerUid);
                console.log("판매자 프로필 조회 결과:", profileResult);
                if (
                  profileResult &&
                  profileResult.success &&
                  profileResult.data
                ) {
                  setSellerProfile(profileResult.data);
                  console.log("판매자 프로필 설정됨:", profileResult.data);
                } else {
                  console.warn(
                    "판매자 프로필을 찾을 수 없습니다:",
                    item.sellerUid
                  );
                  // 기본 프로필 정보 설정
                  setSellerProfile({
                    uid: item.sellerUid,
                    username: item.sellerUid,
                    nickname: "사용자",
                    region: "서울시 강남구",
                    grade: "Bronze",
                    tradesCount: 0,
                    reviewsCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    safeTransactionCount: 0,
                    averageRating: 0,
                    disputeCount: 0,
                    isPhoneVerified: false,
                    isIdVerified: false,
                    isBankVerified: false,
                  });
                }
              } catch (error) {
                console.error("판매자 프로필 조회 실패:", error);
                // 오류가 발생해도 기본 프로필 정보 설정
                setSellerProfile({
                  uid: item.sellerUid,
                  username: item.sellerUid,
                  nickname: "사용자",
                  region: "서울시 강남구",
                  grade: "Bronze",
                  tradesCount: 0,
                  reviewsCount: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  safeTransactionCount: 0,
                  averageRating: 0,
                  disputeCount: 0,
                  isPhoneVerified: false,
                  isIdVerified: false,
                  isBankVerified: false,
                });
              }
            }
          } else if (productId) {
            // 상품 정보 조회
            const productResult = await getProductDetail(productId);
            if (!productResult.success || !productResult.product) {
              setError(productResult.error || "상품을 찾을 수 없습니다.");
              return;
            }

            setProduct(productResult.product);

            // 판매자 정보 조회
            const sellerResult = await getSellerInfo(
              productResult.product.sellerId
            );
            if (sellerResult.success && sellerResult.seller) {
              setSeller(sellerResult.seller);
            }

            // 판매자 프로필 정보 가져오기
            if (productResult.product.sellerId) {
              try {
                console.log(
                  "판매자 프로필 조회 시작 (productId):",
                  productResult.product.sellerId
                );
                const profileResult = await getUserProfile(
                  productResult.product.sellerId
                );
                console.log(
                  "판매자 프로필 조회 결과 (productId):",
                  profileResult
                );
                if (
                  profileResult &&
                  profileResult.success &&
                  profileResult.data
                ) {
                  setSellerProfile(profileResult.data);
                  console.log(
                    "판매자 프로필 설정됨 (productId):",
                    profileResult.data
                  );
                } else {
                  console.warn(
                    "판매자 프로필을 찾을 수 없습니다 (productId):",
                    productResult.product.sellerId
                  );
                  // 기본 프로필 정보 설정
                  setSellerProfile({
                    uid: productResult.product.sellerId,
                    username: productResult.product.sellerId,
                    nickname: "사용자",
                    region: "서울시 강남구",
                    grade: "Bronze",
                    tradesCount: 0,
                    reviewsCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    safeTransactionCount: 0,
                    averageRating: 0,
                    disputeCount: 0,
                    isPhoneVerified: false,
                    isIdVerified: false,
                    isBankVerified: false,
                  });
                }
              } catch (error) {
                console.error("판매자 프로필 조회 실패 (productId):", error);
                // 오류가 발생해도 기본 프로필 정보 설정
                setSellerProfile({
                  uid: productResult.product.sellerId,
                  username: productResult.product.sellerId,
                  nickname: "사용자",
                  region: "서울시 강남구",
                  grade: "Bronze",
                  tradesCount: 0,
                  reviewsCount: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  safeTransactionCount: 0,
                  averageRating: 0,
                  disputeCount: 0,
                  isPhoneVerified: false,
                  isIdVerified: false,
                  isBankVerified: false,
                });
              }
            }
          }
        } catch (err) {
          console.error("데이터 로딩 실패:", err);
          setError("데이터를 불러오는데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [productId, item, isOpen]);

  const getCategoryIcon = (category: string) => {
    const categoryInfo = INSTRUMENT_CATEGORIES.find(c => c.key === category);
    return categoryInfo?.icon || "🎵";
  };

  const getCategoryLabel = (category: string) => {
    const categoryInfo = INSTRUMENT_CATEGORIES.find(c => c.key === category);
    return categoryInfo?.label || category;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "Gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Silver":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Bronze":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case "Gold":
        return "🥇";
      case "Silver":
        return "🥈";
      case "Bronze":
        return "🥉";
      default:
        return "🏅";
    }
  };

  const totalPrice = product ? product.price * quantity : 0;

  // 상품 삭제 함수
  const handleDelete = async () => {
    if (!product) return;

    if (!window.confirm("정말로 이 상품을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const productRef = doc(db, "items", product.id);
      await deleteDoc(productRef);

      toast.success("상품이 삭제되었습니다.");
      onClose(); // 모달 닫기
      window.location.reload(); // 페이지 새로고침
    } catch (error) {
      console.error("상품 삭제 실패:", error);
      toast.error("상품 삭제에 실패했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">상품 상세</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                오류가 발생했습니다
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={onClose}>닫기</Button>
            </div>
          )}

          {product && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 좌측 메인 영역 - 상품 정보 */}
              <div className="lg:col-span-2 space-y-8">
                {/* 상품 기본 정보 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {product.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(
                          product.createdAt?.toDate?.() || product.createdAt
                        ).toLocaleDateString("ko-KR")}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        조회수 0
                      </span>
                    </div>
                  </div>

                  {/* 상품 상세 정보 */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200">
                    <div>
                      <span className="text-sm text-gray-600">카테고리</span>
                      <div className="font-medium">
                        {getCategoryLabel(product.category)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">거래 지역</span>
                      <div className="font-medium flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {product.region}
                      </div>
                    </div>
                  </div>

                  {/* 판매자 정보 */}
                  <div
                    className="pt-4 border-t border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2"
                    onClick={() => setShowSellerProfileModal(true)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      판매자 정보
                    </h3>
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
                            {sellerProfile?.nickname ||
                              seller?.displayName ||
                              "판매자"}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              {(() => {
                                const grade =
                                  sellerProfile?.grade || seller?.grade || "C";
                                const gradeInfo = getGradeInfo(grade);
                                return gradeInfo.displayName;
                              })()}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-1" />
                              {sellerProfile?.region || product.region}
                            </div>
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
                          <span className="text-gray-500">평점</span>
                          <p className="font-semibold">
                            {sellerProfile?.averageRating
                              ? `${sellerProfile.averageRating.toFixed(1)}점`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 이미지 갤러리 (통일: ItemGallery 사용) */}
                {product.images && product.images.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      상품 이미지
                    </h3>
                    <ItemGallery
                      images={product.images}
                      alt={
                        product.title ||
                        `${product.brand || ""} ${product.model || ""}`.trim() ||
                        "상품 이미지"
                      }
                      maxHeight="300px"
                      aiProcessedImages={product.aiProcessedImages || []}
                    />
                  </div>
                )}

                {/* 상품 설명 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    상품 설명
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* 우측 사이드바 - 거래 방식 및 구매 */}
              <div className="space-y-6">
                {/* 거래 방식 선택 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💡</span>
                    거래 방식을 선택해주세요
                  </h3>
                  <div className="space-y-3">
                    {console.log(
                      "렌더링할 tradeOptions:",
                      product.tradeOptions
                    )}
                    {product.tradeOptions.map(option => (
                      <label
                        key={option}
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedTradeMethod === option
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="tradeMethod"
                          value={option}
                          checked={selectedTradeMethod === option}
                          onChange={e =>
                            setSelectedTradeMethod(
                              e.target.value as TradeOption
                            )
                          }
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                            selectedTradeMethod === option
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedTradeMethod === option && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                </Card>

                {/* 구매 영역 */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {product.title}
                      </h4>
                    </div>

                    {/* 총 금액 */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">총 금액</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(product.price)}원
                        </span>
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="space-y-3 pt-4">
                      {isOwnItem ? (
                        // 본인 상품일 때 - 수정하기, 삭제하기 버튼
                        <div className="space-y-3">
                          <Button
                            className="w-full h-12 text-lg font-semibold"
                            onClick={() => {
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="w-5 h-5 mr-2" />
                            수정하기
                          </Button>
                          <Button
                            variant="destructive"
                            className="w-full h-12 text-lg font-semibold"
                            onClick={handleDelete}
                          >
                            <Trash2 className="w-5 h-5 mr-2" />
                            삭제하기
                          </Button>
                        </div>
                      ) : (
                        // 다른 사람 상품일 때 - 찜하기, 채팅하기, 결제하기
                        <>
                          <div className="flex space-x-2">
                            <button
                              className="flex-1 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center space-x-2"
                              onClick={() => {
                                const newLikedState = !isLiked;
                                setIsLiked(newLikedState);

                                // 로컬 스토리지에 찜한 상품 저장/제거
                                if (user?.uid) {
                                  const wishlistKey = `wishlist_${user.uid}`;
                                  const existingWishlist = JSON.parse(
                                    localStorage.getItem(wishlistKey) || "[]"
                                  );

                                  if (newLikedState) {
                                    // 찜하기 추가
                                    if (
                                      !existingWishlist.includes(product.id)
                                    ) {
                                      existingWishlist.push(product.id);
                                      localStorage.setItem(
                                        wishlistKey,
                                        JSON.stringify(existingWishlist)
                                      );
                                      toast.success(
                                        "찜 목록에 추가되었습니다!"
                                      );
                                    }
                                  } else {
                                    // 찜하기 제거
                                    const updatedWishlist =
                                      existingWishlist.filter(
                                        (id: string) => id !== product.id
                                      );
                                    localStorage.setItem(
                                      wishlistKey,
                                      JSON.stringify(updatedWishlist)
                                    );
                                    toast.success(
                                      "찜 목록에서 제거되었습니다!"
                                    );
                                  }
                                }
                              }}
                            >
                              <Heart
                                className={`w-5 h-5 ${isLiked ? "text-red-500 fill-current" : "text-gray-600"}`}
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {isLiked ? "찜하기 해제" : "찜하기"}
                              </span>
                            </button>
                            <button
                              className="flex-1 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center space-x-2"
                              onClick={() => {
                                // 채팅 기능 - 채팅 모달 열기
                                setShowChatModal(true);
                              }}
                            >
                              <MessageCircle className="w-5 h-5 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">
                                채팅하기
                              </span>
                            </button>
                          </div>
                          {/* 상품 상태에 따른 버튼 표시 */}
                          {product?.status === "reserved" ? (
                            <div className="w-full h-12 bg-orange-100 border border-orange-300 rounded-xl flex items-center justify-center">
                              <Clock className="w-5 h-5 mr-2 text-orange-600" />
                              <span className="text-lg font-semibold text-orange-600">
                                거래중
                              </span>
                            </div>
                          ) : (
                            <Button
                              className="w-full h-12 text-lg font-semibold"
                              disabled={!selectedTradeMethod}
                              onClick={async () => {
                                if (selectedTradeMethod && actualProductId) {
                                  try {
                                    console.log("상품 상태 변경 시작:", {
                                      productId: actualProductId,
                                      status: "reserved",
                                    });

                                    // 상품 상태를 거래중으로 변경
                                    const { updateItemStatus } = await import(
                                      "../../lib/api/products"
                                    );
                                    const result = await updateItemStatus(
                                      actualProductId,
                                      "reserved",
                                      user?.uid
                                    );

                                    if (result.success) {
                                      toast.success(
                                        "구매가 완료되었습니다! 거래 관리 페이지로 이동합니다."
                                      );

                                      // 거래 관리 페이지로 이동
                                      setTimeout(() => {
                                        if (onClose) {
                                          onClose();
                                        }
                                        window.location.href = `/transaction/${actualProductId}`;
                                      }, 1500);
                                    } else {
                                      toast.error(
                                        result.error ||
                                          "상품 상태 변경에 실패했습니다."
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "상품 상태 변경 실패:",
                                      error
                                    );
                                    toast.error(
                                      "상품 상태 변경 중 오류가 발생했습니다."
                                    );
                                  }
                                } else if (!actualProductId) {
                                  toast.error("상품 ID를 찾을 수 없습니다.");
                                }
                              }}
                            >
                              <CreditCard className="w-5 h-5 mr-2" />
                              구매하기
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 이미지 모달 */}
      {showImageModal &&
        product &&
        product.images &&
        product.images.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
              >
                ✕
              </button>
              <img
                src={product.images[selectedImageIndex]}
                alt={`상품 이미지 ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              {product.images.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === selectedImageIndex
                          ? "bg-white"
                          : "bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* 채팅 모달 */}
      <FirestoreChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        itemId={product?.id}
        sellerUid={product?.sellerId}
      />

      {/* 판매자 프로필 모달 */}
      {sellerProfile && (
        <SellerProfileModal
          isOpen={showSellerProfileModal}
          onClose={() => setShowSellerProfileModal(false)}
          sellerProfile={sellerProfile}
        />
      )}

      {/* 상품 수정 모달 */}
      {product && (
        <EditProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          productId={product.id}
          onSuccess={() => {
            // 수정 완료 후 상품 정보 새로고침
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
