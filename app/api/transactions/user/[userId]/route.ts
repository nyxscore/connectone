import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    console.log("거래 내역 조회:", userId);

    // TODO: Firestore에서 실제 거래 내역 가져오기
    // 현재는 빈 배열 반환
    const transactions: any[] = [];

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("거래 내역 조회 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: "거래 내역을 불러올 수 없습니다.",
      },
      { status: 500 }
    );
  }
}
