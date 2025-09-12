"use client";

import { ProtectedRoute } from "../../../lib/auth/ProtectedRoute";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../lib/auth/useAuth";
import { useState, useEffect } from "react";
import { Transaction, TransactionStatus } from "../../../data/types";
import { getUserTransactions } from "../../../lib/api/payment";
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
      const result = await getUserTransactions(user.id);
      if (result.success && result.data) {
        setTransactions(result.data);
      } else {
        setError(result.error || "결제 내역을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("결제 내역을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (date: Date) => {
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
                  <Card key={transaction.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                            >
                              <div className="flex items-center space-x-2">
                                <StatusIcon className="w-4 h-4" />
                                <span>{statusInfo.label}</span>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatPrice(transaction.amount)}
                              </span>
                              <span className="text-sm text-gray-500">
                                거래 ID: {transaction.id.slice(-8)}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600">
                              {statusInfo.description}
                            </p>

                            {transaction.trackingNumber && (
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  운송장 번호: {transaction.trackingNumber}
                                </span>
                              </div>
                            )}

                            {transaction.notes && (
                              <p className="text-sm text-gray-500 italic">
                                {transaction.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 상품 상세 페이지로 이동
                              window.open(
                                `/item/${transaction.productId}`,
                                "_blank"
                              );
                            }}
                          >
                            상품 보기
                          </Button>
                        </div>
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

