"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getPointHistory } from "@/lib/api/points";
import type { PointTransaction } from "@/lib/types";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PointsPage() {
  const { user, loading } = useAuth();
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadPointHistory();
    }
  }, [user?.uid]);

  const loadPointHistory = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const history = await getPointHistory(user.uid);
      setPointHistory(history);
    } catch (error) {
      console.error("포인트 내역 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 포인트 타입별 아이콘 및 색상
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "signup":
        return { icon: "🎉", color: "text-green-600", bg: "bg-green-50" };
      case "trade_complete":
        return { icon: "✅", color: "text-blue-600", bg: "bg-blue-50" };
      case "review":
        return { icon: "⭐", color: "text-yellow-600", bg: "bg-yellow-50" };
      case "purchase":
        return { icon: "🛒", color: "text-purple-600", bg: "bg-purple-50" };
      case "admin":
        return { icon: "⚙️", color: "text-gray-600", bg: "bg-gray-50" };
      default:
        return { icon: "💰", color: "text-gray-600", bg: "bg-gray-50" };
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다</p>
          <Link href="/auth/login">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              프로필로 돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Coins className="w-8 h-8 text-blue-600" />
            사용 내역
          </h1>
        </motion.div>

        {/* 포인트 잔액 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl p-8 mb-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-2">사용 가능 포인트</p>
              <p className="text-5xl font-black flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full text-white text-2xl font-bold shadow-lg">
                  P
                </span>
                {(user.points || 0).toLocaleString()}
                <span className="text-2xl">포인트</span>
              </p>
            </div>
            <Coins className="w-16 h-16 text-white opacity-20" />
          </div>
          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <p className="text-sm text-blue-100">
              💡 포인트는 심화 분석 등 다양한 서비스에 사용할 수 있습니다
            </p>
          </div>
        </motion.div>

        {/* 포인트 적립 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            💎 포인트 적립 방법
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">회원가입</p>
                <p className="text-xs text-gray-600">5,000P 지급</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">거래 완료</p>
                <p className="text-xs text-gray-600">100P 지급</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">후기 작성</p>
                <p className="text-xs text-gray-600">50P 지급</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 포인트 내역 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            사용 내역
          </h2>

          {pointHistory.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">사용 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pointHistory.map((transaction, index) => {
                const typeInfo = getTypeInfo(transaction.type);
                const isPositive = transaction.amount > 0;

                return (
                  <motion.div
                    key={transaction.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 ${typeInfo.bg} rounded-full flex items-center justify-center`}
                      >
                        <span className="text-xl">{typeInfo.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {transaction.amount.toLocaleString()}P
                      </p>
                      <p className="text-xs text-gray-500">
                        잔액 {transaction.balance.toLocaleString()}P
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
