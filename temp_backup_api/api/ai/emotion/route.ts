import { NextRequest, NextResponse } from "next/server";

// Static export configuration
export const dynamic = "force-static";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "이미지가 필요합니다." },
        { status: 400 }
      );
    }

    // 간단한 AI 감정 분석 시뮬레이션
    // 실제로는 Google Cloud Vision API나 다른 AI 서비스를 사용할 수 있습니다
    const emotions = [
      "신뢰감",
      "고급스러움",
      "전문성",
      "품질",
      "안정감",
      "혁신성",
      "세련됨",
      "우아함",
    ];

    const descriptions = [
      "이 상품은 신뢰할 수 있는 품질을 보여줍니다.",
      "고급스러운 디자인이 돋보입니다.",
      "전문적인 제작 품질을 확인할 수 있습니다.",
      "우수한 상태의 상품으로 보입니다.",
      "안정적이고 견고한 구조를 가지고 있습니다.",
      "혁신적인 디자인 요소가 포함되어 있습니다.",
      "세련된 외관을 자랑합니다.",
      "우아하고 세심한 마감을 보여줍니다.",
    ];

    // 랜덤하게 감정과 설명 선택
    const randomIndex = Math.floor(Math.random() * emotions.length);
    const emotion = emotions[randomIndex];
    const description = descriptions[randomIndex];
    const confidence = Math.random() * 0.3 + 0.7; // 0.7 ~ 1.0 사이의 신뢰도

    return NextResponse.json({
      success: true,
      emotion,
      confidence,
      description,
    });
  } catch (error) {
    console.error("AI 감정 분석 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI 감정 분석에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
