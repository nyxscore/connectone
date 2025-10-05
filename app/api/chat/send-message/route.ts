import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/chat/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, senderId, message, messageType, productId } = body;

    if (!chatId || !message) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 시스템 메시지인 경우 특별 처리
    if (senderId === "system") {
      const result = await sendMessage({
        chatId,
        senderUid: "system", // 시스템 메시지
        content: message,
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: "시스템 메시지가 전송되었습니다.",
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
    }

    // 일반 사용자 메시지
    const result = await sendMessage({
      chatId,
      senderUid: senderId,
      content: message,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "메시지가 전송되었습니다.",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("메시지 전송 실패:", error);
    return NextResponse.json(
      { success: false, error: "메시지 전송에 실패했습니다." },
      { status: 500 }
    );
  }
}



