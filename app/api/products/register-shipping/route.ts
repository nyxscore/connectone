import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb as getDb } from "../../../../lib/api/firebase-ultra-safe";
import { getOrCreateChat, sendMessage } from "../../../../lib/chat/api";

export async function POST(request: NextRequest) {
  try {
    console.log("발송 정보 등록 API 호출됨");
    const body = await request.json();
    console.log("요청 데이터:", body);
    const { itemId, sellerUid, courier, trackingNumber } = body;

    if (!itemId || !sellerUid || !courier || !trackingNumber) {
      console.log("필수 필드 누락:", {
        itemId,
        sellerUid,
        courier,
        trackingNumber,
      });
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    console.log("Firebase DB 연결 성공");

    // 상품 정보 조회
    const itemRef = doc(db, "items", itemId);
    console.log("상품 조회 중:", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      console.log("상품을 찾을 수 없음:", itemId);
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const itemData = itemSnap.data();
    console.log("상품 데이터:", itemData);

    // 판매자 권한 확인
    if (itemData.sellerUid !== sellerUid) {
      console.log("권한 없음:", {
        itemSeller: itemData.sellerUid,
        requestSeller: sellerUid,
      });
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 상품 상태 업데이트 (shipped로 변경)
    await updateDoc(itemRef, {
      status: "shipped",
      shippingInfo: {
        courier,
        trackingNumber,
        shippedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });

    // 채팅에 시스템 메시지 전송
    if (itemData.buyerUid) {
      try {
        const chatResult = await getOrCreateChat(
          itemId,
          itemData.buyerUid,
          sellerUid,
          "상품이 발송되었습니다."
        );

        if (chatResult.success && chatResult.chatId) {
          await sendMessage({
            chatId: chatResult.chatId,
            senderUid: "system",
            content: `🚚 상품이 발송되었습니다!\n택배사: ${courier}\n송장번호: ${trackingNumber}\n배송 추적이 가능합니다.`,
          });
        }
      } catch (chatError) {
        console.error("발송 시스템 메시지 전송 실패:", chatError);
        // 시스템 메시지 실패는 전체 프로세스를 중단하지 않음
      }
    }

    return NextResponse.json({
      success: true,
      message: "발송 정보가 등록되었습니다.",
    });
  } catch (error) {
    console.error("발송 정보 등록 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "발송 정보 등록에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
