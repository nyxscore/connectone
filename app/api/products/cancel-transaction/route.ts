import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(req: NextRequest) {
  try {
    const { itemId, userId, reason } = await req.json();

    if (!itemId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
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

    // 안전결제 완료 상태인 경우 안전결제 취소 API 호출
    if (itemData.status === "escrow_completed") {
      try {
        // 구매자와 판매자 구분 (buyerId와 buyerUid 모두 체크)
        const isBuyer = itemData.buyerUid === userId || itemData.buyerId === userId;
        const isSeller = itemData.sellerUid === userId;

        if (!isBuyer && !isSeller) {
          return NextResponse.json(
            { success: false, error: "권한이 없습니다." },
            { status: 403 }
          );
        }

        const escrowCancelResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payment/cancel-escrow`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              itemId,
              sellerUid: itemData.sellerUid, // 항상 판매자 UID 전송
              buyerUid: itemData.buyerUid, // 구매자 UID 추가
              cancelledBy: userId, // 실제 취소한 사용자
              reason:
                reason || (isBuyer ? "구매자 거래 취소" : "판매자 거래 취소"),
            }),
          }
        );

        const escrowResult = await escrowCancelResponse.json();

        if (escrowResult.success) {
          return NextResponse.json({
            success: true,
            message: "안전결제가 취소되었습니다. 환불이 처리됩니다.",
            escrowCancelled: true,
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              error: escrowResult.error || "안전결제 취소에 실패했습니다.",
            },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("안전결제 취소 API 호출 실패:", error);
        return NextResponse.json(
          { success: false, error: "안전결제 취소 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    // 일반 거래 취소 (안전결제가 아닌 경우)
    // 구매자와 판매자 구분 (buyerId와 buyerUid 모두 체크)
    const isBuyer = itemData.buyerUid === userId || itemData.buyerId === userId;
    const isSeller = itemData.sellerUid === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    await updateDoc(itemRef, {
      status: "active", // '판매중'으로 되돌리기
      buyerId: null, // 구매자 정보 제거
      buyerUid: null, // buyerUid도 함께 초기화
      transactionCancelledAt: new Date(), // 거래 취소 시간 기록
      cancelledBy: userId, // 취소한 사용자 기록
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "거래가 취소되었습니다.",
    });
  } catch (error) {
    console.error("Error canceling transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel transaction" },
      { status: 500 }
    );
  }
}
