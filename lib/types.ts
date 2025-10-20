export interface User {
  uid: string;
  username: string;
  email: string;
  nickname: string;
  region: string;
  grade: "C" | "D" | "E" | "F" | "G" | "A" | "B";
  tradesCount: number;
  reviewsCount: number;
  points?: number; // 포인트 잔액
  createdAt: Date;
  updatedAt: Date;
}

// 포인트 트랜잭션 인터페이스
export interface PointTransaction {
  id?: string;
  userId: string;
  amount: number; // 양수: 적립, 음수: 차감
  type: "signup" | "trade_complete" | "review" | "purchase" | "admin"; // 적립/차감 유형
  description: string; // 설명
  relatedId?: string; // 관련 거래/상품 ID
  balance: number; // 거래 후 잔액
  createdAt: Date;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  nickname: string;
  region: string;
  agreeTerms: boolean;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
}
