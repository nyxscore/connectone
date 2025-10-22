// 직거래용 간단한 거래 상태 타입

export type DirectTradeStatus =
  | "waiting" // 거래 대기
  | "trading" // 거래중
  | "completed"; // 거래완료

export interface DirectTradeState {
  status: DirectTradeStatus;
  updatedAt: Date;
  updatedBy: string; // 사용자 UID
  notes?: string; // 추가 메모
}

export interface DirectTradeTransition {
  from: DirectTradeStatus;
  to: DirectTradeStatus;
  trigger: "buyer" | "seller" | "system";
  conditions?: string[];
}

export class DirectTradeStateMachine {
  private static readonly VALID_TRANSITIONS: DirectTradeTransition[] = [
    // 거래 대기 → 거래중 (구매자 또는 판매자가 거래 시작)
    {
      from: "waiting",
      to: "trading",
      trigger: "buyer",
      conditions: ["trade_started"],
    },
    {
      from: "waiting",
      to: "trading",
      trigger: "seller",
      conditions: ["trade_started"],
    },

    // 거래중 → 거래완료 (구매자 또는 판매자가 거래 완료)
    {
      from: "trading",
      to: "completed",
      trigger: "buyer",
      conditions: ["trade_completed"],
    },
    {
      from: "trading",
      to: "completed",
      trigger: "seller",
      conditions: ["trade_completed"],
    },

    // 거래중 → 거래 대기 (거래 취소)
    {
      from: "trading",
      to: "waiting",
      trigger: "buyer",
      conditions: ["trade_cancelled"],
    },
    {
      from: "trading",
      to: "waiting",
      trigger: "seller",
      conditions: ["trade_cancelled"],
    },
  ];

  static canTransition(
    from: DirectTradeStatus,
    to: DirectTradeStatus,
    trigger: "buyer" | "seller" | "system"
  ): boolean {
    return this.VALID_TRANSITIONS.some(
      transition =>
        transition.from === from &&
        transition.to === to &&
        transition.trigger === trigger
    );
  }

  static getValidTransitions(
    currentStatus: DirectTradeStatus,
    userRole: "buyer" | "seller"
  ): DirectTradeStatus[] {
    return this.VALID_TRANSITIONS.filter(
      transition =>
        transition.from === currentStatus &&
        (transition.trigger === userRole || transition.trigger === "system")
    ).map(transition => transition.to);
  }

  static getStatusDisplayName(status: DirectTradeStatus): string {
    switch (status) {
      case "waiting":
        return "거래 대기";
      case "trading":
        return "거래중";
      case "completed":
        return "거래완료";
      default:
        return "알 수 없음";
    }
  }

  static getStatusDescription(status: DirectTradeStatus): string {
    switch (status) {
      case "waiting":
        return "거래가 시작되기를 기다리고 있습니다";
      case "trading":
        return "거래가 진행 중입니다";
      case "completed":
        return "거래가 완료되었습니다";
      default:
        return "";
    }
  }

  static getStatusColor(status: DirectTradeStatus): string {
    switch (status) {
      case "waiting":
        return "text-yellow-600 bg-yellow-100";
      case "trading":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  }
}
