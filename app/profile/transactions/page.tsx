"use client";

import { ProtectedRoute } from "../../../lib/auth/ProtectedRoute";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useState, useEffect } from "react";
import { Transaction, TransactionStatus } from "../../../data/types";
// import { getUserTransactions } from "../../../lib/api/payment";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getFirebaseDb as getDb } from "../../../lib/api/firebase-ultra-safe";
import {
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  RefreshCw,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

const statusConfig: Record<
  TransactionStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  pending: {
    label: "결제 대기",
    color: "text-yellow-600 bg-yellow-100",
    icon: Clock,
    description: "결제를 진행해주세요",
  },
  paid_hold: {
    label: "에스크로 보관",
    color: "text-blue-600 bg-blue-100",
    icon: CreditCard,
    description: "결제 완료, 에스크로로 보관 중",
  },
  shipped: {
    label: "배송 중",
    color: "text-purple-600 bg-purple-100",
    icon: Truck,
    description: "상품이 배송되었습니다",
  },
  delivered: {
    label: "배송 완료",
    color: "text-green-600 bg-green-100",
    icon: Package,
    description: "상품이 배송 완료되었습니다",
  },
  released: {
    label: "정산 완료",
    color: "text-green-600 bg-green-100",
    icon: CheckCircle,
    description: "거래가 완료되었습니다",
  },
  refunded: {
    label: "환불 완료",
    color: "text-red-600 bg-red-100",
    icon: RefreshCw,
    description: "환불이 완료되었습니다",
  },
  cancelled: {
    label: "거래 취소",
    color: "text-gray-600 bg-gray-100",
    icon: XCircle,
    description: "거래가 취소되었습니다",
  },
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const db = await getDb();
      // Firestore에서 직접 거래 내역 조회
      const transactionsRef = collection(db, "transactions");
      const q = query(transactionsRef, where("buyerUid", "==", user.id));

      console.log("거래 내역 조회 시작:", user.id);
      const snapshot = await getDocs(q);
      console.log("조회된 문서 개수:", snapshot.docs.length);

      // 각 거래에 대해 상품 정보 조회
      const transactionList = await Promise.all(
        snapshot.docs.map(async doc => {
          const transactionData = doc.data() as Transaction;

          // 상품 정보 조회
          try {
            const { doc: productDoc, getDoc } = await import(
              "firebase/firestore"
            );
            const productRef = productDoc(
              db,
              "items",
              transactionData.productId
            );
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
              const productData = productSnap.data();
              return {
                id: doc.id,
                ...transactionData,
                productTitle: productData.title,
              } as Transaction;
            }
          } catch (error) {
            console.error("상품 정보 조회 실패:", error);
          }

          return {
            id: doc.id,
            ...transactionData,
          } as Transaction;
        })
      );

      // 클라이언트에서 정렬 (최신순)
      transactionList.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setTransactions(transactionList);
      console.log("거래 내역 조회 완료:", transactionList);
    } catch (err: any) {
      console.error("거래 내역 조회 실패:", err);
      console.error("에러 메시지:", err.message);
      console.error("에러 코드:", err.code);

      if (err.message?.includes("index")) {
        setError("Firestore 인덱스가 필요합니다. 콘솔을 확인해주세요.");
      } else {
        setError(
          `결제 내역을 불러오는데 실패했습니다: ${err.message || "알 수 없는 오류"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (timestamp: any) => {
    // Firestore Timestamp 처리
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">결제 내역을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">결제 내역</h1>
            <p className="text-gray-600 mt-2">
              나의 모든 거래 내역을 확인하세요
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={loadTransactions}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                다시 시도
              </Button>
            </div>
          )}

          {transactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  결제 내역이 없습니다
                </h3>
                <p className="text-gray-500">아직 진행한 거래가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map(transaction => {
                const statusInfo = statusConfig[transaction.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={transaction.id} className="overflow-hidden">
                    {/* 상태 헤더 */}
                    <div
                      className={`px-6 py-3 border-b ${statusInfo.color.replace("text-", "bg-").replace("bg-", "bg-").replace("-600", "-50").replace("-100", "-50")} border-${statusInfo.color.split("-")[1]}-200`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <StatusIcon
                            className={`w-5 h-5 ${statusInfo.color}`}
                          />
                          <span className={`font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      {/* 영수증 스타일 내역 */}
                      <div className="space-y-4">
                        {/* 주문번호 */}
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="text-sm text-gray-500">
                            주문번호
                          </span>
                          <span className="text-sm font-mono text-gray-900">
                            {transaction.orderId || transaction.id.slice(-12)}
                          </span>
                        </div>

                        {/* 상품 정보 */}
                        <div className="pb-3 border-b border-gray-100">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-gray-500 block mb-1">
                                상품
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  window.open(
                                    `/item/${transaction.productId}`,
                                    "_blank"
                                  );
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 p-0 h-auto text-left justify-start"
                              >
                                {transaction.productTitle || "상품 정보"}
                                <span className="ml-1">→</span>
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 결제 금액 */}
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="text-sm text-gray-500">
                            결제 금액
                          </span>
                          <span className="text-base font-semibold text-gray-900">
                            {formatPrice(transaction.amount)}
                          </span>
                        </div>

                        {/* 결제 방법 */}
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="text-sm text-gray-500">
                            결제 방법
                          </span>
                          <span className="text-sm text-gray-900">
                            {transaction.escrowEnabled
                              ? "안전거래 (에스크로)"
                              : "일반 결제"}
                          </span>
                        </div>

                        {/* 거래 상태 설명 */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">
                            {statusInfo.description}
                          </p>
                        </div>

                        {/* 운송장 번호 (있을 경우) */}
                        {transaction.trackingNumber && (
                          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-900 font-medium">
                                운송장 번호
                              </span>
                            </div>
                            <span className="text-sm font-mono text-blue-900">
                              {transaction.trackingNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
