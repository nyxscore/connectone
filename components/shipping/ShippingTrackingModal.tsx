"use client";

import { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  trackShipping,
  getTrackingUrl,
  ShippingInfo,
} from "../../lib/api/shipping";
import { Button } from "../ui/Button";

interface ShippingTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: string;
  trackingNumber: string;
}

export function ShippingTrackingModal({
  isOpen,
  onClose,
  courier,
  trackingNumber,
}: ShippingTrackingModalProps) {
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && courier && trackingNumber) {
      fetchShippingInfo();
    }
  }, [isOpen, courier, trackingNumber]);

  const fetchShippingInfo = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await trackShipping(courier, trackingNumber);

      if (result.success && result.data) {
        setShippingInfo(result.data);
      } else {
        setError(result.error || "배송정보를 가져올 수 없습니다.");
      }
    } catch (err) {
      setError("배송조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleExternalTracking = () => {
    const url = getTrackingUrl(courier, trackingNumber);
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">배송조회</h2>
            <p className="text-sm text-gray-600 mt-1">
              {courier} - {trackingNumber}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchShippingInfo}
              disabled={loading}
              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={handleExternalTracking}
              className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              공식사이트
            </Button>
            <Button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">배송정보를 조회하고 있습니다...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <X className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">조회 실패</p>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={fetchShippingInfo}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                다시 시도
              </Button>
            </div>
          ) : shippingInfo ? (
            <div>
              {/* 현재 상태 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    현재 상태: {shippingInfo.status}
                  </span>
                </div>
              </div>

              {/* 배송 진행 상황 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  배송 진행 상황
                </h3>
                <div className="space-y-4">
                  {shippingInfo.progress.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {index === 0 ? (
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        ) : (
                          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {step.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {step.time}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{step.location}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
