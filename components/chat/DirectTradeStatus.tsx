"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, ArrowRight, User } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  DirectTradeState,
  DirectTradeStatus,
  DirectTradeStateMachine,
} from "@/lib/chat/directTradeTypes";
import {
  getDirectTradeState,
  updateDirectTradeState,
  subscribeToDirectTradeState,
} from "@/lib/chat/directTradeApi";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";

interface DirectTradeStatusProps {
  chatId: string;
  userRole: "buyer" | "seller";
  onStatusChange?: (newStatus: DirectTradeStatus) => void;
}

export function DirectTradeStatus({
  chatId,
  userRole,
  onStatusChange,
}: DirectTradeStatusProps) {
  const { user } = useAuth();
  const [state, setState] = useState<DirectTradeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 상태 로드
  useEffect(() => {
    const loadState = async () => {
      try {
        const result = await getDirectTradeState(chatId);
        if (result.success && result.state) {
          setState(result.state);
        }
      } catch (error) {
        console.error("직거래 상태 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, [chatId]);

  // 실시간 상태 구독
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToDirectTradeState(
      chatId,
      newState => {
        setState(newState);
        if (newState && onStatusChange) {
          onStatusChange(newState.status);
        }
      },
      error => {
        console.error("직거래 상태 구독 오류:", error);
      }
    );

    return unsubscribe;
  }, [chatId, onStatusChange]);

  // 상태 업데이트
  const handleStatusUpdate = async (newStatus: DirectTradeStatus) => {
    if (!user?.uid || !state) return;

    setUpdating(true);
    try {
      const result = await updateDirectTradeState(
        chatId,
        newStatus,
        user.uid,
        userRole,
        `${DirectTradeStateMachine.getStatusDisplayName(newStatus)}로 변경됨`
      );

      if (result.success) {
        // 시스템 메시지 전송
        try {
          const { sendMessage } = await import("@/lib/chat/api");
          const statusMessage = `🔄 거래 상태가 "${DirectTradeStateMachine.getStatusDisplayName(newStatus)}"로 변경되었습니다.`;

          await sendMessage({
            chatId: chatId,
            senderUid: "system",
            content: statusMessage,
          });
        } catch (messageError) {
          console.error("시스템 메시지 전송 실패:", messageError);
        }

        toast.success("거래 상태가 업데이트되었습니다.");
      } else {
        toast.error(result.error || "상태 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("상태 업데이트 실패:", error);
      toast.error("상태 업데이트에 실패했습니다.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!state) {
    return null;
  }

  const currentStatus = state.status;
  const validTransitions = DirectTradeStateMachine.getValidTransitions(
    currentStatus,
    userRole
  );
  const canUpdate = validTransitions.length > 0 && !updating;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* 현재 상태 표시 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${DirectTradeStateMachine.getStatusColor(currentStatus)}`}
          >
            {DirectTradeStateMachine.getStatusDisplayName(currentStatus)}
          </div>
          <div className="text-sm text-gray-500">
            {DirectTradeStateMachine.getStatusDescription(currentStatus)}
          </div>
        </div>

        {state.updatedBy && (
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <User className="w-3 h-3" />
            <span>{state.updatedBy === user?.uid ? "나" : "상대방"}</span>
          </div>
        )}
      </div>

      {/* 상태 진행 단계 */}
      <div className="flex items-center justify-between mb-4">
        {["waiting", "trading", "completed"].map((status, index) => {
          const isActive = status === currentStatus;
          const isCompleted =
            ["waiting", "trading", "completed"].indexOf(currentStatus) > index;

          return (
            <div key={status} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isActive ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>

              <div className="ml-2 text-sm">
                <div
                  className={`font-medium ${
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {DirectTradeStateMachine.getStatusDisplayName(
                    status as DirectTradeStatus
                  )}
                </div>
              </div>

              {index < 2 && (
                <ArrowRight className="w-4 h-4 text-gray-300 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* 상태 업데이트 버튼들 */}
      <AnimatePresence>
        {canUpdate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="text-sm text-gray-600 mb-2">
              상태를 변경할 수 있습니다:
            </div>
            <div className="flex space-x-2">
              {validTransitions.map(status => (
                <Button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    DirectTradeStateMachine.getStatusDisplayName(status)
                  )}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메모 표시 */}
      {state.notes && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
          {state.notes}
        </div>
      )}
    </div>
  );
}
