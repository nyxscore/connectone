import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb as getDb } from "../../../../lib/api/firebase-ultra-safe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, sellerUid, buyerUid } = body;

    console.log("거래 시작 요청:", { itemId, sellerUid, buyerUid });

    // 입력 검증
    if (!itemId || !sellerUid || !buyerUid) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // 상품 정보 조회
    const itemRef = doc(db, "items", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const itemData = itemSnap.data();

    // 상품 상태 검증
    if (itemData.status !== "active") {
      return NextResponse.json(
        { success: false, error: "판매 중이 아닌 상품입니다." },
        { status: 400 }
      );
    }

    // 이미 다른 구매자가 있는지 확인
    if (itemData.buyerUid && itemData.buyerUid !== buyerUid) {
      return NextResponse.json(
        { success: false, error: "이미 다른 구매자가 거래 중인 상품입니다." },
        { status: 400 }
      );
    }

    // 판매자가 본인 상품을 구매하려는 경우
    if (itemData.sellerUid === buyerUid) {
      return NextResponse.json(
        { success: false, error: "본인의 상품은 구매할 수 없습니다." },
        { status: 400 }
      );
    }

    // 상품 상태를 'reserved'로 업데이트하고 구매자 정보 추가
    await updateDoc(itemRef, {
      status: "reserved",
      buyerUid: buyerUid,
      buyerId: buyerUid, // 호환성을 위해 추가
      updatedAt: serverTimestamp(),
    });

    console.log("상품 상태 업데이트 완료:", {
      itemId,
      status: "reserved",
      buyerUid,
    });

    return NextResponse.json({
      success: true,
      message: "거래가 시작되었습니다.",
      data: {
        itemId,
        status: "reserved",
        buyerUid,
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

