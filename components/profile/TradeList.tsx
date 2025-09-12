"use client";

import { Card } from "../ui/Card";
import { TradeItem } from "../../data/profile/types";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Package, CheckCircle, RotateCcw } from "lucide-react";
import Image from "next/image";

interface TradeListProps {
  trades: TradeItem[];
  loading?: boolean;
}

export function TradeList({ trades, loading = false }: TradeListProps) {
  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const getStateInfo = (state: string) => {
    switch (state) {
      case "released":
        return {
          label: "거래완료",
          color: "text-green-600",
          bgColor: "bg-green-100",
          icon: CheckCircle,
        };
      case "sold":
        return {
          label: "판매완료",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          icon: Package,
        };
      case "refunded":
        return {
          label: "환불완료",
          color: "text-red-600",
          bgColor: "bg-red-100",
          icon: RotateCcw,
        };
      default:
        return {
          label: state,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: Package,
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            최근 거래
          </h2>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 거래</h2>

        {trades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>아직 거래 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map(trade => {
              const stateInfo = getStateInfo(trade.state);
              const StateIcon = stateInfo.icon;

              return (
                <div
                  key={trade.id}
                  className="flex space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* 상품 썸네일 */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {trade.thumbnail ? (
                      <Image
                        src={trade.thumbnail}
                        alt={`${trade.brand} ${trade.model}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {trade.brand} {trade.model}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatPrice(trade.price)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          상대방: {trade.partnerNickname}
                        </p>
                      </div>

                      {/* 상태 배지 */}
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stateInfo.bgColor} ${stateInfo.color} flex-shrink-0 ml-2`}
                      >
                        <StateIcon className="w-3 h-3 mr-1" />
                        {stateInfo.label}
                      </span>
                    </div>

                    {/* 거래 날짜 */}
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{formatDate(trade.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
