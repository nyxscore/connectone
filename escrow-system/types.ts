// Types for Escrow System
export interface EscrowTransaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: TransactionStatus;
  amount: number;
  escrowAmount: number;
  platformFee: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  cancelReason?: string;
  disputeReason?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface PaymentRequest {
  transactionId: string;
  amount: number;
  method: "card" | "bank_transfer";
  pgProvider: "toss" | "kakaopay" | "iamport";
  idempotencyKey: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  pgOrderId?: string;
  pgTransactionId?: string;
  redirectUrl?: string;
  error?: string;
}

export interface ShipmentRequest {
  transactionId: string;
  courier: string;
  trackingNumber: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  addressDetail?: string;
  postalCode: string;
  memo?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export interface DisputeRequest {
  transactionId: string;
  type: "quality_issue" | "non_delivery" | "wrong_item" | "seller_non_response";
  reason: string;
  evidenceUrls?: string[];
}

export interface ChatMessage {
  id: string;
  transactionId: string;
  senderId: string;
  senderType: "buyer" | "seller" | "system" | "admin";
  messageType: "text" | "system" | "action";
  content: string;
  actions?: ChatAction[];
  createdAt: Date;
  readBy: string[];
}

export interface ChatAction {
  label: string;
  api: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  payload?: Record<string, any>;
  confirmMessage?: string;
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

export interface StateTransition {
  from: TransactionStatus;
  to: TransactionStatus;
  trigger: "buyer" | "seller" | "system" | "admin";
  conditions?: string[];
  autoTransition?: boolean;
  timeout?: number; // milliseconds
}

export interface WebhookPayload {
  transactionId: string;
  eventType: string;
  data: Record<string, any>;
  signature?: string;
  timestamp: number;
}




















