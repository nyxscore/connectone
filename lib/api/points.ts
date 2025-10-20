import { getDb } from "../api/firebase-lazy";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import type { PointTransaction } from "../types";

/**
 * 포인트 잔액 조회
 */
export async function getPointBalance(userId: string): Promise<number> {
  try {
    const db = getDb();
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().points || 0;
    }
    return 0;
  } catch (error) {
    console.error("포인트 잔액 조회 실패:", error);
    return 0;
  }
}

/**
 * 포인트 적립/차감 (트랜잭션)
 */
export async function addPoints(
  userId: string,
  amount: number,
  type: PointTransaction["type"],
  description: string,
  relatedId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const db = getDb();
    const userRef = doc(db, "users", userId);

    // Firestore 트랜잭션으로 안전하게 처리
    const result = await runTransaction(db, async transaction => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error("사용자를 찾을 수 없습니다");
      }

      const currentPoints = userDoc.data().points || 0;
      const newBalance = currentPoints + amount;

      // 차감 시 잔액 확인
      if (newBalance < 0) {
        throw new Error("포인트가 부족합니다");
      }

      // 포인트 업데이트
      transaction.update(userRef, {
        points: newBalance,
        updatedAt: new Date(),
      });

      // 포인트 내역 기록
      const pointHistoryRef = collection(db, "pointHistory");
      const historyData: any = {
        userId,
        amount,
        type,
        description,
        balance: newBalance,
        createdAt: new Date(),
      };

      // relatedId가 있을 때만 추가
      if (relatedId) {
        historyData.relatedId = relatedId;
      }

      transaction.set(doc(pointHistoryRef), historyData);

      return newBalance;
    });

    console.log(
      `✅ 포인트 ${amount > 0 ? "적립" : "차감"} 완료: ${amount}P, 잔액: ${result}P`
    );
    return { success: true, newBalance: result };
  } catch (error: any) {
    console.error("포인트 처리 실패:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 포인트 내역 조회
 */
export async function getPointHistory(
  userId: string
): Promise<PointTransaction[]> {
  try {
    const db = getDb();
    const historyRef = collection(db, "pointHistory");
    const q = query(
      historyRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const history: PointTransaction[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        type: data.type,
        description: data.description,
        relatedId: data.relatedId,
        balance: data.balance,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return history;
  } catch (error) {
    console.error("포인트 내역 조회 실패:", error);
    return [];
  }
}

/**
 * 회원가입 시 웰컴 포인트 지급
 */
export async function grantSignupPoints(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const SIGNUP_POINTS = 5000;

  return await addPoints(
    userId,
    SIGNUP_POINTS,
    "signup",
    "🎉 회원가입 축하 포인트"
  );
}

/**
 * 거래 완료 시 포인트 지급
 */
export async function grantTradeCompletePoints(
  userId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const TRADE_POINTS = 100;

  return await addPoints(
    userId,
    TRADE_POINTS,
    "trade_complete",
    "✅ 거래 완료 포인트",
    itemId
  );
}

/**
 * 후기 작성 시 포인트 지급
 */
export async function grantReviewPoints(
  userId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const REVIEW_POINTS = 50;

  return await addPoints(
    userId,
    REVIEW_POINTS,
    "review",
    "⭐ 후기 작성 포인트",
    itemId
  );
}

/**
 * 포인트로 결제 (심화 분석 등)
 */
export async function usePoints(
  userId: string,
  amount: number,
  description: string,
  relatedId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  // 음수로 차감
  return await addPoints(userId, -amount, "purchase", description, relatedId);
}
