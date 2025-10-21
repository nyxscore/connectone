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

  // Daum Postcode 스크립트 로드 (대안 방법 포함)
  useEffect(() => {
    console.log("🔍 Daum Postcode 스크립트 로드 시작");
    console.log("현재 window.daum 상태:", !!window.daum);
 
    if (!window.daum) {
      console.log("📦 Daum 스크립트 로드 중...");
      const script = document.createElement("script");
      script.src =
        "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ 다음 주소 검색 API 로드 완료");
        console.log("window.daum 확인:", !!window.daum);
        console.log("window.daum.Postcode 확인:", !!window.daum?.Postcode);
      };
      script.onerror = error => {
        console.error("❌ 다음 주소 검색 API 로드 실패:", error);
        console.log("🔄 대안 방법으로 전환합니다");
        toast.error("주소 검색 서비스를 불러올 수 없습니다. 직접 입력해주세요.");
      };
      document.head.appendChild(script);
      console.log("📦 스크립트가 document.head에 추가됨");
    } else {
      console.log("✅ Daum API가 이미 로드되어 있음");
    }
  }, []);

  // 주소 검색 팝업 열기
  const openAddressSearch = () => {
    console.log("🔍 주소 검색 버튼 클릭됨");
    console.log("window.daum 상태:", !!window.daum);
    console.log("window.daum.Postcode 상태:", !!window.daum?.Postcode);

    if (!window.daum) {
      console.error("❌ window.daum이 없음");
      toast.error(
        "주소 검색 서비스가 차단되었습니다. '직접 입력' 버튼을 사용해주세요."
      );
      return;
    }

    if (!window.daum.Postcode) {
      console.error("❌ window.daum.Postcode가 없음");
      toast.error("주소 검색 API가 아직 로드되지 않았습니다. '직접 입력' 버튼을 사용해주세요.");
      return;
    }

    console.log("🚀 Daum Postcode 팝업 열기 시도");
    try {
      // 팝업 차단 감지를 위한 타이머
      const popupTimer = setTimeout(() => {
        console.log("⚠️ 팝업이 차단되었을 가능성이 있습니다");
        toast.error("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
      }, 2000);

      const postcode = new window.daum.Postcode({
        oncomplete: function (data: any) {
          console.log("✅ 주소 선택 완료:", data);
          // 도로명 주소 또는 지번 주소 선택
          const fullAddress = data.roadAddress || data.jibunAddress;
          console.log("선택된 주소:", fullAddress);
          console.log("우편번호:", data.zonecode);

          setFormData(prev => ({
            ...prev,
            zipCode: data.zonecode,
            address: fullAddress,
          }));

          toast.success(`주소가 선택되었습니다.\n${fullAddress}`);
        },
        onclose: function (state: string) {
          console.log("🔍 주소 검색 팝업 닫힘:", state);
          clearTimeout(popupTimer); // 타이머 정리
          if (state === "FORCE_CLOSE") {
            toast.error("주소 검색이 강제로 닫혔습니다. 팝업 차단을 해제해주세요.");
          } else if (state === "COMPLETE_CLOSE") {
            // 정상적으로 닫힌 경우 (주소 선택 완료)
            console.log("✅ 주소 검색 정상 완료");
          } else {
            toast.info("주소 검색이 취소되었습니다.");
          }
        },
        width: "100%",
        height: "100%",
        maxSuggestItems: 5,
        showMoreHints: true,
        hideMapBtn: false,
        hideEngBtn: true,
        alwaysShowEngAddr: false,
        submitMode: false,
        useBanner: true,
        useSuggest: true,
        autoMapping: true,
        autoMappingRoad: true,
        autoMappingJibun: true,
        theme: {
          bgColor: "#ffffff",
          searchBgColor: "#f8f9fa",
          contentBgColor: "#ffffff",
          pageBgColor: "#ffffff",
          textColor: "#333333",
          queryTextColor: "#222222",
          postcodeTextColor: "#fa4256",
          emphTextColor: "#008bd3",
          outlineColor: "#e0e0e0",
        },
      });
      
      postcode.open();
      console.log("✅ 주소 검색 팝업 열기 완료");
    } catch (error) {
      console.error("주소 검색 팝업 오류:", error);
      toast.error("주소 검색 중 오류가 발생했습니다.");
    }
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
                onChange={e => handleInputChange("zipCode", e.target.value)}
                placeholder="우편번호"
                className="w-32"
              />
              <Button
                type="button"
                variant="outline"
                onClick={openAddressSearch}
                className="flex items-center space-x-1"
                disabled={!window.daum}
              >
                <Search className="w-4 h-4" />
                <span>{window.daum ? "주소 검색" : "검색 불가"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("🔧 수동 주소 입력 모드");
                  setFormData(prev => ({
                    ...prev,
                    zipCode: "",
                    address: "",
                  }));
                  toast.info("주소를 직접 입력해주세요.");
                }}
                className="flex items-center space-x-1 text-xs"
              >
                <span>직접 입력</span>
              </Button>
            </div>

            {/* 기본 주소 */}
            <Input
              type="text"
              value={formData.address}
              onChange={e => handleInputChange("address", e.target.value)}
              placeholder="주소 검색 버튼을 클릭하거나 직접 입력하세요"
              className="w-full"
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
