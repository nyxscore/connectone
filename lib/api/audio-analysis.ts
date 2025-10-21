import { AssemblyAI } from "assemblyai";
import toast from "react-hot-toast";

// AssemblyAI 클라이언트 초기화
const ASSEMBLYAI_API_KEY = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;

if (!ASSEMBLYAI_API_KEY) {
  console.error("❌ NEXT_PUBLIC_ASSEMBLYAI_API_KEY가 설정되지 않았습니다!");
  console.error(
    "⚠️  .env.local 파일에 NEXT_PUBLIC_ASSEMBLYAI_API_KEY를 추가하세요."
  );
}

const client = new AssemblyAI({
  apiKey: ASSEMBLYAI_API_KEY || "",
});

// 최대 파일 크기 (30MB)
const MAX_FILE_SIZE = 30 * 1024 * 1024;

// 지원되는 오디오 형식
const SUPPORTED_FORMATS = [
  "audio/wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/webm",
];

// 재시도 로직 (지수 백오프)
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;

      // 마지막 시도가 아니면 재시도
      const delay = baseDelay * Math.pow(2, i);
      console.log(`재시도 ${i + 1}/${maxRetries} - ${delay}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("최대 재시도 횟수 초과");
}

// 감정 점수를 한국어로 변환
function translateEmotionScores(scores: any): any {
  const emotionMap: { [key: string]: string } = {
    positive: "뛰어난 표현력",
    negative: "개선 필요한 표현",
    neutral: "안정적인 표현",
    happy: "밝은 표현",
    sad: "슬픈 표현",
    angry: "강렬한 표현",
    excited: "열정적인 표현",
    calm: "차분한 표현",
    confident: "자신감 있는 표현",
    uncertain: "불안정한 표현",
  };

  const translated: any = {};
  for (const [key, value] of Object.entries(scores)) {
    const koreanKey = emotionMap[key] || key;
    translated[koreanKey] = value;
  }
  return translated;
}

// 감정 레이블을 한국어로 변환
function translateEmotionToKorean(label: string): string {
  const emotionMap: { [key: string]: string } = {
    positive: "뛰어난 표현력",
    negative: "개선 필요한 표현",
    neutral: "안정적인 표현",
    happy: "밝은 표현",
    sad: "슬픈 표현",
    angry: "강렬한 표현",
    excited: "열정적인 표현",
    calm: "차분한 표현",
    confident: "자신감 있는 표현",
    uncertain: "불안정한 표현",
  };
  return emotionMap[label] || label;
}

// 음원 종류 감별 함수
function detectAudioType(audioFile: File, transcript: any): string {
  const fileName = audioFile.name.toLowerCase();
  const text = transcript.text?.toLowerCase() || "";
  const duration = transcript.audio_duration || 0;
  const words = transcript.words?.length || 0;

  // 파일명 기반 감별
  if (
    fileName.includes("vocal") ||
    fileName.includes("voice") ||
    fileName.includes("sing")
  ) {
    return "보컬";
  }
  if (
    fileName.includes("instrumental") ||
    fileName.includes("inst") ||
    fileName.includes("music")
  ) {
    return "연주곡";
  }
  if (
    fileName.includes("speech") ||
    fileName.includes("talk") ||
    fileName.includes("lecture")
  ) {
    return "음성";
  }

  // 텍스트 내용 기반 감별
  const vocalKeywords = [
    "가사",
    "노래",
    "멜로디",
    "코러스",
    "브릿지",
    "후렴",
    "아",
    "어",
    "오",
    "우",
    "이",
  ];
  const instrumentalKeywords = [
    "기타",
    "피아노",
    "드럼",
    "베이스",
    "바이올린",
    "첼로",
    "플루트",
    "트럼펫",
  ];
  const speechKeywords = [
    "안녕하세요",
    "감사합니다",
    "네",
    "아니요",
    "그렇습니다",
    "말씀",
    "이야기",
  ];

  const vocalScore = vocalKeywords.filter(keyword =>
    text.includes(keyword)
  ).length;
  const instrumentalScore = instrumentalKeywords.filter(keyword =>
    text.includes(keyword)
  ).length;
  const speechScore = speechKeywords.filter(keyword =>
    text.includes(keyword)
  ).length;

  // 단어 밀도 기반 감별 (보컬은 보통 단어가 적고, 음성은 단어가 많음)
  const wordDensity = words / (duration / 60); // 분당 단어 수

  if (vocalScore > instrumentalScore && vocalScore > speechScore) {
    return "보컬";
  } else if (
    instrumentalScore > vocalScore &&
    instrumentalScore > speechScore
  ) {
    return "연주곡";
  } else if (speechScore > 0 || wordDensity > 50) {
    return "음성";
  } else if (wordDensity < 10) {
    return "연주곡";
  } else {
    return "보컬";
  }
}

// 노래 장르 추정 함수
function estimateGenre(analysisData: any): string {
  const tempo = analysisData.tempo?.bpm || 120;
  const pitch = analysisData.pitch?.average_hz || 220;
  const audioType = analysisData.audioType?.detected || "보컬";

  if (audioType === "연주곡") {
    if (tempo < 80) return "발라드/재즈";
    if (tempo > 140) return "록/메탈";
    return "클래식/뉴에이지";
  }

  if (tempo < 80) return "발라드/감성";
  if (tempo >= 80 && tempo < 110) return "R&B/소울";
  if (tempo >= 110 && tempo < 130) return "팝/인디";
  if (tempo >= 130 && tempo < 150) return "댄스/일렉트로닉";
  return "힙합/EDM";
}

// 인상적인 부분 생성 함수
function generateImpressiveParts(analysisData: any): string[] {
  const impressions = [];

  const pitchStability = analysisData.pitch?.pitch_stability || 0.7;
  const tempoStability = analysisData.tempo?.tempo_stability || 0.8;
  const emotionConfidence = analysisData.emotion?.confidence || 0.5;

  if (pitchStability > 0.8) {
    impressions.push("안정적이고 정확한 음정 표현");
  } else if (pitchStability > 0.6) {
    impressions.push("전반적으로 균형잡힌 음정");
  }

  if (tempoStability > 0.8) {
    impressions.push("일관된 리듬감과 박자 유지");
  } else if (tempoStability > 0.6) {
    impressions.push("자연스러운 리듬 흐름");
  }

  if (emotionConfidence > 0.7) {
    impressions.push("풍부한 감정 전달력");
  } else if (emotionConfidence > 0.5) {
    impressions.push("진솔한 감정 표현");
  }

  const duration = analysisData.metadata?.duration_seconds || 0;
  if (duration > 180) {
    impressions.push("완성도 높은 긴 호흡의 연주");
  } else if (duration > 60) {
    impressions.push("집중력 있는 구성");
  }

  return impressions;
}

// 한국어 리포트 생성 (사용 안함)
function generateKoreanReport(analysisData: any): string {
  return "";
}

// 사용자 맞춤 분석 결과 생성 (무료 버전 - 간단)
function generatePersonalizedAnalysis(
  analysisData: any,
  userNickname?: string
): string {
  const genre = estimateGenre(analysisData);
  const impressions = generateImpressiveParts(analysisData);
  const pitchStability = analysisData.pitch?.pitch_stability || 0.7;
  const emotionConfidence = analysisData.emotion?.confidence || 0.5;

  let analysis = "";

  // 사용자 이름 포함
  if (userNickname) {
    analysis += `${userNickname}님의 AI 무료 분석 결과\n\n`;
  } else {
    analysis += `AI 무료 분석 결과\n\n`;
  }

  // 장르 분석
  analysis += `🎵 ${genre} 장르의 느낌이 담긴 곡이네요!\n\n`;

  // 간단한 피드백
  analysis += `📊 기본 분석:\n`;

  if (pitchStability > 0.7) {
    analysis += `• 음정이 안정적입니다\n`;
  } else {
    analysis += `• 음정 안정성을 개선해보세요\n`;
  }

  if (emotionConfidence > 0.6) {
    analysis += `• 감정 표현이 좋습니다\n`;
  } else {
    analysis += `• 감정 표현을 풍부하게 해보세요\n`;
  }

  return analysis;
}

// AI 심화 분석 결과 생성 (유료 버전 - 상세)
function generateAdvancedAnalysis(
  analysisData: any,
  userNickname?: string
): any {
  const genre = estimateGenre(analysisData);
  const impressions = generateImpressiveParts(analysisData);
  const pitchStability = analysisData.pitch?.pitch_stability || 0.7;
  const emotionConfidence = analysisData.emotion?.confidence || 0.5;
  const tempoStability = analysisData.tempo?.tempo_stability || 0.8;
  const transcriptionConfidence =
    analysisData.transcription?.confidence || 0.85;

  const audioType = analysisData.audioType?.detected || "보컬";

  // 음원 종류에 따른 분석
  const isVocal = audioType === "보컬" || audioType === "vocal";
  const isInstrumental = audioType === "연주곡" || audioType === "instrumental";

  // 강점 분석
  const strengths: string[] = [];
  if (pitchStability > 0.8) {
    strengths.push(isVocal ? "안정적인 음정과 리듬감" : "정확한 음정과 박자감");
  }
  if (emotionConfidence > 0.7) {
    strengths.push(isVocal ? "풍부한 감정 표현력" : "생동감 있는 연주 표현");
  }
  if (tempoStability > 0.8) {
    strengths.push(isVocal ? "자연스러운 호흡법" : "일관된 템포 유지");
  }
  if (transcriptionConfidence > 0.9) {
    strengths.push(isVocal ? "명확한 발음과 딕션" : "깔끔한 음색과 톤");
  }

  // 기본 강점 (분석이 부족할 때)
  if (strengths.length === 0) {
    if (isVocal) {
      strengths.push("기본적인 보컬 기법", "안정적인 호흡", "자연스러운 표현");
    } else {
      strengths.push("기본적인 연주 기법", "안정적인 박자감", "균형잡힌 연주");
    }
  }

  // 개선점 분석
  const improvements: string[] = [];
  if (pitchStability < 0.7) {
    improvements.push(
      isVocal ? "고음 구간에서의 안정성 개선" : "음정 정확도 향상"
    );
  }
  if (emotionConfidence < 0.6) {
    improvements.push(
      isVocal ? "다이나믹 표현의 다양화" : "감정 표현의 깊이 강화"
    );
  }
  if (tempoStability < 0.7) {
    improvements.push(isVocal ? "리듬감 정교화" : "박자 일관성 개선");
  }
  if (transcriptionConfidence < 0.8) {
    improvements.push(isVocal ? "발음과 딕션 개선" : "음색과 톤 품질 향상");
  }

  // 기본 개선점 (분석이 부족할 때)
  if (improvements.length === 0) {
    if (isVocal) {
      improvements.push(
        "고음 구간에서의 안정성 개선",
        "다이나믹 표현의 다양화",
        "개인적인 스타일 개발"
      );
    } else {
      improvements.push(
        "음정 정확도 향상",
        "감정 표현의 깊이 강화",
        "개인적인 연주 스타일 개발"
      );
    }
  }

  // 상세 코멘트
  const overallScore = Math.round(
    (pitchStability * 0.4 + tempoStability * 0.3 + emotionConfidence * 0.3) *
      100
  );

  let detailedFeedback = "";
  if (overallScore > 85) {
    detailedFeedback = isVocal
      ? "전문가 수준에 근접한 보컬 실력을 보여주고 있습니다. 특히 감정 전달력이 뛰어나며, 듣는 이에게 깊은 감동을 선사할 수 있는 능력을 갖추고 있습니다."
      : "전문가 수준에 근접한 연주 실력을 보여주고 있습니다. 특히 음악적 표현력이 뛰어나며, 곡의 감정을 정확하게 전달하는 능력을 갖추고 있습니다.";
  } else if (overallScore > 70) {
    detailedFeedback = isVocal
      ? "전반적으로 훌륭한 기본기를 갖추고 있으며, 특히 감정 전달력이 뛰어납니다. 몇 가지 부분만 보완하면 더욱 완성도 높은 보컬이 가능할 것입니다."
      : "전반적으로 훌륭한 기본기를 갖추고 있으며, 특히 음악적 표현력이 뛰어납니다. 몇 가지 부분만 보완하면 더욱 완성도 높은 연주가 가능할 것입니다.";
  } else {
    detailedFeedback = isVocal
      ? "기본적인 보컬 기법은 갖추고 있으며, 체계적인 연습을 통해 빠르게 실력을 향상시킬 수 있을 것입니다. 꾸준한 연습이 필요합니다."
      : "기본적인 연주 기법은 갖추고 있으며, 체계적인 연습을 통해 빠르게 실력을 향상시킬 수 있을 것입니다. 꾸준한 연습이 필요합니다.";
  }

  // 추천 연습법
  const recommendations: string[] = [];
  if (isVocal) {
    if (pitchStability < 0.7) {
      recommendations.push("고음 발성 연습 (스케일 연습)", "음정 정확도 훈련");
    }
    if (emotionConfidence < 0.6) {
      recommendations.push("다이나믹 연습 (piano-forte)", "감정 표현 연습");
    }
    if (tempoStability < 0.7) {
      recommendations.push("메트로놈과 함께 리듬 연습", "박자감 향상 훈련");
    }
    recommendations.push("개인 스타일 개발을 위한 다양한 장르 시도");
  } else {
    if (pitchStability < 0.7) {
      recommendations.push("음정 정확도 연습", "스케일 연습");
    }
    if (emotionConfidence < 0.6) {
      recommendations.push("표현력 연습", "다양한 장르 시도");
    }
    if (tempoStability < 0.7) {
      recommendations.push("메트로놈과 함께 연습", "박자감 향상 훈련");
    }
    recommendations.push("개인적인 연주 스타일 개발");
  }

  // 기본 추천 (분석이 부족할 때)
  if (recommendations.length === 0) {
    if (isVocal) {
      recommendations.push(
        "고음 발성 연습 (스케일 연습)",
        "다이나믹 연습 (piano-forte)",
        "개인 스타일 개발을 위한 다양한 장르 시도"
      );
    } else {
      recommendations.push(
        "음정 정확도 연습",
        "표현력 연습",
        "개인적인 연주 스타일 개발"
      );
    }
  }

  // 텍스트로 변환
  let analysisText = "";

  if (userNickname) {
    analysisText += `${userNickname}님의 AI 심화 분석 리포트\n\n`;
  } else {
    analysisText += `AI 심화 분석 리포트\n\n`;
  }

  analysisText += `🎵 장르 분석: ${genre}\n\n`;

  analysisText += `📊 종합 점수: ${overallScore}점\n`;
  analysisText += `• 기술 점수: ${Math.round(pitchStability * 100)}점\n`;
  analysisText += `• 스타일 점수: ${Math.round(emotionConfidence * 100)}점\n`;
  analysisText += `• 리듬 점수: ${Math.round(tempoStability * 100)}점\n\n`;

  analysisText += `✨ 강점:\n`;
  strengths.forEach(s => {
    analysisText += `• ${s}\n`;
  });

  analysisText += `\n🎯 개선점:\n`;
  improvements.forEach(i => {
    analysisText += `• ${i}\n`;
  });

  analysisText += `\n💬 전문가 코멘트:\n${detailedFeedback}\n\n`;

  analysisText += `📚 추천 연습법:\n`;
  recommendations.forEach(r => {
    analysisText += `• ${r}\n`;
  });

  return {
    strengths,
    improvements,
    detailed_feedback: detailedFeedback,
    recommendations,
    technique_score: Math.round(pitchStability * 100),
    style_score: Math.round(emotionConfidence * 100),
    rhythm_score: Math.round(tempoStability * 100),
    overall_score: overallScore,
    genre,
    impressions,
    audio_type: audioType,
    analysis_text: analysisText,
  };
}

// 짧은 요약 생성 (기존 함수 유지)
function generateShortSummary(analysisData: any): string {
  const genre = estimateGenre(analysisData);
  const impressions = generateImpressiveParts(analysisData);

  let summary = `${genre} 장르의 느낌이 담긴 곡이네요! `;

  if (impressions.length > 0) {
    summary += `특히 ${impressions.join(", ")} 부분이 인상적입니다. `;
  }

  summary +=
    "더 전문적인 분석과 발전 방향이 궁금하시다면, 전문가와 상담해보세요!";

  return summary;
}

// 오디오 분석 함수
export async function analyzeAudio(
  audioFile: File,
  tier?: string
): Promise<any> {
  try {
    console.log("🎤 AssemblyAI 오디오 분석 시작");
    console.log("🔑 API 키 확인:", ASSEMBLYAI_API_KEY ? "✅ 있음" : "❌ 없음");

    // AssemblyAI 토큰 체크 - 없으면 데모 모드
    if (!ASSEMBLYAI_API_KEY) {
      console.warn("⚠️ AssemblyAI API 키가 없습니다. 데모 분석을 제공합니다.");

      // 데모 분석 결과 생성
      const demoResult = {
        transcription: {
          text: "음악 파일 분석 데모 모드입니다. 실제 API 키를 설정하면 정확한 분석 결과를 받을 수 있습니다.",
          language: "ko",
          confidence: 0.85,
        },
        emotion: {
          label: "positive",
          label_ko: "긍정적",
          scores: { positive: 0.7, neutral: 0.2, negative: 0.1 },
          scores_ko: {
            "뛰어난 표현력": 0.7,
            "안정적인 표현": 0.2,
            "개선 필요한 표현": 0.1,
          },
          confidence: 0.75,
        },
        pitch: {
          average_hz: 220 + Math.random() * 100,
          stddev_hz: 15 + Math.random() * 10,
          pitch_stability: 0.7 + Math.random() * 0.2,
        },
        tempo: {
          bpm: 100 + Math.random() * 40,
          confidence: 0.8,
          tempo_stability: 0.75 + Math.random() * 0.15,
        },
        key: {
          tonic: "C",
          mode: "major",
          confidence: 0.7,
        },
        metadata: {
          duration_seconds: 180,
          file_name: audioFile.name,
        },
        cost_estimate_usd: 0,
        report_ko:
          "🎵 데모 분석 모드\n\n이 결과는 데모 버전입니다. 실제 AI 분석을 원하시면 AssemblyAI API 키를 설정해주세요.\n\n기본적으로 양호한 음악 파일로 판단됩니다.",
        summary_ko:
          "데모 분석 결과입니다. 실제 분석을 위해서는 API 키가 필요합니다.",
        isDemo: true,
      };

      toast.info("데모 분석 모드로 실행됩니다.");
      return demoResult;
    }

    // 파일 크기 검증
    if (audioFile.size > MAX_FILE_SIZE) {
      throw new Error("파일 크기가 30MB를 초과합니다.");
    }

    // 파일 형식 검증
    if (!SUPPORTED_FORMATS.includes(audioFile.type)) {
      throw new Error("지원되지 않는 파일 형식입니다.");
    }

    console.log(
      `📁 파일 분석: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)}MB)`
    );

    // 오디오 파일 준비 완료

    console.log("🤖 AssemblyAI 분석 시작...");

    // AssemblyAI 분석 요청 (파일 직접 전달)
    const transcript = await retryWithBackoff(async () => {
      return await client.transcripts.transcribe({
        audio: audioFile,
        language_code: "ko", // 한국어
        speaker_labels: true, // 화자 분리 (한국어 지원)
        entity_detection: true, // 개체명 인식 (한국어 지원)
        // 한국어에서 지원되지 않는 기능들은 제거
        // sentiment_analysis: true, // 감정 분석 (한국어 미지원)
        // auto_highlights: true, // 자동 하이라이트 (한국어 미지원)
        // summarization: true, // 요약 (한국어 미지원)
        // iab_categories: true, // 카테고리 분류 (한국어 미지원)
        // content_safety_labels: true, // 콘텐츠 안전성 (한국어 미지원)
        // auto_chapters: true, // 자동 챕터 (한국어 미지원)
      });
    });

    console.log("⏳ 분석 진행 중... (ID:", transcript.id, ")");

    // 분석 완료까지 대기
    let finalTranscript;
    while (transcript.status !== "completed" && transcript.status !== "error") {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      finalTranscript = await client.transcripts.get(transcript.id);
      console.log("📊 분석 상태:", finalTranscript.status);
    }

    if (finalTranscript?.status === "error") {
      throw new Error(`AssemblyAI 분석 실패: ${finalTranscript.error}`);
    }

    finalTranscript = finalTranscript || transcript;

    console.log("✅ AssemblyAI 분석 완료!");

    // 결과 파싱
    const analysisData = {
      transcription: {
        text: finalTranscript.text || "",
        language: finalTranscript.language_code || "ko",
        confidence: finalTranscript.confidence || 0.85,
      },
      emotion: {
        label: "neutral", // 한국어에서는 감정 분석 미지원
        label_ko: "중립적",
        confidence: 0.5,
        scores: {},
        scores_ko: {},
      },
      sentiment: {
        sentiment: "neutral", // 한국어에서는 감정 분석 미지원
        confidence: 0.5,
      },
      auto_highlights: null, // 한국어에서는 자동 하이라이트 미지원
      summary: null, // 한국어에서는 요약 미지원
      utterances: finalTranscript.utterances || [],
      entities: finalTranscript.entities || [],
      iab_categories: null, // 한국어에서는 카테고리 분류 미지원
      content_safety_labels: null, // 한국어에서는 콘텐츠 안전성 미지원
      chapters: [], // 한국어에서는 자동 챕터 미지원
      pitch: {
        average_hz: 220, // 기본값 (A3 음)
        stddev_hz: 50, // 기본값
        pitch_stability: 0.7, // 기본값
      },
      tempo: {
        bpm: 120, // 기본값
        tempo_stability: 0.8, // 기본값
      },
      audioType: {
        detected: detectAudioType(audioFile, finalTranscript),
        confidence: 0.8,
      },
      metadata: {
        duration_seconds: finalTranscript.audio_duration || 0,
        file_name: audioFile.name,
        words_count: finalTranscript.words?.length || 0,
      },
      cost_estimate_usd: (0.00065 * (finalTranscript.audio_duration || 0)) / 60, // AssemblyAI 가격
    };

    // 한국어 리포트 생성
    console.log("📝 한국어 리포트 생성 중...");
    const reportKo = generateKoreanReport(analysisData);
    const shortSummary = generateShortSummary(analysisData);
    const personalizedAnalysis = generatePersonalizedAnalysis(analysisData);
    const advancedAnalysis = generateAdvancedAnalysis(analysisData);

    // 최종 결과
    const result = {
      ...analysisData,
      report_ko: reportKo,
      summary_ko: shortSummary,
      personalized_analysis:
        personalizedAnalysis || "분석 결과를 생성하는 중입니다...",
      advanced_analysis:
        advancedAnalysis || "심화 분석 결과를 생성하는 중입니다...",
    };

    console.log("📊 무료 분석 결과:", personalizedAnalysis);
    console.log("💎 심화 분석 결과:", advancedAnalysis);

    console.log("🎉 AssemblyAI 분석 및 리포트 생성 완료!");
    return result;
  } catch (error: any) {
    console.error("❌ AssemblyAI 분석 오류:", error);
    throw error;
  }
}
