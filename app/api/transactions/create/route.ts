import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseDb as getDb } from "../../../../lib/api/firebase-ultra-safe";
import { CreateTransactionInput, Transaction } from "../../../../data/types";
import { getUserProfile } from "../../../../lib/auth";
import { getItem } from "../../../../lib/api/products";

export async function POST(request: NextRequest) {
  try {
    const body: CreateTransactionInput & {
      buyerId: string;
      isEscrow?: boolean;
    } = await request.json();
    const {
      productId,
      amount,
      paymentMethod = "card",
      buyerId,
      isEscrow = false,
    } = body;

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

    // Firestore 인스턴스 가져오기
    const db = await getDb();

    // 상품 정보 조회
    const productRef = doc(db, "items", productId);
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
    if (product.sellerUid === buyerId) {
      return NextResponse.json(
        { success: false, error: "본인의 상품은 구매할 수 없습니다." },
        { status: 400 }
      );
    }

    // 플레이스홀더 결제 처리 (실제 PG 연동 대신)
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 거래 데이터 생성
    const transactionData = {
      productId,
      buyerId,
      sellerId: product.sellerUid,
      amount,
      status: "paid_hold" as const,
      paymentMethod,
      paymentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 기존 취소된 거래 내역 확인 및 정리
    let docRef: any;
    try {
      const existingTransactionRef = doc(
        db,
        "transactions",
        `${productId}_${buyerId}`
      );
      const existingTransactionSnap = await getDoc(existingTransactionRef);

      if (existingTransactionSnap.exists()) {
        const existingData = existingTransactionSnap.data();
        console.log("기존 거래 내역 발견:", existingData);

        // 취소된 거래인 경우 새 거래로 업데이트
        if (existingData.status === "cancelled") {
          await updateDoc(existingTransactionRef, {
            status: "paid_hold",
            amount,
            paymentMethod,
            paymentId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // 취소 관련 필드 초기화
            cancelledAt: null,
            cancelReason: null,
            cancelledBy: null,
          });
          console.log("취소된 거래를 새 거래로 업데이트 완료");
          docRef = existingTransactionRef;
        } else {
          // 다른 상태의 거래가 있으면 새 문서 생성
          docRef = await addDoc(
            collection(db, "transactions"),
            transactionData
          );
          console.log("새 거래 내역 생성:", docRef.id);
        }
      } else {
        // 기존 거래 내역이 없으면 새로 생성
        docRef = await addDoc(collection(db, "transactions"), transactionData);
        console.log("새 거래 내역 생성:", docRef.id);
      }
    } catch (error) {
      console.error("거래 내역 처리 중 오류:", error);
      // 거래 내역 처리 실패해도 상품 상태 변경은 계속 진행
      docRef = await addDoc(collection(db, "transactions"), transactionData);
    }

    // 상품 상태 변경 - 안전결제면 'escrow_completed', 일반결제면 'pending'
    const productStatus = isEscrow ? "escrow_completed" : "pending";
    await updateDoc(productRef, {
      status: productStatus,
      buyerUid: buyerId, // 안전결제인 경우 구매자 지정
      updatedAt: serverTimestamp(),
    });

    // 안전결제 완료 시 판매자에게 알림 전송 및 채팅에 시스템 메시지 추가
    if (isEscrow && productStatus === "escrow_completed") {
      try {
        // 판매자에게 결제 완료 알림 전송
        const { notificationTrigger } = await import(
          "../../../../lib/notifications/trigger"
        );
        const itemResult = await getItem(productId);
        const sellerProfile = await getUserProfile(product.sellerUid);

        if (sellerProfile && itemResult?.success) {
          await notificationTrigger.triggerTransactionUpdate({
            userId: product.sellerUid,
            productTitle: itemResult.item.title,
            message: "안전결제가 완료되어 거래가 시작되었습니다.",
          });
        }

        // 채팅에 시스템 메시지 추가
        try {
          console.log("🔔 결제 완료 시 채팅 메시지 추가 시작:", {
            productId,
            buyerId,
            sellerUid: product.sellerUid,
          });

          const { getOrCreateChat, sendMessage } = await import(
            "../../../../lib/chat/api"
          );

          // 채팅방 찾기 또는 생성
          const chatResult = await getOrCreateChat(
            productId,
            buyerId,
            product.sellerUid,
            "💳 구매자가 안전결제를 완료했습니다!\n거래를 진행해주세요.",
            "안전거래"
          );

          console.log("🔔 채팅방 생성/찾기 결과:", chatResult);

          if (chatResult.success && chatResult.chatId) {
            console.log("✅ 결제 완료 시스템 메시지 추가 성공");
          } else {
            console.error("❌ 채팅방 찾기/생성 실패:", chatResult.error);
          }
        } catch (chatError) {
          console.error("❌ 채팅 시스템 메시지 추가 중 오류:", chatError);
          // 채팅 메시지 추가 실패해도 결제는 성공으로 처리
        }
      } catch (error) {
        console.error("결제 완료 알림 전송 중 오류:", error);
        // 알림 전송 실패해도 결제는 성공으로 처리
      }
    }

    const transaction: Transaction = {
      id: typeof docRef === "string" ? docRef : docRef.id,
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
