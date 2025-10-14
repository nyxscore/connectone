import { PrismaClient, TransactionStatus } from "@prisma/client";
import { EscrowStateMachine } from "./state-machine";
import {
  PaymentRequest,
  PaymentResponse,
  ShipmentRequest,
  RefundRequest,
  DisputeRequest,
} from "./types";

const prisma = new PrismaClient();

export class EscrowService {
  // 1. 결제 시작
  static async initiatePayment(
    userId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    return await prisma.$transaction(async tx => {
      // 중복 요청 방지
      if (request.idempotencyKey) {
        const existingPayment = await tx.payment.findFirst({
          where: { pgOrderId: request.idempotencyKey },
        });
        if (existingPayment) {
          return {
            success: true,
            paymentId: existingPayment.id,
            pgOrderId: existingPayment.pgOrderId,
          };
        }
      }

      // 거래 상태 검증
      const transaction = await tx.transaction.findUnique({
        where: { id: request.transactionId },
        include: { buyer: true, listing: true },
      });

      if (!transaction) {
        return { success: false, error: "거래를 찾을 수 없습니다." };
      }

      if (transaction.status !== "INITIATED") {
        return { success: false, error: "이미 처리된 거래입니다." };
      }

      if (transaction.buyerId !== userId) {
        return { success: false, error: "권한이 없습니다." };
      }

      // PG 결제 요청 (실제 구현에서는 PG SDK 사용)
      const pgResponse = await this.callPaymentGateway(request);

      if (!pgResponse.success) {
        return pgResponse;
      }

      // 결제 정보 저장
      const payment = await tx.payment.create({
        data: {
          transactionId: request.transactionId,
          userId: userId,
          amount: request.amount,
          method: request.method,
          pgProvider: request.pgProvider,
          pgOrderId: request.idempotencyKey,
          pgTransactionId: pgResponse.pgTransactionId,
          pgStatus: "pending",
        },
      });

      // 거래 상태 업데이트
      await tx.transaction.update({
        where: { id: request.transactionId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          idempotencyKey: request.idempotencyKey,
        },
      });

      // 이벤트 로그
      await tx.eventLog.create({
        data: {
          transactionId: request.transactionId,
          userId: userId,
          eventType: "payment_initiated",
          fromStatus: "INITIATED",
          toStatus: "PAID",
          description: `결제가 시작되었습니다. (${request.amount}원)`,
          metadata: {
            paymentId: payment.id,
            pgProvider: request.pgProvider,
          },
        },
      });

      // 시스템 메시지 전송
      await this.sendSystemMessage(request.transactionId, {
        messageType: "system",
        content: "🔒 결제가 완료되어 금액은 에스크로에 보관되었습니다.",
        actions: [
          {
            label: "배송지 등록 요청",
            api: "/shipment/request",
            method: "POST",
          },
        ],
      });

      return {
        success: true,
        paymentId: payment.id,
        pgOrderId: request.idempotencyKey,
        pgTransactionId: pgResponse.pgTransactionId,
        redirectUrl: pgResponse.redirectUrl,
      };
    });
  }

