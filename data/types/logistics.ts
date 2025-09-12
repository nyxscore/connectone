// 운송 관련 타입 정의

export interface LogisticsOrder {
  id: string;
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  quoteId: string;
  companyName: string;
  companyLogo?: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDays: {
    min: number;
    max: number;
  };
  origin: string;
  destination: string;
  floor: number;
  hasElevator: boolean;
  hasInsurance: boolean;
  status: LogisticsStatus;
  trackingNumber?: string;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  scheduledAt?: any; // Firebase Timestamp
  completedAt?: any; // Firebase Timestamp
  notes?: string;
}

export type LogisticsStatus =
  | "pending" // 대기 중
  | "confirmed" // 확정됨
  | "picked_up" // 픽업 완료
  | "in_transit" // 운송 중
  | "delivered" // 배송 완료
  | "cancelled" // 취소됨
  | "failed"; // 실패

export interface LogisticsQuote {
  id: string;
  companyName: string;
  companyLogo?: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDays: {
    min: number;
    max: number;
  };
  features: string[];
  rating: number;
  description: string;
}

export interface LogisticsQuoteRequest {
  itemId: string;
  origin: string;
  destination: string;
  floor: number;
  hasElevator: boolean;
  hasInsurance: boolean;
  itemWeight?: number;
  itemDimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface CreateLogisticsOrderInput {
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  quoteId: string;
  companyName: string;
  companyLogo?: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDays: {
    min: number;
    max: number;
  };
  origin: string;
  destination: string;
  floor: number;
  hasElevator: boolean;
  hasInsurance: boolean;
  notes?: string;
}

export interface UpdateLogisticsOrderInput {
  status?: LogisticsStatus;
  trackingNumber?: string;
  scheduledAt?: any;
  completedAt?: any;
  notes?: string;
}

// 운송 상태별 정보
export interface LogisticsStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

export const LOGISTICS_STATUS_INFO: Record<
  LogisticsStatus,
  LogisticsStatusInfo
> = {
  pending: {
    label: "대기 중",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: "⏳",
    description: "운송업체의 확인을 기다리고 있습니다.",
  },
  confirmed: {
    label: "확정됨",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: "✅",
    description: "운송이 확정되었습니다.",
  },
  picked_up: {
    label: "픽업 완료",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: "📦",
    description: "상품이 픽업되었습니다.",
  },
  in_transit: {
    label: "운송 중",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    icon: "🚚",
    description: "상품이 운송 중입니다.",
  },
  delivered: {
    label: "배송 완료",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: "🎉",
    description: "상품이 성공적으로 배송되었습니다.",
  },
  cancelled: {
    label: "취소됨",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: "❌",
    description: "운송이 취소되었습니다.",
  },
  failed: {
    label: "실패",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: "⚠️",
    description: "운송 중 문제가 발생했습니다.",
  },
};

// 운송 견적 필터
export interface LogisticsQuoteFilters {
  maxPrice?: number;
  maxDays?: number;
  hasInsurance?: boolean;
  hasElevator?: boolean;
}

// 운송 견적 정렬
export type LogisticsQuoteSortBy = "price" | "days" | "rating";
export type LogisticsQuoteSortOrder = "asc" | "desc";
