import { apiClient } from "./client";
import {
  CreateLogisticsQuoteInput,
  LogisticsQuote,
  CreateLogisticsOrderInput,
  LogisticsOrder,
  ApiResponse,
} from "../../data/types";

// 운송 견적 요청
export async function createLogisticsQuote(
  input: CreateLogisticsQuoteInput
): Promise<ApiResponse<LogisticsQuote>> {
  try {
    const response = await apiClient.post<ApiResponse<LogisticsQuote>>(
      "/api/logistics/quote",
      input
    );
    return response.data || { success: false, error: "응답 데이터가 없습니다" };
  } catch (error: any) {
    console.error("운송 견적 요청 실패:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "운송 견적 요청에 실패했습니다.",
    };
  }
}

// 운송 주문 생성
export async function createLogisticsOrder(
  input: CreateLogisticsOrderInput
): Promise<ApiResponse<LogisticsOrder>> {
  try {
    const response = await apiClient.post<ApiResponse<LogisticsOrder>>(
      "/api/logistics/order",
      input
    );
    return response.data || { success: false, error: "응답 데이터가 없습니다" };
  } catch (error: any) {
    console.error("운송 주문 생성 실패:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "운송 주문 생성에 실패했습니다.",
    };
  }
}

// 운송 상태를 한글로 변환
export function getLogisticsStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "대기 중";
    case "confirmed":
      return "확정됨";
    case "picked_up":
      return "픽업 완료";
    case "in_transit":
      return "운송 중";
    case "delivered":
      return "배송 완료";
    case "cancelled":
      return "취소됨";
    default:
      return "알 수 없음";
  }
}

// 운송 상태에 따른 색상 반환
export function getLogisticsStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "text-yellow-600 bg-yellow-100";
    case "confirmed":
      return "text-blue-600 bg-blue-100";
    case "picked_up":
      return "text-indigo-600 bg-indigo-100";
    case "in_transit":
      return "text-purple-600 bg-purple-100";
    case "delivered":
      return "text-green-600 bg-green-100";
    case "cancelled":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

// 운송업체를 한글로 변환
export function getCarrierLabel(carrier: string): string {
  const carriers: Record<string, string> = {
    CJ대한통운: "CJ대한통운",
    한진택배: "한진택배",
    로젠택배: "로젠택배",
    우체국택배: "우체국택배",
    쿠팡로직스: "쿠팡로직스",
  };

  return carriers[carrier] || carrier;
}

// 서비스 타입을 한글로 변환
export function getServiceTypeLabel(serviceType: string): string {
  const serviceTypes: Record<string, string> = {
    일반택배: "일반택배",
    당일배송: "당일배송",
    특급배송: "특급배송",
    화물운송: "화물운송",
  };

  return serviceTypes[serviceType] || serviceType;
}

// 예상 배송일 계산
export function getEstimatedDeliveryText(estimatedDelivery: Date): string {
  const now = new Date();
  const diffTime = estimatedDelivery.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "오늘 배송 예정";
  } else if (diffDays === 1) {
    return "내일 배송 예정";
  } else {
    return `${diffDays}일 후 배송 예정`;
  }
}
