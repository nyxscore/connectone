import {
  InstrumentCategory,
  ConditionGrade,
  UserGrade,
  GradeInfo,
} from "../types";

// 악기 카테고리 상수
export const INSTRUMENT_CATEGORIES: {
  key: InstrumentCategory;
  label: string;
  icon: string;
}[] = [
  {
    key: "건반",
    label: "건반악기",
    icon: "🎹",
  },
  {
    key: "현악",
    label: "현악기",
    icon: "🎸",
  },
  {
    key: "관악",
    label: "관악기",
    icon: "🎺",
  },
  {
    key: "타악",
    label: "타악기",
    icon: "🥁",
  },
  {
    key: "국악",
    label: "국악기",
    icon: "🎵",
  },
  {
    key: "음향",
    label: "음향기기",
    icon: "🎧",
  },
  {
    key: "특수",
    label: "특수악기",
    icon: "🎻",
  },
  {
    key: "용품",
    label: "기타용품",
    icon: "🎼",
  },
];

// 상태 등급 상수
export const CONDITION_GRADES: {
  key: ConditionGrade;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    key: "A",
    label: "A급",
    description: "사용감이 거의 없음",
    color: "text-blue-600",
  },
  {
    key: "B",
    label: "B급",
    description: "약간의 사용감 있음",
    color: "text-green-600",
  },
  {
    key: "C",
    label: "C급",
    description: "눈에 띄는 사용감",
    color: "text-yellow-600",
  },
  {
    key: "D",
    label: "D급",
    description: "많은 사용감이나 손상",
    color: "text-red-600",
  },
];

// 사용자 등급 상수
export const USER_GRADES: GradeInfo[] = [
  {
    grade: "C",
    name: "브론즈",
    description: "신규 회원",
    color: "text-orange-600",
    requirements: {
      safeTransactions: 0,
      averageRating: 0,
      disputeFree: true,
      totalTrades: 0,
    },
  },
  {
    grade: "B",
    name: "실버",
    description: "활성 회원",
    color: "text-gray-600",
    requirements: {
      safeTransactions: 5,
      averageRating: 4.0,
      disputeFree: true,
      totalTrades: 10,
    },
  },
  {
    grade: "A",
    name: "골드",
    description: "신뢰 회원",
    color: "text-yellow-600",
    requirements: {
      safeTransactions: 20,
      averageRating: 4.5,
      disputeFree: true,
      totalTrades: 50,
    },
  },
];

// 지역 상수
export const REGIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원도",
  "충청북도",
  "충청남도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주도",
];

// API 엔드포인트
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
    PROFILE: "/api/auth/profile",
  },
  PRODUCTS: {
    LIST: "/api/products",
    CREATE: "/api/products",
    DETAIL: (id: string) => `/api/products/${id}`,
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
    SEARCH: "/api/products/search",
  },
  CHAT: {
    ROOMS: "/api/chat/rooms",
    MESSAGES: (roomId: string) => `/api/chat/rooms/${roomId}/messages`,
    CREATE_ROOM: "/api/chat/rooms",
  },
  UPLOAD: {
    IMAGES: "/api/upload/images",
  },
} as const;

// 페이지네이션 기본값
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 50,
} as const;

// 파일 업로드 제한
export const UPLOAD_LIMITS = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

// 배송 방법 상수
export const SHIPPING_TYPES = [
  { key: "direct", label: "직거래" },
  { key: "courier", label: "택배" },
  { key: "pickup", label: "픽업" },
];

// 앱 설정
export const APP_CONFIG = {
  NAME: "ConnecTone",
  DESCRIPTION: "중고 악기 거래 플랫폼",
  VERSION: "1.0.0",
  SUPPORT_EMAIL: "support@connectone.com",
} as const;
