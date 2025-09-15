import { NextRequest, NextResponse } from "next/server";

// Static export configuration
export const dynamic = "force-static";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../../../../lib/api/firebase";
import { TransactionStatus } from "../../../../../data/types";
import { notificationTrigger } from "../../../../../lib/notifications/trigger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    // 상태 검증
    const validStatuses: TransactionStatus[] = [
      "pending",
      "paid_hold",
      "shipped",
      "delivered",
      "released",
      "refunded",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 상태입니다." },
        { status: 400 }
      );
    }

    // 트랜잭션 업데이트
    const transactionRef = doc(db, "transactions", id);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    // 특정 상태에 따른 추가 필드 설정
    if (status === "delivered") {
      updateData.completedAt = serverTimestamp();
    }

    if (status === "refunded") {
      updateData.refundedAt = serverTimestamp();
    }

    if (status === "shipped" && body.trackingNumber) {
      updateData.trackingNumber = body.trackingNumber;
    }

    await updateDoc(transactionRef, updateData);

    // 거래 상태 업데이트 알림 트리거
    try {
      const transactionDoc = await getDoc(transactionRef);
      if (transactionDoc.exists()) {
        const transactionData = transactionDoc.data();

        // 구매자와 판매자 모두에게 알림 발송
        const notifications = [
          {
            userId: transactionData.buyerId,
            counterpartName: transactionData.sellerName || "판매자",
          },
          {
            userId: transactionData.sellerId,
            counterpartName: transactionData.buyerName || "구매자",
          },
        ];

        for (const notification of notifications) {
          await notificationTrigger.triggerTransactionUpdate({
            userId: notification.userId,
            transactionId: id,
            status,
            productTitle: transactionData.productTitle || "상품",
            productBrand: transactionData.productBrand || "",
            productModel: transactionData.productModel || "",
            amount: transactionData.amount || 0,
            counterpartName: notification.counterpartName,
          });
        }
      }
    } catch (error) {
      console.error("거래 상태 알림 발송 오류:", error);
      // 알림 실패해도 상태 업데이트는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      message: "상태가 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("상태 업데이트 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "상태 업데이트에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
