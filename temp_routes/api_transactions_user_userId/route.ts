import { NextRequest, NextResponse } from "next/server";

// Static export configuration
export const dynamic = "force-static";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../../../lib/api/firebase";
import { Transaction } from "../../../../../data/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // 사용자의 모든 거래 내역 조회 (구매자 또는 판매자)
    const q = query(
      collection(db, "transactions"),
      where("buyerId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const transactions: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate(),
      refundedAt: doc.data().refundedAt?.toDate(),
    })) as Transaction[];

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("결제 내역 조회 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "결제 내역 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
