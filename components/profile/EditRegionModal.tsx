"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { X } from "lucide-react";
import { updateUserProfile } from "../../lib/profile/api";
import toast from "react-hot-toast";

interface EditRegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: string;
  userId: string;
  onUpdate: (region: string) => void;
}

export function EditRegionModal({
  isOpen,
  onClose,
  currentRegion,
  userId,
  onUpdate,
}: EditRegionModalProps) {
  const [region, setRegion] = useState(currentRegion);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!region) {
      toast.error("지역을 선택해주세요.");
      return;
    }

    if (region === currentRegion) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserProfile(userId, { region });

      if (result.success) {
        toast.success("지역이 변경되었습니다.");
        onUpdate(region);
        onClose();
      } else {
        toast.error(result.error || "지역 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("지역 변경 실패:", error);
      toast.error("지역 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const regions = [
    "서울특별시",
    "부산광역시",
    "대구광역시",
    "인천광역시",
    "광주광역시",
    "대전광역시",
    "울산광역시",
    "세종특별자치시",
    "경기도",
    "강원도",
    "충청북도",
    "충청남도",
    "전라북도",
    "전라남도",
    "경상북도",
    "경상남도",
    "제주특별자치도",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">지역 수정</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 모달 내용 */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">지역을 선택하세요</option>
                {regions.map(regionOption => (
                  <option key={regionOption} value={regionOption}>
                    {regionOption}
                  </option>
                ))}
              </select>
            </div>

            {/* 버튼들 */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading || !region}
                className="flex-1"
              >
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

















