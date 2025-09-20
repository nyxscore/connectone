"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { reportUser, blockUser } from "../../lib/chat/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { AlertTriangle, Shield, X } from "lucide-react";
import toast from "react-hot-toast";

interface ReportBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUid: string;
  reportedNickname: string;
  onBlocked?: () => void;
}

const reportReasons = [
  "스팸 또는 광고",
  "부적절한 언어 사용",
  "사기 또는 거짓 정보",
  "괴롭힘 또는 협박",
  "성적 내용",
  "폭력적 내용",
  "기타",
];

export function ReportBlockModal({
  isOpen,
  onClose,
  reportedUid,
  reportedNickname,
  onBlocked,
}: ReportBlockModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  if (!isOpen) return null;

  const handleReport = async () => {
    if (!selectedReason) {
      toast.error("신고 사유를 선택해주세요.");
      return;
    }

    if (!user?.uid) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsReporting(true);
    try {
      const result = await reportUser(
        user.uid,
        reportedUid,
        selectedReason,
        description
      );

      if (result.success) {
        toast.success("신고가 접수되었습니다.");
        onClose();
      } else {
        toast.error(result.error || "신고 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("신고 실패:", error);
      toast.error("신고 처리 중 오류가 발생했습니다.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleBlock = async () => {
    if (
      !confirm(
        `${reportedNickname}님을 차단하시겠습니까?\n차단하면 해당 사용자와의 모든 채팅이 삭제됩니다.`
      )
    ) {
      return;
    }

    if (!user?.uid) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsBlocking(true);
    try {
      const result = await blockUser(user.uid, reportedUid);

      if (result.success) {
        toast.success("사용자가 차단되었습니다.");
        onBlocked?.();
        onClose();
      } else {
        toast.error(result.error || "차단 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("차단 실패:", error);
      toast.error("차단 처리 중 오류가 발생했습니다.");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {reportedNickname}님 신고/차단
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 신고 섹션 */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h4 className="font-medium text-gray-900">신고하기</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신고 사유
              </label>
              <select
                value={selectedReason}
                onChange={e => setSelectedReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">사유를 선택해주세요</option>
                {reportReasons.map(reason => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 설명 (선택사항)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="신고 사유에 대한 자세한 설명을 입력해주세요"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
              />
            </div>

            <Button
              onClick={handleReport}
              disabled={isReporting || !selectedReason}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isReporting ? "신고 중..." : "신고하기"}
            </Button>
          </div>
        </div>

        {/* 차단 섹션 */}
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-orange-500" />
            <h4 className="font-medium text-gray-900">차단하기</h4>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            차단하면 {reportedNickname}님과의 모든 채팅이 삭제되며, 더 이상
            메시지를 주고받을 수 없습니다.
          </p>

          <Button
            onClick={handleBlock}
            disabled={isBlocking}
            variant="outline"
            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            {isBlocking ? "차단 중..." : "차단하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
