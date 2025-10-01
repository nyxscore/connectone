"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Shield,
  ShoppingCart,
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
import { SellerProfileCard } from "@/components/profile/SellerProfileCard";
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
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);

  // item이 있으면 item.id를 productId로 사용
  const actualProductId = productId || item?.id;

  // 현재 사용자가 구매자인지 확인
  const isBuyer = user?.uid && item?.buyerId && user.uid === item.buyerId;

  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 거래 방식 및 구매 관련 상태
  const [selectedTradeMethod, setSelectedTradeMethod] =
    useState<TradeOption | null>(null);
  const [buyerEscrowEnabled, setBuyerEscrowEnabled] = useState(false); // 구매자 안전거래 선택 여부
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSellerProfileModal, setShowSellerProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTradeType, setSelectedTradeType] = useState<string>("");

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
      })
      .sort((a, b) => {
        // 직거래를 맨 위로, 택배를 그 다음으로
        if (a === "직거래") return -1;
        if (b === "직거래") return 1;
        if (a.includes("택배")) return -1;
        if (b.includes("택배")) return 1;
        return 0;
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
      escrowEnabled: sellItem.escrowEnabled || false, // 안전거래 옵션 추가
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
                    grade: "E",
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
                    grade: "E",
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
      case "A":
        return "bg-red-100 text-red-800 border-red-200";
      case "B":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "C":
        return "bg-green-100 text-green-800 border-green-200";
      case "D":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "E":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case "A":
        return "🎸";
      case "B":
        return "🎹";
      case "C":
        return "🎼";
      case "D":
        return "🎵";
      case "E":
        return "🥁";
      default:
        return "🥁";
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

  const handleCancelPurchase = async () => {
    if (!actualProductId) return;

    const confirmed = window.confirm("정말 구매를 취소하시겠습니까?");
    if (!confirmed) return;

    try {
      setLoading(true);
      // 상품 상태를 다시 active로 변경하고 buyerId 제거
      const { updateItemStatus } = await import("../../lib/api/products");
      const result = await updateItemStatus(actualProductId, "active");

      if (result.success) {
        toast.success("구매가 취소되었습니다.");
        onClose();
        window.location.reload();
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

  const handleStartChat = async () => {
    if (!product || !user) return;

    try {
      setLoading(true);

      // 채팅 생성 및 이동 로직
      const { createChat } = await import("../../lib/chat/api");
      const chatResult = await createChat(
        product.sellerUid,
        user.uid,
        product.id
      );

      if (chatResult.success && chatResult.chatId) {
        // 채팅 페이지로 이동
        window.location.href = `/chat?chatId=${chatResult.chatId}`;
      } else {
        toast.error("채팅을 시작할 수 없습니다.");
      }
    } catch (error) {
      console.error("채팅 시작 실패:", error);
      toast.error("채팅 시작 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
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
                  <SellerProfileCard
                    sellerProfile={sellerProfile}
                    seller={seller}
                    region={product.region}
                    onClick={() => setShowSellerProfileModal(true)}
                    showClickable={true}
                  />
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
                      <div key={option}>
                        <label
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

                        {/* 택배 선택 시 안전거래 옵션 표시 */}
                        {selectedTradeMethod === option &&
                          option.includes("택배") &&
                          product?.escrowEnabled && (
                            <div
                              className={`mt-3 flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                buyerEscrowEnabled
                                  ? "border-green-500 bg-green-50"
                                  : "border-green-200 bg-green-50 hover:border-green-300"
                              }`}
                              onClick={() =>
                                setBuyerEscrowEnabled(!buyerEscrowEnabled)
                              }
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                  buyerEscrowEnabled
                                    ? "border-green-500 bg-green-500"
                                    : "border-green-300 bg-white"
                                }`}
                              >
                                {buyerEscrowEnabled && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-green-800">
                                    안전거래
                                  </span>
                                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    ⭐ 추천
                                  </span>
                                </div>
                                <p className="text-xs text-green-700 mt-1">
                                  거래금액이 보호되며, 상품 수령 후에 판매자에게
                                  입금됩니다
                                </p>
                              </div>
                            </div>
                          )}
                      </div>
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
                      <div className="space-y-2">
                        {/* 상품 금액 */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            상품 금액
                          </span>
                          <span className="text-base font-medium">
                            {formatPrice(product.price)}원
                          </span>
                        </div>

                        {/* 안전거래 수수료 - 택배 선택 + 안전거래 체크 시에만 */}
                        {selectedTradeMethod?.includes("택배") &&
                          product?.escrowEnabled &&
                          buyerEscrowEnabled && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                안전거래 수수료 (1.9%)
                              </span>
                              <span className="text-base font-medium text-red-600">
                                +
                                {Math.round(
                                  product.price * 0.019
                                ).toLocaleString()}
                                원
                              </span>
                            </div>
                          )}

                        {/* 총 금액 */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-lg font-semibold">총 금액</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {selectedTradeMethod?.includes("택배") &&
                            product?.escrowEnabled &&
                            buyerEscrowEnabled
                              ? formatPrice(
                                  product.price +
                                    Math.round(product.price * 0.019)
                                )
                              : formatPrice(product.price)}
                            원
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="space-y-3 pt-4">
                      {isOwnItem ? (
                        // 본인 상품일 때 - 수정하기, 삭제하기, 구매신청자 목록 버튼
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
                              className={`flex-1 p-3 rounded-xl flex items-center justify-center space-x-2 ${
                                selectedTradeMethod === "직거래"
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "border border-gray-300 hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                // 선택된 거래 형태 저장
                                if (
                                  product?.tradeOptions?.includes("직거래") &&
                                  product?.tradeOptions?.includes("택배")
                                ) {
                                  // 직거래와 택배 모두 가능한 경우
                                  if (buyerEscrowEnabled) {
                                    setSelectedTradeType("택배 + 안전거래");
                                  } else if (
                                    product?.tradeOptions?.includes("택배")
                                  ) {
                                    setSelectedTradeType("택배");
                                  } else {
                                    setSelectedTradeType("직거래");
                                  }
                                } else if (
                                  product?.tradeOptions?.includes("직거래")
                                ) {
                                  setSelectedTradeType("직거래");
                                } else if (
                                  product?.tradeOptions?.includes("택배")
                                ) {
                                  setSelectedTradeType("택배");
                                } else {
                                  setSelectedTradeType("직거래"); // 기본값
                                }

                                // 채팅 기능 - 채팅 모달 열기
                                setShowChatModal(true);
                              }}
                            >
                              <MessageCircle
                                className={`w-5 h-5 ${
                                  selectedTradeMethod === "직거래"
                                    ? "text-white"
                                    : "text-gray-600"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  selectedTradeMethod === "직거래"
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}
                              >
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
                          ) : isBuyer ? (
                            // 구매자일 때는 구매취소 버튼 표시
                            <Button
                              className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
                              onClick={handleCancelPurchase}
                              disabled={loading}
                            >
                              <X className="w-5 h-5 mr-2" />
                              {loading ? "취소 중..." : "구매취소"}
                            </Button>
                          ) : (
                            // 일반 사용자일 때는 구매 옵션 표시
                            <div className="space-y-3">
                              {/* 안전거래를 선택했을 때만 결제 버튼 표시 */}
                              {buyerEscrowEnabled &&
                                selectedTradeMethod?.includes("택배") && (
                                  <Button
                                    onClick={() => {
                                      // 안전거래로 구매
                                      router.push(
                                        `/payment?itemId=${product?.id}&escrow=true`
                                      );
                                    }}
                                    className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
                                    disabled={loading}
                                  >
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    {loading ? "로딩 중..." : "결제하기"}
                                  </Button>
                                )}
                            </div>
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
        tradeType={selectedTradeType}
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
