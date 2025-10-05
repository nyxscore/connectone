import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(request: NextRequest) {
  try {
    const { itemId, sellerUid, courier, trackingNumber } = await request.json();

    if (!itemId || !sellerUid || !courier || !trackingNumber) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const itemRef = doc(db, "items", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const itemData = itemSnap.data();

    // 판매자 권한 확인
    if (itemData.sellerUid !== sellerUid) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 거래중 상태인지 확인
    if (itemData.status !== "reserved") {
      return NextResponse.json(
        { success: false, error: "거래중인 상품만 발송 등록할 수 있습니다." },
        { status: 400 }
      );
    }

    // 발송 정보 등록 및 상태를 배송중으로 변경
    await updateDoc(itemRef, {
      status: "shipping", // 배송중으로 변경
      shippingInfo: {
        courier,
        trackingNumber,
        shippedAt: new Date(),
      },
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "발송 정보가 등록되었습니다.",
    });
  } catch (error) {
    console.error("발송 정보 등록 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
