import { Timestamp } from "firebase/firestore";

export interface Chat {
  id: string; // `${buyerUid}_${sellerUid}_${itemId}`
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  lastMessage: string;
  updatedAt: Timestamp;
  deletedByBuyer?: boolean; // 구매자가 삭제했는지 여부
  deletedBySeller?: boolean; // 판매자가 삭제했는지 여부
  deletedAt?: Timestamp; // 삭제 시간
}

export interface Message {
  id: string;
  chatId: string;
  senderUid: string;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp;
  readBy: string[]; // 읽음 처리
}

export interface ChatWithDetails extends Chat {
  // 채팅 목록에서 사용할 추가 정보
  otherUser: {
    uid: string;
    nickname: string;
    profileImage?: string;
  };
  item: {
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
  };
  unreadCount: number;
}

export interface CreateChatData {
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  firstMessage: string;
}

export interface SendMessageData {
  chatId: string;
  senderUid: string;
  content: string;
  imageUrl?: string;
}
