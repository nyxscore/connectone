// Cloud Functions 호출 헬퍼
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "../api/firebase-ultra-safe";

const functions = getFunctions(firebaseApp);

export interface RegisterShipmentData {
  itemId: string;
  chatId: string;
  courier: string;
  trackingNumber: string;
}

export interface ConfirmPurchaseData {
  itemId: string;
  chatId: string;
}

export interface CancelTransactionData {
  itemId: string;
  chatId: string;
  reason: string;
}

// 1. 배송 등록 (Cloud Function)
export async function callRegisterShipment(
  data: RegisterShipmentData
): Promise<{ success: boolean; error?: string }> {
  try {
    const registerShipment = httpsCallable<
      RegisterShipmentData,
      { success: boolean }
    >(functions, "registerShipment");

    const result = await registerShipment(data);
    return result.data;
  } catch (error: any) {
    console.error("배송 등록 실패:", error);
    return {
      success: false,
      error: error.message || "배송 등록 중 오류가 발생했습니다.",
    };
  }
}

// 2. 구매 확정 (Cloud Function)
export async function callConfirmPurchase(
  data: ConfirmPurchaseData
): Promise<{ success: boolean; error?: string }> {
  try {
    const confirmPurchase = httpsCallable<
      ConfirmPurchaseData,
      { success: boolean }
    >(functions, "confirmPurchase");

    const result = await confirmPurchase(data);
    return result.data;
  } catch (error: any) {
    console.error("구매확정 실패:", error);
    return {
      success: false,
      error: error.message || "구매확정 중 오류가 발생했습니다.",
    };
  }
}

// 3. 거래 취소 (Cloud Function)
export async function callCancelTransaction(
  data: CancelTransactionData
): Promise<{ success: boolean; error?: string }> {
  try {
    const cancelTransaction = httpsCallable<
      CancelTransactionData,
      { success: boolean }
    >(functions, "cancelTransaction");

    const result = await cancelTransaction(data);
    return result.data;
  } catch (error: any) {
    console.error("거래 취소 실패:", error);
    return {
      success: false,
      error: error.message || "거래 취소 중 오류가 발생했습니다.",
    };
  }
}














