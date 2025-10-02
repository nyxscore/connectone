"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { X, Package, Truck } from "lucide-react";
import toast from "react-hot-toast";

interface ShippingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shippingInfo: {
    courier: string;
    trackingNumber: string;
  }) => void;
  loading?: boolean;
}

const COURIER_OPTIONS = [
  { value: "cj", label: "CJ대한통운" },
  { value: "hanjin", label: "한진택배" },
  { value: "lotte", label: "롯데택배" },
  { value: "kdexp", label: "경동택배" },
  { value: "epost", label: "우체국택배" },
  { value: "logen", label: "로젠택배" },
  { value: "kdexp", label: "경동택배" },
  { value: "dongbu", label: "동부택배" },
  { value: "kg", label: "KG로지스" },
  { value: "kgm", label: "KGB택배" },
  { value: "inno", label: "이노지스" },
  { value: "kdexp", label: "경동택배" },
  { value: "slx", label: "SLX택배" },
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "기타" },
];

export function ShippingInfoModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: ShippingInfoModalProps) {
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!courier) {
      toast.error("택배사를 선택해주세요.");
      return;
    }

    if (!trackingNumber.trim()) {
      toast.error("송장번호를 입력해주세요.");
      return;
    }

    onConfirm({
      courier,
      trackingNumber: trackingNumber.trim(),
    });
  };

  const handleClose = () => {
    setCourier("");
    setTrackingNumber("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">택배 발송 정보</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              택배사
            </label>
            <Select
              value={courier}
              onChange={e => setCourier(e.target.value)}
              disabled={loading}
              required
              options={COURIER_OPTIONS}
              placeholder="택배사를 선택하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              송장번호
            </label>
            <Input
              type="text"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder="송장번호를 입력하세요"
              disabled={loading}
              required
            />
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">발송 정보 등록 후</p>
                <p className="text-blue-600">
                  • 상품 상태가 "배송중"으로 변경됩니다
                  <br />• 구매자가 배송 추적을 할 수 있습니다
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  등록 중...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  발송 등록
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
