import { Timestamp } from "firebase/firestore";

export type UserGrade = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export interface UserProfile {
  uid: string;
  nickname: string;
  region: string; // 시/군/구
  photoURL?: string; // 아바타
  grade: UserGrade; // 등급
  tradesCount: number; // 총 거래 횟수
  reviewsCount: number; // 받은 후기 수
  introShort?: string; // 한 줄 소개
  introLong?: string; // 자기소개(상세)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProfileUpdateData {
  nickname?: string;
  region?: string;
  photoURL?: string;
  introShort?: string;
  introLong?: string;
}

export interface TradeItem {
  id: string;
  itemId: string;
  brand: string;
  model: string;
  price: number;
  thumbnail?: string;
  state: "released" | "sold" | "refunded";
  createdAt: Timestamp;
  partnerUid: string;
  partnerNickname: string;
}

export interface GradeInfo {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

export const GRADE_LABELS: Record<UserGrade, string> = {
  C: "Chord",
  D: "Duo",
  E: "Ensemble",
  F: "Forte",
  G: "Grand",
  A: "Allegro",
  B: "Bravura",
};

export const GRADE_COLORS: Record<UserGrade, GradeInfo> = {
  C: {
    label: "Chord",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    description: "신규 회원",
  },
  D: {
    label: "Duo",
    color: "text-sky-600",
    bgColor: "bg-sky-100",
    description: "거래 시작",
  },
  E: {
    label: "Ensemble",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    description: "활발한 거래",
  },
  F: {
    label: "Forte",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "신뢰할 수 있는 판매자",
  },
  G: {
    label: "Grand",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    description: "전문 판매자",
  },
  A: {
    label: "Allegro",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    description: "우수 판매자",
  },
  B: {
    label: "Bravura",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    description: "최고 등급",
  },
};
