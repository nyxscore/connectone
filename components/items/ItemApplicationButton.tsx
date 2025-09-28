"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import {
  applyForItem,
  getUserApplicationStatus,
  ItemApplication,
} from "../../lib/api/products";
import { CheckCircle, Clock, XCircle, User } from "lucide-react";
import toast from "react-hot-toast";

interface ItemApplicationButtonProps {
  itemId: string;
  sellerUid: string;
  onApplicationChange?: () => void;
}

export function ItemApplicationButton({
  itemId,
  sellerUid,
  onApplicationChange,
}: ItemApplicationButtonProps) {
  const { user } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // 신청 상태 확인
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!user?.uid || !itemId) {
        setCheckingStatus(false);
        return;
      }

      try {
        const result = await getUserApplicationStatus(itemId, user.uid);
        if (result.success) {
          setApplicationStatus(result.status || "none");
        }
      } catch (error) {
        console.error("신청 상태 확인 실패:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkApplicationStatus();
  }, [itemId, user?.uid]);

  // 구매신청
  const handleApply = async () => {
    if (!user?.uid) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (user.uid === sellerUid) {
      toast.error("자신의 상품에는 신청할 수 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const result = await applyForItem(itemId, user.uid);

      if (result.success) {
        toast.success("구매신청이 완료되었습니다!");
        setApplicationStatus("pending");
        onApplicationChange?.();
      } else {
        toast.error(result.error || "구매신청에 실패했습니다.");
      }
    } catch (error) {
      console.error("신청 실패:", error);
      toast.error("구매신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Button disabled className="w-full h-12 text-lg font-semibold">
        <Clock className="w-5 h-5 mr-2 animate-spin" />
        확인 중...
      </Button>
    );
  }

  if (user?.uid === sellerUid) {
    return null; // 판매자는 신청 버튼을 볼 수 없음
  }

  switch (applicationStatus) {
    case "none":
      return (
        <Button
          onClick={handleApply}
          disabled={loading}
          className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
        >
          <User className="w-5 h-5 mr-2" />
          {loading ? "신청 중..." : "구매신청"}
        </Button>
      );

    case "pending":
      return (
        <Button
          disabled
          className="w-full h-12 text-lg font-semibold bg-yellow-100 text-yellow-800 border-yellow-300"
        >
          <Clock className="w-5 h-5 mr-2" />
          구매 신청중...
        </Button>
      );

    case "approved":
      return (
        <Button
          disabled
          className="w-full h-12 text-lg font-semibold bg-green-100 text-green-800 border-green-300"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          승인됨
        </Button>
      );

    case "rejected":
      return (
        <Button
          disabled
          className="w-full h-12 text-lg font-semibold bg-red-100 text-red-800 border-red-300"
        >
          <XCircle className="w-5 h-5 mr-2" />
          거부됨
        </Button>
      );

    default:
      return (
        <Button
          onClick={handleApply}
          disabled={loading}
          className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
        >
          <User className="w-5 h-5 mr-2" />
          {loading ? "신청 중..." : "구매신청"}
        </Button>
      );
  }
}
