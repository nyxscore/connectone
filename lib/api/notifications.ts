import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Notification,
  CreateNotificationData,
  NotificationType,
} from "../../data/types";

// 알림 생성
export async function createNotification(
  data: CreateNotificationData
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    console.log("알림 생성 시작:", data);

    const notificationsRef = collection(db, "notifications");
    const notificationData = {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      isRead: false,
      priority: data.priority || "normal",
      link: data.link,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(notificationsRef, notificationData);
    console.log("알림 생성 완료:", docRef.id);

    return { success: true, notificationId: docRef.id };
  } catch (error) {
    console.error("알림 생성 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "알림 생성에 실패했습니다.",
    };
  }
}

// 사용자의 알림 목록 조회
export async function getUserNotifications(
  userId: string,
  limitCount: number = 20,
  lastDoc?: any
): Promise<{
  success: boolean;
  notifications?: Notification[];
  lastDoc?: any;
  error?: string;
}> {
  try {
    console.log("사용자 알림 목록 조회:", userId);

    const notificationsRef = collection(db, "notifications");
    // 인덱스 문제를 피하기 위해 orderBy를 제거하고 클라이언트에서 정렬
    let q = query(
      notificationsRef,
      where("userId", "==", userId),
      limit(limitCount * 2) // 더 많이 가져와서 클라이언트에서 정렬 후 제한
    );

    if (lastDoc) {
      q = query(
        notificationsRef,
        where("userId", "==", userId),
        startAfter(lastDoc),
        limit(limitCount * 2)
      );
    }

    const snapshot = await getDocs(q);
    let notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    // 클라이언트에서 시간순 정렬
    notifications = notifications.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime; // 최신순
    });

    // 제한된 개수만 반환
    notifications = notifications.slice(0, limitCount);

    console.log("알림 목록 조회 완료:", notifications.length, "개");
    return {
      success: true,
      notifications,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
    };
  } catch (error) {
    console.error("알림 목록 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림 목록을 조회하는데 실패했습니다.",
    };
  }
}

// 읽지 않은 알림 개수 조회
export async function getUnreadNotificationCount(
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    console.log("읽지 않은 알림 개수 조회:", userId);

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("isRead", "==", false)
    );

    const snapshot = await getDocs(q);
    const count = snapshot.docs.length;

    console.log("읽지 않은 알림 개수:", count);
    return { success: true, count };
  } catch (error) {
    console.error("읽지 않은 알림 개수 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "읽지 않은 알림 개수를 조회하는데 실패했습니다.",
    };
  }
}

// 알림 읽음 처리
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("알림 읽음 처리:", notificationId, userId);

    const notificationRef = doc(db, "notifications", notificationId);
    const notificationSnap = await getDoc(notificationRef);

    if (!notificationSnap.exists()) {
      return { success: false, error: "알림을 찾을 수 없습니다." };
    }

    const notificationData = notificationSnap.data() as Notification;

    // 권한 확인
    if (notificationData.userId !== userId) {
      return { success: false, error: "권한이 없습니다." };
    }

    // 이미 읽음 처리된 경우
    if (notificationData.isRead) {
      return { success: true };
    }

    // 읽음 처리
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });

    console.log("알림 읽음 처리 완료:", notificationId);
    return { success: true };
  } catch (error) {
    console.error("알림 읽음 처리 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림 읽음 처리에 실패했습니다.",
    };
  }
}

// 모든 알림 읽음 처리
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("모든 알림 읽음 처리:", userId);

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("isRead", "==", false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.docs.length === 0) {
      return { success: true };
    }

    // 배치 업데이트
    const updatePromises = snapshot.docs.map(doc => {
      return updateDoc(doc.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });

    await Promise.all(updatePromises);

    console.log("모든 알림 읽음 처리 완료:", snapshot.docs.length, "개");
    return { success: true };
  } catch (error) {
    console.error("모든 알림 읽음 처리 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "모든 알림 읽음 처리에 실패했습니다.",
    };
  }
}

// 알림 삭제
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("알림 삭제:", notificationId, userId);

    const notificationRef = doc(db, "notifications", notificationId);
    const notificationSnap = await getDoc(notificationRef);

    if (!notificationSnap.exists()) {
      return { success: false, error: "알림을 찾을 수 없습니다." };
    }

    const notificationData = notificationSnap.data() as Notification;

    // 권한 확인
    if (notificationData.userId !== userId) {
      return { success: false, error: "권한이 없습니다." };
    }

    await deleteDoc(notificationRef);
    console.log("알림 삭제 완료:", notificationId);

    return { success: true };
  } catch (error) {
    console.error("알림 삭제 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "알림 삭제에 실패했습니다.",
    };
  }
}

