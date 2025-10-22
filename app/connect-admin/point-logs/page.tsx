"use client";

import { useState, useEffect } from "react";
import { AdminRoute } from "@/lib/auth/AdminRoute";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  Coins,
  Gift,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  DollarSign,
} from "lucide-react";

interface PointTransaction {
  id: string;
  userId: string;
  userNickname: string;
  userEmail: string;
  type: "earn" | "spend" | "refund" | "admin_grant" | "admin_deduct";
  amount: number;
  balance: number;
  description: string;
  reason?: string;
  relatedId?: string; // 거래 ID, 상품 ID 등
  status: "completed" | "pending" | "cancelled";
  createdAt: any;
  processedBy?: string;
  processedAt?: any;
}

export default function PointLogsPage() {
  const { user: currentAdmin } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "user">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadPointTransactions();
  }, []);

  const loadPointTransactions = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs, query, orderBy, limit } = await import(
        "firebase/firestore"
      );

      const db = getDb();
      const transactionsQuery = query(
        collection(db, "point_transactions"),
        orderBy("createdAt", "desc"),
        limit(1000)
      );
      const querySnapshot = await getDocs(transactionsQuery);

      const transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PointTransaction[];

      setTransactions(transactionsData);
    } catch (error) {
      console.error("포인트 거래 내역 로드 실패:", error);
      toast.error("포인트 거래 내역을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earn":
        return <Gift className="w-4 h-4 text-green-600" />;
      case "spend":
        return <ShoppingCart className="w-4 h-4 text-red-600" />;
      case "refund":
        return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      case "admin_grant":
        return <Coins className="w-4 h-4 text-yellow-600" />;
      case "admin_deduct":
        return <CreditCard className="w-4 h-4 text-orange-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "earn":
        return "적립";
      case "spend":
        return "사용";
      case "refund":
        return "환불";
      case "admin_grant":
        return "관리자 지급";
      case "admin_deduct":
        return "관리자 차감";
      default:
        return "기타";
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "earn":
        return "bg-green-100 text-green-800";
      case "spend":
        return "bg-red-100 text-red-800";
      case "refund":
        return "bg-blue-100 text-blue-800";
      case "admin_grant":
        return "bg-yellow-100 text-yellow-800";
      case "admin_deduct":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      (transaction.userNickname || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (transaction.userEmail || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (transaction.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const transactionDate =
        transaction.createdAt?.toDate?.() || new Date(transaction.createdAt);
      const now = new Date();

      switch (dateFilter) {
        case "today":
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "amount":
        aValue = a.amount;
        bValue = b.amount;
        break;
      case "user":
        aValue = a.userNickname;
        bValue = b.userNickname;
        break;
      case "date":
      default:
        aValue = a.createdAt?.toDate?.() || new Date(a.createdAt);
        bValue = b.createdAt?.toDate?.() || new Date(b.createdAt);
        break;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalEarned = transactions
    .filter(t => t.type === "earn" || t.type === "admin_grant")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type === "spend" || t.type === "admin_deduct")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunded = transactions
    .filter(t => t.type === "refund")
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  포인트 거래 내역을 불러오는 중...
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              💰 포인트 거래 내역
            </h1>
            <p className="text-gray-600">
              모든 포인트 거래 내역을 확인하고 관리할 수 있습니다.
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Gift className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 적립</p>
                    <p className="text-2xl font-bold text-green-600">
                      {totalEarned.toLocaleString()}P
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 사용</p>
                    <p className="text-2xl font-bold text-red-600">
                      {totalSpent.toLocaleString()}P
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ArrowUpDown className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 환불</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalRefunded.toLocaleString()}P
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      순 포인트
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(
                        totalEarned -
                        totalSpent +
                        totalRefunded
                      ).toLocaleString()}
                      P
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 필터 및 검색 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    검색
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="닉네임, 이메일, 설명 검색"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    거래 유형
                  </label>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="earn">적립</option>
                    <option value="spend">사용</option>
                    <option value="refund">환불</option>
                    <option value="admin_grant">관리자 지급</option>
                    <option value="admin_deduct">관리자 차감</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="completed">완료</option>
                    <option value="pending">대기</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기간
                  </label>
                  <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="today">오늘</option>
                    <option value="week">최근 7일</option>
                    <option value="month">최근 30일</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정렬
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="date">날짜</option>
                      <option value="amount">금액</option>
                      <option value="user">사용자</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="px-3"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 거래 내역 테이블 */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        거래 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        잔액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        날짜
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedTransactions.map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTransactionIcon(transaction.type)}
                            <div className="ml-3">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={getTransactionTypeColor(
                                    transaction.type
                                  )}
                                >
                                  {getTransactionTypeLabel(transaction.type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-900 mt-1">
                                {transaction.description || "N/A"}
                              </p>
                              {transaction.reason && (
                                <p className="text-xs text-gray-500 mt-1">
                                  사유: {transaction.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.userNickname || "N/A"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {transaction.userEmail || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p
                            className={`text-sm font-medium ${
                              transaction.type === "earn" ||
                              transaction.type === "refund" ||
                              transaction.type === "admin_grant"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "earn" ||
                            transaction.type === "refund" ||
                            transaction.type === "admin_grant"
                              ? "+"
                              : "-"}
                            {transaction.amount.toLocaleString()}P
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">
                            {transaction.balance.toLocaleString()}P
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(transaction.status)}
                            <Badge
                              className={`ml-2 ${getStatusColor(transaction.status)}`}
                            >
                              {transaction.status === "completed"
                                ? "완료"
                                : transaction.status === "pending"
                                  ? "대기"
                                  : "취소"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {transaction.createdAt
                              ?.toDate?.()
                              ?.toLocaleDateString("ko-KR") || "N/A"}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {transaction.createdAt
                              ?.toDate?.()
                              ?.toLocaleTimeString("ko-KR") || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            상세
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sortedTransactions.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">거래 내역이 없습니다</p>
                  <p className="text-gray-400 text-sm mt-2">
                    검색 조건을 변경해보세요
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 페이지네이션 또는 더보기 */}
          {sortedTransactions.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                내역 다운로드
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
