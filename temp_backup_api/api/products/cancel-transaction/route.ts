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
        const isBuyer =
          itemData.buyerUid === userId || itemData.buyerId === userId;
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
      status: "active", // '거래 대기' 상태로 변경 (active = 거래 대기)
      buyerId: null, // 구매자 정보 제거
      buyerUid: null, // buyerUid도 함께 초기화
      transactionCancelledAt: new Date(), // 거래 취소 시간 기록
      cancelledBy: userId, // 취소한 사용자 기록
      updatedAt: new Date(),
    });

    // 거래 내역 업데이트 (취소 상태로 변경)
    try {
      const { updateDoc: updateDocTransaction } = await import(
        "firebase/firestore"
      );
      const transactionsRef = doc(
        db,
        "transactions",
        `${itemId}_${itemData.buyerUid || itemData.buyerId}`
      );
      await updateDocTransaction(transactionsRef, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason:
          reason || (isBuyer ? "구매자 거래 취소" : "판매자 거래 취소"),
        cancelledBy: userId,
        updatedAt: new Date(),
      }).catch(() => {
        // 거래 내역이 없어도 상품 취소는 진행
        console.log("거래 내역 업데이트 실패 (무시됨)");
      });
    } catch (error) {
      console.error("거래 내역 업데이트 실패:", error);
      // 거래 내역 업데이트 실패해도 상품 취소는 성공으로 처리
    }

    // 채팅에 시스템 메시지 추가
    try {
      const { getOrCreateChat, addMessage } = await import(
        "../../../../lib/chat/api"
      );

      // 채팅방 찾기 또는 생성
      const chatResult = await getOrCreateChat({
        itemId: itemId,
        buyerUid: itemData.buyerUid || itemData.buyerId,
        sellerUid: itemData.sellerUid,
        firstMessage: "거래가 취소되었습니다.",
      });

      if (chatResult.success && chatResult.chatId) {
        // 시스템 메시지 추가
        const cancelMessage = isBuyer
          ? "❌ 구매자가 거래를 취소했습니다. 거래가 종료되었습니다."
          : "❌ 판매자가 거래를 취소했습니다. 거래가 종료되었습니다.";

        const systemMessageResult = await addMessage({
          chatId: chatResult.chatId,
          senderUid: "system",
          content: cancelMessage,
        });

        if (systemMessageResult.success) {
          console.log("✅ 거래 취소 시스템 메시지 추가 성공");

          // 구매자에게 거래 취소 알림 전송
          if (!isBuyer && itemData.buyerUid) {
            try {
              const { notificationTrigger } = await import(
                "../../../../lib/notifications/trigger"
              );
              const { getItem } = await import("../../../../lib/api/products");

              const itemResult = await getItem(itemId);
              if (itemResult.success && itemResult.item) {
                await notificationTrigger.triggerTransactionUpdate({
                  userId: itemData.buyerUid,
                  productTitle: itemResult.item.title,
                  message: "판매자가 거래를 취소했습니다.",
                });
                console.log("✅ 구매자에게 거래 취소 알림 전송 완료");
              }
            } catch (error) {
              console.error("❌ 거래 취소 알림 전송 실패:", error);
            }
          }
        } else {
          console.error(
            "❌ 거래 취소 시스템 메시지 추가 실패:",
            systemMessageResult.error
          );
        }
      } else {
        console.error("❌ 거래 취소 채팅방 찾기/생성 실패:", chatResult.error);
      }
    } catch (chatError) {
      console.error("❌ 거래 취소 채팅 시스템 메시지 추가 중 오류:", chatError);
      // 채팅 메시지 추가 실패해도 취소는 성공으로 처리
    }

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
