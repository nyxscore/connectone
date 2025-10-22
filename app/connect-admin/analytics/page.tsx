"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useState, useEffect } from "react";
import {
  BarChart3,
  ChevronLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    userGrowth: 0,
    totalProducts: 0,
    newProductsThisWeek: 0,
    newProductsThisMonth: 0,
    productGrowth: 0,
    totalRevenue: 0,
    revenueThisWeek: 0,
    revenueThisMonth: 0,
    revenueGrowth: 0,
    totalTransactions: 0,
    transactionsThisWeek: 0,
    transactionsThisMonth: 0,
    transactionGrowth: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs } = await import("firebase/firestore");

      const db = getDb();

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let totalUsers = 0,
        newUsersThisWeek = 0,
        newUsersThisMonth = 0;
      let totalProducts = 0,
        newProductsThisWeek = 0,
        newProductsThisMonth = 0;
      let totalTransactions = 0,
        transactionsThisWeek = 0,
        transactionsThisMonth = 0;
      let totalRevenue = 0,
        revenueThisWeek = 0,
        revenueThisMonth = 0;

      // 사용자 통계
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        }));

        totalUsers = usersSnapshot.size;
        newUsersThisWeek = users.filter(
          u => u.createdAt && u.createdAt >= weekAgo
        ).length;
        newUsersThisMonth = users.filter(
          u => u.createdAt && u.createdAt >= monthAgo
        ).length;
      } catch (e) {
        console.log("사용자 통계 로딩 실패:", e);
      }

      // 상품 통계
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const products = productsSnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        }));

        totalProducts = productsSnapshot.size;
        newProductsThisWeek = products.filter(
          p => p.createdAt && p.createdAt >= weekAgo
        ).length;
        newProductsThisMonth = products.filter(
          p => p.createdAt && p.createdAt >= monthAgo
        ).length;
      } catch (e) {
        console.log("상품 통계 로딩 실패:", e);
      }

      // 거래 통계
      try {
        const transactionsSnapshot = await getDocs(
          collection(db, "transactions")
        );
        const transactions = transactionsSnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
          amount: doc.data().amount || 0,
        }));

        totalTransactions = transactionsSnapshot.size;
        transactionsThisWeek = transactions.filter(
          t => t.createdAt && t.createdAt >= weekAgo
        ).length;
        transactionsThisMonth = transactions.filter(
          t => t.createdAt && t.createdAt >= monthAgo
        ).length;

        totalRevenue = transactions.reduce(
          (sum, t) => sum + (t.amount || 0),
          0
        );
        revenueThisWeek = transactions
          .filter(t => t.createdAt && t.createdAt >= weekAgo)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        revenueThisMonth = transactions
          .filter(t => t.createdAt && t.createdAt >= monthAgo)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
      } catch (e) {
        console.log("거래 통계 로딩 실패:", e);
      }

      setStats({
        totalUsers,
        newUsersThisWeek,
        newUsersThisMonth,
        userGrowth: totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0,
        totalProducts,
        newProductsThisWeek,
        newProductsThisMonth,
        productGrowth:
          totalProducts > 0 ? (newProductsThisMonth / totalProducts) * 100 : 0,
        totalRevenue,
        revenueThisWeek,
        revenueThisMonth,
        revenueGrowth:
          totalRevenue > 0 ? (revenueThisMonth / totalRevenue) * 100 : 0,
        totalTransactions,
        transactionsThisWeek,
        transactionsThisMonth,
        transactionGrowth:
          totalTransactions > 0
            ? (transactionsThisMonth / totalTransactions) * 100
            : 0,
      });
    } catch (error) {
      console.error("통계 로딩 실패:", error);
      toast.error("통계를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

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
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    통계 분석
                  </h1>
                  <p className="text-xs text-gray-500">
                    플랫폼 통계 및 성장 지표
                  </p>
                </div>
              </div>
              <Button onClick={loadAnalytics}>새로고침</Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 주요 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div
                    className={`flex items-center text-sm ${stats.userGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.userGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stats.userGrowth.toFixed(1)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600">총 사용자</p>
                <div className="mt-2 text-xs text-gray-500">
                  이번 주: +{stats.newUsersThisWeek} | 이번 달: +
                  {stats.newUsersThisMonth}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 text-green-600" />
                  <div
                    className={`flex items-center text-sm ${stats.productGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.productGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stats.productGrowth.toFixed(1)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.totalProducts.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600">총 상품</p>
                <div className="mt-2 text-xs text-gray-500">
                  이번 주: +{stats.newProductsThisWeek} | 이번 달: +
                  {stats.newProductsThisMonth}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-yellow-600" />
                  <div
                    className={`flex items-center text-sm ${stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.revenueGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stats.revenueGrowth.toFixed(1)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {(stats.totalRevenue / 10000).toLocaleString()}만원
                </h3>
                <p className="text-sm text-gray-600">총 거래액</p>
                <div className="mt-2 text-xs text-gray-500">
                  이번 주: {(stats.revenueThisWeek / 10000).toLocaleString()}
                  만원 | 이번 달:{" "}
                  {(stats.revenueThisMonth / 10000).toLocaleString()}만원
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <div
                    className={`flex items-center text-sm ${stats.transactionGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.transactionGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stats.transactionGrowth.toFixed(1)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.totalTransactions.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600">총 거래</p>
                <div className="mt-2 text-xs text-gray-500">
                  이번 주: +{stats.transactionsThisWeek} | 이번 달: +
                  {stats.transactionsThisMonth}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 추가 정보 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                플랫폼 성장 요약
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    이번 주
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 신규 사용자: {stats.newUsersThisWeek}명</li>
                    <li>• 신규 상품: {stats.newProductsThisWeek}개</li>
                    <li>• 신규 거래: {stats.transactionsThisWeek}건</li>
                    <li>
                      • 거래액:{" "}
                      {(stats.revenueThisWeek / 10000).toLocaleString()}만원
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    이번 달
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 신규 사용자: {stats.newUsersThisMonth}명</li>
                    <li>• 신규 상품: {stats.newProductsThisMonth}개</li>
                    <li>• 신규 거래: {stats.transactionsThisMonth}건</li>
                    <li>
                      • 거래액:{" "}
                      {(stats.revenueThisMonth / 10000).toLocaleString()}만원
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRoute>
  );
}
