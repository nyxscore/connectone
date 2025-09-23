// 사용자 등급 시스템
export type UserGrade = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export interface GradeInfo {
  grade: UserGrade;
  name: string;
  description: string;
  color: string;
  requirements: {
    safeTransactions: number;
    averageRating: number;
    disputeFree: boolean;
    totalTrades: number;
  };
}

export interface UserProgress {
  currentGrade: UserGrade;
  nextGrade: UserGrade | null;
  progress: {
    safeTransactions: number;
    averageRating: number;
    disputeFree: boolean;
    totalTrades: number;
  };
  requirements: {
    safeTransactions: number;
    averageRating: number;
    disputeFree: boolean;
    totalTrades: number;
  };
  progressPercentage: number;
}

// 사용자 관련 타입
export interface User {
  id: string;
  uid: string; // Firebase UID
  email: string;
  phoneNumber?: string;
  nickname: string;
  region: string;
  grade: UserGrade;
  profileImage?: string;
  tradeCount: number;
  reviewCount: number;
  safeTransactionCount: number;
  averageRating: number;
  disputeCount: number;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 악기 카테고리
export type InstrumentCategory =
  | "건반" // 건반악기
  | "현악" // 현악기
  | "관악" // 관악기
  | "타악" // 타악기
  | "국악" // 국악기
  | "음향" // 음향기기
  | "특수" // 특수악기
  | "용품"; // 기타용품

// 악기 상태 등급
export type ConditionGrade = "A" | "B" | "C" | "D";

// 배송 방법
export type ShippingType = "direct" | "pickup" | "courier";

// 판매글 타입
export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: InstrumentCategory;
  brand: string;
  model: string;
  year: number;
  condition: ConditionGrade;
  price: number;
  region: string;
  images: string[];
  isEscrow: boolean;
  isShipping: boolean;
  status: "active" | "sold" | "reserved" | "deleted";
  views: number;
  likes: number;
  likedBy?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// AI 처리된 이미지 정보 타입
export interface AIProcessedImage {
  imageIndex: number;
  isAiProcessed: boolean;
  emotionScore: number;
  conditionGrade: ConditionGrade;
  confidence: number;
}

// 판매글 등록용 타입 (새로운 스키마)
export interface SellItem {
  id: string;
  sellerUid: string;
  category: InstrumentCategory;
  brand: string;
  model: string;
  year: number;
  condition: ConditionGrade;
  price: number;
  region: string;
  description: string;
  images: string[];
  aiTags: string[];
  aiProcessedImages?: AIProcessedImage[]; // AI 처리된 이미지 정보
  escrowEnabled: boolean;
  shippingTypes: ShippingType[];
  parcelPaymentType?: string; // "seller" or "buyer"
  status: "active" | "sold" | "inactive";
  createdAt: any;
  updatedAt: any;
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "file";
  timestamp: Date;
  isRead: boolean;
}

// 채팅방 타입
export interface ChatRoom {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  lastMessage?: ChatMessage;
  createdAt: Date;
  updatedAt: Date;
}

// Q&A 댓글 타입
export interface Comment {
  id: string;
  productId: string;
  authorId: string;
  content: string;
  isAnswer: boolean;
  parentId?: string; // 대댓글용
  createdAt: Date;
  updatedAt: Date;
}

// AI 분석 결과 타입
export interface AIAnalysis {
  id: string;
  productId: string;
  detectedBrand?: string;
  detectedCategory?: InstrumentCategory;
  conditionAnalysis?: {
    scratches: number;
    cracks: number;
    overallScore: number;
  };
  confidence: number;
  createdAt: Date;
}

// 검색 필터 타입
export interface SearchFilters {
  category?: InstrumentCategory;
  minPrice?: number;
  maxPrice?: number;
  condition?: ConditionGrade[];
  region?: string;
  brand?: string;
  keyword?: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 페이지네이션 타입
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 결제 관련 타입
export type TransactionStatus =
  | "pending" // 결제 대기
  | "paid_hold" // 결제 완료 (에스크로 보관)
  | "shipped" // 배송 시작
  | "delivered" // 배송 완료
  | "released" // 정산 완료 (판매자에게 입금)
  | "refunded" // 환불 완료
  | "cancelled"; // 거래 취소

export interface Transaction {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: TransactionStatus;
  paymentMethod?: string;
  paymentId?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
}

export interface CreateTransactionInput {
  productId: string;
  amount: number;
  paymentMethod?: string;
}

// 악기 상태 평가 관련 타입

export type DefectType =
  | "scratch" // 스크래치
  | "dent" // 찌그러짐
  | "crack" // 균열
  | "rust" // 녹슨 부분
  | "fade" // 색상 퇴색
  | "stain" // 얼룩
  | "worn" // 마모
  | "missing_part" // 부품 누락
  | "loose" // 느슨함
  | "sticky" // 끈적임
  | "noise" // 소음
  | "tuning_issue"; // 조율 문제

export interface Defect {
  type: DefectType;
  severity: "minor" | "moderate" | "major";
  location?: string; // 예: "헤드", "바디", "넥"
  description?: string;
  confidence: number; // 0-1 사이의 신뢰도
}

export interface ConditionAssessment {
  conditionHint: ConditionGrade;
  defects: Defect[];
  overallScore: number; // 0-100 점수
  recommendations: string[];
  confidence: number; // 전체 평가의 신뢰도
}

export interface InspectionResult {
  success: boolean;
  data?: ConditionAssessment;
  error?: string;
}

// 운송 견적 관련 타입
export interface LogisticsQuote {
  id: string;
  productId: string;
  fromAddress: {
    address: string;
    floor: number;
    hasElevator: boolean;
  };
  toAddress: {
    address: string;
    floor: number;
    hasElevator: boolean;
  };
  insurance: boolean;
  estimatedPrice: number;
  estimatedDays: number;
  carrier: string;
  serviceType: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateLogisticsQuoteInput {
  productId: string;
  fromAddress: {
    address: string;
    floor: number;
    hasElevator: boolean;
  };
  toAddress: {
    address: string;
    floor: number;
    hasElevator: boolean;
  };
  insurance: boolean;
}

export interface LogisticsOrder {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  quoteId: string;
  fromAddress: {
    address: string;
    floor: number;
    hasElevator: boolean;
  };
  toAddress: {
    address: string;
    floor: number;
    hasElevator: boolean;
  };
  insurance: boolean;
  price: number;
  carrier: string;
  serviceType: string;
  status:
    | "pending"
    | "confirmed"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "cancelled";
  trackingNumber?: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLogisticsOrderInput {
  quoteId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
}

// 관리자 관련 타입
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedProductId?: string;
  reportedMessageId?: string;
  type: "user" | "product" | "message" | "transaction";
  reason: string;
  description: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  adminNotes?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AdminAction {
  id: string;
  adminId: string;
  targetType: "user" | "product" | "transaction" | "report" | "dispute";
  targetId: string;
  action:
    | "suspend"
    | "unsuspend"
    | "hide"
    | "unhide"
    | "resolve"
    | "dismiss"
    | "label";
  reason: string;
  details?: any;
  createdAt: Date;
}

export interface UserSuspension {
  id: string;
  userId: string;
  reason: string;
  duration?: number; // 일 단위, null이면 영구
  status: "active" | "expired" | "revoked";
  suspendedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedBy?: string;
}

export interface ProductLabel {
  id: string;
  productId: string;
  type: "sentiment" | "warranty";
  value: string;
  confidence?: number;
  assignedBy: "ai" | "admin";
  assignedAt: Date;
  adminId?: string;
}

// 이메일 알림 관련 타입
export type NotificationType =
  | "new_message"
  | "transaction_update"
  | "logistics_quote"
  | "question_answer"
  | "payment_status"
  | "product_interest"
  | "system_announcement";

export interface EmailNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  templateId: string;
  data: Record<string, any>;
  status: "pending" | "sent" | "failed" | "delivered";
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: {
    newMessage: boolean;
    transactionUpdate: boolean;
    logisticsQuote: boolean;
    questionAnswer: boolean;
    paymentStatus: boolean;
    productInterest: boolean;
    systemAnnouncement: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    newMessage: boolean;
    transactionUpdate: boolean;
    logisticsQuote: boolean;
    questionAnswer: boolean;
    paymentStatus: boolean;
    productInterest: boolean;
    systemAnnouncement: boolean;
  };
  updatedAt: Date;
}

export interface NotificationTrigger {
  id: string;
  type: NotificationType;
  userId: string;
  data: Record<string, any>;
  priority: "low" | "normal" | "high" | "urgent";
  scheduledAt?: Date;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  processedAt?: Date;
}

// 상품 목록 응답 타입
export interface ProductListResponse {
  products: Product[];
  pagination: Pagination;
}

// 사용자 등급별 혜택 (기존 인터페이스 - 제거됨)
