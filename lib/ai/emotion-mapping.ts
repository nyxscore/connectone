/**
 * AI 보컬 분석 - 감정 라벨 한국어 매핑
 * 영어 감정 라벨을 한국어로 변환하는 유틸리티
 */

// 감정 라벨 매핑 테이블
export const EMOTION_LABELS_KO: Record<string, string> = {
  // 기본 감정
  happy: "행복",
  sad: "슬픔",
  angry: "분노",
  neutral: "중립",
  calm: "차분함",
  surprised: "놀람",
  fearful: "두려움",
  disgusted: "혐오",

  // 추가 감정
  excited: "흥분",
  anxious: "불안",
  confident: "자신감",
  tired: "피곤함",
  energetic: "활기참",
  peaceful: "평화로움",
  tense: "긴장",
  relaxed: "편안함",
  joyful: "기쁨",
  melancholy: "우울",
  passionate: "열정적",
  bored: "지루함",

  // 음성 특성
  warm: "따뜻함",
  cold: "차가움",
  bright: "밝음",
  dark: "어두움",
  soft: "부드러움",
  harsh: "거침",
};

// 감정 그룹 (차트 색상 매핑용)
export const EMOTION_GROUPS: Record<string, string[]> = {
  positive: [
    "happy",
    "excited",
    "joyful",
    "confident",
    "energetic",
    "peaceful",
    "relaxed",
    "warm",
    "bright",
  ],
  negative: [
    "sad",
    "angry",
    "fearful",
    "disgusted",
    "anxious",
    "tired",
    "tense",
    "melancholy",
    "bored",
    "cold",
    "dark",
  ],
  neutral: ["neutral", "calm", "soft"],
};

// 감정별 색상 (차트용)
export const EMOTION_COLORS: Record<string, string> = {
  happy: "#10b981", // green
  sad: "#3b82f6", // blue
  angry: "#ef4444", // red
  neutral: "#6b7280", // gray
  calm: "#8b5cf6", // purple
  surprised: "#f59e0b", // amber
  fearful: "#6366f1", // indigo
  disgusted: "#84cc16", // lime
  excited: "#ec4899", // pink
  anxious: "#f97316", // orange
  confident: "#14b8a6", // teal
  tired: "#64748b", // slate
  energetic: "#eab308", // yellow
  peaceful: "#06b6d4", // cyan
  tense: "#dc2626", // red-600
  relaxed: "#22c55e", // green-500
  joyful: "#fbbf24", // amber-400
  melancholy: "#4f46e5", // indigo-600
  passionate: "#db2777", // pink-600
  bored: "#9ca3af", // gray-400
};

/**
 * 영어 감정 라벨을 한국어로 변환
 * @param emotionEn - 영어 감정 라벨
 * @returns 한국어 감정 라벨
 */
export function translateEmotionToKorean(emotionEn: string): string {
  const normalized = emotionEn.toLowerCase().trim();
  return EMOTION_LABELS_KO[normalized] || emotionEn; // fallback to original
}

/**
 * 감정 점수 객체를 한국어 라벨로 변환
 * @param scores - { happy: 0.8, sad: 0.2, ... }
 * @returns { "행복": 0.8, "슬픔": 0.2, ... }
 */
export function translateEmotionScores(
  scores: Record<string, number>
): Record<string, number> {
  const translatedScores: Record<string, number> = {};

  for (const [emotionEn, score] of Object.entries(scores)) {
    const emotionKo = translateEmotionToKorean(emotionEn);
    translatedScores[emotionKo] = score;
  }

  return translatedScores;
}

/**
 * 감정 그룹 판별 (positive/negative/neutral)
 * @param emotionEn - 영어 감정 라벨
 * @returns 감정 그룹
 */
export function getEmotionGroup(
  emotionEn: string
): "positive" | "negative" | "neutral" {
  const normalized = emotionEn.toLowerCase().trim();

  if (EMOTION_GROUPS.positive.includes(normalized)) return "positive";
  if (EMOTION_GROUPS.negative.includes(normalized)) return "negative";
  return "neutral";
}

/**
 * 감정별 색상 가져오기
 * @param emotionEn - 영어 감정 라벨
 * @returns HEX 색상 코드
 */
export function getEmotionColor(emotionEn: string): string {
  const normalized = emotionEn.toLowerCase().trim();
  return EMOTION_COLORS[normalized] || "#6b7280"; // default gray
}

/**
 * 감정 점수를 정렬하여 상위 N개 반환
 * @param scores - 감정 점수 객체
 * @param topN - 상위 N개 (기본값: 5)
 * @returns 정렬된 감정 배열
 */
export function getTopEmotions(
  scores: Record<string, number>,
  topN: number = 5
): Array<{ emotion: string; emotionKo: string; score: number; color: string }> {
  return Object.entries(scores)
    .map(([emotion, score]) => ({
      emotion,
      emotionKo: translateEmotionToKorean(emotion),
      score,
      color: getEmotionColor(emotion),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}


