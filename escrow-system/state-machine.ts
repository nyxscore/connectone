import { TransactionStatus, StateTransition } from "./types";

export class EscrowStateMachine {
  private static readonly VALID_TRANSITIONS: StateTransition[] = [
    // INITIATED → PAID (구매자 결제)
    {
      from: "INITIATED",
      to: "PAID",
      trigger: "buyer",
      conditions: ["payment_completed"],
    },

    // PAID → IN_ESCROW (시스템 자동)
    {
      from: "PAID",
      to: "IN_ESCROW",
      trigger: "system",
      autoTransition: true,
    },

    // IN_ESCROW → AWAITING_SHIPMENT (구매자 배송지 요청)
    {
      from: "IN_ESCROW",
      to: "AWAITING_SHIPMENT",
      trigger: "buyer",
      conditions: ["shipping_address_provided"],
    },

    // AWAITING_SHIPMENT → SHIPPED (판매자 송장 등록)
    {
      from: "AWAITING_SHIPMENT",
      to: "SHIPPED",
      trigger: "seller",
      conditions: ["tracking_number_provided"],
    },

    // SHIPPED → IN_TRANSIT (택배사 웹훅)
    {
      from: "SHIPPED",
      to: "IN_TRANSIT",
      trigger: "system",
      conditions: ["courier_picked_up"],
    },

    // IN_TRANSIT → DELIVERED (택배사 웹훅)
    {
      from: "IN_TRANSIT",
      to: "DELIVERED",
      trigger: "system",
      conditions: ["courier_delivered"],
    },

    // DELIVERED → DELIVERY_CONFIRMED (구매자 확인)
    {
      from: "DELIVERED",
      to: "DELIVERY_CONFIRMED",
      trigger: "buyer",
      conditions: ["delivery_confirmed"],
    },

    // DELIVERY_CONFIRMED → BUYER_CONFIRMED (구매자 최종 확정)
    {
      from: "DELIVERY_CONFIRMED",
      to: "BUYER_CONFIRMED",
      trigger: "buyer",
      conditions: ["purchase_confirmed"],
    },

    // 취소 관련 전이
    {
      from: "INITIATED",
      to: "CANCELLED",
      trigger: "buyer",
      conditions: ["no_payment_made"],
    },

    {
      from: "PAID",
      to: "CANCEL_REQUESTED",
      trigger: "buyer",
      conditions: ["cancel_requested"],
    },

    {
      from: "IN_ESCROW",
      to: "CANCEL_REQUESTED",
      trigger: "buyer",
      conditions: ["cancel_requested"],
    },

    {
      from: "AWAITING_SHIPMENT",
      to: "CANCEL_REQUESTED",
      trigger: "buyer",
      conditions: ["cancel_requested"],
    },

    {
      from: "SHIPPED",
      to: "CANCEL_REQUESTED",
      trigger: "buyer",
      conditions: ["cancel_requested"],
    },

    {
      from: "IN_TRANSIT",
      to: "CANCEL_REQUESTED",
      trigger: "buyer",
      conditions: ["cancel_requested"],
    },

    {
      from: "DELIVERED",
      to: "CANCEL_REQUESTED",
      trigger: "buyer",
      conditions: ["cancel_requested"],
    },

    // 판매자 취소 승인
    {
      from: "CANCEL_REQUESTED",
      to: "CANCELLED",
      trigger: "seller",
      conditions: ["cancel_approved"],
    },

    // 자동 취소 (판매자 미응답)
    {
      from: "CANCEL_REQUESTED",
      to: "CANCELLED",
      trigger: "system",
      autoTransition: true,
      timeout: 24 * 60 * 60 * 1000, // 24시간
    },

    // 환불 처리
    {
      from: "CANCELLED",
      to: "REFUND_PENDING",
      trigger: "system",
      autoTransition: true,
    },

    {
      from: "REFUND_PENDING",
      to: "REFUNDED",
      trigger: "system",
      conditions: ["refund_completed"],
    },

    // 분쟁 처리
    {
      from: "CANCEL_REQUESTED",
      to: "DISPUTE",
      trigger: "buyer",
      conditions: ["dispute_opened"],
    },

    {
      from: "DELIVERED",
      to: "DISPUTE",
      trigger: "buyer",
      conditions: ["quality_issue_reported"],
    },

    // 관리자 개입
    {
      from: "DISPUTE",
      to: "REFUNDED",
      trigger: "admin",
      conditions: ["admin_resolution"],
    },

    {
      from: "DISPUTE",
      to: "BUYER_CONFIRMED",
      trigger: "admin",
      conditions: ["admin_resolution"],
    },
  ];

  static canTransition(
    from: TransactionStatus,
    to: TransactionStatus,
    trigger: "buyer" | "seller" | "system" | "admin"
  ): boolean {
    return this.VALID_TRANSITIONS.some(
      transition =>
        transition.from === from &&
        transition.to === to &&
        transition.trigger === trigger
    );
  }

  static getValidTransitions(
    currentStatus: TransactionStatus,
    trigger: "buyer" | "seller" | "system" | "admin"
  ): TransactionStatus[] {
    return this.VALID_TRANSITIONS.filter(
      transition =>
        transition.from === currentStatus && transition.trigger === trigger
    ).map(transition => transition.to);
  }

  static getAutoTransitions(): StateTransition[] {
    return this.VALID_TRANSITIONS.filter(
      transition => transition.autoTransition
    );
  }

  static validateTransition(
    transactionId: string,
    from: TransactionStatus,
    to: TransactionStatus,
    trigger: "buyer" | "seller" | "system" | "admin",
    conditions?: Record<string, any>
  ): { valid: boolean; reason?: string } {
    const transition = this.VALID_TRANSITIONS.find(
      t => t.from === from && t.to === to && t.trigger === trigger
    );

    if (!transition) {
      return {
        valid: false,
        reason: `Invalid transition from ${from} to ${to} triggered by ${trigger}`,
      };
    }

    // 조건 검증
    if (transition.conditions && conditions) {
      for (const condition of transition.conditions) {
        if (!conditions[condition]) {
          return {
            valid: false,
            reason: `Condition not met: ${condition}`,
          };
        }
      }
    }

    return { valid: true };
  }
}



