"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Plus } from "lucide-react";
import { Button } from "../ui/Button";
import { getShippingAddresses } from "../../lib/api/shipping-address";
import { ShippingAddress } from "../../lib/schemas";
import ShippingAddressModal from "../profile/ShippingAddressModal";

interface ShippingAddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onAddressSelect: (address: ShippingAddress) => void;
}

export default function ShippingAddressSelectionModal({
  isOpen,
  onClose,
  userId,
  onAddressSelect,
}: ShippingAddressSelectionModalProps) {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddress, setSelectedAddress] =
    useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // 배송지 목록 로드
  const loadAddresses = async () => {
    try {
      setLoading(true);
      const result = await getShippingAddresses(userId);
      if (result.success && result.addresses) {
        setAddresses(result.addresses);
        // 기본 배송지가 있으면 선택
        const defaultAddress = result.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error("배송지 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen, userId]);

  const handleConfirm = () => {
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
    }
  };

  const handleAddressAdded = () => {
    setShowAddModal(false);
    loadAddresses(); // 배송지 목록 새로고침
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">배송지 선택</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">배송지를 불러오는 중...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">등록된 배송지가 없습니다.</p>
                <p className="text-sm text-gray-500 mb-6">
                  배송지를 먼저 등록해주세요.
                </p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />새 배송지 추가
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {addresses.map((address, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddress === address
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {address.recipientName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {address.phoneNumber}
                            </span>
                            {address.isDefault && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                기본
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>{address.address}</div>
                            {address.deliveryMemo && (
                              <div className="text-gray-500 mt-1">
                                배송 메모: {address.deliveryMemo}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-2">
                          {selectedAddress === address && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1"
                    disabled={!selectedAddress}
                  >
                    선택 완료
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />새 배송지 추가
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 배송지 추가 모달 */}
      {showAddModal && (
        <ShippingAddressModal
          isOpen={showAddModal}
          onClose={handleAddressAdded}
          userId={userId}
        />
      )}
    </>
  );
}
