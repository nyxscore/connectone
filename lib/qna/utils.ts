import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// 날짜 포맷팅
export function formatQaDate(date: any): string {
  if (!date) return "";
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
}

// 상세 날짜 포맷팅
export function formatQaDetailedDate(date: any): string {
  if (!date) return "";
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

// 태그 색상 생성
export function getTagColor(tag: string): string {
  const colors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800",
    "bg-yellow-100 text-yellow-800",
    "bg-red-100 text-red-800",
    "bg-gray-100 text-gray-800",
  ];

  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// 질문 제목 요약 (긴 제목 자르기)
export function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + "...";
}

// 질문 내용 요약 (HTML 태그 제거 후 자르기)
export function truncateContent(
  content: string,
  maxLength: number = 150
): string {
  // HTML 태그 제거
  const plainText = content.replace(/<[^>]*>/g, "");
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + "...";
}

// 조회수 포맷팅
export function formatViews(views: number): string {
  if (views < 1000) return views.toString();
  if (views < 10000) return `${(views / 1000).toFixed(1)}k`;
  return `${Math.floor(views / 1000)}k`;
}

// 좋아요 수 포맷팅
export function formatLikes(likes: number): string {
  if (likes < 1000) return likes.toString();
  if (likes < 10000) return `${(likes / 1000).toFixed(1)}k`;
  return `${Math.floor(likes / 1000)}k`;
}

// 태그 검증
export function validateTags(tags: string[]): {
  valid: boolean;
  error?: string;
} {
  if (tags.length === 0) {
    return { valid: false, error: "최소 1개의 태그가 필요합니다." };
  }

  if (tags.length > 5) {
    return { valid: false, error: "최대 5개의 태그만 선택할 수 있습니다." };
  }

  for (const tag of tags) {
    if (tag.length < 2) {
      return { valid: false, error: "태그는 최소 2글자 이상이어야 합니다." };
    }

    if (tag.length > 20) {
      return { valid: false, error: "태그는 최대 20글자까지 가능합니다." };
    }

    if (!/^[가-힣a-zA-Z0-9\s]+$/.test(tag)) {
      return {
        valid: false,
        error: "태그는 한글, 영문, 숫자, 공백만 사용할 수 있습니다.",
      };
    }
  }

  return { valid: true };
}

// 질문 제목 검증
export function validateTitle(title: string): {
  valid: boolean;
  error?: string;
} {
  if (!title.trim()) {
    return { valid: false, error: "제목을 입력해주세요." };
  }

  if (title.length < 5) {
    return { valid: false, error: "제목은 최소 5글자 이상이어야 합니다." };
  }

  if (title.length > 100) {
    return { valid: false, error: "제목은 최대 100글자까지 가능합니다." };
  }

  return { valid: true };
}

// 질문 내용 검증
export function validateContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content.trim()) {
    return { valid: false, error: "내용을 입력해주세요." };
  }

  if (content.length < 10) {
    return { valid: false, error: "내용은 최소 10글자 이상이어야 합니다." };
  }

  if (content.length > 5000) {
    return { valid: false, error: "내용은 최대 5000글자까지 가능합니다." };
  }

  return { valid: true };
}

// 답변 내용 검증
export function validateAnswerContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content.trim()) {
    return { valid: false, error: "답변을 입력해주세요." };
  }

  if (content.length < 5) {
    return { valid: false, error: "답변은 최소 5글자 이상이어야 합니다." };
  }

  if (content.length > 2000) {
    return { valid: false, error: "답변은 최대 2000글자까지 가능합니다." };
  }

  return { valid: true };
}

// 인기 태그 추출 (질문 목록에서)
export function extractPopularTags(
  questions: any[]
): { tag: string; count: number }[] {
  const tagCount: { [key: string]: number } = {};

  questions.forEach(question => {
    question.tags?.forEach((tag: string) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
