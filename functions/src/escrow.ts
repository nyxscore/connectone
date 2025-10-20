import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ==================== 헬퍼 함수 ====================

async function sendSystemMessage(
  chatId: string,
  transactionId: string,
  content: string
): Promise<void> {
  const messageRef = db.collection("chats").doc(chatId).collection("messages");

  await messageRef.add({
    chatId,
    transactionId,
    senderUid: "system",
    senderType: "system",
    messageType: "system",
    content,
    readBy: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 채팅 마지막 메시지 업데이트
  await db.collection("chats").doc(chatId).update({
    lastMessage: content,
    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    lastMessageSender: "system",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function logEvent(
  itemId: string,
  eventType: string,
  actorId: string,
  description: string,
  metadata?: any
): Promise<void> {
  await db.collection("event_logs").add({
    itemId,
    eventType,
    actorId,
    description,
    metadata: metadata || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ==================== Cloud Functions ====================

// 1. 거래 시작 (판매자 → 구매자 지정)
export const startTransaction = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "인증이 필요합니다."
      );
    }

    const { itemId, buyerUid, chatId } = data;
    const sellerId = context.auth.uid;

    try {
      const itemRef = db.collection("items").doc(itemId);
      const itemSnap = await itemRef.get();

      if (!itemSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "상품을 찾을 수 없습니다."
        );
      }

      const item = itemSnap.data();

      // 권한 확인 (판매자만)
      if (item?.sellerUid !== sellerId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "판매자만 거래를 시작할 수 있습니다."
        );
      }

      // 상태 확인
      if (item?.status !== "active" && item?.status !== "escrow_completed") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "거래를 시작할 수 없는 상태입니다."
        );
      }

      // 이미 거래중인지 확인
      if (item?.status === "reserved") {
        throw new functions.https.HttpsError(
          "already-exists",
          "이미 거래가 진행중입니다."
        );
      }

      // 상품 상태 업데이트
      await itemRef.update({
        status: "reserved",
        buyerUid,
        buyerId: buyerUid, // 호환성
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 이벤트 로그
      await logEvent(
        itemId,
        "transaction_started",
        sellerId,
        `거래가 시작되었습니다. (구매자: ${buyerUid})`,
        { buyerUid, sellerId }
      );

      // 채팅에 시스템 메시지
      if (chatId) {
        await sendSystemMessage(
          chatId,
          itemId,
          `거래가 시작되었습니다!\n판매자와 구매자가 연결되었습니다.`
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error("거래 시작 오류:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// 2. 배송 등록 (판매자)
export const registerShipment = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "인증이 필요합니다."
      );
    }

    const { itemId, chatId, courier, trackingNumber } = data;
    const userId = context.auth.uid;

    try {
      const itemRef = db.collection("items").doc(itemId);
      const itemSnap = await itemRef.get();

      if (!itemSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "상품을 찾을 수 없습니다."
        );
      }

      const item = itemSnap.data();

      // 권한 확인 (판매자만)
      if (item?.sellerUid !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "판매자만 배송 등록이 가능합니다."
        );
      }

      // 상태 확인
      if (item?.status !== "escrow_completed") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "안전결제 완료 상태에서만 배송 등록이 가능합니다."
        );
      }

      // 상품 상태 업데이트
      await itemRef.update({
        status: "shipping",
        shippingInfo: {
          courier,
          trackingNumber,
        },
        shippedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 이벤트 로그
      await logEvent(
        itemId,
        "shipment_registered",
        userId,
        `배송이 시작되었습니다. (택배사: ${courier}, 송장번호: ${trackingNumber})`,
        { courier, trackingNumber }
      );

      // 채팅에 시스템 메시지
      if (chatId) {
        await sendSystemMessage(
          chatId,
          itemId,
          `상품이 발송되었습니다!\n택배사: ${getCourierName(courier)}\n송장번호: ${trackingNumber}\n배송 추적이 가능합니다.`
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error("배송 등록 오류:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// 3. 구매 확정 (구매자)
export const confirmPurchase = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "인증이 필요합니다."
      );
    }

    const { itemId, chatId } = data;
    const userId = context.auth.uid;

    try {
      const itemRef = db.collection("items").doc(itemId);
      const itemSnap = await itemRef.get();

      if (!itemSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "상품을 찾을 수 없습니다."
        );
      }

      const item = itemSnap.data();

      // 권한 확인 (구매자만)
      if (item?.buyerUid !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "구매자만 구매확정이 가능합니다."
        );
      }

      // 상태 확인
      if (item?.status !== "shipping" && item?.status !== "shipped") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "배송 중 또는 배송 완료 상태에서만 구매확정이 가능합니다."
        );
      }

      // 상품 상태 업데이트
      await itemRef.update({
        status: "sold",
        soldAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        autoConfirmScheduled: false,
      });

      // 이벤트 로그
      await logEvent(
        itemId,
        "purchase_confirmed",
        userId,
        "구매자가 거래를 확정했습니다.",
        { confirmedBy: userId }
      );

      // 채팅에 시스템 메시지
      if (chatId) {
        await sendSystemMessage(
          chatId,
          itemId,
          `거래가 성공적으로 완료되었습니다!\n거래 완료 시간: ${new Date().toLocaleString()}\n감사합니다!`
        );
      }

      // TODO: 판매자에게 알림 전송 (나중에 구현)
      console.log("알림 전송 필요:", item.sellerUid);

      return { success: true };
    } catch (error: any) {
      console.error("구매확정 오류:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// 4. 자동 구매확정 (Scheduled - 매 1시간마다)
export const autoConfirmPurchases = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context: any) => {
    const now = admin.firestore.Timestamp.now();
    const cutoffTime = admin.firestore.Timestamp.fromMillis(
      now.toMillis() - 72 * 60 * 60 * 1000 // 72시간 전
    );

    try {
      // 자동 확정 대상 상품 조회 (배송 완료 후 72시간 경과)
      const itemsSnap = await db
        .collection("items")
        .where("status", "==", "shipped")
        .where("shippedAt", "<=", cutoffTime)
        .where("autoConfirmScheduled", "!=", true)
        .limit(100)
        .get();

      console.log(`자동 확정 대상 상품: ${itemsSnap.size}개`);

      const promises = itemsSnap.docs.map(async itemDoc => {
        const itemId = itemDoc.id;
        const item = itemDoc.data();

        try {
          // 상품 상태 업데이트
          await itemDoc.ref.update({
            status: "sold",
            soldAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            autoConfirmScheduled: true,
          });

          // 이벤트 로그
          await logEvent(
            itemId,
            "auto_confirmed",
            "system",
            "자동 구매확정되었습니다. (72시간 경과)",
            { autoConfirmed: true }
          );

          // 채팅에 시스템 메시지
          const chatSnap = await db
            .collection("chats")
            .where("itemId", "==", itemId)
            .limit(1)
            .get();

          if (!chatSnap.empty) {
            const chatId = chatSnap.docs[0].id;
            await sendSystemMessage(
              chatId,
              itemId,
              `자동 구매확정되었습니다.\n구매자가 72시간 내에 확정하지 않아 자동으로 거래가 완료되었습니다.\n거래 완료 시간: ${new Date().toLocaleString()}`
            );
          }

          // TODO: 판매자에게 알림 (나중에 구현)
          console.log("자동확정 알림 필요:", item.sellerUid);

          console.log(`자동 확정 완료: ${itemId}`);
        } catch (error) {
          console.error(`자동 확정 실패 (${itemId}):`, error);
        }
      });

      await Promise.all(promises);
      console.log(`자동 확정 처리 완료: ${promises.length}개`);

      return null;
    } catch (error) {
      console.error("자동 확정 실행 오류:", error);
      return null;
    }
  });

// 5. 거래 취소 (구매자/판매자)
export const cancelTransaction = functions.https.onCall(
  async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "인증이 필요합니다."
      );
    }

    const { itemId, chatId, reason } = data;
    const userId = context.auth.uid;

    try {
      const itemRef = db.collection("items").doc(itemId);
      const itemSnap = await itemRef.get();

      if (!itemSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "상품을 찾을 수 없습니다."
        );
      }

      const item = itemSnap.data();

      // 권한 확인 (구매자 또는 판매자)
      if (item?.buyerUid !== userId && item?.sellerUid !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "거래 참여자만 취소가 가능합니다."
        );
      }

      // 상태 확인 (sold가 아닌 경우만)
      if (item?.status === "sold") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "이미 완료된 거래입니다."
        );
      }

      // 상품 상태 업데이트 (다시 판매중으로)
      await itemRef.update({
        status: "active",
        buyerUid: admin.firestore.FieldValue.delete(),
        buyerId: admin.firestore.FieldValue.delete(),
        transactionCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelReason: reason,
        cancelledBy: userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 이벤트 로그
      await logEvent(
        itemId,
        "transaction_cancelled",
        userId,
        `거래가 취소되었습니다. (사유: ${reason})`,
        { reason, cancelledBy: userId }
      );

      // 채팅에 시스템 메시지
      if (chatId) {
        await sendSystemMessage(
          chatId,
          itemId,
          `거래가 취소되었습니다.\n취소 사유: ${reason}\n취소 시간: ${new Date().toLocaleString()}`
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error("거래 취소 오류:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// 헬퍼: 택배사 이름
function getCourierName(code: string): string {
  const couriers: Record<string, string> = {
    cj: "CJ대한통운",
    hanjin: "한진택배",
    lotte: "롯데택배",
    epost: "우체국택배",
    kdexp: "경동택배",
  };
  return couriers[code] || code;
}
