import { NextRequest, NextResponse } from "next/server";

// Static export configuration
export const dynamic = "force-static";
import { getOrCreateChat } from "../../../../lib/chat/api";

export async function POST(request: NextRequest) {
  try {
    const { chatId, itemId, sellerUid, buyerUid, firstMessage } =
      await request.json();

    if (!chatId || !itemId || !sellerUid || !buyerUid) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const result = await getOrCreateChat(
      itemId,
      buyerUid,
      sellerUid,
      firstMessage || `${itemId}에 대해 문의드립니다.`
    );

    if (result.success) {
      return NextResponse.json({ success: true, chatId: result.chatId });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("채팅 시작 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "채팅을 시작할 수 없습니다." },
      { status: 500 }
    );
  }
}
