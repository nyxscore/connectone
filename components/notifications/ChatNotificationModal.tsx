"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Package, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { markNotificationAsRead } from "@/lib/api/notifications";
import type { Notification } from "@/data/types";

interface ChatNotificationModalProps {
  notification: Notification | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ChatNotificationModal({
  notification,
  onClose,
  onConfirm,
}: ChatNotificationModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);

      // 10초 후 자동으로 사라지게 하기
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = async () => {
    if (!user?.uid || !notification) return;

    // 알림 읽음 처리
    try {
      await markNotificationAsRead(notification.id, user.uid);
    } catch (error) {
      console.error("알림 읽음 처리 오류:", error);
    }

    // 채팅 페이지로 이동
    if (notification.link) {
      router.push(notification.link);
    }

    onConfirm();
    handleClose();
  };

  if (!notification || !isVisible) return null;

  const { data } = notification;
  const productTitle = data?.productTitle || "상품";
  const senderName = data?.senderName || "사용자";
  const messagePreview = data?.messagePreview || "";
  const productPrice = data?.productPrice || 0;
  const productImage = data?.productImage;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  새로운 채팅 메시지
                </h3>
                <p className="text-sm text-gray-500">
                  상품 문의가 도착했습니다
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 상품 정보 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={productTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {productTitle}
                </h4>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">
                    {senderName}님이 문의하셨습니다
                  </p>
                  {productPrice > 0 && (
                    <span className="text-sm font-semibold text-blue-600">
                      {productPrice.toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 메시지 미리보기 */}
          <div className="p-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 line-clamp-2">
                  {messagePreview}
                </p>
              </div>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex space-x-2 p-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              확인
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
