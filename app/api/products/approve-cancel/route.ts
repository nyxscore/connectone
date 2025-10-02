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
      cancelRequestedBy: null,
      cancelReason: null,
      cancelRequestedAt: null,
      cancelApprovedAt: new Date(),
      updatedAt: new Date(),
    });

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
