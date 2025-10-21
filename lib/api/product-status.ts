/**
 * 상품 상태 관리 중앙 집중화
 * 
 * 이 파일에서 모든 상품 상태 관련 로직을 관리합니다.
 * 상태가 추가되면 여기만 수정하면 전체 앱에 반영됩니다.
 */

// 모든 가능한 상품 상태
export const ITEM_STATUS = {
  ACTIVE: "active",           // 판매중
  RESERVED: "reserved",       // 거래중 (예약됨)
  ESCROW_COMPLETED: "escrow_completed", // 결제완료 (에스크로)
  SHIPPING: "shipping",       // 배송중
  SHIPPED: "shipped",         // 배송완료
  SOLD: "sold",              // 거래완료
  CANCELLED: "cancelled",     // 취소됨
  DELETED: "deleted",        // 삭제됨
} as const;

export type ItemStatus = typeof ITEM_STATUS[keyof typeof ITEM_STATUS];

// 상태별 한글 라벨
export const STATUS_LABELS: Record<ItemStatus, string> = {
  [ITEM_STATUS.ACTIVE]: "판매중",
  [ITEM_STATUS.RESERVED]: "거래중",
  [ITEM_STATUS.ESCROW_COMPLETED]: "결제완료",
  [ITEM_STATUS.SHIPPING]: "배송중",
  [ITEM_STATUS.SHIPPED]: "배송완료",
  [ITEM_STATUS.SOLD]: "거래완료",
  [ITEM_STATUS.CANCELLED]: "취소됨",
  [ITEM_STATUS.DELETED]: "삭제됨",
};

// 상태별 색상 (Tailwind CSS)
export const STATUS_COLORS: Record<ItemStatus, string> = {
  [ITEM_STATUS.ACTIVE]: "bg-green-100 text-green-800",
  [ITEM_STATUS.RESERVED]: "bg-orange-100 text-orange-800",
  [ITEM_STATUS.ESCROW_COMPLETED]: "bg-blue-100 text-blue-800",
  [ITEM_STATUS.SHIPPING]: "bg-purple-100 text-purple-800",
  [ITEM_STATUS.SHIPPED]: "bg-indigo-100 text-indigo-800",
  [ITEM_STATUS.SOLD]: "bg-gray-100 text-gray-800",
  [ITEM_STATUS.CANCELLED]: "bg-red-100 text-red-800",
  [ITEM_STATUS.DELETED]: "bg-gray-100 text-gray-500",
};

/**
 * 필터별 상태 그룹
 * ⚠️ 주의: 이 설정이 전체 앱에 영향을 미칩니다!
 */
export const STATUS_GROUPS = {
  // 전체 목록 (기본) - 활성화된 모든 상품
  ALL_ACTIVE: [
    ITEM_STATUS.ACTIVE,
    ITEM_STATUS.RESERVED,
    ITEM_STATUS.ESCROW_COMPLETED,
    ITEM_STATUS.SHIPPING,
    ITEM_STATUS.SHIPPED,
    ITEM_STATUS.SOLD,
  ],

  // 거래 가능한 상품만
  AVAILABLE: [ITEM_STATUS.ACTIVE],

  // 거래중인 상품
  TRADING: [
    ITEM_STATUS.RESERVED,
    ITEM_STATUS.ESCROW_COMPLETED,
    ITEM_STATUS.SHIPPING,
    ITEM_STATUS.SHIPPED,
  ],

  // 배송 관련 상품
  SHIPPING_RELATED: [ITEM_STATUS.SHIPPING, ITEM_STATUS.SHIPPED],

  // 거래 완료된 상품
  COMPLETED: [ITEM_STATUS.SOLD],

  // 취소된 상품
  CANCELLED: [ITEM_STATUS.CANCELLED],

  // 전체 (취소/삭제 포함)
  ALL_INCLUDING_CANCELLED: [
    ITEM_STATUS.ACTIVE,
    ITEM_STATUS.RESERVED,
    ITEM_STATUS.ESCROW_COMPLETED,
    ITEM_STATUS.SHIPPING,
    ITEM_STATUS.SHIPPED,
    ITEM_STATUS.SOLD,
    ITEM_STATUS.CANCELLED,
  ],

  // 숨겨야 할 상품 (삭제됨)
  HIDDEN: [ITEM_STATUS.DELETED],
} as const;

