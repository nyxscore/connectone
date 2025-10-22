import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb as getDb } from "../api/firebase-ultra-safe";
import {
  DirectTradeState,
  DirectTradeStatus,
  DirectTradeStateMachine,
} from "./directTradeTypes";

// 직거래 상태 가져오기
export async function getDirectTradeState(
  chatId: string
): Promise<{ success: boolean; state?: DirectTradeState; error?: string }> {
  try {
    const db = getDb();
    if (!db) {
      return { success: false, error: "데이터베이스 연결에 실패했습니다." };
    }

    const stateRef = doc(db, "directTrades", chatId);
    const stateSnap = await getDoc(stateRef);

    if (stateSnap.exists()) {
      const data = stateSnap.data();
      return {
        success: true,
        state: {
          status: data.status || "waiting",
          updatedAt: data.updatedAt?.toDate() || new Date(),
          updatedBy: data.updatedBy || "",
          notes: data.notes,
        },
      };
    } else {
      // 기본 상태 생성
      const defaultState: DirectTradeState = {
        status: "waiting",
        updatedAt: new Date(),
        updatedBy: "",
        notes: "거래가 시작되었습니다",
      };

      await setDoc(stateRef, {
        ...defaultState,
        updatedAt: serverTimestamp(),
      });

      return { success: true, state: defaultState };
    }
  } catch (error) {
    console.error("직거래 상태 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "상태 조회에 실패했습니다.",
    };
  }
}

// 직거래 상태 업데이트
export async function updateDirectTradeState(
  chatId: string,
  newStatus: DirectTradeStatus,
  userId: string,
  userRole: "buyer" | "seller",
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    if (!db) {
      return { success: false, error: "데이터베이스 연결에 실패했습니다." };
    }

    // 현재 상태 조회
    const currentStateResult = await getDirectTradeState(chatId);
    if (!currentStateResult.success || !currentStateResult.state) {
      return { success: false, error: "현재 상태를 조회할 수 없습니다." };
    }

    const currentStatus = currentStateResult.state.status;

    // 상태 전이 유효성 검사
    if (
      !DirectTradeStateMachine.canTransition(currentStatus, newStatus, userRole)
    ) {
      return {
        success: false,
        error: `${DirectTradeStateMachine.getStatusDisplayName(currentStatus)}에서 ${DirectTradeStateMachine.getStatusDisplayName(newStatus)}로 전이할 수 없습니다.`,
      };
    }

    // 상태 업데이트
    const stateRef = doc(db, "directTrades", chatId);
    await updateDoc(stateRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
      notes: notes || "",
    });

    console.log(`직거래 상태 업데이트 완료: ${currentStatus} → ${newStatus}`);

    return { success: true };
  } catch (error) {
    console.error("직거래 상태 업데이트 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상태 업데이트에 실패했습니다.",
    };
  }
}

// 직거래 상태 구독
export function subscribeToDirectTradeState(
  chatId: string,
  callback: (state: DirectTradeState | null) => void,
  onError?: (error: Error) => void
): () => void {
  let unsubscribe: (() => void) | null = null;

  try {
    const db = getDb();
    if (!db) {
      onError?.(new Error("데이터베이스 연결에 실패했습니다."));
      return () => {};
    }

    const stateRef = doc(db, "directTrades", chatId);

    // Firestore의 onSnapshot을 사용하여 실시간 구독
    const { onSnapshot } = require("firebase/firestore");

    unsubscribe = onSnapshot(
      stateRef,
      (doc: any) => {
        if (doc.exists()) {
          const data = doc.data();
          const state: DirectTradeState = {
            status: data.status || "waiting",
            updatedAt: data.updatedAt?.toDate() || new Date(),
            updatedBy: data.updatedBy || "",
            notes: data.notes,
          };
          callback(state);
        } else {
          callback(null);
        }
      },
      (error: any) => {
        console.error("직거래 상태 구독 오류:", error);
        onError?.(error);
      }
    );
  } catch (error) {
    console.error("직거래 상태 구독 설정 실패:", error);
    onError?.(
      error instanceof Error ? error : new Error("구독 설정에 실패했습니다.")
    );
  }

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
