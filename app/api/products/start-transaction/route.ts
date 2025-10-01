import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(request: NextRequest) {
  try {
    const { itemId, buyerUid, sellerUid } = await request.json();

    if (!itemId || !buyerUid || !sellerUid) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 상품 문서 가져오기
    const itemRef = doc(db, "items", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const itemData = itemSnap.data();

    // 판매자 확인
    if (itemData.sellerUid !== sellerUid) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 이미 거래중인지 확인
    if (itemData.status === "reserved" || itemData.status === "sold") {
      return NextResponse.json(
        { success: false, error: "이미 거래중이거나 판매완료된 상품입니다." },
        { status: 400 }
      );
    }

    // 상품 상태를 '거래중'으로 변경하고 구매자 지정
    await updateDoc(itemRef, {
      status: "reserved",
      buyerUid: buyerUid,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "거래가 시작되었습니다.",
    });
  } catch (error) {
    console.error("거래 시작 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
