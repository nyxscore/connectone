import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(req: NextRequest) {
  try {
    const { itemId, buyerUid } = await req.json();

    if (!itemId || !buyerUid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const itemRef = doc(db, "items", itemId);
    
    // 상품 정보 먼저 가져오기
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const itemData = itemSnap.data();

    await updateDoc(itemRef, {
      status: "escrow_completed", // 안전결제 완료 상태
      buyerId: buyerUid,
      escrowCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 채팅에 시스템 메시지 추가
    try {
      const { getOrCreateChat, addMessage } = await import(
        "../../../../lib/chat/api"
      );
      
      // 채팅방 찾기 또는 생성
      const chatResult = await getOrCreateChat({
        itemId: itemId,
        buyerUid: buyerUid,
        sellerUid: itemData.sellerUid,
        firstMessage: "안전결제가 완료되었습니다.",
      });

      if (chatResult.success && chatResult.chatId) {
        // 시스템 메시지 추가
        const systemMessageResult = await addMessage({
          chatId: chatResult.chatId,
          senderUid: "system",
          content: "🎉 안전결제가 완료되었습니다! 구매자가 안전결제를 완료했습니다.",
        });

        if (systemMessageResult.success) {
          console.log("✅ complete-escrow 시스템 메시지 추가 성공");
        } else {
          console.error("❌ complete-escrow 시스템 메시지 추가 실패:", systemMessageResult.error);
        }
      } else {
        console.error("❌ complete-escrow 채팅방 찾기/생성 실패:", chatResult.error);
      }
    } catch (chatError) {
      console.error("❌ complete-escrow 채팅 시스템 메시지 추가 중 오류:", chatError);
      // 채팅 메시지 추가 실패해도 결제는 성공으로 처리
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing escrow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete escrow" },
      { status: 500 }
    );
  }
}
