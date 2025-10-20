import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

// AssemblyAI 클라이언트 초기화
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

if (!ASSEMBLYAI_API_KEY) {
  console.error("❌ ASSEMBLYAI_API_KEY가 설정되지 않았습니다!");
  console.error("⚠️  .env.local 파일에 ASSEMBLYAI_API_KEY를 추가하세요.");
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
    positive: "긍정적",
    negative: "부정적",
    neutral: "중립적",
    happy: "행복",
    sad: "슬픔",
    angry: "화남",
    excited: "흥분",
    calm: "평온",
    confident: "자신감",
    uncertain: "불확실",
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
    positive: "긍정적",
    negative: "부정적",
    neutral: "중립적",
    happy: "행복",
    sad: "슬픔",
    angry: "화남",
    excited: "흥분",
    calm: "평온",
    confident: "자신감",
    uncertain: "불확실",
  };
  return emotionMap[label] || label;
}

// 한국어 리포트 생성
function generateKoreanReport(analysisData: any): string {
  const { transcription, emotion, sentiment, auto_highlights, summary } =
    analysisData;

  let report = "🎤 **AI 보컬 분석 리포트**\n\n";

  // 트랜스크립션
  if (transcription?.text) {
    report += `**📝 음성 인식 결과:**\n${transcription.text}\n\n`;
  }

  // 감정 분석
  if (emotion?.label) {
    report += `**😊 감정 분석:** ${emotion.label_ko || emotion.label}\n`;
    if (emotion.confidence) {
      report += `신뢰도: ${(emotion.confidence * 100).toFixed(1)}%\n\n`;
    }
  }

  // 감정 점수
  if (emotion?.scores) {
    report += `**📊 감정 점수:**\n`;
    const scores = emotion.scores_ko || emotion.scores;
    for (const [emotion, score] of Object.entries(scores)) {
      report += `- ${emotion}: ${(Number(score) * 100).toFixed(1)}%\n`;
    }
    report += "\n";
  }

  // 감정 분석 (AssemblyAI)
  if (sentiment?.sentiment) {
    report += `**💭 전체 감정:** ${sentiment.sentiment}\n`;
    if (sentiment.confidence) {
      report += `신뢰도: ${(sentiment.confidence * 100).toFixed(1)}%\n\n`;
    }
  }

  // 자동 하이라이트
  if (auto_highlights?.results && auto_highlights.results.length > 0) {
    report += `**⭐ 주요 하이라이트:**\n`;
    auto_highlights.results.forEach((highlight: any, index: number) => {
      report += `${index + 1}. ${highlight.text} (${highlight.timestamp?.start}초)\n`;
    });
    report += "\n";
  }

  // 요약
  if (summary) {
    report += `**📋 요약:**\n${summary}\n\n`;
  }

  // 화자 분리
  if (analysisData.utterances && analysisData.utterances.length > 0) {
    report += `**👥 화자 분석:**\n`;
    const speakers = new Set(
      analysisData.utterances.map((u: any) => u.speaker)
    );
    report += `총 ${speakers.size}명의 화자가 감지되었습니다.\n\n`;
  }

  return report;
}

