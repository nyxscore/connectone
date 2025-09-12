// 비밀번호 유효성 검사 유틸리티

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // 길이 검사 (8자 이상)
  if (password.length < 8) {
    errors.push("비밀번호는 8자 이상이어야 합니다.");
  }

  // 영문 포함 검사
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("비밀번호는 영문을 포함해야 합니다.");
  }

  // 숫자 포함 검사
  if (!/\d/.test(password)) {
    errors.push("비밀번호는 숫자를 포함해야 합니다.");
  }

  // 특수문자 포함 검사
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
  if (!specialCharRegex.test(password)) {
    errors.push("비밀번호는 특수문자를 포함해야 합니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUsername(username: string): PasswordValidationResult {
  const errors: string[] = [];

  // 길이 검사 (4-20자)
  if (username.length < 4) {
    errors.push("아이디는 4자 이상이어야 합니다.");
  }
  if (username.length > 20) {
    errors.push("아이디는 20자 이하여야 합니다.");
  }

  // 소문자, 숫자, 언더스코어만 허용
  const usernameRegex = /^[a-z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    errors.push("아이디는 소문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.");
  }

  // 첫 글자는 소문자 또는 숫자
  const firstCharRegex = /^[a-z0-9]/;
  if (!firstCharRegex.test(username)) {
    errors.push("아이디는 소문자 또는 숫자로 시작해야 합니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 비밀번호 강도 측정
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  // 길이 점수
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // 특수문자 점수
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) score += 1;

  // 대소문자 점수
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;

  // 숫자 점수
  if (/\d/.test(password)) score += 1;

  const strengthMap = [
    { label: "매우 약함", color: "text-red-500" },
    { label: "약함", color: "text-orange-500" },
    { label: "보통", color: "text-yellow-500" },
    { label: "강함", color: "text-blue-500" },
    { label: "매우 강함", color: "text-green-500" },
  ];

  return {
    score,
    label: strengthMap[Math.min(score, 4)].label,
    color: strengthMap[Math.min(score, 4)].color,
  };
}