/**
 * 필터 이름을 상태 배열로 변환
 */
export function getStatusFilterArray(filterName?: string): ItemStatus[] {
  if (!filterName) {
    return STATUS_GROUPS.ALL_ACTIVE;
  }

  switch (filterName) {
    case "available":
      return STATUS_GROUPS.AVAILABLE;
    case "reserved":
    case "trading":
      return STATUS_GROUPS.TRADING;
    case "shipping":
      return STATUS_GROUPS.SHIPPING_RELATED;
    case "sold":
    case "completed":
      return STATUS_GROUPS.COMPLETED;
    case "cancelled":
      return STATUS_GROUPS.CANCELLED;
    case "all":
      return STATUS_GROUPS.ALL_INCLUDING_CANCELLED;
    default:
      return STATUS_GROUPS.ALL_ACTIVE;
  }
}

/**
 * 특정 상태가 거래중 상태인지 확인
 */
export function isTradingStatus(status: ItemStatus): boolean {
  return STATUS_GROUPS.TRADING.includes(status);
}

/**
 * 특정 상태가 활성 상태인지 확인 (목록에 표시되어야 하는지)
 */
export function isActiveStatus(status: ItemStatus): boolean {
  return STATUS_GROUPS.ALL_ACTIVE.includes(status);
}

/**
 * 특정 상태가 숨김 상태인지 확인
 */
export function isHiddenStatus(status: ItemStatus): boolean {
  return STATUS_GROUPS.HIDDEN.includes(status);
}

/**
 * 상태 진행 순서 (작은 숫자가 이른 단계)
 */
export const STATUS_ORDER: Record<ItemStatus, number> = {
  [ITEM_STATUS.ACTIVE]: 1,
  [ITEM_STATUS.RESERVED]: 2,
  [ITEM_STATUS.ESCROW_COMPLETED]: 3,
  [ITEM_STATUS.SHIPPING]: 4,
  [ITEM_STATUS.SHIPPED]: 5,
  [ITEM_STATUS.SOLD]: 6,
  [ITEM_STATUS.CANCELLED]: 99,
  [ITEM_STATUS.DELETED]: 100,
};

/**
 * 상태 변경이 유효한지 검증
 */
export function isValidStatusTransition(
  from: ItemStatus,
  to: ItemStatus
): boolean {
  // 삭제된 상품은 변경 불가
  if (from === ITEM_STATUS.DELETED) {
    return false;
  }

  // 취소된 상품은 active로만 복구 가능
  if (from === ITEM_STATUS.CANCELLED) {
    return to === ITEM_STATUS.ACTIVE;
  }

  // 거래완료 후에는 변경 불가 (취소 제외)
  if (from === ITEM_STATUS.SOLD) {
    return to === ITEM_STATUS.CANCELLED;
  }

  // 일반적으로 진행 방향으로만 가능 (또는 취소)
  return (
    STATUS_ORDER[to] >= STATUS_ORDER[from] || to === ITEM_STATUS.CANCELLED
  );
}

/**
 * 디버깅용: 누락된 상태 감지
 */
export function detectMissingStatuses(
  currentStatuses: string[]
): {
  missing: string[];
  unexpected: string[];
} {
  const allKnownStatuses = Object.values(ITEM_STATUS);
  const currentSet = new Set(currentStatuses);
  const knownSet = new Set(allKnownStatuses);

  const missing = allKnownStatuses.filter(s => !currentSet.has(s));
  const unexpected = currentStatuses.filter(s => !knownSet.has(s));

  return { missing, unexpected };
}

/**
 * 상태 통계 생성
 */
export function generateStatusStats(items: Array<{ status: string }>) {
  const stats: Partial<Record<ItemStatus, number>> = {};
  const unknownStatuses: string[] = [];

  items.forEach(item => {
    const status = item.status as ItemStatus;
    if (Object.values(ITEM_STATUS).includes(status)) {
      stats[status] = (stats[status] || 0) + 1;
    } else {
      unknownStatuses.push(status);
    }
  });

  return {
    stats,
    unknownStatuses: [...new Set(unknownStatuses)],
    total: items.length,
  };
}

