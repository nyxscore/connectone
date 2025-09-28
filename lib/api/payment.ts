import { Transaction, CreateTransactionInput } from "../../data/types";

// 결제 생성
export async function createPayment(
  productId: string,
  amount: number,
  paymentMethod: string = "card"
): Promise<{ success: boolean; data?: Transaction; error?: string }> {
  try {
    const response = await fetch("/api/transactions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        amount,
        paymentMethod,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "결제 처리에 실패했습니다.",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("결제 API 호출 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "결제 처리에 실패했습니다.",
    };
  }
}

// 결제 상태 업데이트 (관리자용)
export async function updatePaymentStatus(
  transactionId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/transactions/${transactionId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        notes,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "상태 업데이트에 실패했습니다.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("상태 업데이트 API 호출 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상태 업데이트에 실패했습니다.",
    };
  }
}

// 사용자의 결제 내역 조회
export async function getUserTransactions(
  userId: string
): Promise<{ success: boolean; data?: Transaction[]; error?: string }> {
  try {
    const response = await fetch(`/api/transactions/user/${userId}`);

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "결제 내역 조회에 실패했습니다.",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("결제 내역 조회 API 호출 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "결제 내역 조회에 실패했습니다.",
    };
  }
}










