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

  // Daum Postcode 스크립트 확인 (이미 layout.tsx에서 로드됨)
  useEffect(() => {
    console.log("🔍 Daum Postcode 스크립트 확인");

    // 스크립트 로딩 대기 (최대 5초)
    let attempts = 0;
    const maxAttempts = 10;

    const checkScript = setInterval(() => {
      attempts++;
      console.log(`📦 스크립트 확인 시도 ${attempts}/${maxAttempts}`);

      if (window.daum && window.daum.Postcode) {
        console.log("✅ Daum Postcode API 준비 완료");
        clearInterval(checkScript);
      } else if (attempts >= maxAttempts) {
        console.error("❌ Daum Postcode API 로드 실패 (타임아웃)");
        toast.error(
          "주소 검색 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요."
        );
        clearInterval(checkScript);
      }
    }, 500);

    return () => clearInterval(checkScript);
  }, []);

  // 주소 검색 iframe 표시 상태
  const [showAddressIframe, setShowAddressIframe] = useState(false);

  // 주소 검색 팝업 열기 (iframe 방식)
  const openAddressSearch = () => {
    console.log("🔍 주소 검색 버튼 클릭됨");

    // iframe 방식으로 열기
    setShowAddressIframe(true);
  };

  // postMessage로 주소 데이터 받기
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== "https://t1.daumcdn.net") return;

      console.log("📬 주소 데이터 수신:", e.data);

      const data = e.data;
      if (data.zonecode) {
        const fullAddress = data.roadAddress || data.jibunAddress;
        console.log("선택된 주소:", fullAddress);
        console.log("우편번호:", data.zonecode);

        setFormData(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: fullAddress,
        }));

        toast.success(`주소가 선택되었습니다.\n${fullAddress}`);
        setShowAddressIframe(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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
        console.log("✅ 배송지 정보 등록 성공 - 콜백 호출");
        onSuccess?.();
        onClose();

        // 강제 새로고침 (Vercel 호환성)
        setTimeout(() => {
          console.log("🔄 채팅 모달 강제 새로고침");
          window.location.reload();
        }, 1000);
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
              >
                <Search className="w-4 h-4" />
                <span>주소 검색</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("🔧 카카오 주소 검색 시도");
                  // 카카오 주소 검색 API 시도
                  if (window.kakao && window.kakao.maps) {
                    // 카카오 지도 API 사용
                    toast.info("카카오 주소 검색을 시도합니다.");
                  } else {
                    // 카카오 API 로드 시도
                    const kakaoScript = document.createElement("script");
                    kakaoScript.src =
                      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_APP_KEY&libraries=services";
                    kakaoScript.onload = () => {
                      console.log("✅ 카카오 API 로드 성공");
                      toast.success("카카오 주소 검색이 준비되었습니다.");
                    };
                    kakaoScript.onerror = () => {
                      console.error("❌ 카카오 API 로드 실패");
                      toast.error("카카오 주소 검색도 사용할 수 없습니다.");
                    };
                    document.head.appendChild(kakaoScript);
                  }
                }}
                className="flex items-center space-x-1 text-xs"
              >
                <span>카카오 검색</span>
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
              placeholder="주소를 직접 입력하세요 (예: 서울시 강남구 테헤란로 123)"
              className="w-full"
              list="address-suggestions"
            />

            {/* 주소 자동완성 데이터 */}
            <datalist id="address-suggestions">
              <option value="서울시 강남구 테헤란로 123" />
              <option value="서울시 서초구 서초대로 123" />
              <option value="서울시 중구 을지로 123" />
              <option value="서울시 종로구 종로 123" />
              <option value="서울시 마포구 홍대입구역 123" />
              <option value="서울시 송파구 올림픽로 123" />
              <option value="서울시 영등포구 여의도동 123" />
              <option value="경기도 성남시 분당구 판교역로 123" />
              <option value="경기도 수원시 영통구 광교로 123" />
              <option value="인천시 연수구 컨벤시아대로 123" />
            </datalist>

            {/* 주소 입력 도움말 */}
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 <strong>주소 입력 팁:</strong>
              <br />
              • 우편번호: 12345 (5자리 숫자)
              <br />
              • 주소: 시/도 + 구/군 + 도로명 + 건물번호
              <br />• 예시: 서울시 강남구 테헤란로 123
            </div>

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

      {/* 주소 검색 iframe 모달 */}
      {showAddressIframe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">주소 검색</h3>
              <button
                onClick={() => setShowAddressIframe(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <iframe
              src="data:text/html;charset=utf-8,%3C!DOCTYPE%20html%3E%0A%3Chtml%3E%0A%3Chead%3E%0A%20%20%3Cmeta%20charset%3D%22utf-8%22%3E%0A%20%20%3Cscript%20src%3D%22https%3A//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js%22%3E%3C/script%3E%0A%3C/head%3E%0A%3Cbody%3E%0A%20%20%3Cdiv%20id%3D%22postcode%22%20style%3D%22width%3A100%25%3Bheight%3A100%25%22%3E%3C/div%3E%0A%20%20%3Cscript%3E%0A%20%20%20%20new%20daum.Postcode(%7B%0A%20%20%20%20%20%20oncomplete%3A%20function(data)%20%7B%0A%20%20%20%20%20%20%20%20parent.postMessage(data%2C%20'*')%3B%0A%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20width%3A%20'100%25'%2C%0A%20%20%20%20%20%20height%3A%20'100%25'%0A%20%20%20%20%7D).embed(document.getElementById('postcode'))%3B%0A%20%20%3C/script%3E%0A%3C/body%3E%0A%3C/html%3E"
              className="flex-1 w-full"
              style={{ border: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