  // 2. 취소 승인
  static async approveCancel(
    userId: string,
    transactionId: string
  ): Promise<{ success: boolean; error?: string }> {
    return await prisma.$transaction(async tx => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        return { success: false, error: "거래를 찾을 수 없습니다." };
      }

      if (transaction.sellerId !== userId) {
        return { success: false, error: "권한이 없습니다." };
      }

      if (transaction.status !== "CANCEL_REQUESTED") {
        return { success: false, error: "취소 요청이 아닙니다." };
      }

      // 상태 전이 검증
      const validation = EscrowStateMachine.validateTransition(
        transactionId,
        "CANCEL_REQUESTED",
        "CANCELLED",
        "seller",
        { cancel_approved: true }
      );

      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      // 거래 상태 업데이트
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: "판매자 승인",
        },
      });

      // 이벤트 로그
      await tx.eventLog.create({
        data: {
          transactionId: transactionId,
          userId: userId,
          eventType: "cancel_approved",
          fromStatus: "CANCEL_REQUESTED",
          toStatus: "CANCELLED",
          description: "판매자가 취소를 승인했습니다.",
          metadata: { approvedBy: userId },
        },
      });

      // 시스템 메시지
      await this.sendSystemMessage(transactionId, {
        messageType: "system",
        content: "✅ 판매자가 취소를 승인했습니다. 환불이 진행됩니다.",
        actions: [],
      });

      return { success: true };
    });
  }

  // 3. 배송 웹훅 처리
  static async handleShipmentWebhook(
    payload: any
  ): Promise<{ success: boolean; error?: string }> {
    return await prisma.$transaction(async tx => {
      const { transactionId, eventType, data } = payload;

      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { shipments: true },
      });

      if (!transaction) {
        return { success: false, error: "거래를 찾을 수 없습니다." };
      }

      let newStatus: TransactionStatus;
      let description: string;

      switch (eventType) {
        case "picked_up":
          newStatus = "IN_TRANSIT";
          description = "상품이 택배사에서 픽업되었습니다.";
          break;
        case "delivered":
          newStatus = "DELIVERED";
          description = "상품이 배송 완료되었습니다.";
          break;
        default:
          return { success: false, error: "알 수 없는 이벤트 타입입니다." };
      }

      // 상태 전이 검증
      const validation = EscrowStateMachine.validateTransition(
        transactionId,
        newStatus,
        "system",
        "system",
        { [eventType]: true }
      );

      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      // 배송 정보 업데이트
      if (transaction.shipments.length > 0) {
        const shipment = transaction.shipments[0];
        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status: eventType === "delivered" ? "delivered" : "in_transit",
            webhookData: data,
            ...(eventType === "delivered" && { deliveredAt: new Date() }),
            ...(eventType === "picked_up" && { pickedUpAt: new Date() }),
          },
        });
      }

      // 거래 상태 업데이트
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (eventType === "delivered") {
        updateData.deliveredAt = new Date();
      }

      await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
      });

      // 이벤트 로그
      await tx.eventLog.create({
        data: {
          transactionId: transactionId,
          userId: "system",
          eventType: "shipment_updated",
          fromStatus: transaction.status,
          toStatus: newStatus,
          description: description,
          metadata: { webhookData: data, eventType },
        },
      });

      // 시스템 메시지
      const actions =
        newStatus === "DELIVERED"
          ? [
              {
                label: "구매확정",
                api: "/payment/confirm",
                method: "POST",
              },
              {
                label: "반품 요청",
                api: "/payment/cancel-request",
                method: "POST",
              },
            ]
          : [];

      await this.sendSystemMessage(transactionId, {
        messageType: "system",
        content: description,
        actions,
      });

      return { success: true };
    });
  }

  // 4. 배송 확인
  static async confirmDelivery(
    userId: string,
    transactionId: string
  ): Promise<{ success: boolean; error?: string }> {
    return await prisma.$transaction(async tx => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        return { success: false, error: "거래를 찾을 수 없습니다." };
      }

      if (transaction.buyerId !== userId) {
        return { success: false, error: "권한이 없습니다." };
      }

      if (transaction.status !== "DELIVERED") {
        return { success: false, error: "배송 완료 상태가 아닙니다." };
      }

      // 상태 전이 검증
      const validation = EscrowStateMachine.validateTransition(
        transactionId,
        "DELIVERY_CONFIRMED",
        "buyer",
        "buyer",
        { delivery_confirmed: true }
      );

      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      // 거래 상태 업데이트
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "DELIVERY_CONFIRMED",
          updatedAt: new Date(),
        },
      });

      // 이벤트 로그
      await tx.eventLog.create({
        data: {
          transactionId: transactionId,
          userId: userId,
          eventType: "delivery_confirmed",
          fromStatus: "DELIVERED",
          toStatus: "DELIVERY_CONFIRMED",
          description: "구매자가 배송을 확인했습니다.",
          metadata: { confirmedBy: userId },
        },
      });

      // 시스템 메시지
      await this.sendSystemMessage(transactionId, {
        messageType: "system",
        content: "📦 배송이 확인되었습니다. 최종 구매확정을 진행해주세요.",
        actions: [
          {
            label: "구매확정",
            api: "/payment/final-confirm",
            method: "POST",
          },
        ],
      });

      return { success: true };
    });
  }

  // 5. 환불 처리
  static async processRefund(
    request: RefundRequest
  ): Promise<{ success: boolean; error?: string }> {
    return await prisma.$transaction(async tx => {
      const transaction = await tx.transaction.findUnique({
        where: { id: request.transactionId },
        include: { payments: true },
      });

      if (!transaction) {
        return { success: false, error: "거래를 찾을 수 없습니다." };
      }

      if (!["CANCELLED", "DISPUTE"].includes(transaction.status)) {
        return { success: false, error: "환불 가능한 상태가 아닙니다." };
      }

      // 중복 환불 방지
      const existingRefund = await tx.refund.findFirst({
        where: {
          transactionId: request.transactionId,
          status: { in: ["pending", "processing", "completed"] },
        },
      });

      if (existingRefund) {
        return {
          success: false,
          error: "이미 환불 처리 중이거나 완료된 거래입니다.",
        };
      }

      // 환불 정보 저장
      const refund = await tx.refund.create({
        data: {
          transactionId: request.transactionId,
          amount: request.amount,
          reason: request.reason,
          status: "pending",
          bankCode: request.bankCode,
          accountNumber: request.accountNumber,
          accountHolder: request.accountHolder,
        },
      });

      // 거래 상태 업데이트
      await tx.transaction.update({
        where: { id: request.transactionId },
        data: {
          status: "REFUND_PENDING",
          updatedAt: new Date(),
        },
      });

      // 이벤트 로그
      await tx.eventLog.create({
        data: {
          transactionId: request.transactionId,
          userId: "system",
          eventType: "refund_initiated",
          fromStatus: transaction.status,
          toStatus: "REFUND_PENDING",
          description: `환불이 시작되었습니다. (${request.amount}원)`,
          metadata: {
            refundId: refund.id,
            reason: request.reason,
          },
        },
      });

      // PG 환불 요청 (비동기 처리)
      this.processRefundWithPG(refund.id);

      return { success: true };
    });
  }

  // 헬퍼 메서드들
  private static async callPaymentGateway(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    // 실제 구현에서는 PG SDK 사용
    // 예: Toss Payments, Kakao Pay, Iamport 등
    return {
      success: true,
      pgTransactionId: `pg_${Date.now()}`,
      redirectUrl: "https://pg.example.com/payment",
    };
  }

  private static async sendSystemMessage(
    transactionId: string,
    messageData: any
  ): Promise<void> {
    // WebSocket 또는 채팅 서비스로 메시지 전송
    // 실제 구현에서는 Socket.IO나 Pusher 등 사용
    console.log(
      `System message for transaction ${transactionId}:`,
      messageData
    );
  }

  private static async processRefundWithPG(refundId: string): Promise<void> {
    // PG 환불 API 호출
    // 성공 시 상태를 'completed'로 업데이트
    // 실패 시 상태를 'failed'로 업데이트하고 재시도 큐에 추가
  }
}



