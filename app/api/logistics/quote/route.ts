import { NextRequest, NextResponse } from "next/server";

// Static export configuration
export const dynamic = "force-static";

// 운송 견적 요청 타입
interface LogisticsQuoteRequest {
  itemId: string;
  origin: string;
  destination: string;
  floor: number;
  hasElevator: boolean;
  hasInsurance: boolean;
  itemWeight?: number;
  itemDimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

// 운송 견적 응답 타입
interface LogisticsQuoteResponse {
  success: boolean;
  quotes?: LogisticsQuote[];
  error?: string;
}

// 운송 견적 타입
interface LogisticsQuote {
  id: string;
  companyName: string;
  companyLogo?: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDays: {
    min: number;
    max: number;
  };
  features: string[];
  rating: number;
  description: string;
}

// Mock 운송 견적 생성 함수
function generateMockQuotes(request: LogisticsQuoteRequest): LogisticsQuote[] {
  const basePrice = 15000; // 기본 가격
  const distanceMultiplier = Math.random() * 2 + 1; // 거리 배수 (1-3)
  const floorMultiplier = request.floor > 1 ? 1 + (request.floor - 1) * 0.1 : 1; // 층수 배수
  const elevatorDiscount = request.hasElevator ? 0.9 : 1; // 엘리베이터 할인
  const insuranceMultiplier = request.hasInsurance ? 1.2 : 1; // 보험 배수

  const adjustedPrice = Math.round(
    basePrice *
      distanceMultiplier *
      floorMultiplier *
      elevatorDiscount *
      insuranceMultiplier
  );

  const quotes: LogisticsQuote[] = [
    {
      id: "logistics-1",
      companyName: "안전운송",
      companyLogo: "🚛",
      price: {
        min: adjustedPrice,
        max: adjustedPrice + 5000,
        currency: "KRW",
      },
      estimatedDays: {
        min: 1,
        max: 2,
      },
      features: ["안전 포장", "실시간 추적", "보험 포함"],
      rating: 4.8,
      description: "전문 악기 운송업체로 안전한 배송을 보장합니다.",
    },
    {
      id: "logistics-2",
      companyName: "빠른배송",
      companyLogo: "🚚",
      price: {
        min: adjustedPrice - 3000,
        max: adjustedPrice + 2000,
        currency: "KRW",
      },
      estimatedDays: {
        min: 1,
        max: 1,
      },
      features: ["당일 배송", "전문 포장", "손해 배상"],
      rating: 4.6,
      description: "빠른 배송을 원하시는 고객에게 추천합니다.",
    },
    {
      id: "logistics-3",
      companyName: "경제운송",
      companyLogo: "📦",
      price: {
        min: adjustedPrice - 5000,
        max: adjustedPrice - 1000,
        currency: "KRW",
      },
      estimatedDays: {
        min: 2,
        max: 3,
      },
      features: ["저렴한 가격", "기본 포장", "기본 보험"],
      rating: 4.3,
      description: "경제적인 배송을 원하시는 고객에게 적합합니다.",
    },
  ];

  return quotes;
}

export async function POST(request: NextRequest) {
  try {
    const body: LogisticsQuoteRequest = await request.json();

    // 필수 필드 검증
    const requiredFields = [
      "itemId",
      "origin",
      "destination",
      "floor",
      "hasElevator",
      "hasInsurance",
    ];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          {
            success: false,
            error: `${field} 필드가 필요합니다.`,
          },
          { status: 400 }
        );
      }
    }

    // 데이터 유효성 검증
    if (body.floor < 1 || body.floor > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "층수는 1-100 사이여야 합니다.",
        },
        { status: 400 }
      );
    }

    if (body.origin.length < 2 || body.destination.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "출발지와 도착지는 최소 2글자 이상이어야 합니다.",
        },
        { status: 400 }
      );
    }

    // Mock 견적 생성
    const quotes = generateMockQuotes(body);

    return NextResponse.json({
      success: true,
      quotes,
    });
  } catch (error) {
    console.error("운송 견적 생성 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: "운송 견적 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 테스트 가능
export async function GET() {
  return NextResponse.json({
    message: "운송 견적 API가 준비되었습니다.",
    endpoints: {
      POST: "/api/logistics/quote - 운송 견적 요청",
    },
  });
}
