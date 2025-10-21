import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🎭 AI 감정 분석 API 호출됨");
    
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json(
        { error: "이미지가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("📸 이미지 데이터 수신:", image.substring(0, 50) + "...");

    // Google Cloud Vision API를 사용한 감정 분석
    const visionApiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
    
    if (!visionApiKey) {
      console.warn("⚠️ Google Vision API 키가 없습니다. 모의 감정 분석을 제공합니다.");
      
      // 모의 감정 분석 결과 제공
      const mockResult = {
        success: true,
        emotions: {
          dominant: "joy",
          scores: {
            joy: 0.7,
            sorrow: 0.1,
            anger: 0.05,
            surprise: 0.15,
            confidence: 0.8,
          },
          faceCount: 1,
        },
        labels: [
          { description: "person", score: 0.95 },
          { description: "face", score: 0.9 },
          { description: "smile", score: 0.8 },
        ],
        texts: [],
        summary: "주요 감정: 기쁨 (신뢰도: 80%)\n인식된 객체: person, face, smile",
        isMock: true,
      };
      
      console.log("🎭 모의 감정 분석 결과:", mockResult);
      return NextResponse.json(mockResult);
    }

    // Base64 이미지 데이터 처리
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, "");
    
    console.log("🤖 Google Vision API 호출 중...");
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: "FACE_DETECTION",
                  maxResults: 10,
                },
                {
                  type: "LABEL_DETECTION",
                  maxResults: 10,
                },
                {
                  type: "TEXT_DETECTION",
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Vision API 오류:", errorData);
      
      if (response.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: "Vision API가 활성화되지 않았습니다. Google Cloud Console에서 Cloud Vision API를 활성화해주세요.",
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: "이미지 분석에 실패했습니다.",
          details: errorData.error?.message || "알 수 없는 오류",
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log("✅ Vision API 분석 완료");

    // 감정 분석 결과 파싱
    const faceAnnotations = result.responses[0]?.faceAnnotations || [];
    const labelAnnotations = result.responses[0]?.labelAnnotations || [];
    const textAnnotations = result.responses[0]?.textAnnotations || [];

    // 얼굴 감정 분석
    const emotions = faceAnnotations.map((face: any) => {
      const emotions = face.emotions || {};
      return {
        joy: emotions.joy || 0,
        sorrow: emotions.sorrow || 0,
        anger: emotions.anger || 0,
        surprise: emotions.surprise || 0,
        confidence: face.detectionConfidence || 0,
      };
    });

    // 라벨 분석 (객체 인식)
    const labels = labelAnnotations.map((label: any) => ({
      description: label.description,
      score: label.score,
    }));

    // 텍스트 분석
    const texts = textAnnotations.map((text: any) => ({
      description: text.description,
      confidence: text.confidence,
    }));

    // 감정 점수 계산
    const emotionScores = emotions.reduce(
      (acc: any, emotion: any) => ({
        joy: acc.joy + emotion.joy,
        sorrow: acc.sorrow + emotion.sorrow,
        anger: acc.anger + emotion.anger,
        surprise: acc.surprise + emotion.surprise,
        confidence: acc.confidence + emotion.confidence,
      }),
      { joy: 0, sorrow: 0, anger: 0, surprise: 0, confidence: 0 }
    );

    // 평균 계산
    const faceCount = emotions.length || 1;
    const avgEmotionScores = {
      joy: emotionScores.joy / faceCount,
      sorrow: emotionScores.sorrow / faceCount,
      anger: emotionScores.anger / faceCount,
      surprise: emotionScores.surprise / faceCount,
      confidence: emotionScores.confidence / faceCount,
    };

    // 주요 감정 결정
    const dominantEmotion = Object.entries(avgEmotionScores)
      .filter(([key]) => key !== "confidence")
      .reduce((a, b) => (avgEmotionScores[a[0] as keyof typeof avgEmotionScores] > avgEmotionScores[b[0] as keyof typeof avgEmotionScores] ? a : b))[0];

    // 감정 분석 결과
    const analysisResult = {
      success: true,
      emotions: {
        dominant: dominantEmotion,
        scores: avgEmotionScores,
        faceCount: faceCount,
      },
      labels: labels.slice(0, 5), // 상위 5개 라벨
      texts: texts.slice(0, 3), // 상위 3개 텍스트
      summary: generateEmotionSummary(avgEmotionScores, dominantEmotion, labels),
    };

    console.log("🎭 감정 분석 결과:", analysisResult);

    return NextResponse.json(analysisResult);

  } catch (error: any) {
    console.error("❌ AI 감정 분석 오류:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "AI 감정 분석 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// 감정 요약 생성
function generateEmotionSummary(
  scores: any,
  dominant: string,
  labels: any[]
): string {
  const emotionMap: { [key: string]: string } = {
    joy: "기쁨",
    sorrow: "슬픔", 
    anger: "분노",
    surprise: "놀라움",
  };

  const dominantKorean = emotionMap[dominant] || "중립";
  const confidence = Math.round(scores.confidence * 100);
  
  const topLabels = labels.slice(0, 3).map(l => l.description).join(", ");
  
  return `주요 감정: ${dominantKorean} (신뢰도: ${confidence}%)${topLabels ? `\n인식된 객체: ${topLabels}` : ""}`;
}
