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

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 상품 정보 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상품 정보</h2>
            
            {/* 상품 이미지 */}
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.title || `${item.brand} ${item.model}`}
                  className="w-full h-full object-cover"
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

          {/* 판매자 정보 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">판매자 정보</h2>

            <div className="space-y-4">
              {/* 프로필 */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">판매자</p>
                  <p className="text-sm text-gray-500">판매자 프로필</p>
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
                  <span>채팅하기</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
