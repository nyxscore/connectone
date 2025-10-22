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
  Loader2,
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
  const [dailySignups, setDailySignups] = useState<
    { date: string; count: number }[]
  >([]);
  const [dailyTransactions, setDailyTransactions] = useState<
    { date: string; count: number }[]
  >([]);
  const [monthlySignups, setMonthlySignups] = useState<
    { month: string; count: number }[]
  >([]);
  const [weeklySignups, setWeeklySignups] = useState<
    { week: string; count: number }[]
  >([]);
  const [topUsersByPoints, setTopUsersByPoints] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [todaySignups, setTodaySignups] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<
    "monthly" | "weekly" | "daily"
  >("monthly");
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
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs, query, where } = await import(
        "firebase/firestore"
      );

      const db = getDb();

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

        // 오늘 신규가입 회원 수 계산
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySignupsCount = users.filter(user => {
          if (!user.createdAt) return false;
          const userCreatedAt = user.createdAt.toDate
            ? user.createdAt.toDate()
            : new Date(user.createdAt);
          return userCreatedAt >= today;
        }).length;
        setTodaySignups(todaySignupsCount);

        // 월별 가입 현황 계산 (최근 12개월)
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          date.setDate(1);
          date.setHours(0, 0, 0, 0);

          const nextMonth = new Date(date);
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          const monthCount = users.filter(user => {
            if (!user.createdAt) return false;
            const userCreatedAt = user.createdAt.toDate
              ? user.createdAt.toDate()
              : new Date(user.createdAt);
            return userCreatedAt >= date && userCreatedAt < nextMonth;
          }).length;

          monthlyData.push({
            month: date.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "short",
            }),
            count: monthCount,
          });
        }
        setMonthlySignups(monthlyData);

        // 주간 가입 현황 계산 (최근 12주)
        const weeklyData = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i * 7);
          date.setHours(0, 0, 0, 0);

          const nextWeek = new Date(date);
          nextWeek.setDate(nextWeek.getDate() + 7);

          const weekCount = users.filter(user => {
            if (!user.createdAt) return false;
            const userCreatedAt = user.createdAt.toDate
              ? user.createdAt.toDate()
              : new Date(user.createdAt);
            return userCreatedAt >= date && userCreatedAt < nextWeek;
          }).length;

          weeklyData.push({
            week: `${date.getMonth() + 1}/${date.getDate()}주`,
            count: weekCount,
          });
        }
        setWeeklySignups(weeklyData);
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

      // 일자별 가입 회원 현황 (최근 7일) - 기존 로직 유지
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        }));

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          const count = users.filter(
            u => u.createdAt && u.createdAt >= date && u.createdAt < nextDay
          ).length;

          last7Days.push({
            date: date.toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            }),
            count,
          });
        }
        setDailySignups(last7Days);
      } catch (e) {
        console.log("일자별 가입 통계 로딩 실패:", e);
      }

      // 일자별 거래 현황 (최근 7일)
      try {
        const transactionsSnapshot = await getDocs(
          collection(db, "transactions")
        );
        const transactions = transactionsSnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        }));

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          const count = transactions.filter(
            t => t.createdAt && t.createdAt >= date && t.createdAt < nextDay
          ).length;

          last7Days.push({
            date: date.toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            }),
            count,
          });
        }
        setDailyTransactions(last7Days);
      } catch (e) {
        console.log("일자별 거래 통계 로딩 실패:", e);
      }

      // 포인트 상위 회원 (Top 10)
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sorted = users
          .filter(u => u.points > 0)
          .sort((a, b) => (b.points || 0) - (a.points || 0));

        setTopUsersByPoints(sorted);
      } catch (e) {
        console.log("포인트 상위 회원 로딩 실패:", e);
      }

      // 최근 가입 회원 (Top 10)
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        }));

        const sorted = users
          .filter(u => u.createdAt)
          .sort(
            (a, b) =>
              (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
          );

        setRecentUsers(sorted);
      } catch (e) {
        console.log("최근 가입 회원 로딩 실패:", e);
      }
    } catch (error) {
      console.error("통계 로딩 실패:", error);
      toast.error("통계를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPoints = async () => {
    if (!targetUserId.trim()) {
      toast.error("사용자 아이디 또는 닉네임을 입력해주세요.");
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
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const {
        doc,
        updateDoc,
        increment,
        collection,
        addDoc,
        serverTimestamp,
        query,
        where,
        getDocs,
      } = await import("firebase/firestore");

      const db = getDb();

      // 먼저 username으로 검색
      let usersQuery = query(
        collection(db, "users"),
        where("username", "==", targetUserId.trim())
      );
      let querySnapshot = await getDocs(usersQuery);

      // username으로 찾지 못하면 nickname으로 검색
      if (querySnapshot.empty) {
        usersQuery = query(
          collection(db, "users"),
          where("nickname", "==", targetUserId.trim())
        );
        querySnapshot = await getDocs(usersQuery);
      }

      if (querySnapshot.empty) {
        toast.error(
          "해당 사용자를 찾을 수 없습니다. (아이디 또는 닉네임을 확인해주세요)"
        );
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
        userNickname: targetUser.nickname || "알 수 없음",
        userEmail: targetUser.email || targetUserUid,
        amount: points,
        type: "admin_grant",
        description: pointReason.trim() || "관리자 지급",
        reason: pointReason.trim() || "관리자 처리",
        balance: (targetUser.points || 0) + points,
        status: "completed",
        relatedId: `admin_${Date.now()}`,
        processedBy: user?.uid || "admin",
        processedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      // 사용자에게 알림 전송
      try {
        const { createNotification } = await import(
          "../../lib/api/notifications"
        );
        const reason = pointReason.trim() || "관리자 지급";

        await createNotification({
          userId: targetUserUid,
          type: "system",
          title: "🎁 포인트가 지급되었습니다",
          message: `${points.toLocaleString()}P가 지급되었습니다. 사유: ${reason}`,
          data: {
            amount: points,
            reason: reason,
            balanceAfter: (targetUser.points || 0) + points,
          },
          link: "/profile/points",
          priority: "high",
        });
        console.log("✅ 포인트 지급 알림 전송 완료");

        // 이메일 발송
        try {
          const emailResponse = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: targetUser.email || targetUserUid,
              subject: "🎁 ConnecTone 포인트 지급 알림",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">🎁 포인트가 지급되었습니다!</h2>
                  <p>안녕하세요, ${targetUser.nickname || "고객"}님!</p>
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1f2937; margin-top: 0;">지급 내역</h3>
                    <p><strong>지급 포인트:</strong> ${points.toLocaleString()}P</p>
                    <p><strong>지급 사유:</strong> ${reason}</p>
                    <p><strong>현재 잔액:</strong> ${((targetUser.points || 0) + points).toLocaleString()}P</p>
                  </div>
                  <p>포인트는 즉시 사용 가능합니다. 마이페이지에서 확인해보세요!</p>
                  <a href="${window.location.origin}/profile/points" 
                     style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    포인트 내역 확인하기
                  </a>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px;">
                    이 이메일은 ConnecTone 시스템에서 자동으로 발송되었습니다.<br>
                    문의사항이 있으시면 고객센터로 연락해주세요.
                  </p>
                </div>
              `,
              text: `
                🎁 포인트가 지급되었습니다!
                
                안녕하세요, ${targetUser.nickname || "고객"}님!
                
                지급 내역:
                - 지급 포인트: ${points.toLocaleString()}P
                - 지급 사유: ${reason}
                - 현재 잔액: ${((targetUser.points || 0) + points).toLocaleString()}P
                
                포인트는 즉시 사용 가능합니다.
                마이페이지에서 확인해보세요: ${window.location.origin}/profile/points
                
                ---
                ConnecTone 고객센터
              `,
            }),
          });

          if (emailResponse.ok) {
            console.log("✅ 이메일 발송 성공");
          } else {
            console.log("❌ 이메일 발송 실패:", await emailResponse.text());
          }
        } catch (emailError) {
          console.log("이메일 발송 오류:", emailError);
        }
      } catch (e) {
        console.log("알림 전송 실패 (무시):", e);
      }

      // 감사 로그 (user가 있을 때만)
      if (user) {
        try {
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
        } catch (e) {
          console.log("감사 로그 기록 실패 (무시):", e);
        }
      }

      toast.success(
        `${targetUser.nickname || targetUser.username}님에게 ${points.toLocaleString()}P를 지급했습니다!`
      );

      setTargetUserId("");
      setPointAmount("");
      setPointReason("");
      setShowPointModal(false);
    } catch (error) {
      console.error("포인트 지급 오류:", error);
      toast.error(`포인트 지급 중 오류: ${error.message || error}`);
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

  // 차트 데이터 렌더링 함수
  const renderChart = () => {
    if (chartPeriod === "monthly") {
      return (
        <div className="flex items-end justify-between h-64 space-x-2">
          {monthlySignups.map((month, idx) => {
            const maxCount = Math.max(...monthlySignups.map(m => m.count), 1);
            const height = (month.count / maxCount) * 200;

            return (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div className="text-xs text-gray-500 mb-2 text-center">
                  {month.month}
                </div>
                <div
                  className="w-full bg-gray-200 rounded-t-lg relative"
                  style={{ height: "200px" }}
                >
                  <div
                    className="bg-blue-600 w-full rounded-t-lg transition-all duration-500 hover:bg-blue-700"
                    style={{
                      height: `${height}px`,
                      position: "absolute",
                      bottom: 0,
                    }}
                  />
                </div>
                <div className="text-xs font-bold text-gray-900 mt-2">
                  {month.count}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (chartPeriod === "weekly") {
      return (
        <div className="flex items-end justify-between h-64 space-x-2">
          {weeklySignups.map((week, idx) => {
            const maxCount = Math.max(...weeklySignups.map(w => w.count), 1);
            const height = (week.count / maxCount) * 200;

            return (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div className="text-xs text-gray-500 mb-2 text-center">
                  {week.week}
                </div>
                <div
                  className="w-full bg-gray-200 rounded-t-lg relative"
                  style={{ height: "200px" }}
                >
                  <div
                    className="bg-green-600 w-full rounded-t-lg transition-all duration-500 hover:bg-green-700"
                    style={{
                      height: `${height}px`,
                      position: "absolute",
                      bottom: 0,
                    }}
                  />
                </div>
                <div className="text-xs font-bold text-gray-900 mt-2">
                  {week.count}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // daily
      return (
        <div className="space-y-2">
          {dailySignups.map((day, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{day.date}</span>
              <div className="flex items-center space-x-3">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((day.count / Math.max(...dailySignups.map(d => d.count), 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-8 text-right">
                  {day.count}명
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  const getTotalCount = () => {
    if (chartPeriod === "monthly") {
      return monthlySignups.reduce((sum, month) => sum + month.count, 0);
    } else if (chartPeriod === "weekly") {
      return weeklySignups.reduce((sum, week) => sum + week.count, 0);
    } else {
      return dailySignups.reduce((sum, day) => sum + day.count, 0);
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
      title: "포인트 로그",
      description: "포인트 사용 내역 및 거래 로그",
      icon: Coins,
      color: "yellow",
      href: "/connect-admin/point-logs",
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
    yellow: { icon: "text-yellow-600", bg: "bg-yellow-50 hover:bg-yellow-100" },
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
                  {user?.nickname || "관리자"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/connect-admin/users">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all cursor-pointer">
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
                      <p className="text-blue-200 text-xs mt-1 font-medium">
                        오늘 신규가입: {todaySignups}명
                      </p>
                    </div>
                    <Users className="w-12 h-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/connect-admin/products">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl transition-all cursor-pointer">
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
                        노출 {stats.activeProducts} | 숨김{" "}
                        {stats.hiddenProducts}
                      </p>
                    </div>
                    <Package className="w-12 h-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/connect-admin/reports">
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-xl transition-all cursor-pointer">
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
            </Link>

            <Link href="/connect-admin/transactions">
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all cursor-pointer">
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
            </Link>
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
          <div className="mb-8">
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

          {/* 일자별 통계 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 가입 회원 차트 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    📈 가입 회원 현황
                  </h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setChartPeriod("monthly")}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${
                        chartPeriod === "monthly"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      월별
                    </button>
                    <button
                      onClick={() => setChartPeriod("weekly")}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${
                        chartPeriod === "weekly"
                          ? "bg-white text-green-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      주간
                    </button>
                    <button
                      onClick={() => setChartPeriod("daily")}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${
                        chartPeriod === "daily"
                          ? "bg-white text-purple-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      일별
                    </button>
                  </div>
                </div>

                {renderChart()}

                <div className="mt-4 text-xs text-gray-500 text-center">
                  총 {getTotalCount()}명 가입
                </div>
              </CardContent>
            </Card>

            {/* 일자별 거래 현황 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  💰 일자별 거래 현황 (최근 7일)
                </h3>
                <div className="space-y-2">
                  {dailyTransactions.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">{day.date}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-48 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min((day.count / Math.max(...dailyTransactions.map(d => d.count), 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">
                          {day.count}건
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 회원 정보 테이블 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 포인트 상위 회원 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  🏆 포인트 상위 회원
                </h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-left text-xs font-semibold text-gray-600 pb-2">
                          순위
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-600 pb-2">
                          닉네임
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-600 pb-2">
                          등급
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-600 pb-2">
                          포인트
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUsersByPoints.map((u, idx) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="py-2 text-sm text-gray-900 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2 text-sm text-gray-900">
                            {u.nickname || u.username || "Unknown"}
                          </td>
                          <td className="py-2">
                            {u.grade &&
                            ["C", "D", "E", "F", "G", "A", "B"].includes(
                              u.grade
                            ) ? (
                              <UserGradeBadge
                                grade={u.grade}
                                size="sm"
                                showDescription={false}
                              />
                            ) : (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                C
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-sm font-bold text-yellow-600 text-right">
                            {(u.points || 0).toLocaleString()}P
                          </td>
                        </tr>
                      ))}
                      {topUsersByPoints.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-4 text-center text-gray-500 text-sm"
                          >
                            포인트 보유 회원이 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 최근 가입 회원 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  🆕 최근 가입 회원
                </h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-left text-xs font-semibold text-gray-600 pb-2">
                          닉네임
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-600 pb-2">
                          이메일
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-600 pb-2">
                          등급
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-600 pb-2">
                          가입일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map(u => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="py-2 text-sm text-gray-900 font-medium">
                            {u.nickname || "Unknown"}
                          </td>
                          <td className="py-2 text-xs text-gray-600">
                            {u.email?.substring(0, 20)}...
                          </td>
                          <td className="py-2">
                            {u.grade &&
                            ["C", "D", "E", "F", "G", "A", "B"].includes(
                              u.grade
                            ) ? (
                              <UserGradeBadge
                                grade={u.grade}
                                size="sm"
                                showDescription={false}
                              />
                            ) : (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                C
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-xs text-gray-600 text-right">
                            {u.createdAt?.toLocaleDateString("ko-KR")}
                          </td>
                        </tr>
                      ))}
                      {recentUsers.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-4 text-center text-gray-500 text-sm"
                          >
                            가입 회원이 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
                    사용자 아이디 또는 닉네임
                  </label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={e => setTargetUserId(e.target.value)}
                    placeholder="아이디 또는 닉네임을 입력하세요"
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
