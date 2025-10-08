"use client";

import { useState, useEffect } from "react";
import { X, MapPin, User, Phone, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitBuyerShippingInfo } from "@/lib/api/products";
import toast from "react-hot-toast";

// Daum Postcode 타입 정의
declare global {
  interface Window {
    daum: any;
  }
}

interface BuyerShippingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  buyerUid: string;
  onSuccess?: () => void;
}

export default function BuyerShippingInfoModal({
  isOpen,
  onClose,
  itemId,
  buyerUid,
  onSuccess,
}: BuyerShippingInfoModalProps) {
  const [formData, setFormData] = useState({
    recipientName: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    phoneNumber: "",
    deliveryMemo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Daum Postcode 스크립트 로드
  useEffect(() => {
    if (!window.daum) {
      const script = document.createElement("script");
      script.src =
        "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // 주소 검색 팝업 열기
  const openAddressSearch = () => {
    if (!window.daum) {
      toast.error(
        "주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        // 도로명 주소 또는 지번 주소 선택
        const fullAddress = data.roadAddress || data.jibunAddress;

        setFormData(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: fullAddress,
        }));
      },
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.recipientName.trim() ||
      !formData.address.trim() ||
      !formData.addressDetail.trim() ||
      !formData.phoneNumber.trim()
    ) {
      toast.error("필수 정보를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 주소를 합쳐서 전송
      const fullAddress = `[${formData.zipCode}] ${formData.address} ${formData.addressDetail}`;

      const result = await submitBuyerShippingInfo(itemId, buyerUid, {
        recipientName: formData.recipientName,
        address: fullAddress,
        phoneNumber: formData.phoneNumber,
        deliveryMemo: formData.deliveryMemo,
      });

      if (result.success) {
        toast.success("배송지 정보가 등록되었습니다.");
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "배송지 정보 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("배송지 정보 제출 에러:", error);
      toast.error("배송지 정보 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            배송지 정보 입력
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <User className="w-4 h-4 mr-2" />
              받는 사람 이름 *
            </label>
            <Input
              type="text"
              value={formData.recipientName}
              onChange={e => handleInputChange("recipientName", e.target.value)}
              placeholder="받는 사람 이름을 입력하세요"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              배송 주소 *
            </label>

            {/* 우편번호 검색 */}
            <div className="flex space-x-2">
              <Input
                type="text"
                value={formData.zipCode}
                placeholder="우편번호"
                className="w-32"
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                onClick={openAddressSearch}
                className="flex items-center space-x-1"
              >
                <Search className="w-4 h-4" />
                <span>주소 검색</span>
              </Button>
            </div>

            {/* 기본 주소 */}
            <Input
              type="text"
              value={formData.address}
              placeholder="주소 검색 버튼을 클릭하세요"
              className="w-full"
              readOnly
            />

            {/* 상세 주소 */}
            <Input
              type="text"
              value={formData.addressDetail}
              onChange={e => handleInputChange("addressDetail", e.target.value)}
              placeholder="상세 주소를 입력하세요 (동/호수 등)"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              연락처 *
            </label>
            <Input
              type="tel"
              value={formData.phoneNumber}
              onChange={e => handleInputChange("phoneNumber", e.target.value)}
              placeholder="010-1234-5678"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              배송 메모 (선택사항)
            </label>
            <textarea
              value={formData.deliveryMemo}
              onChange={e => handleInputChange("deliveryMemo", e.target.value)}
              placeholder="배송 시 요청사항을 입력하세요"
              className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