// 짧은 요약 생성
function generateShortSummary(analysisData: any): string {
  const { emotion, sentiment, summary } = analysisData;

  let summary_text = "";

  if (summary) {
    summary_text = summary;
  } else if (emotion?.label) {
    summary_text = `감정: ${emotion.label_ko || emotion.label}`;
  } else if (sentiment?.sentiment) {
    summary_text = `감정: ${sentiment.sentiment}`;
  } else {
    summary_text = "AI 보컬 분석이 완료되었습니다.";
  }

  return summary_text;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🎤 POST /api/audio/analyze 요청 수신 (AssemblyAI)");

    // AssemblyAI 토큰 체크
    if (!ASSEMBLYAI_API_KEY) {
      console.error("❌ AssemblyAI API 토큰이 없습니다!");
      return NextResponse.json(
        {
          error: "AI 분석 서비스가 설정되지 않았습니다. 관리자에게 문의하세요.",
          details: "ASSEMBLYAI_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    // FormData 파싱
    console.log("📦 FormData 파싱 중...");
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    console.log("📁 파일 수신:", audioFile ? audioFile.name : "없음");

    if (!audioFile) {
      return NextResponse.json(
        { error: "오디오 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기가 30MB를 초과합니다." },
        { status: 400 }
      );
    }

    // 파일 형식 검증
    if (!SUPPORTED_FORMATS.includes(audioFile.type)) {
      return NextResponse.json(
        { error: "지원되지 않는 파일 형식입니다." },
        { status: 400 }
      );
    }

    console.log(
      `📁 파일 수신: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)}MB)`
    );

    // 오디오 파일을 ArrayBuffer로 변환
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("🤖 AssemblyAI 분석 시작...");

    // AssemblyAI에 오디오 업로드
    const uploadUrl = await retryWithBackoff(async () => {
      return await client.files.upload(buffer);
    });

    console.log("📤 오디오 업로드 완료:", uploadUrl);

    // AssemblyAI 분석 요청
    const transcript = await retryWithBackoff(async () => {
      return await client.transcripts.create({
        audio: uploadUrl,
        language_code: "ko", // 한국어
        sentiment_analysis: true, // 감정 분석
        auto_highlights: true, // 자동 하이라이트
        summarization: true, // 요약
        speaker_labels: true, // 화자 분리
        entity_detection: true, // 개체명 인식
        iab_categories: true, // 카테고리 분류
        content_safety_labels: true, // 콘텐츠 안전성
        auto_chapters: true, // 자동 챕터
        summarization_model: "informative", // 요약 모델
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
        label:
          finalTranscript.sentiment_analysis_results?.[0]?.sentiment ||
          "neutral",
        label_ko: translateEmotionToKorean(
          finalTranscript.sentiment_analysis_results?.[0]?.sentiment ||
            "neutral"
        ),
        confidence:
          finalTranscript.sentiment_analysis_results?.[0]?.confidence || 0.5,
        scores:
          finalTranscript.sentiment_analysis_results?.[0]?.sentiment_scores ||
          {},
        scores_ko: translateEmotionScores(
          finalTranscript.sentiment_analysis_results?.[0]?.sentiment_scores ||
            {}
        ),
      },
      sentiment: {
        sentiment:
          finalTranscript.sentiment_analysis_results?.[0]?.sentiment ||
          "neutral",
        confidence:
          finalTranscript.sentiment_analysis_results?.[0]?.confidence || 0.5,
      },
      auto_highlights: finalTranscript.auto_highlights_results || null,
      summary: finalTranscript.summary || null,
      utterances: finalTranscript.utterances || [],
      entities: finalTranscript.entities || [],
      iab_categories: finalTranscript.iab_categories_results || null,
      content_safety_labels:
        finalTranscript.content_safety_labels_results || null,
      chapters: finalTranscript.chapters || [],
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

    // 최종 결과
    const result = {
      ...analysisData,
      report_ko: reportKo,
      summary_ko: shortSummary,
    };

    console.log("🎉 AssemblyAI 분석 및 리포트 생성 완료!");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ AssemblyAI 분석 오류:", error);

    // 에러 타입별 처리
    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    if (error.message?.includes("authentication")) {
      return NextResponse.json(
        { error: "API 인증에 실패했습니다. 관리자에게 문의하세요." },
        { status: 401 }
      );
    }

    if (error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "API 사용량 한도를 초과했습니다. 관리자에게 문의하세요." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "분석 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET 요청 - API 상태 확인
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "AI Vocal Analysis API (AssemblyAI)",
    version: "2.0.0",
    provider: "AssemblyAI",
    endpoints: {
      POST: "/api/audio/analyze - 오디오 파일 분석",
    },
    features: [
      "음성 인식 (Speech-to-Text)",
      "감정 분석 (Sentiment Analysis)",
      "자동 하이라이트 (Auto Highlights)",
      "요약 (Summarization)",
      "화자 분리 (Speaker Labels)",
      "개체명 인식 (Entity Detection)",
      "카테고리 분류 (IAB Categories)",
      "콘텐츠 안전성 (Content Safety)",
      "자동 챕터 (Auto Chapters)",
    ],
  });
}
