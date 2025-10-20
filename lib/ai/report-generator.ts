/**
 * AI 보컬 분석 - 한국어 리포트 자동 생성
 * 분석 결과를 바탕으로 자연스러운 한국어 리포트를 생성
 */

import { translateEmotionToKorean, getEmotionGroup } from "./emotion-mapping";

interface AnalysisData {
  emotion: {
    label: string;
    scores: Record<string, number>;
  };
  pitch: {
    average_hz: number;
    stddev_hz: number;
    pitch_stability: number;
  };
  tempo: {
    bpm: number;
    confidence: number;
  };
  key: {
    tonic: string;
    mode: string;
    confidence: number;
  };
  transcription: {
    text: string;
    language: string;
    confidence: number;
  };
}

/**
 * 피치 안정성 평가 (이모지 포함)
 */
function evaluatePitchStability(stability: number): {
  text: string;
  emoji: string;
} {
  if (stability >= 0.9) return { text: "완벽해요", emoji: "🌟" };
  if (stability >= 0.75) return { text: "좋아요", emoji: "👍" };
  if (stability >= 0.6) return { text: "괜찮아요", emoji: "😊" };
  if (stability >= 0.4) return { text: "조금 아쉬워요", emoji: "😅" };
  return { text: "연습이 필요해요", emoji: "💪" };
}

/**
 * 피치 범위 평가 (Hz 기준, 이모지 포함)
 */
function evaluatePitchRange(avgHz: number): { text: string; emoji: string } {
  if (avgHz < 100) return { text: "베이스 음역", emoji: "🎸" };
  if (avgHz < 200) return { text: "낮은 음역", emoji: "🎵" };
  if (avgHz < 300) return { text: "중간 음역", emoji: "🎤" };
  if (avgHz < 400) return { text: "높은 음역", emoji: "🎶" };
  return { text: "소프라노 음역", emoji: "🦅" };
}

/**
 * 템포 평가 (이모지 포함)
 */
function evaluateTempo(bpm: number): { text: string; emoji: string } {
  if (bpm < 60) return { text: "느린 발라드", emoji: "🐌" };
  if (bpm < 90) return { text: "차분한 템포", emoji: "🌙" };
  if (bpm < 120) return { text: "편안한 템포", emoji: "☕" };
  if (bpm < 150) return { text: "신나는 템포", emoji: "🎉" };
  return { text: "아주 빠른 템포", emoji: "🚀" };
}

/**
 * 감정 강도 평가 (이모지 포함)
 */
function evaluateEmotionIntensity(topScore: number): {
  text: string;
  emoji: string;
} {
  if (topScore >= 0.8) return { text: "아주 확실하게", emoji: "💯" };
  if (topScore >= 0.6) return { text: "뚜렷하게", emoji: "✨" };
  if (topScore >= 0.4) return { text: "은은하게", emoji: "💫" };
  return { text: "살짝", emoji: "🌸" };
}

/**
 * 피드백 생성 (감정 기반)
 */
function generateEmotionFeedback(
  emotion: string,
  group: "positive" | "negative" | "neutral"
): string {
  const emotionKo = translateEmotionToKorean(emotion);

  if (group === "positive") {
    return `${emotionKo} 감정이 효과적으로 표현되었습니다. 현재의 긍정적인 에너지를 유지하시길 권장합니다.`;
  } else if (group === "negative") {
    return `${emotionKo} 감정이 명확하게 감지됩니다. 감정 전달력이 우수합니다.`;
  } else {
    return `${emotionKo} 톤으로 안정적입니다. 필요시 감정 표현의 폭을 확장해보세요.`;
  }
}

/**
 * 피치 피드백 생성
 */
function generatePitchFeedback(pitch: AnalysisData["pitch"]): string {
  const stability = pitch.pitch_stability;
  const stddev = pitch.stddev_hz;

  if (stability >= 0.8 && stddev < 10) {
    return "음정 컨트롤이 매우 우수합니다.";
  } else if (stability >= 0.6) {
    return "음정이 안정적입니다. 일관성을 더 높이면 향상될 것입니다.";
  } else if (stability >= 0.4) {
    return "음정 안정성 개선이 필요합니다. 호흡 조절 연습을 권장합니다.";
  } else {
    return "음정 트레이닝이 필요합니다. 스케일 연습을 추천합니다.";
  }
}

/**
 * 템포 피드백 생성
 */
