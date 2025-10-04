"use client";

import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Truck,
  CreditCard,
  ExternalLink,
  Copy,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ShippingTrackingModal } from "../shipping/ShippingTrackingModal";
import toast from "react-hot-toast";

interface StatusLog {
  status: string;
  timestamp: any;
  note?: string;
}

interface ShippingInfo {
  courier: string;
  trackingNumber: string;
}

interface StatusTimelineProps {
  status: "active" | "reserved" | "paid_hold" | "shipped" | "sold";
  statusLog?: StatusLog[];
  shippingInfo?: ShippingInfo;
  className?: string;
  currentUserId?: string;
  buyerUid?: string;
}

export function StatusTimeline({
  status,
  statusLog = [],
  shippingInfo,
  className = "",
  currentUserId,
  buyerUid,
}: StatusTimelineProps) {
  const [showShippingTrackingModal, setShowShippingTrackingModal] =
    useState(false);

  // 택배사 코드를 한글 이름으로 변환
  const getCourierName = (courierCode: string) => {
    const courierMap: { [key: string]: string } = {
      cj: "CJ대한통운",
      hanjin: "한진택배",
      lotte: "롯데택배",
      kdexp: "경동택배",
      epost: "우체국택배",
      logen: "로젠택배",
      ktx: "KTX물류",
      dhl: "DHL",
      fedex: "FedEx",
      ups: "UPS",
      ems: "EMS",
      cvs: "편의점택배",
    };
    return courierMap[courierCode] || courierCode;
  };

  // 구매자인지 확인
  const isBuyer = currentUserId && buyerUid && currentUserId === buyerUid;
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "판매중",
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          description: "상품이 판매 중입니다",
        };
      case "reserved":
        return {
          label: "거래중",
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          description: "상품이 거래 중입니다",
        };
      case "paid_hold":
        return {
          label: "결제완료",
          icon: CreditCard,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          description: "결제가 완료되었습니다",
        };
      case "shipped":
        return {
          label: "배송중",
          icon: Truck,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          description: "상품이 배송 중입니다",
        };
      case "sold":
        return {
          label: "거래완료",
          icon: CheckCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          description: "거래가 완료되었습니다",
        };
      default:
        return {
          label: "알 수 없음",
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          description: "상태를 확인할 수 없습니다",
        };
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
  };

  const getStatusOrder = (status: string) => {
    const order = ["active", "reserved", "paid_hold", "shipped", "sold"];
    return order.indexOf(status);
  };

  // 상태 로그가 없으면 현재 상태만 표시
  const timelineItems =
    statusLog.length > 0
      ? statusLog.sort((a, b) => {
          const aOrder = getStatusOrder(a.status);
          const bOrder = getStatusOrder(b.status);
          return aOrder - bOrder;
        })
      : [{ status, timestamp: new Date(), note: "현재 상태" }];

  const currentStatusInfo = getStatusInfo(status);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">거래 상태</h3>
          <div
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusInfo.bgColor} ${currentStatusInfo.color}`}
          >
            <currentStatusInfo.icon className="w-4 h-4 mr-2" />
            {currentStatusInfo.label}
          </div>
        </div>

        <p className="text-sm text-gray-600">{currentStatusInfo.description}</p>

        {/* 타임라인 */}
        <div className="space-y-4">
          {timelineItems.map((item, index) => {
            const itemStatusInfo = getStatusInfo(item.status);
            const isLast = index === timelineItems.length - 1;
            const isCompleted =
              getStatusOrder(item.status) <= getStatusOrder(status);

            return (
              <div key={index} className="flex items-start space-x-3">
                {/* 아이콘 */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? itemStatusInfo.bgColor : "bg-gray-100"
                  }`}
                >
                  <itemStatusInfo.icon
                    className={`w-4 h-4 ${
                      isCompleted ? itemStatusInfo.color : "text-gray-400"
                    }`}
                  />
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {itemStatusInfo.label}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-xs text-gray-600 mt-1">{item.note}</p>
                  )}
                </div>

                {/* 연결선 */}
                {!isLast && (
                  <div
                    className={`absolute left-4 top-8 w-0.5 h-6 ${
                      isCompleted ? "bg-gray-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* 추가 정보 */}
        {status === "shipped" && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <Truck className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">배송 정보</p>
            </div>

            {shippingInfo && isBuyer ? (
              <div className="space-y-3">
                {/* 택배사 및 송장번호 정보 */}
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">택배사:</span>
                      <p className="font-medium text-gray-900">
                        {getCourierName(shippingInfo.courier)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">송장번호:</span>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 font-mono">
                          {shippingInfo.trackingNumber}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              shippingInfo.trackingNumber
                            );
                            toast.success("송장번호가 복사되었습니다.");
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="송장번호 복사"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 배송 추적 버튼 */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowShippingTrackingModal(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    배송 추적하기
                  </Button>
                  <Button
                    onClick={() => {
                      const url = `https://tracker.delivery/#/${shippingInfo.courier}/${shippingInfo.trackingNumber}`;
                      window.open(url, "_blank");
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    공식사이트
                  </Button>
                </div>
              </div>
            ) : shippingInfo ? (
              <div className="text-sm text-blue-700">
                배송이 시작되었습니다. 구매자에게 배송 정보가 안내됩니다.
              </div>
            ) : (
              <div className="text-sm text-blue-700">
                배송 추적 정보는 구매자에게 개별적으로 안내됩니다.
              </div>
            )}
          </div>
        )}

        {status === "sold" && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-gray-600" />
              <p className="text-sm text-gray-700">
                이 상품은 이미 판매되었습니다. 비슷한 상품을 찾아보세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 배송 추적 모달 */}
      {shippingInfo && (
        <ShippingTrackingModal
          isOpen={showShippingTrackingModal}
          onClose={() => setShowShippingTrackingModal(false)}
          courier={shippingInfo.courier}
          trackingNumber={shippingInfo.trackingNumber}
        />
      )}
    </Card>
  );
}
