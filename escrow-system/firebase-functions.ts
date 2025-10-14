import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FirebaseEscrowStateMachine } from "./firebase-state-machine";
import { Transaction, TransactionStatus, ChatMessage } from "./firebase-schema";

admin.initializeApp();
const db = admin.firestore();

// ==================== 헬퍼 함수 ====================

async function sendSystemMessage(
  chatId: string,
  content: string,
  actions?: any[],
  statusChange?: { from: TransactionStatus; to: TransactionStatus }
): Promise<void> {
  const messageRef = db.collection("chats").doc(chatId).collection("messages");

  await messageRef.add({
    chatId,
    senderUid: "system",
    senderType: "system",
    messageType: "system",
    content,
    actions: actions || [],
    statusChange,
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
  transactionId: string,
  eventType: string,
  actorId: string,
  actorType: "buyer" | "seller" | "system" | "admin",
  description: string,
  fromStatus?: TransactionStatus,
  toStatus?: TransactionStatus,
  metadata?: any
): Promise<void> {
  await db.collection("event_logs").add({
    transactionId,
    eventType,
    actorId,
    actorType,
    description,
    fromStatus,
    toStatus,
    metadata: metadata || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function scheduleAutoConfirm(
  transactionId: string,
  executeAt: Date
): Promise<void> {
  await db.collection("scheduled_tasks").add({
    type: "auto_confirm",
    transactionId,
    scheduledAt: admin.firestore.Timestamp.fromDate(executeAt),
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 거래 문서에 자동 확정 예정 시간 저장
  await db
    .collection("transactions")
    .doc(transactionId)
    .update({
      autoConfirmAt: admin.firestore.Timestamp.fromDate(executeAt),
      autoConfirmScheduled: true,
    });
}

// ==================== Cloud Functions ====================

// 1. 결제 완료 (PG 웹훅)
export const onPaymentCompleted = functions.https.onRequest(
  async (req, res) => {
    try {
      const { transactionId, pgTransactionId, amount, pgProvider } = req.body;

      // PG 서명 검증 (실제 구현에서는 PG SDK 사용)
      // const isValid = await verifyPGSignature(req.body, req.headers);
      // if (!isValid) {
      //   res.status(400).json({ error: 'Invalid signature' });
      //   return;
      // }

      const transactionRef = db.collection("transactions").doc(transactionId);
      const transactionSnap = await transactionRef.get();

      if (!transactionSnap.exists) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      const transaction = transactionSnap.data() as Transaction;

      // 상태 검증
      if (transaction.status !== "INITIATED") {
        res.status(400).json({ error: "Invalid transaction status" });
        return;
      }

      // Payment 문서 생성
      const paymentRef = await db.collection("payments").add({
        transactionId,
        userId: transaction.buyerId,
        amount,
        currency: "KRW",
        method: "card",
        pgProvider,
        pgTransactionId,
        pgOrderId: transactionId,
        pgStatus: "completed",
        escrowStatus: "holding",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Transaction 상태 업데이트
      await transactionRef.update({
        status: "PAID",
        paymentId: paymentRef.id,
        pgTransactionId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 이벤트 로그
      await logEvent(
        transactionId,
        "payment_completed",
        "system",
        "system",
        `결제가 완료되었습니다. (${amount}원)`,
        "INITIATED",
        "PAID",
        { paymentId: paymentRef.id, pgTransactionId }
      );

      // 채팅에 시스템 메시지 전송
      const chatSnap = await db
        .collection("chats")
        .where("transactionId", "==", transactionId)
        .limit(1)
        .get();

      if (!chatSnap.empty) {
        const chatId = chatSnap.docs[0].id;
        await sendSystemMessage(
          chatId,
          "🔒 결제가 완료되어 금액은 에스크로에 보관되었습니다. 배송지 정보를 입력해주세요.",
          [
            {
              label: "배송지 등록 요청",
              actionType: "request_shipping",
              api: "/api/escrow/request-shipping",
              method: "POST",
              payload: { transactionId },
            },
          ],
          { from: "INITIATED", to: "PAID" }
        );

        // 자동으로 IN_ESCROW로 전이
        setTimeout(async () => {
          await transactionRef.update({
            status: "IN_ESCROW",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          await sendSystemMessage(
            chatId,
            "💰 결제 금액이 안전하게 에스크로에 보관되었습니다.",
            [],
            { from: "PAID", to: "IN_ESCROW" }
          );

          await logEvent(
            transactionId,
            "status_change",
            "system",
            "system",
            "에스크로 보관 완료",
            "PAID",
            "IN_ESCROW"
          );
        }, 1000);
      }

      res.json({ success: true, paymentId: paymentRef.id });
    } catch (error) {
      console.error("Payment completion error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// 2. 배송 등록
export const registerShipment = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { transactionId, courier, trackingNumber, shippingInfo } = data;
    const userId = context.auth.uid;

    const transactionRef = db.collection("transactions").doc(transactionId);
    const transactionSnap = await transactionRef.get();

    if (!transactionSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Transaction not found"
      );
    }

    const transaction = transactionSnap.data() as Transaction;

    // 권한 확인
    if (transaction.sellerId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only seller can register shipment"
      );
    }

    // 상태 검증
    if (transaction.status !== "AWAITING_SHIPMENT") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Invalid transaction status"
      );
    }

    // 거래 업데이트
    await transactionRef.update({
      status: "SHIPPED",
      shippingInfo: {
        courier,
        trackingNumber,
        ...shippingInfo,
      },
      shippedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 이벤트 로그
    await logEvent(
      transactionId,
      "shipment_registered",
      userId,
      "seller",
      `배송이 시작되었습니다. (택배사: ${courier}, 송장번호: ${trackingNumber})`,
      "AWAITING_SHIPMENT",
      "SHIPPED",
      { courier, trackingNumber }
    );

    // 채팅에 시스템 메시지
    const chatSnap = await db
      .collection("chats")
      .where("transactionId", "==", transactionId)
      .limit(1)
      .get();

    if (!chatSnap.empty) {
      const chatId = chatSnap.docs[0].id;
      await sendSystemMessage(
        chatId,
        `🚚 판매자가 상품을 발송했습니다.\n택배사: ${courier}\n송장번호: ${trackingNumber}\n배송 상태를 추적해주세요.`,
        [
          {
            label: "배송 추적",
            actionType: "track_shipment",
            api: `/api/escrow/track-shipment?courier=${courier}&trackingNumber=${trackingNumber}`,
            method: "GET",
          },
        ],
        { from: "AWAITING_SHIPMENT", to: "SHIPPED" }
      );
    }

    return { success: true };
  }
);

// 3. 취소 요청
export const requestCancel = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { transactionId, reason } = data;
  const userId = context.auth.uid;

  const transactionRef = db.collection("transactions").doc(transactionId);
  const transactionSnap = await transactionRef.get();

  if (!transactionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Transaction not found");
  }

  const transaction = transactionSnap.data() as Transaction;

  // 권한 확인 (구매자만)
  if (transaction.buyerId !== userId) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only buyer can request cancellation"
    );
  }

  // 상태 검증
  const validStatuses = [
    "PAID",
    "IN_ESCROW",
    "AWAITING_SHIPMENT",
    "SHIPPED",
    "IN_TRANSIT",
    "DELIVERED",
  ];
  if (!validStatuses.includes(transaction.status)) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Cannot cancel at this stage"
    );
  }

  // 거래 업데이트
  await transactionRef.update({
    status: "CANCEL_REQUESTED",
    cancelReason: reason,
    cancelRequestedBy: userId,
    cancelRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 이벤트 로그
  await logEvent(
    transactionId,
    "cancel_requested",
    userId,
    "buyer",
    `구매자가 취소를 요청했습니다. (사유: ${reason})`,
    transaction.status,
    "CANCEL_REQUESTED",
    { reason }
  );

  // 채팅에 시스템 메시지
  const chatSnap = await db
    .collection("chats")
    .where("transactionId", "==", transactionId)
    .limit(1)
    .get();

  if (!chatSnap.empty) {
    const chatId = chatSnap.docs[0].id;
    await sendSystemMessage(
      chatId,
      `⚠️ 구매자가 거래 취소를 요청했습니다.\n취소 사유: ${reason}\n\n판매자가 승인하면 환불이 진행됩니다.\n(24시간 내 미응답 시 자동 취소됩니다)`,
      [
        {
          label: "취소 승인",
          actionType: "approve_cancel",
          api: "/api/escrow/approve-cancel",
          method: "POST",
          payload: { transactionId },
          confirmMessage: "거래 취소를 승인하시겠습니까?",
        },
        {
          label: "고객센터 요청",
          actionType: "open_dispute",
          api: "/api/escrow/open-dispute",
          method: "POST",
          payload: { transactionId },
        },
      ],
      { from: transaction.status, to: "CANCEL_REQUESTED" }
    );
  }

  // 24시간 후 자동 취소 스케줄
  const autoConfirmTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.collection("scheduled_tasks").add({
    type: "cancel_timeout",
    transactionId,
    scheduledAt: admin.firestore.Timestamp.fromDate(autoConfirmTime),
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// 4. 취소 승인
export const approveCancel = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { transactionId } = data;
  const userId = context.auth.uid;

  const transactionRef = db.collection("transactions").doc(transactionId);
  const transactionSnap = await transactionRef.get();

  if (!transactionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Transaction not found");
  }

  const transaction = transactionSnap.data() as Transaction;

  // 권한 확인 (판매자만)
  if (transaction.sellerId !== userId) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only seller can approve cancellation"
    );
  }

  // 상태 검증
  if (transaction.status !== "CANCEL_REQUESTED") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "No cancel request found"
    );
  }

  // 거래 업데이트
  await transactionRef.update({
    status: "CANCELLED",
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 이벤트 로그
  await logEvent(
    transactionId,
    "cancel_approved",
    userId,
    "seller",
    "판매자가 취소를 승인했습니다.",
    "CANCEL_REQUESTED",
    "CANCELLED"
  );

  // 채팅에 시스템 메시지
  const chatSnap = await db
    .collection("chats")
    .where("transactionId", "==", transactionId)
    .limit(1)
    .get();

  if (!chatSnap.empty) {
    const chatId = chatSnap.docs[0].id;
    await sendSystemMessage(
      chatId,
      "✅ 판매자가 취소를 승인했습니다. 환불이 진행됩니다.",
      [],
      { from: "CANCEL_REQUESTED", to: "CANCELLED" }
    );
  }

  // 자동으로 환불 처리 시작
  setTimeout(async () => {
    await processRefund(transactionId, transaction.amount, "거래 취소");
  }, 1000);

  return { success: true };
});

// 5. 환불 처리
async function processRefund(
  transactionId: string,
  amount: number,
  reason: string
): Promise<void> {
  const transactionRef = db.collection("transactions").doc(transactionId);

  // Refund 문서 생성
  const refundRef = await db.collection("refunds").add({
    transactionId,
    paymentId: (await transactionRef.get()).data()?.paymentId,
    amount,
    reason,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Transaction 상태 업데이트
  await transactionRef.update({
    status: "REFUND_PENDING",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 이벤트 로그
  await logEvent(
    transactionId,
    "refund_initiated",
    "system",
    "system",
    `환불이 시작되었습니다. (${amount}원)`,
    "CANCELLED",
    "REFUND_PENDING",
    { refundId: refundRef.id, amount }
  );

  // 채팅에 시스템 메시지
  const chatSnap = await db
    .collection("chats")
    .where("transactionId", "==", transactionId)
    .limit(1)
    .get();

  if (!chatSnap.empty) {
    const chatId = chatSnap.docs[0].id;
    await sendSystemMessage(
      chatId,
      `💳 환불이 처리 중입니다.\n환불 금액: ${amount.toLocaleString()}원\n처리 상태: 진행 중\n\n영업일 기준 1-3일 내 계좌로 입금됩니다.`,
      [],
      { from: "CANCELLED", to: "REFUND_PENDING" }
    );
  }

  // 실제 PG 환불 API 호출 (비동기)
  // await callPGRefundAPI(refundRef.id);

  // 시뮬레이션: 3초 후 환불 완료
  setTimeout(async () => {
    await db.collection("refunds").doc(refundRef.id).update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await transactionRef.update({
      status: "REFUNDED",
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logEvent(
      transactionId,
      "refund_completed",
      "system",
      "system",
      "환불이 완료되었습니다.",
      "REFUND_PENDING",
      "REFUNDED"
    );

    if (!chatSnap.empty) {
      const chatId = chatSnap.docs[0].id;
      await sendSystemMessage(
        chatId,
        `✅ 환불이 완료되었습니다!\n환불 금액: ${amount.toLocaleString()}원\n환불 완료일: ${new Date().toLocaleDateString()}\n\n결제수단에 따라 영업일 기준 반영 시간이 다를 수 있습니다.`,
        [],
        { from: "REFUND_PENDING", to: "REFUNDED" }
      );
    }
  }, 3000);
}

// 6. 구매 확정
export const confirmPurchase = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { transactionId } = data;
  const userId = context.auth.uid;

  const transactionRef = db.collection("transactions").doc(transactionId);
  const transactionSnap = await transactionRef.get();

  if (!transactionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Transaction not found");
  }

  const transaction = transactionSnap.data() as Transaction;

  // 권한 확인 (구매자만)
  if (transaction.buyerId !== userId) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only buyer can confirm purchase"
    );
  }

  // 상태 검증
  if (
    transaction.status !== "DELIVERED" &&
    transaction.status !== "DELIVERY_CONFIRMED"
  ) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Invalid transaction status"
    );
  }

  // 거래 업데이트
  await transactionRef.update({
    status: "BUYER_CONFIRMED",
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    autoConfirmScheduled: false,
  });

  // 에스크로 해제 및 판매자 정산
  if (transaction.paymentId) {
    await db.collection("payments").doc(transaction.paymentId).update({
      escrowStatus: "released",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 이벤트 로그
  await logEvent(
    transactionId,
    "purchase_confirmed",
    userId,
    "buyer",
    "구매자가 거래를 확정했습니다.",
    transaction.status,
    "BUYER_CONFIRMED"
  );

  // 채팅에 시스템 메시지
  const chatSnap = await db
    .collection("chats")
    .where("transactionId", "==", transactionId)
    .limit(1)
    .get();

  if (!chatSnap.empty) {
    const chatId = chatSnap.docs[0].id;
    await sendSystemMessage(
      chatId,
      `🎉 거래가 성공적으로 완료되었습니다!\n판매자에게 대금이 지급되었습니다.\n거래 완료 시간: ${new Date().toLocaleString()}`,
      [
        {
          label: "거래 내역 보기",
          actionType: "view_transaction",
          api: `/api/transactions/${transactionId}`,
          method: "GET",
        },
      ],
      { from: transaction.status, to: "BUYER_CONFIRMED" }
    );
  }

  return { success: true };
});

// 7. 자동 구매확정 (Scheduled Function - Cloud Scheduler)
export const autoConfirmPurchases = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async context => {
    const now = admin.firestore.Timestamp.now();

    // 자동 확정 대상 거래 조회
    const tasksSnap = await db
      .collection("scheduled_tasks")
      .where("type", "==", "auto_confirm")
      .where("status", "==", "pending")
      .where("scheduledAt", "<=", now)
      .limit(100)
      .get();

    const promises = tasksSnap.docs.map(async taskDoc => {
      const task = taskDoc.data();
      const transactionId = task.transactionId;

      try {
        const transactionRef = db.collection("transactions").doc(transactionId);
        const transactionSnap = await transactionRef.get();

        if (!transactionSnap.exists) {
          await taskDoc.ref.update({ status: "cancelled" });
          return;
        }

        const transaction = transactionSnap.data() as Transaction;

        // 상태 확인 (아직 DELIVERED 상태인지)
        if (transaction.status === "DELIVERED") {
          // 자동 확정 처리
          await transactionRef.update({
            status: "BUYER_CONFIRMED",
            confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            autoConfirmScheduled: false,
          });

          // 에스크로 해제
          if (transaction.paymentId) {
            await db.collection("payments").doc(transaction.paymentId).update({
              escrowStatus: "released",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          // 이벤트 로그
          await logEvent(
            transactionId,
            "auto_confirmed",
            "system",
            "system",
            "자동 구매확정되었습니다.",
            "DELIVERED",
            "BUYER_CONFIRMED"
          );

          // 채팅에 시스템 메시지
          const chatSnap = await db
            .collection("chats")
            .where("transactionId", "==", transactionId)
            .limit(1)
            .get();

          if (!chatSnap.empty) {
            const chatId = chatSnap.docs[0].id;
            await sendSystemMessage(
              chatId,
              `⏰ 자동 구매확정되었습니다.\n구매자가 72시간 내에 확정하지 않아 자동으로 거래가 완료되었습니다.\n거래 완료 시간: ${new Date().toLocaleString()}`,
              [],
              { from: "DELIVERED", to: "BUYER_CONFIRMED" }
            );
          }

          await taskDoc.ref.update({
            status: "executed",
            executedAt: admin.firestore.FieldValue.serverTimestamp(),
            result: "success",
          });

          console.log(`Auto-confirmed transaction: ${transactionId}`);
        } else {
          // 이미 다른 상태로 전이됨
          await taskDoc.ref.update({ status: "cancelled" });
        }
      } catch (error) {
        console.error(
          `Error auto-confirming transaction ${transactionId}:`,
          error
        );
        await taskDoc.ref.update({
          status: "executed",
          executedAt: admin.firestore.FieldValue.serverTimestamp(),
          result: `error: ${error}`,
        });
      }
    });

    await Promise.all(promises);
    console.log(`Processed ${promises.length} auto-confirm tasks`);
  });

// 8. 배송 완료 시 자동 확정 타이머 시작
export const onDeliveryCompleted = functions.firestore
  .document("transactions/{transactionId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Transaction;
    const after = change.after.data() as Transaction;

    // DELIVERED 상태로 전이되었을 때
    if (before.status !== "DELIVERED" && after.status === "DELIVERED") {
      const transactionId = context.params.transactionId;

      // 72시간 후 자동 확정
      const autoConfirmTime = new Date(Date.now() + 72 * 60 * 60 * 1000);
      await scheduleAutoConfirm(transactionId, autoConfirmTime);

      console.log(
        `Scheduled auto-confirm for transaction ${transactionId} at ${autoConfirmTime}`
      );
    }
  });

// 9. 분쟁 신고
export const openDispute = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { transactionId, type, reason } = data;
  const userId = context.auth.uid;

  const transactionRef = db.collection("transactions").doc(transactionId);
  const transactionSnap = await transactionRef.get();

  if (!transactionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Transaction not found");
  }

  const transaction = transactionSnap.data() as Transaction;

  // 권한 확인 (거래 참여자만)
  if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Not a transaction participant"
    );
  }

  // Dispute 문서 생성
  const disputeRef = await db.collection("disputes").add({
    transactionId,
    reportedBy: userId,
    reporterRole: transaction.buyerId === userId ? "buyer" : "seller",
    type,
    reason,
    status: "open",
    evidenceUrls: [],
    evidenceDescriptions: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Transaction 상태 업데이트
  await transactionRef.update({
    status: "DISPUTE",
    disputeId: disputeRef.id,
    disputeReason: reason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 이벤트 로그
  await logEvent(
    transactionId,
    "dispute_opened",
    userId,
    transaction.buyerId === userId ? "buyer" : "seller",
    `분쟁이 신고되었습니다. (유형: ${type})`,
    transaction.status,
    "DISPUTE",
    { disputeId: disputeRef.id, type, reason }
  );

  // 채팅에 시스템 메시지
  const chatSnap = await db
    .collection("chats")
    .where("transactionId", "==", transactionId)
    .limit(1)
    .get();

  if (!chatSnap.empty) {
    const chatId = chatSnap.docs[0].id;
    await sendSystemMessage(
      chatId,
      `🛡️ 분쟁 상태입니다.\n분쟁 유형: ${type}\n분쟁 사유: ${reason}\n\n관리자 개입을 요청했습니다.\n증빙 자료를 업로드해주세요.`,
      [
        {
          label: "증빙 업로드",
          actionType: "upload_evidence",
          api: "/api/escrow/upload-evidence",
          method: "POST",
          payload: { transactionId, disputeId: disputeRef.id },
        },
      ],
      { from: transaction.status, to: "DISPUTE" }
    );
  }

  return { success: true, disputeId: disputeRef.id };
});



