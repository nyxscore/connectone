"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { TossPaymentDemo } from "@/components/payment/TossPaymentDemo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  const itemId = searchParams.get("itemId");
  const escrow = searchParams.get("escrow") === "true";

  useEffect(() => {
    // 인증 로딩 중에는 아무것도 하지 않음
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다.");
      router.push(
        `/auth/login?next=/payment?itemId=${itemId}&escrow=${escrow}`
      );
      return;
    }

    if (!itemId) {
      toast.error("상품 정보가 없습니다.");
      router.push("/");
      return;
    }

    loadProduct();
  }, [authLoading, user, itemId]);

  const loadProduct = async () => {
    try {
      setLoading(true);

      if (!itemId) {
        toast.error("상품 ID가 없습니다.");
        router.push("/");
        return;
      }

      // Firestore에서 실제 상품 정보 가져오기
      const itemRef = doc(db, "items", itemId);
      const itemDoc = await getDoc(itemRef);

      if (!itemDoc.exists()) {
        toast.error("상품을 찾을 수 없습니다.");
        router.push("/");
        return;
      }

      const itemData = itemDoc.data();

      setProduct({
        id: itemId,
        title: itemData.title || `${itemData.brand} ${itemData.model}`,
        price: itemData.price,
        escrowEnabled: escrow,
        sellerUid: itemData.sellerUid || itemData.sellerId,
      });

      console.log("상품 정보 로드 완료:", itemData);
      console.log("sellerUid 확인:", itemData.sellerUid || itemData.sellerId);
    } catch (error) {
      console.error("상품 로딩 실패:", error);
      toast.error("상품 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (orderId: string, amount: number) => {
    console.log("결제 성공:", orderId, amount);
    toast.success("결제가 완료되었습니다!");
    router.push(
      `/payment/success?orderId=${orderId}&amount=${amount}&escrow=${escrow}&itemId=${itemId}&sellerUid=${product?.sellerUid}`
    );
  };

  const handlePaymentFail = (error: string) => {
    console.error("결제 실패:", error);
    toast.error("결제에 실패했습니다.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">결제 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">
            상품을 찾을 수 없습니다
          </h2>
          <Button onClick={() => router.push("/")}>홈으로 가기</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            onClick={() => {
              console.log("뒤로가기 클릭");
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/list");
              }
            }}
            variant="ghost"
            size="sm"
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">결제하기</h1>
        </div>
      </div>

      {/* 결제 영역 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 상품 정보 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              주문 상품
            </h2>
            <div>
              <h3 className="font-medium text-gray-900">{product.title}</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {product.price.toLocaleString()}원
              </p>
            </div>
          </Card>

          {/* 결제 수단 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              결제 수단
            </h2>
            <TossPaymentDemo
              amount={product.price}
              orderName={product.title}
              customerName={user?.nickname || user?.email || "구매자"}
              escrowEnabled={product.escrowEnabled}
              itemId={product.id}
              sellerUid={product.sellerUid}
              onSuccess={handlePaymentSuccess}
              onFail={handlePaymentFail}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