function generateTempoFeedback(tempo: AnalysisData["tempo"]): string {
  const bpm = tempo.bpm;
  const confidence = tempo.confidence;

  if (confidence < 0.5) {
    return "자유로운 템포 스타일입니다.";
  }

  if (bpm >= 120 && bpm <= 140) {
    return "적절한 템포입니다.";
  } else if (bpm < 60) {
    return "발라드 계열에 적합한 템포입니다.";
  } else if (bpm > 150) {
    return "업템포 곡에 적합합니다.";
  } else {
    return "템포가 안정적으로 유지됩니다.";
  }
}

/**
 * 종합 권장사항 생성
 */
function generateRecommendation(data: AnalysisData): string {
  const emotionGroup = getEmotionGroup(data.emotion.label);
  const stability = data.pitch.pitch_stability;

  const recommendations: string[] = [];

  // 음정 관련 권장사항
  if (stability < 0.6) {
    recommendations.push("음정 연습");
  }

  // 감정 관련 권장사항
  if (
    emotionGroup === "neutral" &&
    data.emotion.scores[data.emotion.label] < 0.5
  ) {
    recommendations.push("감정 표현 강화");
  }

  // 템포 관련 권장사항
  if (data.tempo.confidence < 0.5) {
    recommendations.push("리듬감 향상");
  }

  if (recommendations.length === 0) {
    return "전반적으로 우수한 수준입니다.";
  }

  return `권장 사항: ${recommendations.join(", ")}`;
}

/**
 * 한국어 리포트 생성 (메인 함수)
 * @param data - 분석 결과 데이터
 * @returns 2-3문장의 자연스러운 한국어 리포트
 */
export function generateKoreanReport(data: AnalysisData): string {
  const emotionKo = translateEmotionToKorean(data.emotion.label);
  const emotionGroup = getEmotionGroup(data.emotion.label);
  const topScore = data.emotion.scores[data.emotion.label] || 0;
  const intensity = evaluateEmotionIntensity(topScore);

  const pitchRange = evaluatePitchRange(data.pitch.average_hz);
  const pitchStability = evaluatePitchStability(data.pitch.pitch_stability);
  const tempoDesc = evaluateTempo(data.tempo.bpm);

  // 감정 이모지 (딱 하나만!)
  let emotionEmoji = "";
  if (emotionGroup === "positive") emotionEmoji = "😊";
  else if (emotionGroup === "negative") emotionEmoji = "😔";
  else emotionEmoji = "😌";

  // 등급 이모지 (딱 하나만!)
  let gradeEmoji = "";
  if (data.pitch.pitch_stability >= 0.8) gradeEmoji = "⭐";
  else if (data.pitch.pitch_stability >= 0.6) gradeEmoji = "✓";
  else gradeEmoji = "→";

  // 문장 1: 감정 분석
  const sentence1 = `${emotionEmoji} 이 보컬은 **${emotionKo}** 감정을 ${intensity.text} 표현하고 있습니다 (신뢰도 ${(topScore * 100).toFixed(0)}%).`;

  // 문장 2: 음정 및 템포
  const sentence2 = `${gradeEmoji} ${pitchRange.text}(평균 ${data.pitch.average_hz.toFixed(1)}Hz)에서 ${pitchStability.text} 음정을 유지하며, ${tempoDesc.text}(${data.tempo.bpm}BPM)로 진행됩니다.`;

  // 문장 3: 피드백 및 권장사항
  const pitchFeedback = generatePitchFeedback(data.pitch);
  const recommendation = generateRecommendation(data);
  const sentence3 = `${pitchFeedback} ${recommendation}`;

  return `${sentence1}\n\n${sentence2}\n\n${sentence3}`;
}

/**
 * 짧은 요약 생성 (1문장)
 * @param data - 분석 결과 데이터
 * @returns 1문장 요약
 */
export function generateShortSummary(data: AnalysisData): string {
  const emotionKo = translateEmotionToKorean(data.emotion.label);
  const pitchStability = evaluatePitchStability(data.pitch.pitch_stability);

  return `${emotionKo} 감정의 ${pitchStability.text} 보컬 (${data.pitch.average_hz.toFixed(0)}Hz, ${data.tempo.bpm}BPM)`;
}

/**
 * 상세 리포트 생성 (여러 섹션)
 * @param data - 분석 결과 데이터
 * @returns 섹션별 상세 리포트
 */
export function generateDetailedReport(data: AnalysisData): {
  emotion: string;
  pitch: string;
  tempo: string;
  overall: string;
} {
  const emotionKo = translateEmotionToKorean(data.emotion.label);
  const emotionGroup = getEmotionGroup(data.emotion.label);

  return {
    emotion: generateEmotionFeedback(data.emotion.label, emotionGroup),
    pitch: generatePitchFeedback(data.pitch),
    tempo: generateTempoFeedback(data.tempo),
    overall: generateRecommendation(data),
  };
}
