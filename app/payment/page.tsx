"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { TossPaymentDemo } from "@/components/payment/TossPaymentDemo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb as getDb } from "@/lib/api/firebase-ultra-safe";

// 계좌이체 결제 컴포넌트
function BankTransferPayment({
  amount,
  requestId,
  onComplete,
}: {
  amount: number;
  requestId: string;
  onComplete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const bankInfo = {
    bank: "국민은행",
    account: "123-456-789012",
    holder: "커넥톤",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("계좌번호가 복사되었습니다!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentConfirm = async () => {
    setSubmitting(true);
    try {
      const db = await getDb();
      const requestRef = doc(db, "expert_analysis_requests", requestId);

      await updateDoc(requestRef, {
        paymentStatus: "pending_confirmation", // 입금 확인 대기
        paymentMethod: "bank_transfer",
        paymentRequestedAt: serverTimestamp(),
      });

      toast.success("입금 신청이 완료되었습니다!");
      onComplete();
    } catch (error) {
      console.error("입금 신청 실패:", error);
      toast.error("입금 신청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 계좌 정보 */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          입금 계좌 정보
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white rounded-lg p-4">
            <div>
              <p className="text-sm text-gray-600">은행</p>
              <p className="text-lg font-bold text-gray-900">{bankInfo.bank}</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg p-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">계좌번호</p>
              <p className="text-lg font-bold text-gray-900 font-mono">
                {bankInfo.account}
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(bankInfo.account)}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  복사
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg p-4">
            <div>
              <p className="text-sm text-gray-600">예금주</p>
              <p className="text-lg font-bold text-gray-900">
                {bankInfo.holder}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-blue-400">
            <div>
              <p className="text-sm text-gray-600">입금 금액</p>
              <p className="text-2xl font-black text-blue-600">
                {amount.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 안내사항 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">
          ⚠️ 입금 시 주의사항
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            • 입금자명을 회원님의 <strong>이름</strong>으로 해주세요
          </li>
          <li>• 금액을 정확히 입금해주세요 (수수료 별도)</li>
          <li>
            • 입금 확인은 <strong>영업일 기준 1-2시간</strong> 소요됩니다
          </li>
          <li>• 입금 확인 후 전문가 분석이 시작됩니다</li>
        </ul>
      </div>

      {/* 입금 완료 버튼 */}
      <Button
        onClick={handlePaymentConfirm}
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-bold"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            처리 중...
          </>
        ) : (
          "입금 완료했습니다"
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        입금 후 위 버튼을 클릭해주세요. 입금 확인 후 자동으로 전문가 분석이
        시작됩니다.
      </p>
    </div>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  const type = searchParams.get("type"); // expert-analysis or product
  const itemId = searchParams.get("itemId");
  const requestId = searchParams.get("requestId");
  const amount = searchParams.get("amount");
  const escrow = searchParams.get("escrow") === "true";

  useEffect(() => {
    // 인증 로딩 중에는 아무것도 하지 않음
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다.");
      const nextUrl =
        type === "expert-analysis"
          ? `/payment?type=${type}&requestId=${requestId}&amount=${amount}`
          : `/payment?itemId=${itemId}&escrow=${escrow}`;
      router.push(`/auth/login?next=${nextUrl}`);
      return;
    }

    // 전문가 분석 결제
    if (type === "expert-analysis") {
      if (!requestId || !amount) {
        toast.error("결제 정보가 없습니다.");
        router.push("/expert-analysis");
        return;
      }
      loadExpertAnalysisRequest();
      return;
    }

    // 상품 결제
    if (!itemId) {
      toast.error("상품 정보가 없습니다.");
      router.push("/");
      return;
    }

    loadProduct();
  }, [authLoading, user, itemId, type, requestId]);

  const loadExpertAnalysisRequest = async () => {
    try {
      setLoading(true);

      if (!requestId || !amount) {
        toast.error("결제 정보가 없습니다.");
        router.push("/expert-analysis");
        return;
      }

      // Firestore에서 분석 요청 정보 가져오기
      const db = await getDb();
      const requestRef = doc(db, "expert_analysis_requests", requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        toast.error("분석 요청을 찾을 수 없습니다.");
        router.push("/expert-analysis");
        return;
      }

      const requestData = requestDoc.data();

      setProduct({
        id: requestId,
        title: "전문가 피드백 서비스",
        description: `음악 파일: ${requestData.fileName}`,
        price: parseInt(amount as string),
        type: "expert-analysis",
        requestData,
      });

      console.log("전문가 분석 요청 로드 완료:", requestData);
    } catch (error) {
      console.error("분석 요청 로딩 실패:", error);
      toast.error("결제 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);

      if (!itemId) {
        toast.error("상품 ID가 없습니다.");
        router.push("/");
        return;
      }

      // Firestore에서 실제 상품 정보 가져오기
      const db = await getDb();
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
    // toast는 TossPaymentDemo 컴포넌트에서 이미 표시하므로 중복 제거
    // toast.error("결제에 실패했습니다.");
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
              if (product?.type === "expert-analysis") {
                router.push("/expert-analysis");
              } else if (window.history.length > 1) {
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
              {product.type === "expert-analysis" ? "신청 정보" : "주문 상품"}
            </h2>
            <div>
              <h3 className="font-medium text-gray-900">{product.title}</h3>
              {product.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {product.description}
                </p>
              )}
              {product.requestData?.analysisCategory && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 mb-1">분석 분야:</p>
                  <p className="text-sm font-semibold text-purple-900">
                    {product.requestData.analysisCategory}
                  </p>
                </div>
              )}
              {product.requestData?.additionalRequest && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">추가 요청사항:</p>
                  <p className="text-sm text-gray-800">
                    {product.requestData.additionalRequest}
                  </p>
                </div>
              )}
              <p className="text-2xl font-bold text-blue-600 mt-3">
                {product.price.toLocaleString()}원
              </p>
            </div>
          </Card>

          {/* 결제 수단 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              결제 수단
            </h2>
            {product.type === "expert-analysis" ? (
              <BankTransferPayment
                amount={product.price}
                requestId={product.id}
                onComplete={() => {
                  router.push("/expert-analysis?payment=success");
                }}
              />
            ) : (
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
            )}
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
