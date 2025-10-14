import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, sellerUid } = body;

    console.log("거래 시작 요청:", { itemId, sellerUid });

    // 입력 검증
    if (!itemId || !sellerUid) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 임시로 성공 응답 반환 (실제 Firebase 연동은 나중에)
    return NextResponse.json({
      success: true,
      message: "거래가 시작되었습니다.",
      data: {
        itemId,
        status: "reserved",
      },
    });
  } catch (error) {
    console.error("거래 시작 실패:", error);
    return NextResponse.json(
      { success: false, error: "거래 시작 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

