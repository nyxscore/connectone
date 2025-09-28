"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getItem } from "../../../lib/api/products";
import { SellItem } from "../../../data/types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
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
  Clock
} from "lucide-react";
import { WatermarkImage } from "../../../components/ui/WatermarkImage";
import toast from "react-hot-toast";

export default function TransactionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [item, setItem] = useState<SellItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const transactionId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user && transactionId) {
      loadTransaction();
    }
  }, [user, transactionId, authLoading]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError("");

      // 상품 정보 조회
      const result = await getItem(transactionId);
      if (result.success && result.item) {
        setItem(result.item);
      } else {
        setError("거래 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("거래 정보 로드 실패:", error);
      setError("거래 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (item?.sellerId) {
      router.push(`/chat?itemId=${item.id}&sellerId=${item.sellerId}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      return dateObj.toLocaleDateString("ko-KR");
    } catch (error) {
      return "";
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "reserved":
        return {
          text: "거래중",
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          icon: Clock
        };
      case "sold":
        return {
          text: "판매완료",
          color: "text-green-600",
          bgColor: "bg-green-100",
          icon: CheckCircle
        };
      default:
        return {
          text: "거래중",
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          icon: Clock
        };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">거래 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>뒤로가기</Button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">거래 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => router.back()}>뒤로가기</Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(item.status);
  const StatusIcon = statusInfo.icon;
  const isBuyer = user?.uid !== item.sellerId;
  const isSeller = user?.uid === item.sellerId;

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
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 상품 정보 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상품 정보</h2>
            
            {/* 상품 이미지 */}
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
              {item.images && item.images.length > 0 ? (
                <WatermarkImage
                  src={item.images[0]}
                  alt={item.title || `${item.brand} ${item.model}`}
                  className="w-full h-full object-cover"
                  isAiProcessed={item.aiProcessedImages?.some(aiImg => aiImg.imageIndex === 0) || false}
                  showWatermark={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                  🎵
                </div>
              )}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {item.title || `${item.brand} ${item.model}`}
            </h3>
            
            <div className="text-2xl font-bold text-blue-600 mb-4">
              {formatPrice(item.price)}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{item.region}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>등록일: {formatDate(item.createdAt)}</span>
              </div>
            </div>
          </Card>

          {/* 거래 상대방 정보 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isBuyer ? "판매자 정보" : "구매자 정보"}
            </h2>

            <div className="space-y-4">
              {/* 프로필 */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  {isBuyer ? (
                    <User className="w-6 h-6 text-gray-500" />
                  ) : (
                    <User className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {isBuyer ? "판매자" : "구매자"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isBuyer ? "판매자 프로필" : "구매자 프로필"}
                  </p>
                </div>
              </div>

              {/* 연락처 정보 */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>연락처 정보는 채팅에서 확인하세요</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>이메일 정보는 채팅에서 확인하세요</span>
                </div>
              </div>

              {/* 채팅하기 버튼 */}
              <div className="pt-4">
                <Button
                  onClick={handleStartChat}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>
                    {isBuyer ? "판매자와 채팅하기" : "구매자와 채팅하기"}
                  </span>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 거래 진행 상황 */}
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">거래 진행 상황</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">거래 시작</p>
                <p className="text-sm text-gray-500">
                  {isBuyer ? "구매 요청이 완료되었습니다" : "구매 요청을 받았습니다"}
                </p>
              </div>
            </div>

            {item.status === "reserved" && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">거래 진행중</p>
                  <p className="text-sm text-gray-500">
                    채팅을 통해 거래를 진행하세요
                  </p>
                </div>
              </div>
            )}

            {item.status === "sold" && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">거래 완료</p>
                  <p className="text-sm text-gray-500">
                    거래가 성공적으로 완료되었습니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
