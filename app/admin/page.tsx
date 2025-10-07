"use client";

import { AdminRoute } from "../../lib/auth/AdminRoute";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { UserGradeBadge } from "../../components/ui/UserGradeBadge";
import { useAuth } from "../../lib/hooks/useAuth";
import {
  Shield,
  AlertTriangle,
  Users,
  Package,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Settings,
  FileText,
  UserX,
  Eye,
  EyeOff,
  Tag,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isUpdatingResponseRate, setIsUpdatingResponseRate] = useState(false);

  // 응답률 업데이트 함수
  const handleUpdateResponseRates = async () => {
    setIsUpdatingResponseRate(true);
    try {
      // Firestore에서 직접 응답률 업데이트
      const { updateAllUsersResponseRate } = await import("../../lib/profile/responseRate");
      const result = await updateAllUsersResponseRate();

      if (result.success) {
        toast.success(`전체 사용자 응답률 업데이트 완료! (${result.updatedCount}명)`);
      } else {
        toast.error(result.error || "응답률 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("응답률 업데이트 실패:", error);
      toast.error("응답률 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsUpdatingResponseRate(false);
    }
  };

  // Mock 데이터 (실제로는 API에서 가져옴)
  const stats = {
    totalUsers: 1250,
    activeUsers: 1180,
    suspendedUsers: 70,
    totalProducts: 3400,
    activeProducts: 3200,
    hiddenProducts: 200,
    pendingReports: 15,
    pendingDisputes: 8,
    totalTransactions: 8900,
    completedTransactions: 8500,
  };

  const recentReports = [
    {
      id: "1",
      type: "user",
      reason: "스팸 계정",
      reporter: "김사용자",
      reported: "이의심",
      status: "pending",
      createdAt: new Date(),
    },
    {
      id: "2",
      type: "product",
      reason: "가짜 상품",
      reporter: "박구매자",
      reported: "최판매자",
      status: "reviewing",
      createdAt: new Date(),
    },
  ];

  const recentDisputes = [
    {
      id: "1",
      transactionId: "tx_123",
      reason: "상품 불일치",
      reporter: "김구매자",
      reported: "이판매자",
      status: "investigating",
      createdAt: new Date(),
    },
  ];

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  관리자 대시보드
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <UserGradeBadge grade="B" size="md" showDescription={false} />
                <span className="text-sm text-gray-600">{user?.nickname}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      총 사용자
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalUsers.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 상품</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalProducts.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      대기 중인 신고
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendingReports}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">분쟁 중</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendingDisputes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 관리 메뉴 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 신고 관리 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    신고 관리
                  </h2>
                  <Link href="/admin/reports">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      전체 보기
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.map(report => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {report.type === "user" ? "사용자 신고" : "상품 신고"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.reporter} → {report.reported}
                        </p>
                        <p className="text-xs text-gray-500">{report.reason}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {report.status === "pending" ? "대기" : "검토중"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 분쟁 관리 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    분쟁 관리
                  </h2>
                  <Link href="/admin/disputes">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      전체 보기
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDisputes.map(dispute => (
                    <div
                      key={dispute.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">거래 분쟁</p>
                        <p className="text-sm text-gray-600">
                          {dispute.reporter} vs {dispute.reported}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dispute.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                          조사중
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 빠른 액션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/users">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    사용자 관리
                  </h3>
                  <p className="text-sm text-gray-600">사용자 정지/해제</p>
                </CardContent>
              </Card>
            </Link>

            {/* 응답률 업데이트 */}
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleUpdateResponseRates}
            >
              <CardContent className="p-6 text-center">
                <RefreshCw
                  className={`w-12 h-12 text-green-600 mx-auto mb-4 ${isUpdatingResponseRate ? "animate-spin" : ""}`}
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  응답률 업데이트
                </h3>
                <p className="text-sm text-gray-600">
                  {isUpdatingResponseRate
                    ? "업데이트 중..."
                    : "전체 사용자 응답률 계산"}
                </p>
              </CardContent>
            </Card>

            <Link href="/admin/products">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    상품 관리
                  </h3>
                  <p className="text-sm text-gray-600">매물 숨김/노출</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/labels">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Tag className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    라벨 관리
                  </h3>
                  <p className="text-sm text-gray-600">감정/보증 라벨</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    분석
                  </h3>
                  <p className="text-sm text-gray-600">통계 및 분석</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
