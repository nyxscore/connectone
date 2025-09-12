import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../../lib/api/firebase";
import { CreateTransactionInput, Transaction } from "../../../../data/types";

export async function POST(request: NextRequest) {
  try {
    const body: CreateTransactionInput & { buyerId: string } =
      await request.json();
    const { productId, amount, paymentMethod = "card", buyerId } = body;

    // 입력 검증
    if (!productId || !amount || !buyerId) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "결제 금액은 0원보다 커야 합니다." },
        { status: 400 }
      );
    }

    // 상품 정보 조회
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const product = productSnap.data();

    // 상품 가격 검증
    if (product.price !== amount) {
      return NextResponse.json(
        { success: false, error: "결제 금액이 상품 가격과 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 상품 상태 검증
    if (product.status !== "active") {
      return NextResponse.json(
        { success: false, error: "판매 중이 아닌 상품입니다." },
        { status: 400 }
      );
    }

    // 구매자와 판매자가 같은지 확인
    if (product.sellerId === buyerId) {
      return NextResponse.json(
        { success: false, error: "본인의 상품은 구매할 수 없습니다." },
        { status: 400 }
      );
    }

    // 플레이스홀더 결제 처리 (실제 PG 연동 대신)
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 트랜잭션 생성
    const transactionData = {
      productId,
      buyerId,
      sellerId: product.sellerId,
      amount,
      status: "paid_hold" as const, // 플레이스홀더에서는 바로 paid_hold로 설정
      paymentMethod,
      paymentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, "transactions"),
      transactionData
    );

    // 상품 상태를 'pending'으로 변경 (거래 진행 중)
    await updateDoc(productRef, {
      status: "pending",
      updatedAt: serverTimestamp(),
    });

    const transaction: Transaction = {
      id: docRef.id,
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: transaction,
      message: "결제가 완료되었습니다. 에스크로로 보관됩니다.",
    });
  } catch (error) {
    console.error("결제 처리 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "결제 처리에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

