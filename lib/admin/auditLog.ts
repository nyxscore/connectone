import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb as getDb } from "../api/firebase-ultra-safe";

export interface AuditLogEntry {
  adminUid: string;
  adminNickname: string;
  action: string; // 예: "USER_SUSPEND", "PRODUCT_HIDE", "RESPONSE_RATE_UPDATE"
  targetType: "user" | "product" | "system" | "report" | "dispute";
  targetId?: string; // 대상 사용자/상품 ID
  details?: string; // 추가 정보 (JSON 문자열)
  ipAddress?: string;
  userAgent?: string;
  timestamp: any;
  status: "success" | "failure";
  errorMessage?: string;
}

/**
 * 관리자 액션 감사 로그 기록
 */
export async function logAdminAction(params: {
  adminUid: string;
  adminNickname: string;
  action: string;
  targetType: "user" | "product" | "system" | "report" | "dispute";
  targetId?: string;
  details?: any;
  status?: "success" | "failure";
  errorMessage?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    if (!db) {
      console.error("❌ DB 초기화 실패 - 감사 로그 기록 불가");
      return { success: false, error: "DB 초기화 실패" };
    }

    // 클라이언트 정보 수집
    const ipAddress = await getClientIP();
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "";

    const logEntry: AuditLogEntry = {
      adminUid: params.adminUid,
      adminNickname: params.adminNickname,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details ? JSON.stringify(params.details) : undefined,
      ipAddress,
      userAgent,
      timestamp: serverTimestamp(),
      status: params.status || "success",
      errorMessage: params.errorMessage,
    };

    console.log("📝 감사 로그 기록:", logEntry);

    await addDoc(collection(db, "adminAuditLogs"), logEntry);

    return { success: true };
  } catch (error) {
    console.error("❌ 감사 로그 기록 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "감사 로그 기록 실패",
    };
  }
}

/**
 * 클라이언트 IP 주소 가져오기 (외부 API 사용)
 */
async function getClientIP(): Promise<string> {
  try {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") return "unknown";

    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "unknown";
  } catch (error) {
    console.error("IP 주소 조회 실패:", error);
    return "unknown";
  }
}

/**
 * 관리자 액션 래퍼 - 자동으로 감사 로그 기록
 */
export async function withAdminAudit<T>(
  params: {
    adminUid: string;
    adminNickname: string;
    action: string;
    targetType: "user" | "product" | "system" | "report" | "dispute";
    targetId?: string;
  },
  actionFunc: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await actionFunc();

    // 성공 로그 기록
    await logAdminAction({
      ...params,
      status: "success",
      details: { duration: Date.now() - startTime },
    });

    return result;
  } catch (error) {
    // 실패 로그 기록
    await logAdminAction({
      ...params,
      status: "failure",
      errorMessage: error instanceof Error ? error.message : "알 수 없는 오류",
      details: { duration: Date.now() - startTime },
    });

    throw error;
  }
}


















