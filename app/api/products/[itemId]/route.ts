import { NextRequest, NextResponse } from "next/server";
import { getItem } from "@/lib/api/products";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "아이템 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await getItem(itemId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("아이템 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
