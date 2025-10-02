import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(request: NextRequest) {
  try {
    const { itemId, buyerUid } = await request.json();

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

    // 구매자 확인
    if (itemData.buyerId !== buyerUid) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 거래중 상태인지 확인
    if (itemData.status !== "reserved") {
      return NextResponse.json(
        { success: false, error: "구매 완료할 수 없는 상태입니다." },
        { status: 400 }
      );
    }

    // 실제 토스페이먼츠 API 호출 (판매자에게 입금 처리)
    // TODO: 실제 토스페이먼츠 API 연동 시 구현
    console.log("구매 완료 처리:", {
      itemId,
      buyerUid,
      sellerUid: itemData.sellerUid,
      amount: itemData.price,
    });

    // Mock: 입금 성공으로 가정
    const paymentSuccess = true;

    if (paymentSuccess) {
      // 상품 상태를 '판매완료'로 변경
      await updateDoc(itemRef, {
        status: "sold",
        completedAt: new Date(),
        completedBy: buyerUid,
        updatedAt: new Date(),
      });

      // 거래 내역에 완료 기록 추가
      const transactionsRef = doc(db, "transactions", `${itemId}_${buyerUid}`);
      await updateDoc(transactionsRef, {
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      }).catch(() => {
        // 거래 내역이 없어도 상품 완료는 진행
        console.log("거래 내역 업데이트 실패 (무시됨)");
      });

      return NextResponse.json({
        success: true,
        message: "구매가 완료되었습니다. 판매자에게 입금이 처리됩니다.",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "입금 처리에 실패했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("구매 완료 실패:", error);
    return NextResponse.json(
      { success: false, error: "구매 완료 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
