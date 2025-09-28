"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  ShoppingCart,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import {
  getReservedItemsBySeller,
  getReservedItemsForBuyer,
} from "../../lib/api/products";
import { SellItem } from "../../data/types";

interface TransactionStats {
  selling: {
    registered: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  buying: {
    registered: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

export function TransactionDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TransactionStats>({
    selling: { registered: 0, inProgress: 0, completed: 0, cancelled: 0 },
    buying: { registered: 0, inProgress: 0, completed: 0, cancelled: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    if (user?.uid) {
      loadTransactionStats();
    }
  }, [user?.uid]);

  const loadTransactionStats = async () => {
    try {
      setLoading(true);
      setError("");

      // 판매자용 거래중 상품 조회
      const sellingResult = await getReservedItemsBySeller(user!.uid);
      const sellingInProgress = sellingResult.success
        ? sellingResult.items?.length || 0
        : 0;

      // 구매자용 거래중 상품 조회
      const buyingResult = await getReservedItemsForBuyer(user!.uid);
      const buyingInProgress = buyingResult.success
        ? buyingResult.items?.length || 0
        : 0;

      // TODO: 실제 데이터베이스에서 다른 상태들도 조회해야 함
      // 지금은 임시 데이터로 표시
      setStats({
        selling: {
          registered: 0, // 등록된 상품 수
          inProgress: sellingInProgress,
          completed: 0, // 완료된 거래 수 (실제 데이터로 변경 필요)
          cancelled: 0,
        },
        buying: {
          registered: 0,
          inProgress: buyingInProgress,
          completed: 0,
          cancelled: 0,
        },
      });
    } catch (error) {
      console.error("거래 현황 로드 실패:", error);
      setError("거래 현황을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">거래 현황을 불러오는 중...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadTransactionStats} variant="outline">
            다시 시도
          </Button>
        </div>
      </Card>
    );
  }

  const filterOptions = [
    { key: "all", label: "전체", type: "all" },
    { key: "selling_registered", label: "판매 등록", type: "selling" },
    { key: "selling_inProgress", label: "판매중", type: "selling" },
    { key: "selling_completed", label: "판매 완료", type: "selling" },
    { key: "selling_cancelled", label: "취소 대기", type: "selling" },
    { key: "buying_registered", label: "구매 등록", type: "buying" },
    { key: "buying_inProgress", label: "구매중", type: "buying" },
    { key: "buying_completed", label: "구매 완료", type: "buying" },
    { key: "buying_cancelled", label: "취소 요청", type: "buying" },
  ];

  const getFilterCount = (filterKey: string) => {
    switch (filterKey) {
      case "selling_registered":
        return stats.selling.registered;
      case "selling_inProgress":
        return stats.selling.inProgress;
      case "selling_completed":
        return stats.selling.completed;
      case "selling_cancelled":
        return stats.selling.cancelled;
      case "buying_registered":
        return stats.buying.registered;
      case "buying_inProgress":
        return stats.buying.inProgress;
      case "buying_completed":
        return stats.buying.completed;
      case "buying_cancelled":
        return stats.buying.cancelled;
      default:
        return 0;
    }
  };

  return (
    <div className="flex gap-6">
      {/* 사이드바 필터 */}
      <div className="w-64 flex-shrink-0">
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">거래 현황</h3>
          
          {/* 판매 섹션 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              판매
            </h4>
            <div className="space-y-2">
              {filterOptions.filter(option => option.type === "selling").map(option => (
                <button
                  key={option.key}
                  onClick={() => setSelectedFilter(option.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFilter === option.key
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      getFilterCount(option.key) > 0 
                        ? "bg-red-100 text-red-600" 
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {getFilterCount(option.key)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 구매 섹션 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2 text-pink-600" />
              구매
            </h4>
            <div className="space-y-2">
              {filterOptions.filter(option => option.type === "buying").map(option => (
                <button
                  key={option.key}
                  onClick={() => setSelectedFilter(option.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFilter === option.key
                      ? "bg-pink-100 text-pink-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      getFilterCount(option.key) > 0 
                        ? "bg-red-100 text-red-600" 
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {getFilterCount(option.key)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 전체 보기 */}
          <button
            onClick={() => setSelectedFilter("all")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedFilter === "all"
                ? "bg-gray-100 text-gray-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            전체 보기
          </button>
        </Card>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 space-y-6">
        {/* 거래 현황 헤더 */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">거래 현황</h2>
        </div>

          {/* 판매 현황 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">판매중</h3>
          </div>
        </div>

        {/* 판매 플로우 차트 */}
        <div className="flex items-center justify-between mb-4">
          {/* 시작 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
              판매
            </div>
          </div>

          {/* 연결선 */}
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

          {/* 판매 등록 */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.selling.registered}
            </div>
            <span className="text-sm text-gray-600">판매 등록</span>
          </div>

          {/* 연결선 */}
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

          {/* 판매중 */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.selling.inProgress}
            </div>
            <span className="text-sm text-gray-600">판매중</span>
          </div>

          {/* 연결선 */}
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

          {/* 판매 완료 */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.selling.completed}
            </div>
            <span className="text-sm text-gray-600">판매 완료</span>
          </div>

          {/* 연결선 */}
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

          {/* 취소 대기 */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.selling.cancelled}
            </div>
            <span className="text-sm text-gray-600">취소 대기</span>
          </div>
        </div>

        {/* 판매 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.selling.registered}
            </div>
            <div className="text-sm text-gray-600">등록 물품</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.selling.inProgress}
            </div>
            <div className="text-sm text-gray-600">판매중</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.selling.completed}
            </div>
            <div className="text-sm text-gray-600">판매 완료</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {stats.selling.cancelled}
            </div>
            <div className="text-sm text-gray-600">취소 대기</div>
          </div>
        </div>
      </Card>

      {/* 구매 현황 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6 text-pink-600" />
            <h3 className="text-xl font-semibold text-gray-900">구매중</h3>
          </div>
        </div>

        {/* 구매 플로우 차트 */}
        <div className="flex items-center justify-between mb-4">
          {/* 시작 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
              구매
            </div>
          </div>

          {/* 연결선 */}
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

          {/* 구매 등록 */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.buying.registered}
            </div>
            <span className="text-sm text-gray-600">구매 등록</span>
          </div>

          {/* 연결선 */}
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

          {/* 구매중 */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.buying.inProgress}
            </div>
            <span className="text-sm text-gray-600">구매중</span>
          </div>

          {/* 연결선 */}
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

          {/* 구매 완료 */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.buying.completed}
            </div>
            <span className="text-sm text-gray-600">구매 완료</span>
          </div>

          {/* 연결선 */}
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

          {/* 취소 요청 */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold mb-2">
              {stats.buying.cancelled}
            </div>
            <span className="text-sm text-gray-600">취소 요청</span>
          </div>
        </div>

        {/* 구매 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">
              {stats.buying.registered}
            </div>
            <div className="text-sm text-gray-600">등록 물품</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.buying.inProgress}
            </div>
            <div className="text-sm text-gray-600">구매중</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.buying.completed}
            </div>
            <div className="text-sm text-gray-600">구매 완료</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {stats.buying.cancelled}
            </div>
            <div className="text-sm text-gray-600">취소 요청</div>
          </div>
        </div>
      </Card>

      {/* 유료서비스 섹션 */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">유료서비스</h3>
          </div>
          <Button variant="outline" size="sm">
            서비스 보기
          </Button>
        </div>
        <div className="mt-4 text-gray-600">
          <p>프리미엄 기능을 이용하여 더 많은 혜택을 받아보세요!</p>
        </div>
        </Card>
      </div>
    </div>
  );
}
