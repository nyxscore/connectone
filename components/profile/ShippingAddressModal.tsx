"use client";

import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  User,
  Phone,
  Home,
  Star,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ShippingAddress } from "@/lib/schemas";
import {
  addShippingAddress,
  getShippingAddresses,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultAddress,
} from "@/lib/api/shipping-address";
import { useDaumPostcode, PostcodeData } from "@/lib/hooks/useDaumPostcode";
import toast from "react-hot-toast";

interface ShippingAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function ShippingAddressModal({
  isOpen,
  onClose,
  userId,
}: ShippingAddressModalProps) {
  const [addresses, setAddresses] = useState<
    (ShippingAddress & { id: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipientName: "",
    phoneNumber: "",
    address: "",
    detailAddress: "",
    zipCode: "",
    deliveryMemo: "",
    isDefault: false,
  });

  const { openPostcode } = useDaumPostcode();

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    return phone;
  };

  // 주소 검색 핸들러
  const handleAddressSearch = () => {
    if (typeof window === "undefined" || !(window as any).daum) {
      toast.error(
        "주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    openPostcode({
      onComplete: (data: PostcodeData) => {
        // 도로명주소 우선, 없으면 지번주소 사용
        const selectedAddress = data.roadAddress || data.jibunAddress;

        setFormData(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: selectedAddress,
        }));

        toast.success(`주소가 선택되었습니다.\n${selectedAddress}`);
      },
      onClose: state => {
        if (state === "FORCE_CLOSE") {
          toast.error("주소 검색이 강제로 닫혔습니다.");
        } else if (state === "COMPLETE_CLOSE") {
          // 정상적으로 닫힌 경우 (주소 선택 완료)
        } else {
          toast.info("주소 검색이 취소되었습니다.");
        }
      },
      onResize: size => {
        console.log("주소 검색 창 크기 변경:", size);
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
  };

  // 배송지 목록 로드
  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const result = await getShippingAddresses(userId);
      if (result.success && result.addresses) {
        setAddresses(result.addresses);
      } else {
        toast.error(result.error || "배송지 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("배송지 로드 실패:", error);
      toast.error("배송지 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 열릴 때 배송지 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen, userId]);

  // 새 배송지 추가 버튼 클릭 핸들러
  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      recipientName: "",
      phoneNumber: "",
      address: "",
      detailAddress: "",
      zipCode: "",
      deliveryMemo: "",
      isDefault: false,
    });
  };

  // 배송지 수정 버튼 클릭 핸들러
  const handleEditClick = (address: ShippingAddress & { id: string }) => {
    setIsAdding(true);
    setEditingId(address.id);
    setFormData({
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      address: address.address,
      zipCode: address.zipCode,
      deliveryMemo: address.deliveryMemo,
      isDefault: address.isDefault,
    });
  };

  // 폼 취소 핸들러
  const handleCancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      recipientName: "",
      phoneNumber: "",
      address: "",
      detailAddress: "",
      zipCode: "",
      deliveryMemo: "",
      isDefault: false,
    });
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.recipientName ||
      !formData.phoneNumber ||
      !formData.address ||
      !formData.zipCode
    ) {
      toast.error("필수 정보를 모두 입력해주세요.");
      return;
    }

    try {
      // 상세 주소를 기본 주소와 합쳐서 저장
      const addressData = {
        ...formData,
        address: formData.detailAddress
          ? `${formData.address} ${formData.detailAddress}`.trim()
          : formData.address,
      };

      if (editingId) {
        // 수정
        const result = await updateShippingAddress(editingId, addressData);
        if (result.success) {
          toast.success("배송지가 수정되었습니다.");
          loadAddresses();
          handleCancelEdit();
        } else {
          toast.error(result.error || "배송지 수정에 실패했습니다.");
        }
      } else {
        // 추가
        const result = await addShippingAddress(userId, addressData);
        if (result.success) {
          toast.success("배송지가 추가되었습니다.");
          loadAddresses();
          handleCancelEdit();
        } else {
          toast.error(result.error || "배송지 추가에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("배송지 저장 실패:", error);
      toast.error("배송지 저장에 실패했습니다.");
    }
  };

  // 배송지 수정 시작
  const handleEdit = (address: ShippingAddress & { id: string }) => {
    // 기존 주소를 기본 주소와 상세 주소로 분리
    const addressParts = address.address.split(" ");
    const baseAddress = addressParts.slice(0, -1).join(" ");
    const detailAddress = addressParts[addressParts.length - 1] || "";

    setFormData({
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      address: baseAddress,
      detailAddress: detailAddress,
      zipCode: address.zipCode,
      deliveryMemo: address.deliveryMemo || "",
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  // 배송지 삭제
  const handleDelete = async (addressId: string) => {
    if (!confirm("이 배송지를 삭제하시겠습니까?")) return;

    try {
      const result = await deleteShippingAddress(addressId);
      if (result.success) {
        toast.success("배송지가 삭제되었습니다.");
        loadAddresses();
      } else {
        toast.error(result.error || "배송지 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("배송지 삭제 실패:", error);
      toast.error("배송지 삭제에 실패했습니다.");
    }
  };

  // 기본 배송지 설정
  const handleSetDefault = async (addressId: string) => {
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        toast.success("기본 배송지로 설정되었습니다.");
        loadAddresses();
      } else {
        toast.error(result.error || "기본 배송지 설정에 실패했습니다.");
      }
    } catch (error) {
      console.error("기본 배송지 설정 실패:", error);
      toast.error("기본 배송지 설정에 실패했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">배송지 관리</h2>
                <p className="text-blue-100 text-sm">
                  주소를 등록하고 관리하세요
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-white/20 text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 배송지 목록 */}
          <div className="space-y-4 mb-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <p className="text-gray-600 font-medium">
                  배송지를 불러오는 중...
                </p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  등록된 배송지가 없습니다
                </h3>
                <p className="text-gray-500 mb-6">
                  첫 번째 배송지를 등록해보세요
                </p>
                <Button
                  onClick={handleAddClick}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="w-4 h-4 mr-2" />새 배송지 추가
                </Button>
              </div>
            ) : (
              addresses.map(address => (
                <div
                  key={address.id}
                  className={`group relative border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg ${
                    address.isDefault
                      ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {/* 기본 배송지 배지 */}
                  {address.isDefault && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        기본
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            address.isDefault ? "bg-blue-200" : "bg-gray-100"
                          }`}
                        >
                          <User
                            className={`w-5 h-5 ${
                              address.isDefault
                                ? "text-blue-700"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {address.recipientName}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Phone
                            className={`w-4 h-4 ${
                              address.isDefault
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              address.isDefault
                                ? "text-blue-900"
                                : "text-gray-700"
                            }`}
                          >
                            {formatPhoneNumber(address.phoneNumber)}
                          </span>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Home
                            className={`w-4 h-4 mt-1 ${
                              address.isDefault
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                          />
                          <div className="flex-1">
                            <div
                              className={`font-medium ${
                                address.isDefault
                                  ? "text-blue-900"
                                  : "text-gray-700"
                              }`}
                            >
                              ({address.zipCode}) {address.address}
                            </div>
                            {address.deliveryMemo && (
                              <div
                                className={`text-sm mt-1 font-medium ${
                                  address.isDefault
                                    ? "text-blue-700"
                                    : "text-gray-500"
                                }`}
                              >
                                {address.deliveryMemo}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(address)}
                        className="p-2 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        className="p-2 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {!address.isDefault && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        className="w-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        기본 배송지로 설정
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 배송지 추가/수정 폼 */}
          {isAdding && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingId ? "배송지 수정" : "새 배송지 추가"}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 받는 분 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      받는 분 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.recipientName || ""}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          recipientName: e.target.value,
                        })
                      }
                      placeholder="받는 분을 입력해 주세요."
                      className="h-12 text-sm rounded-lg"
                      required
                    />
                  </div>

                  {/* 휴대폰 번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      휴대폰 번호 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.phoneNumber || ""}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="-없이 휴대폰 번호를 입력해주세요."
                      className="h-12 text-sm rounded-lg"
                      required
                    />
                  </div>

                  {/* 주소 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주소 <span className="text-red-500">*</span>
                    </label>

                    {/* 우편번호 + 검색 버튼 */}
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={formData.zipCode || ""}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            zipCode: e.target.value,
                          })
                        }
                        placeholder="우편번호"
                        className="w-32 h-10 text-sm"
                        readOnly
                      />
                      <Button
                        type="button"
                        onClick={handleAddressSearch}
                        className="h-10 px-6 text-sm bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                      >
                        우편번호 찾기
                      </Button>
                    </div>

                    {/* 기본 주소 */}
                    <Input
                      value={formData.address || ""}
                      onChange={e =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="기본 주소"
                      className="h-12 text-sm bg-gray-50 border-gray-300 rounded-lg mb-3"
                      readOnly
                    />

                    {/* 상세 주소 */}
                    <Input
                      value={formData.detailAddress || ""}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          detailAddress: e.target.value,
                        })
                      }
                      placeholder="상세주소 (동/호수 등)"
                      className="h-12 text-sm rounded-lg"
                    />

                    {/* 배송 메모 */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        배송메모
                      </label>
                      <Input
                        value={formData.deliveryMemo || ""}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            deliveryMemo: e.target.value,
                          })
                        }
                        placeholder="예: 공동현관 비밀번호 ****"
                        className="h-12 text-sm rounded-lg"
                      />
                    </div>
                  </div>

                  {/* 기본 배송지 설정 */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          isDefault: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="isDefault"
                      className="text-sm text-gray-700"
                    >
                      기본 배송지로 설정
                    </label>
                  </div>

                  {/* 버튼들 */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium"
                    >
                      {isLoading
                        ? "저장 중..."
                        : editingId
                          ? "수정하기"
                          : "추가하기"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      className="flex-1 h-12 text-sm rounded-lg border-gray-300"
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 배송지 추가 버튼 */}
          {!isAdding && addresses.length > 0 && (
            <div className="pt-6">
              <Button
                onClick={() => setIsAdding(true)}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <MapPin className="w-5 h-5 mr-2" />새 배송지 추가
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
