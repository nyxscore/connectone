"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { X } from "lucide-react";
import { updateUserProfile } from "../../lib/profile/api";
import toast from "react-hot-toast";

interface EditNicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  userId: string;
  onUpdate: (nickname: string) => void;
}

export function EditNicknameModal({
  isOpen,
  onClose,
  currentNickname,
  userId,
  onUpdate,
}: EditNicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }

    if (nickname === currentNickname) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserProfile(userId, {
        nickname: nickname.trim(),
      });

      if (result.success) {
        toast.success("닉네임이 변경되었습니다.");
        onUpdate(nickname.trim());
        onClose();
      } else {
        toast.error(result.error || "닉네임 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("닉네임 변경 실패:", error);
      toast.error("닉네임 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="text-lg font-semibold text-gray-900">닉네임 수정</h2>
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
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                최대 20자까지 입력 가능합니다.
              </p>
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
                disabled={loading || !nickname.trim()}
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

















