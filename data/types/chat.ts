// 채팅 관련 타입 정의

export interface Chat {
  id: string;
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  lastMessage?: string;
  updatedAt: any; // Firebase Timestamp
  createdAt: any; // Firebase Timestamp
  buyerUnreadCount?: number;
  sellerUnreadCount?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderUid: string;
  content: string;
  type: MessageType; // 메시지 타입 (text, image, system)
  imageUrl?: string;
  createdAt: any; // Firebase Timestamp
  readBy: string[]; // 읽은 사용자 UID 배열
}

export interface CreateChatInput {
  itemId: string;
  buyerUid: string;
  sellerUid: string;
}

export interface CreateMessageInput {
  chatId: string;
  senderUid: string;
  content: string;
  imageUrl?: string;
}

export interface ChatWithDetails extends Chat {
  // 채팅 목록에서 사용할 추가 정보
  itemTitle?: string;
  itemImage?: string;
  itemPrice?: number;
  otherUserUid?: string;
  otherUserNickname?: string;
  otherUserAvatar?: string;
  unreadCount?: number;
}

export interface MessageWithSender extends Message {
  // 메시지 목록에서 사용할 추가 정보
  senderNickname?: string;
  senderAvatar?: string;
  isRead?: boolean;
}

// 채팅 상태
export type ChatStatus = "active" | "archived" | "blocked";

// 메시지 타입
export type MessageType = "text" | "image" | "system";

// 읽음 상태 업데이트
export interface MarkAsReadInput {
  chatId: string;
  userId: string;
  messageId?: string; // 특정 메시지까지 읽음 처리
}

// 채팅 필터 옵션
export interface ChatFilters {
  status?: ChatStatus;
  itemId?: string;
  otherUserUid?: string;
}

// 채팅 정렬 옵션
export type ChatSortBy = "updatedAt" | "createdAt";
export type ChatSortOrder = "desc" | "asc";

// 실시간 채팅 이벤트
export interface ChatEvent {
  type: "message" | "typing" | "read" | "user_joined" | "user_left";
  chatId: string;
  data: any;
}

// 타이핑 상태
export interface TypingStatus {
  userId: string;
  isTyping: boolean;
  timestamp: any;
}
