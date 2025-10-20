import { TransactionStatus } from "./firebase-schema";

export interface StateTransition {
  from: TransactionStatus;
  to: TransactionStatus;
  trigger: "buyer" | "seller" | "system" | "admin";
  conditions?: string[];
  autoTransition?: boolean;
  timeout?: number; // milliseconds
  requiresApproval?: boolean;
}

export class FirebaseEscrowStateMachine {
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

    // SHIPPED → IN_TRANSIT (택배사 웹훅 또는 시스템)
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

    // DELIVERED → BUYER_CONFIRMED (자동 확정, 72시간 후)
    {
      from: "DELIVERED",
      to: "BUYER_CONFIRMED",
      trigger: "system",
      autoTransition: true,
      timeout: 72 * 60 * 60 * 1000, // 72시간
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

    // 자동 취소 (판매자 미응답, 24시간)
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

    {
      from: "AWAITING_SHIPMENT",
      to: "DISPUTE",
      trigger: "buyer",
      conditions: ["seller_non_response"],
    },

    // 관리자 개입
    {
      from: "DISPUTE",
      to: "REFUNDED",
      trigger: "admin",
      conditions: ["admin_resolution"],
      requiresApproval: true,
    },

    {
      from: "DISPUTE",
      to: "BUYER_CONFIRMED",
      trigger: "admin",
      conditions: ["admin_resolution"],
      requiresApproval: true,
    },

    {
      from: "DISPUTE",
      to: "CANCELLED",
      trigger: "admin",
      conditions: ["admin_resolution"],
      requiresApproval: true,
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

  static getAutoTransitions(
    currentStatus: TransactionStatus
  ): StateTransition[] {
    return this.VALID_TRANSITIONS.filter(
      transition =>
        transition.from === currentStatus && transition.autoTransition
    );
  }

  static getTransitionWithTimeout(
    currentStatus: TransactionStatus
  ): StateTransition | null {
    const transitions = this.VALID_TRANSITIONS.filter(
      transition =>
        transition.from === currentStatus &&
        transition.autoTransition &&
        transition.timeout
    );

    return transitions.length > 0 ? transitions[0] : null;
  }

  static validateTransition(
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

  // 상태에 따른 허용 액션 반환
  static getAllowedActions(
    status: TransactionStatus,
    userRole: "buyer" | "seller" | "admin"
  ): string[] {
    const actions: string[] = [];

    switch (status) {
      case "INITIATED":
        if (userRole === "buyer") {
          actions.push("initiate_payment", "cancel");
        }
        break;

      case "PAID":
      case "IN_ESCROW":
        if (userRole === "buyer") {
          actions.push("request_shipping", "request_cancel");
        }
        break;

      case "AWAITING_SHIPMENT":
        if (userRole === "seller") {
          actions.push("register_shipment");
        }
        if (userRole === "buyer") {
          actions.push("request_cancel", "open_dispute");
        }
        break;

      case "SHIPPED":
      case "IN_TRANSIT":
        if (userRole === "buyer") {
          actions.push("track_shipment", "request_cancel");
        }
        if (userRole === "seller") {
          actions.push("update_shipment");
        }
        break;

      case "DELIVERED":
        if (userRole === "buyer") {
          actions.push(
            "confirm_delivery",
            "confirm_purchase",
            "request_return",
            "open_dispute"
          );
        }
        break;

      case "DELIVERY_CONFIRMED":
        if (userRole === "buyer") {
          actions.push("confirm_purchase");
        }
        break;

      case "CANCEL_REQUESTED":
        if (userRole === "seller") {
          actions.push("approve_cancel", "reject_cancel");
        }
        if (userRole === "buyer") {
          actions.push("open_dispute");
        }
        break;

      case "DISPUTE":
        if (userRole === "admin") {
          actions.push("resolve_dispute", "request_evidence");
        }
        actions.push("upload_evidence", "add_comment");
        break;

      case "BUYER_CONFIRMED":
      case "REFUNDED":
      case "CANCELLED":
        // 완료된 거래, 제한적인 액션만
        actions.push("view_details", "download_receipt");
        break;
    }

    return actions;
  }

  // 상태 표시명 (한국어)
  static getStatusDisplayName(status: TransactionStatus): string {
    const statusNames: Record<TransactionStatus, string> = {
      INITIATED: "거래 시작",
      PAID: "결제 완료",
      IN_ESCROW: "에스크로 보관",
      AWAITING_SHIPMENT: "배송 대기",
      SHIPPED: "배송 시작",
      IN_TRANSIT: "배송 중",
      DELIVERED: "배송 완료",
      DELIVERY_CONFIRMED: "배송 확인",
      BUYER_CONFIRMED: "거래 완료",
      CANCEL_REQUESTED: "취소 요청",
      CANCELLED: "거래 취소",
      REFUND_PENDING: "환불 대기",
      REFUNDED: "환불 완료",
      DISPUTE: "분쟁",
    };

    return statusNames[status] || status;
  }
}












