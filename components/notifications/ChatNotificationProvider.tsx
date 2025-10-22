"use client";

import React, { createContext, useContext } from "react";
import { useChatNotification } from "@/lib/hooks/useChatNotification";
import { ChatNotificationModal } from "./ChatNotificationModal";

interface ChatNotificationContextType {
  currentNotification: any;
  isChatModalOpen: boolean;
  activeChatId: string | null;
  showNotification: (notification: any) => void;
  closeNotification: () => void;
  confirmNotification: () => void;
  setChatModalOpen: (isOpen: boolean, chatId?: string) => void;
}

const ChatNotificationContext =
  createContext<ChatNotificationContextType | null>(null);

export function useChatNotificationContext() {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error(
      "useChatNotificationContext must be used within ChatNotificationProvider"
    );
  }
  return context;
}

interface ChatNotificationProviderProps {
  children: React.ReactNode;
}

export function ChatNotificationProvider({
  children,
}: ChatNotificationProviderProps) {
  const chatNotification = useChatNotification();

  return (
    <ChatNotificationContext.Provider value={chatNotification}>
      {children}
      <ChatNotificationModal
        notification={chatNotification.currentNotification}
        onClose={chatNotification.closeNotification}
        onConfirm={chatNotification.confirmNotification}
      />
    </ChatNotificationContext.Provider>
  );
}
