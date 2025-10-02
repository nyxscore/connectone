import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(request: NextRequest) {
  try {
    const { itemId, sellerUid, reason } = await request.json();

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

    // 판매자 확인
    if (itemData.sellerUid !== sellerUid) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 안전결제 완료 상태인지 확인
    if (itemData.status !== "escrow_completed") {
      return NextResponse.json(
        { success: false, error: "안전결제 취소할 수 없는 상태입니다." },
        { status: 400 }
      );
    }

    // 실제 토스페이먼츠 API 호출 (환불 처리)
    // TODO: 실제 토스페이먼츠 API 연동 시 구현
    console.log("안전결제 취소 요청:", {
      itemId,
      sellerUid,
      buyerUid: itemData.buyerId,
      amount: itemData.price,
      reason: reason || "판매자 거래 취소"
    });

    // Mock: 환불 성공으로 가정
    const refundSuccess = true;

    if (refundSuccess) {
      // 상품 상태를 '판매중'으로 변경하고 구매자 정보 제거
      await updateDoc(itemRef, {
        status: "active",
        buyerId: null,
        escrowCompletedAt: null,
        escrowCanceledAt: new Date(),
        escrowCancelReason: reason || "판매자 거래 취소",
        updatedAt: new Date(),
      });

      // 거래 내역에 취소 기록 추가
      const transactionsRef = doc(db, "transactions", `${itemId}_${itemData.buyerId}`);
      await updateDoc(transactionsRef, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: reason || "판매자 거래 취소",
        updatedAt: new Date(),
      }).catch(() => {
        // 거래 내역이 없어도 상품 취소는 진행
        console.log("거래 내역 업데이트 실패 (무시됨)");
      });

      return NextResponse.json({
        success: true,
        message: "안전결제가 취소되었습니다. 환불이 처리됩니다.",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "환불 처리에 실패했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("안전결제 취소 실패:", error);
    return NextResponse.json(
      { success: false, error: "안전결제 취소 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
