"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Eye,
  ChevronLeft,
  Loader2,
  DollarSign,
  Calendar,
  User,
  Package,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Transaction {
  id: string;
  buyerId: string;
  buyerNickname: string;
  sellerId: string;
  sellerNickname: string;
  productId: string;
  productTitle: string;
  amount: number;
  status:
    | "pending"
    | "paid"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "refunded";
  paymentMethod: string;
  createdAt: any;
  paidAt?: any;
  completedAt?: any;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      const q = query(
        collection(db, "transactions"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];

      setTransactions(transactionsData);
    } catch (error) {
      console.error("거래 목록 로딩 실패:", error);
      toast.error("거래 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "paid":
      case "confirmed":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
      case "refunded":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "대기중";
      case "paid":
        return "결제완료";
      case "confirmed":
        return "확인완료";
      case "completed":
        return "거래완료";
      case "cancelled":
        return "취소됨";
      case "refunded":
        return "환불됨";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
      case "refunded":
        return <XCircle className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (transaction.buyerNickname || "").toLowerCase().includes(searchLower) ||
      (transaction.sellerNickname || "").toLowerCase().includes(searchLower) ||
      (transaction.productTitle || "").toLowerCase().includes(searchLower) ||
      (transaction.id || "").toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/connect-admin">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    대시보드
                  </Button>
                </Link>
                <CreditCard className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    거래 관리
                  </h1>
                  <p className="text-xs text-gray-500">
                    {filteredTransactions.length}건 표시 중
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 검색 및 필터 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="거래 ID, 구매자, 판매자, 상품명으로 검색..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 상태</option>
                    <option value="pending">대기중</option>
                    <option value="paid">결제완료</option>
                    <option value="confirmed">확인완료</option>
                    <option value="completed">거래완료</option>
                    <option value="cancelled">취소됨</option>
                    <option value="refunded">환불됨</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 거래 목록 */}
          <div className="space-y-4">
            {filteredTransactions.map(transaction => (
              <Card key={transaction.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2 text-gray-600">
                          {getStatusIcon(transaction.status)}
                          <span className="text-sm font-medium">거래</span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}
                        >
                          {getStatusLabel(transaction.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {transaction.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString("ko-KR") || "N/A"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <User className="w-4 h-4 mr-2" />
                            <span className="font-medium">구매자</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            {transaction.buyerNickname}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <User className="w-4 h-4 mr-2" />
                            <span className="font-medium">판매자</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            {transaction.sellerNickname}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span className="font-medium">금액</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6 font-bold">
                            {transaction.amount.toLocaleString()}원
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Package className="w-4 h-4 mr-2" />
                          <span className="font-medium">상품</span>
                        </div>
                        <p className="text-sm text-gray-900 ml-6">
                          {transaction.productTitle}
                        </p>
                      </div>

                      <div className="flex items-center text-xs text-gray-500">
                        <CreditCard className="w-3 h-3 mr-1" />
                        거래 ID:{" "}
                        <span className="font-mono ml-1">{transaction.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        상세보기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  거래 내역이 없습니다
                </h3>
                <p className="text-gray-600">
                  검색 조건에 맞는 거래가 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
