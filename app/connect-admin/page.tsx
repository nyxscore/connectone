"use client";

import { AdminRoute } from "../../lib/auth/AdminRoute";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { UserGradeBadge } from "../../components/ui/UserGradeBadge";
import { useAuth } from "../../lib/hooks/useAuth";
import {
  Shield,
  Users,
  Package,
  AlertTriangle,
  MessageSquare,
  FileText,
  Tag,
  TrendingUp,
  BarChart3,
  Coins,
  RefreshCw,
  CreditCard,
  Music,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function ConnectAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalProducts: 0,
    activeProducts: 0,
    hiddenProducts: 0,
    pendingReports: 0,
    pendingDisputes: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  });
  const [isUpdatingResponseRate, setIsUpdatingResponseRate] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [pointAmount, setPointAmount] = useState("");
  const [pointReason, setPointReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { db } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs, query, where } = await import(
        "firebase/firestore"
      );

      // 안전하게 데이터 가져오기
      let totalUsers = 0,
        activeUsers = 0,
        suspendedUsers = 0;
      let totalProducts = 0,
        activeProducts = 0,
        hiddenProducts = 0;
      let pendingReports = 0,
        pendingDisputes = 0;
      let totalTransactions = 0,
        completedTransactions = 0;

      // 사용자 통계
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => doc.data());
        totalUsers = usersSnapshot.size;
        activeUsers = users.filter(u => !u.isSuspended).length;
        suspendedUsers = users.filter(u => u.isSuspended).length;
      } catch (e) {
        console.log("사용자 통계 로딩 실패:", e);
      }

      // 상품 통계
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const products = productsSnapshot.docs.map(doc => doc.data());
        totalProducts = productsSnapshot.size;
        activeProducts = products.filter(p => !p.isHidden).length;
        hiddenProducts = products.filter(p => p.isHidden).length;
      } catch (e) {
        console.log("상품 통계 로딩 실패:", e);
      }

      // 신고 통계
      try {
        const reportsQuery = query(
          collection(db, "reports"),
          where("status", "==", "pending")
        );
        const reportsSnapshot = await getDocs(reportsQuery);
        pendingReports = reportsSnapshot.size;
      } catch (e) {
        console.log("신고 통계 로딩 실패:", e);
      }

      // 분쟁 통계
      try {
        const disputesQuery = query(
          collection(db, "disputes"),
          where("status", "in", ["pending", "investigating"])
        );
        const disputesSnapshot = await getDocs(disputesQuery);
        pendingDisputes = disputesSnapshot.size;
      } catch (e) {
        console.log("분쟁 통계 로딩 실패:", e);
      }

      // 거래 통계
      try {
        const transactionsSnapshot = await getDocs(
          collection(db, "transactions")
        );
        const transactions = transactionsSnapshot.docs.map(doc => doc.data());
        totalTransactions = transactionsSnapshot.size;
        completedTransactions = transactions.filter(
          t => t.status === "completed"
        ).length;
      } catch (e) {
        console.log("거래 통계 로딩 실패:", e);
      }

      setStats({
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalProducts,
        activeProducts,
        hiddenProducts,
        pendingReports,
        pendingDisputes,
        totalTransactions,
        completedTransactions,
        todayRevenue: 0,
        monthlyRevenue: 0,
      });
    } catch (error) {
      console.error("통계 로딩 실패:", error);
      toast.error("통계를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPoints = async () => {
    if (!user) return;
    if (!targetUserId.trim()) {
      toast.error("사용자 아이디를 입력해주세요.");
      return;
    }
    if (
      !pointAmount ||
      isNaN(Number(pointAmount)) ||
      Number(pointAmount) <= 0
    ) {
      toast.error("올바른 포인트 금액을 입력해주세요.");
      return;
    }

    try {
      const { db } = await import("@/lib/api/firebase-lazy");
      const {
        doc,
        getDoc,
        updateDoc,
        increment,
        collection,
        addDoc,
        serverTimestamp,
        query,
        where,
        getDocs,
      } = await import("firebase/firestore");

      const usersQuery = query(
        collection(db, "users"),
        where("username", "==", targetUserId.trim())
      );
      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        toast.error("해당 사용자를 찾을 수 없습니다.");
        return;
      }

      const userDocSnap = querySnapshot.docs[0];
      const targetUserUid = userDocSnap.id;
      const targetUser = userDocSnap.data();
      const points = Number(pointAmount);

      await updateDoc(doc(db, "users", targetUserUid), {
        points: increment(points),
      });

      await addDoc(collection(db, "point_transactions"), {
        userId: targetUserUid,
        amount: points,
        type: "admin_grant",
        description: pointReason.trim() || "관리자 지급",
        balanceAfter: (targetUser.points || 0) + points,
        grantedBy: user.uid,
        grantedByNickname: user.nickname || "관리자",
        createdAt: serverTimestamp(),
      });

      const { logAdminAction } = await import("../../lib/admin/auditLog");
      await logAdminAction({
        adminUid: user.uid,
        adminNickname: user.nickname || "관리자",
        action: "GRANT_POINTS",
        targetType: "user",
        targetId: targetUserUid,
        details: {
          amount: points,
          reason: pointReason.trim() || "관리자 지급",
          targetUsername: targetUser.username || targetUserId.trim(),
          targetNickname: targetUser.nickname || "Unknown",
        },
        status: "success",
      });

      toast.success(
        `${targetUser.nickname || targetUser.username}님에게 ${points.toLocaleString()}P를 지급했습니다!`
      );

      setTargetUserId("");
      setPointAmount("");
      setPointReason("");
      setShowPointModal(false);
    } catch (error) {
      console.error("포인트 지급 오류:", error);
      toast.error("포인트 지급 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateResponseRates = async () => {
    if (!user) return;

    setIsUpdatingResponseRate(true);
    try {
      const { logAdminAction } = await import("../../lib/admin/auditLog");
      const { updateAllUsersResponseRate } = await import(
        "../../lib/profile/responseRate"
      );
      const result = await updateAllUsersResponseRate();

      if (result.success) {
        toast.success(
          `전체 사용자 응답률 업데이트 완료! (${result.updatedCount}명)`
        );

        await logAdminAction({
          adminUid: user.uid,
          adminNickname: user.nickname || "관리자",
          action: "RESPONSE_RATE_UPDATE_ALL",
          targetType: "system",
          details: { updatedCount: result.updatedCount },
          status: "success",
        });
      } else {
        toast.error(result.error || "응답률 업데이트에 실패했습니다.");

        await logAdminAction({
          adminUid: user.uid,
          adminNickname: user.nickname || "관리자",
          action: "RESPONSE_RATE_UPDATE_ALL",
          targetType: "system",
          status: "failure",
          errorMessage: result.error,
        });
      }
    } catch (error) {
      console.error("응답률 업데이트 실패:", error);
      toast.error("응답률 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsUpdatingResponseRate(false);
    }
  };

  const quickActions = [
    {
      title: "사용자 관리",
      description: "회원 정지/해제 및 정보 수정",
      icon: Users,
      color: "blue",
      href: "/connect-admin/users",
    },
    {
      title: "상품 관리",
      description: "매물 숨김/노출 및 라벨 관리",
      icon: Package,
      color: "green",
      href: "/connect-admin/products",
    },
    {
      title: "신고 관리",
      description: "사용자/상품 신고 처리",
      icon: FileText,
      color: "red",
      href: "/connect-admin/reports",
    },
    {
      title: "분쟁 관리",
      description: "거래 분쟁 조사 및 해결",
      icon: MessageSquare,
      color: "orange",
      href: "/connect-admin/disputes",
    },
    {
      title: "거래 관리",
      description: "결제 및 거래 내역 관리",
      icon: CreditCard,
      color: "purple",
      href: "/connect-admin/transactions",
    },
    {
      title: "전문가 피드백",
      description: "보컬 분석 피드백 관리",
      icon: Music,
      color: "pink",
      href: "/connect-admin/expert-feedback",
    },
    {
      title: "라벨 관리",
      description: "감정/보증 라벨 관리",
      icon: Tag,
      color: "indigo",
      href: "/connect-admin/labels",
    },
    {
      title: "통계 분석",
      description: "플랫폼 통계 및 분석",
      icon: BarChart3,
      color: "teal",
      href: "/connect-admin/analytics",
    },
  ];

  const colorClasses: Record<string, { icon: string; bg: string }> = {
    blue: { icon: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100" },
    green: { icon: "text-green-600", bg: "bg-green-50 hover:bg-green-100" },
    red: { icon: "text-red-600", bg: "bg-red-50 hover:bg-red-100" },
    orange: { icon: "text-orange-600", bg: "bg-orange-50 hover:bg-orange-100" },
    purple: { icon: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100" },
    pink: { icon: "text-pink-600", bg: "bg-pink-50 hover:bg-pink-100" },
    indigo: { icon: "text-indigo-600", bg: "bg-indigo-50 hover:bg-indigo-100" },
    teal: { icon: "text-teal-600", bg: "bg-teal-50 hover:bg-teal-100" },
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    ConnecTone 관리자
                  </h1>
                  <p className="text-xs text-gray-500">통합 관리 대시보드</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <UserGradeBadge grade="B" size="md" showDescription={false} />
                <span className="text-sm font-medium text-gray-700">
                  {user?.nickname}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      총 사용자
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stats.totalUsers.toLocaleString()}
                    </p>
                    <p className="text-blue-100 text-xs mt-1">
                      활성 {stats.activeUsers} | 정지 {stats.suspendedUsers}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      총 상품
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stats.totalProducts.toLocaleString()}
                    </p>
                    <p className="text-green-100 text-xs mt-1">
                      노출 {stats.activeProducts} | 숨김 {stats.hiddenProducts}
                    </p>
                  </div>
                  <Package className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">
                      대기 중인 신고
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stats.pendingReports}
                    </p>
                    <p className="text-red-100 text-xs mt-1">
                      분쟁 {stats.pendingDisputes}건
                    </p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      총 거래
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stats.totalTransactions.toLocaleString()}
                    </p>
                    <p className="text-purple-100 text-xs mt-1">
                      완료 {stats.completedTransactions}건
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 빠른 작업 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">빠른 작업</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setShowPointModal(true)}
              >
                <CardContent className="p-6 text-center">
                  <Coins className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    포인트 지급
                  </h3>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={handleUpdateResponseRates}
              >
                <CardContent className="p-6 text-center">
                  <RefreshCw
                    className={`w-10 h-10 text-green-600 mx-auto mb-3 ${isUpdatingResponseRate ? "animate-spin" : ""}`}
                  />
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isUpdatingResponseRate
                      ? "업데이트 중..."
                      : "응답률 업데이트"}
                  </h3>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={loadStats}
              >
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    통계 새로고침
                  </h3>
                </CardContent>
              </Card>

              <Link href="/connect-admin/settings">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Settings className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      설정
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* 관리 메뉴 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">관리 메뉴</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map(action => {
                const Icon = action.icon;
                const colors = colorClasses[action.color];
                return (
                  <Link key={action.title} href={action.href}>
                    <Card
                      className={`h-full ${colors.bg} border-2 border-transparent hover:border-${action.color}-300 transition-all cursor-pointer`}
                    >
                      <CardContent className="p-6">
                        <Icon className={`w-12 h-12 ${colors.icon} mb-4`} />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 포인트 지급 모달 */}
        {showPointModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                포인트 지급
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사용자 아이디 (username)
                  </label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={e => setTargetUserId(e.target.value)}
                    placeholder="사용자 아이디를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    포인트 금액
                  </label>
                  <input
                    type="number"
                    value={pointAmount}
                    onChange={e => setPointAmount(e.target.value)}
                    placeholder="예: 10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지급 사유 (선택)
                  </label>
                  <input
                    type="text"
                    value={pointReason}
                    onChange={e => setPointReason(e.target.value)}
                    placeholder="예: 이벤트 참여 보상"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowPointModal(false);
                    setTargetUserId("");
                    setPointAmount("");
                    setPointReason("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleGrantPoints}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  지급하기
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
