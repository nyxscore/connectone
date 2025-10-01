"use client";

import { useState, useEffect } from "react";
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
  initialTab?: "report" | "block";
}

const reportReasons = [
  "스팸/광고",
  "부적절한 언어 사용",
  "사기/피싱",
  "성희롱/성추행",
  "기타",
];

export function ReportBlockModal({
  isOpen,
  onClose,
  reportedUid,
  reportedNickname,
  onBlocked,
  initialTab = "report",
}: ReportBlockModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [activeTab, setActiveTab] = useState<"report" | "block">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
            {activeTab === "report" ? "신고하기" : "차단하기"}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 탭 버튼 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("report")}
            className={`flex-1 p-4 text-center font-medium transition-colors ${
              activeTab === "report"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
            신고하기
          </button>
          <button
            onClick={() => setActiveTab("block")}
            className={`flex-1 p-4 text-center font-medium transition-colors ${
              activeTab === "block"
                ? "text-gray-600 border-b-2 border-gray-600 bg-gray-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <X className="w-5 h-5 mx-auto mb-1" />
            차단하기
          </button>
        </div>

        {/* 신고 섹션 */}
        {activeTab === "report" && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              신고 사유를 선택해주세요.
            </p>

            <div className="space-y-2">
              {reportReasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    selectedReason === reason
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Button
                onClick={handleReport}
                disabled={isReporting || !selectedReason}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isReporting ? "신고 중..." : "신고하기"}
              </Button>
            </div>
          </div>
        )}

        {/* 차단 섹션 */}
        {activeTab === "block" && (
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <X className="w-5 h-5 text-gray-500" />
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
              className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              {isBlocking ? "차단 중..." : "차단하기"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
