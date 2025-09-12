export interface User {
  uid: string;
  username: string;
  nickname: string;
  region: string;
  grade: "C" | "D" | "E" | "F" | "G" | "A" | "B";
  tradesCount: number;
  reviewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface SignUpData {
  username: string;
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
