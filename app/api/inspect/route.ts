import { NextRequest, NextResponse } from "next/server";

// AI 검사 결과 타입
interface InspectionResult {
  conditionHint: "A" | "B" | "C" | "D";
  defects: string[];
  confidence: number;
  suggestions: string[];
}

// Mock AI 검사 함수 (나중에 Roboflow/YOLOv8로 교체)
function mockInspectImage(imageUrl: string): InspectionResult {
  // 실제 구현에서는 이미지 URL을 받아서 AI 모델로 분석
  // 현재는 랜덤한 결과를 반환

  const conditions: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
  const possibleDefects = [
    "scratch", // 스크래치
    "dent", // 찌그러짐
    "rust", // 녹슬음
    "crack", // 균열
    "fade", // 색상 퇴색
    "stain", // 얼룩
    "wear", // 마모
    "discoloration", // 변색
  ];

  const possibleSuggestions = [
    "전문 청소 필요",
    "부품 교체 권장",
    "정기 점검 필요",
    "보관 방법 개선",
    "사용 시 주의",
  ];

  // 랜덤하게 조건과 결함 선택
  const conditionHint =
    conditions[Math.floor(Math.random() * conditions.length)];
  const numDefects = Math.floor(Math.random() * 3) + 1; // 1-3개 결함
  const defects = possibleDefects
    .sort(() => 0.5 - Math.random())
    .slice(0, numDefects);

  const numSuggestions = Math.floor(Math.random() * 2) + 1; // 1-2개 제안
  const suggestions = possibleSuggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, numSuggestions);

  return {
    conditionHint,
    defects,
    confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
    suggestions,
  };
}

// 실제 AI 검사 함수 (Roboflow/YOLOv8 연동)
async function inspectImageWithAI(imageUrl: string): Promise<InspectionResult> {
  // TODO: 실제 AI 모델 연동
  // 1. 이미지 다운로드
  // 2. Roboflow/YOLOv8 API 호출
  // 3. 결과 파싱 및 반환

  console.log("AI 검사 중:", imageUrl);

  // 현재는 mock 결과 반환
  return mockInspectImage(imageUrl);
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "이미지 URL이 필요합니다." },
        { status: 400 }
      );
    }

    // 이미지 URL 유효성 검사
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "유효하지 않은 이미지 URL입니다." },
        { status: 400 }
      );
    }

    // AI 검사 실행
    const result = await inspectImageWithAI(imageUrl);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI 검사 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: "AI 검사 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 테스트 가능
export async function GET() {
  return NextResponse.json({
    message: "AI 검사 API가 준비되었습니다.",
    endpoints: {
      POST: "/api/inspect - 이미지 검사",
    },
  });
}
