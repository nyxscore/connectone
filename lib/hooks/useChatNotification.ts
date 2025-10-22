"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { subscribeToNotifications } from "@/lib/api/notifications";
import type { Notification } from "@/data/types";

interface ChatNotificationState {
  currentNotification: Notification | null;
  isChatModalOpen: boolean;
  activeChatId: string | null;
}

export function useChatNotification() {
  const { user } = useAuth();
  const [state, setState] = useState<ChatNotificationState>({
    currentNotification: null,
    isChatModalOpen: false,
    activeChatId: null,
  });

  // 채팅 모달이 열려있는지 확인하는 함수
  const checkIfChatModalIsOpen = useCallback(() => {
    // DOM에서 채팅 모달이 열려있는지 확인
    const chatModal = document.querySelector('[data-chat-modal="true"]');
    return !!chatModal;
  }, []);

  // 현재 활성 채팅 ID 확인
  const getActiveChatId = useCallback(() => {
    // URL에서 채팅 ID 추출하거나 다른 방법으로 확인
    const url = window.location.pathname;
    const chatMatch = url.match(/\/chat\/(.+)/);
    return chatMatch ? chatMatch[1] : null;
  }, []);

  // 알림 표시 여부 결정
  const shouldShowNotification = useCallback(
    (notification: Notification) => {
      // 채팅 메시지 알림이 아니면 표시하지 않음
      if (notification.type !== "new_message") return false;

      // 채팅 모달이 열려있으면 표시하지 않음
      if (checkIfChatModalIsOpen()) return false;

      // 현재 활성 채팅과 같은 채팅의 알림이면 표시하지 않음
      const activeChatId = getActiveChatId();
      const notificationChatId = notification.data?.chatId;

      if (activeChatId && notificationChatId === activeChatId) {
        return false;
      }

      return true;
    },
    [checkIfChatModalIsOpen, getActiveChatId]
  );

  // 알림 표시
  const showNotification = useCallback(
    (notification: Notification) => {
      if (shouldShowNotification(notification)) {
        setState(prev => ({
          ...prev,
          currentNotification: notification,
        }));
      }
    },
    [shouldShowNotification]
  );

  // 알림 닫기
  const closeNotification = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentNotification: null,
    }));
  }, []);

  // 알림 확인 (채팅으로 이동)
  const confirmNotification = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentNotification: null,
    }));
  }, []);

  // 채팅 모달 상태 업데이트
  const setChatModalOpen = useCallback((isOpen: boolean, chatId?: string) => {
    setState(prev => ({
      ...prev,
      isChatModalOpen: isOpen,
      activeChatId: chatId || null,
    }));
  }, []);

  // 실시간 알림 구독
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToNotifications(
      user.uid,
      notifications => {
        // 가장 최근의 읽지 않은 채팅 메시지 알림 찾기
        const latestChatNotification = notifications
          .filter(n => n.type === "new_message" && !n.isRead)
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          })[0];

        if (latestChatNotification) {
          showNotification(latestChatNotification);
        }
      },
      error => {
        console.error("채팅 알림 구독 오류:", error);
      }
    );

    return unsubscribe;
  }, [user?.uid, showNotification]);

  // 페이지 변경 감지 (채팅 모달 상태 업데이트)
  useEffect(() => {
    const handleRouteChange = () => {
      const isChatModalOpen = checkIfChatModalIsOpen();
      const activeChatId = getActiveChatId();

      setState(prev => ({
        ...prev,
        isChatModalOpen,
        activeChatId,
      }));
    };

    // 초기 상태 설정
    handleRouteChange();

    // 주기적으로 상태 확인 (채팅 모달이 동적으로 열릴 수 있음)
    const interval = setInterval(handleRouteChange, 1000);

    return () => clearInterval(interval);
  }, [checkIfChatModalIsOpen, getActiveChatId]);

  return {
    currentNotification: state.currentNotification,
    isChatModalOpen: state.isChatModalOpen,
    activeChatId: state.activeChatId,
    showNotification,
    closeNotification,
    confirmNotification,
    setChatModalOpen,
  };
}
