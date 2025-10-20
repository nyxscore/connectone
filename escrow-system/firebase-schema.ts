// Firebase Firestore 데이터 구조

// ==================== COLLECTIONS ====================

// /transactions/{transactionId}
export interface Transaction {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImages: string[];

  // 참여자
  buyerId: string;
  buyerNickname: string;
  buyerProfileImage?: string;
  sellerId: string;
  sellerNickname: string;
  sellerProfileImage?: string;

  // 상태
  status: TransactionStatus;
  previousStatus?: TransactionStatus;

  // 금액
  amount: number;
  escrowAmount: number;
  platformFee: number;

  // 결제 정보
  paymentId?: string;
  paymentMethod?: "card" | "bank_transfer";
  pgProvider?: "toss" | "kakaopay" | "iamport";
  pgTransactionId?: string;
  pgOrderId?: string;

  // 배송 정보
  shippingInfo?: {
    courier: string;
    trackingNumber: string;
    recipientName: string;
    recipientPhone: string;
    address: string;
    addressDetail?: string;
    postalCode: string;
    memo?: string;
  };

  // 타임스탬프
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  paidAt?: FirebaseFirestore.Timestamp;
  shippedAt?: FirebaseFirestore.Timestamp;
  deliveredAt?: FirebaseFirestore.Timestamp;
  confirmedAt?: FirebaseFirestore.Timestamp;
  cancelledAt?: FirebaseFirestore.Timestamp;
  refundedAt?: FirebaseFirestore.Timestamp;

  // 취소/환불 정보
  cancelReason?: string;
  cancelRequestedBy?: string;
  cancelRequestedAt?: FirebaseFirestore.Timestamp;

  // 분쟁 정보
  disputeId?: string;
  disputeReason?: string;

  // 자동 확정 타이머
  autoConfirmAt?: FirebaseFirestore.Timestamp;
  autoConfirmScheduled?: boolean;

  // 메타데이터
  metadata?: Record<string, any>;
}

export type TransactionStatus =
  | "INITIATED"
  | "PAID"
  | "IN_ESCROW"
  | "AWAITING_SHIPMENT"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DELIVERY_CONFIRMED"
  | "BUYER_CONFIRMED"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "DISPUTE";

// /chats/{chatId}
export interface Chat {
  id: string;
  transactionId: string;
  listingId: string;

  // 참여자
  buyerUid: string;
  sellerUid: string;
  participants: string[];

  // 상태
  status: "active" | "archived";

  // 안읽은 메시지
  buyerUnreadCount: number;
  sellerUnreadCount: number;

  // 마지막 읽은 시간
  buyerLastReadAt?: FirebaseFirestore.Timestamp;
  sellerLastReadAt?: FirebaseFirestore.Timestamp;

  // 마지막 메시지
  lastMessage?: string;
  lastMessageAt?: FirebaseFirestore.Timestamp;
  lastMessageSender?: string;

  // 타임스탬프
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// /chats/{chatId}/messages/{messageId}
export interface ChatMessage {
  id: string;
  chatId: string;
  transactionId: string;

  // 발신자
  senderUid: string; // "system", "buyer_uid", "seller_uid"
  senderType: "buyer" | "seller" | "system" | "admin";

  // 메시지 타입
  messageType: "text" | "system" | "action";
  content: string;

  // 액션 버튼 (시스템 메시지)
  actions?: Array<{
    label: string;
    actionType: string;
    api: string;
    method: "GET" | "POST";
    payload?: Record<string, any>;
    confirmMessage?: string;
    disabled?: boolean;
  }>;

  // 상태 정보 (시스템 메시지)
  statusChange?: {
    from: TransactionStatus;
    to: TransactionStatus;
  };

  // 읽음 상태
  readBy: string[];

  // 타임스탬프
  createdAt: FirebaseFirestore.Timestamp;
}

// /payments/{paymentId}
export interface Payment {
  id: string;
  transactionId: string;
  userId: string;

  // 결제 정보
  amount: number;
  currency: string;
  method: "card" | "bank_transfer";

  // PG 정보
  pgProvider: "toss" | "kakaopay" | "iamport";
  pgTransactionId?: string;
  pgOrderId?: string;
  pgStatus: "pending" | "completed" | "failed" | "cancelled";

  // 에스크로
  escrowStatus: "holding" | "released" | "refunded";

  // 타임스탬프
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  failedAt?: FirebaseFirestore.Timestamp;

  // 실패 정보
  failureReason?: string;

  // 메타데이터
  metadata?: Record<string, any>;
}

// /refunds/{refundId}
export interface Refund {
  id: string;
  transactionId: string;
  paymentId: string;

  // 환불 정보
  amount: number;
  reason: string;
  status: "pending" | "processing" | "completed" | "failed";

  // 계좌 정보 (암호화 필요)
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;

  // PG 환불
  pgRefundId?: string;
  pgStatus?: string;

  // 타임스탬프
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  processedAt?: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;

  // 실패 정보
  failureReason?: string;
}

// /disputes/{disputeId}
export interface Dispute {
  id: string;
  transactionId: string;

  // 신고자
  reportedBy: string;
  reporterRole: "buyer" | "seller";

  // 분쟁 정보
  type:
    | "quality_issue"
    | "non_delivery"
    | "wrong_item"
    | "seller_non_response"
    | "buyer_non_response"
    | "other";
  reason: string;
  status: "open" | "investigating" | "resolved" | "closed";

  // 증빙 자료
  evidenceUrls: string[];
  evidenceDescriptions: string[];

  // 관리자 처리
  assignedAdmin?: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: FirebaseFirestore.Timestamp;

  // 타임스탬프
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// /event_logs/{logId}
export interface EventLog {
  id: string;
  transactionId: string;

  // 이벤트 정보
  eventType:
    | "status_change"
    | "payment_created"
    | "payment_completed"
    | "shipment_registered"
    | "shipment_updated"
    | "cancel_requested"
    | "cancel_approved"
    | "refund_initiated"
    | "refund_completed"
    | "dispute_opened"
    | "dispute_resolved"
    | "auto_confirmed";

  // 상태 변경
  fromStatus?: TransactionStatus;
  toStatus?: TransactionStatus;

  // 액터
  actorId: string;
  actorType: "buyer" | "seller" | "system" | "admin";

  // 설명
  description: string;

  // 메타데이터
  metadata?: Record<string, any>;

  // 타임스탬프
  createdAt: FirebaseFirestore.Timestamp;
}

// /scheduled_tasks/{taskId}
export interface ScheduledTask {
  id: string;
  type: "auto_confirm" | "cancel_timeout" | "dispute_escalate";
  transactionId: string;
  scheduledAt: FirebaseFirestore.Timestamp;
  executedAt?: FirebaseFirestore.Timestamp;
  status: "pending" | "executed" | "cancelled";
  result?: string;
  createdAt: FirebaseFirestore.Timestamp;
}