// 모든 알림 삭제
export async function deleteAllNotifications(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("모든 알림 삭제:", userId);

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("userId", "==", userId));

    const snapshot = await getDocs(q);

    if (snapshot.docs.length === 0) {
      return { success: true };
    }

    // 배치 삭제
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log("모든 알림 삭제 완료:", snapshot.docs.length, "개");
    return { success: true };
  } catch (error) {
    console.error("모든 알림 삭제 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "모든 알림 삭제에 실패했습니다.",
    };
  }
}

// 실시간 알림 구독
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  onError?: (error: Error) => void
): () => void {
  console.log("실시간 알림 구독 시작:", userId);

  const notificationsRef = collection(db, "notifications");
  // 인덱스 문제를 피하기 위해 orderBy를 제거하고 클라이언트에서 정렬
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    limit(100) // 더 많이 가져와서 클라이언트에서 정렬
  );

  return onSnapshot(
    q,
    snapshot => {
      let notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      // 클라이언트에서 시간순 정렬
      notifications = notifications.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // 최신순
      });

      // 최근 50개만 반환
      notifications = notifications.slice(0, 50);

      console.log("실시간 알림 업데이트:", notifications.length, "개");
      callback(notifications);
    },
    error => {
      console.error("실시간 알림 구독 오류:", error);
      onError?.(error);
    }
  );
}

// 실시간 읽지 않은 알림 개수 구독
export function subscribeToUnreadNotificationCount(
  userId: string,
  callback: (count: number) => void,
  onError?: (error: Error) => void
): () => void {
  console.log("실시간 읽지 않은 알림 개수 구독 시작:", userId);

  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    where("isRead", "==", false)
  );

  return onSnapshot(
    q,
    snapshot => {
      const count = snapshot.docs.length;
      console.log("실시간 읽지 않은 알림 개수:", count);
      callback(count);
    },
    error => {
      console.error("실시간 읽지 않은 알림 개수 구독 오류:", error);
      onError?.(error);
    }
  );
}

// 알림 생성 헬퍼 함수들 (타입별)
export async function createNewMessageNotification(data: {
  userId: string;
  senderName: string;
  productTitle: string;
  messagePreview: string;
  chatId: string;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  return createNotification({
    userId: data.userId,
    type: "new_message",
    title: "새로운 채팅 메시지",
    message: `${data.senderName}님이 "${data.productTitle}" 상품에 대해 메시지를 보냈습니다: ${data.messagePreview}`,
    data: {
      senderName: data.senderName,
      productTitle: data.productTitle,
      messagePreview: data.messagePreview,
      chatId: data.chatId,
    },
    link: `/chat`,
    priority: "normal",
  });
}

export async function createTransactionUpdateNotification(data: {
  userId: string;
  transactionId: string;
  status: string;
  productTitle: string;
  amount: number;
  counterpartName: string;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const statusMessages: Record<string, string> = {
    paid_hold: "결제가 완료되어 안전거래가 시작되었습니다",
    shipped: "상품이 배송되었습니다",
    delivered: "상품이 배송 완료되었습니다",
    released: "거래가 완료되어 정산이 완료되었습니다",
    refunded: "환불이 완료되었습니다",
    cancelled: "거래가 취소되었습니다",
  };

  return createNotification({
    userId: data.userId,
    type: "transaction_update",
    title: "거래 상태 업데이트",
    message: `"${data.productTitle}" 거래가 ${statusMessages[data.status] || "상태가 변경되었습니다"}`,
    data: {
      transactionId: data.transactionId,
      status: data.status,
      productTitle: data.productTitle,
      amount: data.amount,
      counterpartName: data.counterpartName,
    },
    link: `/profile/transactions`,
    priority: "high",
  });
}

export async function createProductSoldNotification(data: {
  userId: string;
  productId: string;
  productTitle: string;
  buyerName: string;
  amount: number;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  return createNotification({
    userId: data.userId,
    type: "transaction_update",
    title: "상품이 판매되었습니다",
    message: `"${data.productTitle}" 상품이 ${data.buyerName}님에게 판매되었습니다`,
    data: {
      productId: data.productId,
      productTitle: data.productTitle,
      buyerName: data.buyerName,
      amount: data.amount,
    },
    link: `/profile/items`,
    priority: "high",
  });
}
