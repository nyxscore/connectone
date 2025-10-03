// 테스트용 알림 생성 함수들
import {
  createNewMessageNotification,
  createTransactionUpdateNotification,
  createProductSoldNotification,
} from "./notifications";

// 테스트용 새 메시지 알림 생성
export async function createTestMessageNotification(userId: string) {
  return createNewMessageNotification({
    userId,
    senderName: "테스트 사용자",
    productTitle: "테스트 상품",
    messagePreview: "안녕하세요! 이 상품에 대해 문의드립니다.",
    chatId: "test_chat_123",
  });
}

// 테스트용 거래 상태 알림 생성
export async function createTestTransactionNotification(userId: string) {
  return createTransactionUpdateNotification({
    userId,
    transactionId: "test_transaction_123",
    status: "paid_hold",
    productTitle: "테스트 상품",
    amount: 100000,
    counterpartName: "테스트 구매자",
  });
}

// 테스트용 상품 판매 알림 생성
export async function createTestProductSoldNotification(userId: string) {
  return createProductSoldNotification({
    userId,
    productId: "test_product_123",
    productTitle: "테스트 상품",
    buyerName: "테스트 구매자",
    amount: 100000,
  });
}
