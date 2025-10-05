export async function fixBuyerUid(itemId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}> {
  try {
    const response = await fetch("/api/fix-buyer-uid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("buyerUid 수정 요청 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "요청에 실패했습니다.",
    };
  }
}
