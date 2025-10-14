// 에스크로 상태 머신 (ConnectOne 통합 버전)

export type EscrowStatus =
  | "initiated" // 거래 시작
  | "escrow_completed" // 안전결제 완료 (에스크로)
  | "shipping" // 배송 중
  | "shipped" // 배송 완료
  | "sold" // 거래 완료
  | "cancelled"; // 취소됨

export interface StateTransition {
  from: EscrowStatus;
  to: EscrowStatus;
  trigger: "buyer" | "seller" | "system" | "admin";
  conditions?: string[];
  autoTransition?: boolean;
  timeout?: number;
}

export class EscrowStateMachine {
  private static readonly VALID_TRANSITIONS: StateTransition[] = [
    // initiated → escrow_completed (구매자 안전결제)
    {
      from: "initiated",
      to: "escrow_completed",
      trigger: "buyer",
      conditions: ["payment_completed"],
    },

    // escrow_completed → shipping (판매자 송장 등록)
    {
      from: "escrow_completed",
      to: "shipping",
      trigger: "seller",
      conditions: ["tracking_number_provided"],
    },

    // shipping → shipped (배송 완료)
    {
      from: "shipping",
      to: "shipped",
      trigger: "system",
      conditions: ["delivery_completed"],
    },

    // shipped → sold (구매자 구매확정)
    {
      from: "shipped",
      to: "sold",
      trigger: "buyer",
      conditions: ["purchase_confirmed"],
    },

    // shipped → sold (자동 확정, 72시간)
    {
      from: "shipped",
      to: "sold",
      trigger: "system",
      autoTransition: true,
      timeout: 72 * 60 * 60 * 1000,
    },

    // 취소 관련
    {
      from: "initiated",
      to: "cancelled",
      trigger: "buyer",
      conditions: ["cancel_requested"],
    },

    {
      from: "escrow_completed",
      to: "cancelled",
      trigger: "buyer",
      conditions: ["cancel_approved"],
    },

    {
      from: "shipping",
      to: "cancelled",
      trigger: "buyer",
      conditions: ["cancel_approved"],
    },
  ];

  static canTransition(
    from: EscrowStatus,
    to: EscrowStatus,
    trigger: "buyer" | "seller" | "system" | "admin"
  ): boolean {
    return this.VALID_TRANSITIONS.some(
      transition =>
        transition.from === from &&
        transition.to === to &&
        transition.trigger === trigger
    );
  }

  static validateTransition(
    from: EscrowStatus,
    to: EscrowStatus,
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

  static getAutoConfirmTimeout(status: EscrowStatus): number | null {
    const transition = this.VALID_TRANSITIONS.find(
      t => t.from === status && t.autoTransition && t.timeout
    );
    return transition?.timeout || null;
  }

  static getStatusDisplayName(status: EscrowStatus): string {
    const statusNames: Record<EscrowStatus, string> = {
      initiated: "거래 시작",
      escrow_completed: "안전결제 완료",
      shipping: "배송 중",
      shipped: "배송 완료",
      sold: "거래 완료",
      cancelled: "거래 취소",
    };
    return statusNames[status] || status;
  }

  static getAllowedActions(
    status: EscrowStatus,
    userRole: "buyer" | "seller"
  ): string[] {
    const actions: string[] = [];

    switch (status) {
      case "initiated":
        if (userRole === "buyer") {
          actions.push("initiate_payment", "cancel");
        }
        break;

      case "escrow_completed":
        if (userRole === "seller") {
          actions.push("register_shipment");
        }
        if (userRole === "buyer") {
          actions.push("request_cancel");
        }
        break;

      case "shipping":
        if (userRole === "seller") {
          actions.push("update_shipment");
        }
        if (userRole === "buyer") {
          actions.push("track_shipment");
        }
        break;

      case "shipped":
        if (userRole === "buyer") {
          actions.push("confirm_purchase");
        }
        break;

      case "sold":
      case "cancelled":
        actions.push("view_details");
        break;
    }

    return actions;
  }
}



