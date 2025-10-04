import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(request: NextRequest) {
  try {
    const { itemId, sellerUid } = await request.json();

    if (!itemId || !sellerUid) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 상품 정보 확인
    const itemRef = doc(db, "items", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const itemData = itemSnap.data();

    // 판매자가 맞는지 확인
    if (itemData.sellerId !== sellerUid) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 취소 요청 상태인지 확인
    if (itemData.status !== "cancel_requested") {
      return NextResponse.json(
        { success: false, error: "취소 요청이 없습니다." },
        { status: 400 }
      );
    }

    // 상품을 다시 판매중으로 변경하고 구매자 정보 제거
    await updateDoc(itemRef, {
      status: "active",
      buyerId: null,
      buyerUid: null, // buyerUid도 함께 초기화
      cancelRequestedBy: null,
      cancelReason: null,
      cancelRequestedAt: null,
      cancelApprovedAt: new Date(),
      updatedAt: new Date(),
    });

    // 채팅에 시스템 메시지 추가
    try {
      const { getOrCreateChat, addMessage } = await import(
        "../../../../lib/chat/api"
      );
      
      // 채팅방 찾기 또는 생성
      const chatResult = await getOrCreateChat({
        itemId: itemId,
        buyerUid: itemData.cancelRequestedBy,
        sellerUid: itemData.sellerUid,
        firstMessage: "취소 요청이 승인되었습니다.",
      });

      if (chatResult.success && chatResult.chatId) {
        // 시스템 메시지 추가
        const systemMessageResult = await addMessage({
          chatId: chatResult.chatId,
          senderUid: "system",
          content: "✅ 판매자가 취소 요청을 승인했습니다. 거래가 취소되었습니다.",
        });

        if (systemMessageResult.success) {
          console.log("✅ 취소 승인 시스템 메시지 추가 성공");
        } else {
          console.error("❌ 취소 승인 시스템 메시지 추가 실패:", systemMessageResult.error);
        }
      } else {
        console.error("❌ 취소 승인 채팅방 찾기/생성 실패:", chatResult.error);
      }
    } catch (chatError) {
      console.error("❌ 취소 승인 채팅 시스템 메시지 추가 중 오류:", chatError);
      // 채팅 메시지 추가 실패해도 승인은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      message: "취소 요청이 승인되었습니다.",
    });
  } catch (error) {
    console.error("취소 승인 실패:", error);
    return NextResponse.json(
      { success: false, error: "취소 승인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
