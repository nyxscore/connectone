import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(request: NextRequest) {
  try {
    const { itemId, buyerUid, reason } = await request.json();

    if (!itemId || !buyerUid) {
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

    // 구매자가 맞는지 확인
    if (itemData.buyerId !== buyerUid) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 거래중인 상품인지 확인
    if (itemData.status !== "reserved" && itemData.status !== "escrow_completed") {
      return NextResponse.json(
        { success: false, error: "취소할 수 없는 상품 상태입니다." },
        { status: 400 }
      );
    }

    // 취소 요청 상태로 업데이트
    await updateDoc(itemRef, {
      status: "cancel_requested",
      cancelRequestedBy: buyerUid,
      cancelReason: reason || "구매자 요청",
      cancelRequestedAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "취소 요청이 전송되었습니다.",
    });
  } catch (error) {
    console.error("취소 요청 실패:", error);
    return NextResponse.json(
      { success: false, error: "취소 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
