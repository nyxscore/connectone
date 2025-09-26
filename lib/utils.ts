import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 한국 지역 목록
export const KOREAN_REGIONS = [
  { value: "서울특별시", label: "서울특별시" },
  { value: "부산광역시", label: "부산광역시" },
  { value: "대구광역시", label: "대구광역시" },
  { value: "인천광역시", label: "인천광역시" },
  { value: "광주광역시", label: "광주광역시" },
  { value: "대전광역시", label: "대전광역시" },
  { value: "울산광역시", label: "울산광역시" },
  { value: "세종특별자치시", label: "세종특별자치시" },
  { value: "경기도", label: "경기도" },
  { value: "강원도", label: "강원도" },
  { value: "충청북도", label: "충청북도" },
  { value: "충청남도", label: "충청남도" },
  { value: "전라북도", label: "전라북도" },
  { value: "전라남도", label: "전라남도" },
  { value: "경상북도", label: "경상북도" },
  { value: "경상남도", label: "경상남도" },
  { value: "제주특별자치도", label: "제주특별자치도" },
];

// 이메일 유효성 검사
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 유효성 검사
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};









