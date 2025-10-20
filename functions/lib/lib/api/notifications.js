"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.getUserNotifications = getUserNotifications;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.deleteNotification = deleteNotification;
exports.deleteAllNotifications = deleteAllNotifications;
exports.subscribeToNotifications = subscribeToNotifications;
exports.subscribeToUnreadNotificationCount = subscribeToUnreadNotificationCount;
exports.createNewMessageNotification = createNewMessageNotification;
exports.createTransactionUpdateNotification = createTransactionUpdateNotification;
exports.createProductSoldNotification = createProductSoldNotification;
const firestore_1 = require("firebase/firestore");
const firebase_ultra_safe_1 = require("./firebase-ultra-safe");
// 알림 생성
async function createNotification(data) {
    const db = await (0, firebase_ultra_safe_1.getFirebaseDb)();
    try {
        console.log("알림 생성 시작:", data);
        const notificationsRef = (0, firestore_1.collection)(db, "notifications");
        const notificationData = {
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data || {},
            isRead: false,
            priority: data.priority || "normal",
            link: data.link,
            createdAt: (0, firestore_1.serverTimestamp)(),
        };
        const docRef = await (0, firestore_1.addDoc)(notificationsRef, notificationData);
        console.log("알림 생성 완료:", docRef.id);
        return { success: true, notificationId: docRef.id };
    }
    catch (error) {
        console.error("알림 생성 실패:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "알림 생성에 실패했습니다.",
        };
    }
}
// 사용자의 알림 목록 조회
async function getUserNotifications(userId, limitCount = 20, lastDoc) {
    const db = await (0, firebase_ultra_safe_1.getFirebaseDb)();
    try {
        console.log("사용자 알림 목록 조회:", userId);
        const notificationsRef = (0, firestore_1.collection)(db, "notifications");
        // 인덱스 문제를 피하기 위해 orderBy를 제거하고 클라이언트에서 정렬
        let q = (0, firestore_1.query)(notificationsRef, (0, firestore_1.where)("userId", "==", userId), (0, firestore_1.limit)(limitCount * 2) // 더 많이 가져와서 클라이언트에서 정렬 후 제한
        );
        if (lastDoc) {
            q = (0, firestore_1.query)(notificationsRef, (0, firestore_1.where)("userId", "==", userId), (0, firestore_1.startAfter)(lastDoc), (0, firestore_1.limit)(limitCount * 2));
        }
        const snapshot = await (0, firestore_1.getDocs)(q);
        let notifications = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // 클라이언트에서 시간순 정렬
        notifications = notifications.sort((a, b) => {
            var _a, _b;
            const aTime = ((_a = a.createdAt) === null || _a === void 0 ? void 0 : _a.seconds) || 0;
            const bTime = ((_b = b.createdAt) === null || _b === void 0 ? void 0 : _b.seconds) || 0;
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
    }
    catch (error) {
        console.error("알림 목록 조회 실패:", error);
        return {
            success: false,
            error: error instanceof Error
                ? error.message
                : "알림 목록을 조회하는데 실패했습니다.",
        };
    }
}
// 읽지 않은 알림 개수 조회
async function getUnreadNotificationCount(userId) {
    const db = await (0, firebase_ultra_safe_1.getFirebaseDb)();
    try {
        console.log("읽지 않은 알림 개수 조회:", userId);
        const notificationsRef = (0, firestore_1.collection)(db, "notifications");
        const q = (0, firestore_1.query)(notificationsRef, (0, firestore_1.where)("userId", "==", userId), (0, firestore_1.where)("isRead", "==", false));
        const snapshot = await (0, firestore_1.getDocs)(q);
        const count = snapshot.docs.length;
        console.log("읽지 않은 알림 개수:", count);
        return { success: true, count };
    }
    catch (error) {
        console.error("읽지 않은 알림 개수 조회 실패:", error);
        return {
            success: false,
            error: error instanceof Error
                ? error.message
                : "읽지 않은 알림 개수를 조회하는데 실패했습니다.",
        };
    }
}
// 알림 읽음 처리
async function markNotificationAsRead(notificationId, userId) {
    const db = await (0, firebase_ultra_safe_1.getFirebaseDb)();
    try {
        console.log("알림 읽음 처리:", notificationId, userId);
        const notificationRef = (0, firestore_1.doc)(db, "notifications", notificationId);
        const notificationSnap = await (0, firestore_1.getDoc)(notificationRef);
        if (!notificationSnap.exists()) {
            return { success: false, error: "알림을 찾을 수 없습니다." };
        }
        const notificationData = notificationSnap.data();
        // 권한 확인
        if (notificationData.userId !== userId) {
            return { success: false, error: "권한이 없습니다." };
        }
        // 이미 읽음 처리된 경우
        if (notificationData.isRead) {
            return { success: true };
        }
        // 읽음 처리
        await (0, firestore_1.updateDoc)(notificationRef, {
            isRead: true,
            readAt: (0, firestore_1.serverTimestamp)(),
        });
        console.log("알림 읽음 처리 완료:", notificationId);
        return { success: true };
    }
    catch (error) {
        console.error("알림 읽음 처리 실패:", error);
        return {
            success: false,
            error: error instanceof Error
                ? error.message
                : "알림 읽음 처리에 실패했습니다.",
        };
    }
}
// 모든 알림 읽음 처리
async function markAllNotificationsAsRead(userId) {
    const db = await (0, firebase_ultra_safe_1.getFirebaseDb)();
    try {
        console.log("모든 알림 읽음 처리:", userId);
        const notificationsRef = (0, firestore_1.collection)(db, "notifications");
        const q = (0, firestore_1.query)(notificationsRef, (0, firestore_1.where)("userId", "==", userId), (0, firestore_1.where)("isRead", "==", false));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (snapshot.docs.length === 0) {
            return { success: true };
        }
        // 배치 업데이트
        const updatePromises = snapshot.docs.map(doc => {
            return (0, firestore_1.updateDoc)(doc.ref, {
                isRead: true,
                readAt: (0, firestore_1.serverTimestamp)(),
            });
        });
        await Promise.all(updatePromises);
        console.log("모든 알림 읽음 처리 완료:", snapshot.docs.length, "개");
        return { success: true };
    }
    catch (error) {
        console.error("모든 알림 읽음 처리 실패:", error);
        return {
            success: false,
            error: error instanceof Error
                ? error.message
                : "모든 알림 읽음 처리에 실패했습니다.",
        };
    }
}
// 알림 삭제
async function deleteNotification(notificationId, userId) {
    const db = await (0, firebase_ultra_safe_1.getFirebaseDb)();
    try {
        console.log("알림 삭제:", notificationId, userId);
        const notificationRef = (0, firestore_1.doc)(db, "notifications", notificationId);
        const notificationSnap = await (0, firestore_1.getDoc)(notificationRef);
        if (!notificationSnap.exists()) {
            return { success: false, error: "알림을 찾을 수 없습니다." };
        }
        const notificationData = notificationSnap.data();
        // 권한 확인
        if (notificationData.userId !== userId) {
            return { success: false, error: "권한이 없습니다." };
        }
        await (0, firestore_1.deleteDoc)(notificationRef);
        console.log("알림 삭제 완료:", notificationId);
        return { success: true };
    }
    catch (error) {
        console.error("알림 삭제 실패:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "알림 삭제에 실패했습니다.",
        };
    }
}
// 모든 알림 삭제
async function deleteAllNotifications(userId) {
    const db = await (0, firebase_ultra_safe_1.getFirebaseDb)();
    try {
        console.log("모든 알림 삭제:", userId);
        const notificationsRef = (0, firestore_1.collection)(db, "notifications");
        const q = (0, firestore_1.query)(notificationsRef, (0, firestore_1.where)("userId", "==", userId));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (snapshot.docs.length === 0) {
            return { success: true };
        }
        // 배치 삭제
        const deletePromises = snapshot.docs.map(doc => (0, firestore_1.deleteDoc)(doc.ref));
        await Promise.all(deletePromises);
        console.log("모든 알림 삭제 완료:", snapshot.docs.length, "개");
        return { success: true };
    }
    catch (error) {
        console.error("모든 알림 삭제 실패:", error);
        return {
            success: false,
            error: error instanceof Error
                ? error.message
                : "모든 알림 삭제에 실패했습니다.",
        };
    }
}
// 실시간 알림 구독
function subscribeToNotifications(userId, callback, onError) {
    console.log("실시간 알림 구독 시작:", userId);
    let unsubscribe = null;
    // 동기적으로 db를 가져와서 구독 설정
    try {
        const db = (0, firebase_ultra_safe_1.getFirebaseDb)();
        const notificationsRef = (0, firestore_1.collection)(db, "notifications");
        // 인덱스 문제를 피하기 위해 orderBy를 제거하고 클라이언트에서 정렬
        const q = (0, firestore_1.query)(notificationsRef, (0, firestore_1.where)("userId", "==", userId), (0, firestore_1.limit)(100) // 더 많이 가져와서 클라이언트에서 정렬
        );
        unsubscribe = (0, firestore_1.onSnapshot)(q, snapshot => {
            let notifications = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
            // 클라이언트에서 시간순 정렬
            notifications = notifications.sort((a, b) => {
                var _a, _b;
                const aTime = ((_a = a.createdAt) === null || _a === void 0 ? void 0 : _a.seconds) || 0;
                const bTime = ((_b = b.createdAt) === null || _b === void 0 ? void 0 : _b.seconds) || 0;
                return bTime - aTime; // 최신순
            });
            // 최근 50개만 반환
            notifications = notifications.slice(0, 50);
            console.log("실시간 알림 업데이트:", notifications.length, "개");
            callback(notifications);
        }, error => {
            console.error("실시간 알림 구독 오류:", error);
            onError === null || onError === void 0 ? void 0 : onError(error);
        });
    }
    catch (error) {
        console.error("❌ DB 초기화 오류:", error);
        onError === null || onError === void 0 ? void 0 : onError(error);
    }
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
}
// 실시간 읽지 않은 알림 개수 구독
function subscribeToUnreadNotificationCount(userId, callback, onError) {
    console.log("실시간 읽지 않은 알림 개수 구독 시작:", userId);
    let unsubscribe = null;
    // 동기적으로 db를 가져와서 구독 설정
    try {
        const db = (0, firebase_ultra_safe_1.getFirebaseDb)();
        const notificationsRef = (0, firestore_1.collection)(db, "notifications");
        const q = (0, firestore_1.query)(notificationsRef, (0, firestore_1.where)("userId", "==", userId), (0, firestore_1.where)("isRead", "==", false));
        unsubscribe = (0, firestore_1.onSnapshot)(q, snapshot => {
            const count = snapshot.docs.length;
            console.log("실시간 읽지 않은 알림 개수:", count);
            callback(count);
        }, error => {
            console.error("실시간 읽지 않은 알림 개수 구독 오류:", error);
            onError === null || onError === void 0 ? void 0 : onError(error);
        });
    }
    catch (error) {
        console.error("❌ DB 초기화 오류:", error);
        onError === null || onError === void 0 ? void 0 : onError(error);
    }
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
}
// 알림 생성 헬퍼 함수들 (타입별)
async function createNewMessageNotification(data) {
    // 시스템 메시지인 경우 (senderName이 빈 문자열) 메시지 내용만 표시
    const isSystemMessage = data.senderName === "";
    const notificationMessage = isSystemMessage
        ? data.messagePreview
        : `${data.senderName}님이 "${data.productTitle}" 상품에 대해 메시지를 보냈습니다: ${data.messagePreview}`;
    return createNotification({
        userId: data.userId,
        type: "new_message",
        title: "새로운 채팅 메시지",
        message: notificationMessage,
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
async function createTransactionUpdateNotification(data) {
    let actualStatus = data.status;
    let statusLabel = data.status;
    // 실제 상품 상태 확인 (itemId가 있는 경우)
    if (data.itemId) {
        try {
            const { doc, getDoc } = await Promise.resolve().then(() => __importStar(require("firebase/firestore")));
            const db = await (0, firebase_ultra_safe_1.getFirebaseDb)();
            const itemRef = doc(db, "items", data.itemId);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
                const itemData = itemSnap.data();
                actualStatus = itemData.status || data.status;
                // 실제 상태에 따른 라벨 매핑
                const statusLabels = {
                    active: "판매중",
                    reserved: "거래중",
                    escrow_completed: "결제완료",
                    shipping: "배송중",
                    sold: "거래완료",
                    cancelled: "거래취소",
                };
                statusLabel = statusLabels[actualStatus] || actualStatus;
            }
        }
        catch (error) {
            console.error("상품 상태 확인 실패:", error);
            // 실패 시 원래 상태 사용
        }
    }
    const statusMessages = {
        paid_hold: "결제가 완료되어 안전거래가 시작되었습니다",
        shipped: "상품이 배송되었습니다",
        delivered: "상품이 배송 완료되었습니다",
        released: "거래가 완료되어 정산이 완료되었습니다",
        refunded: "환불이 완료되었습니다",
        cancelled: "거래가 취소되었습니다",
        active: "상품이 다시 판매중으로 변경되었습니다",
        reserved: "거래가 시작되었습니다",
        escrow_completed: "안전결제가 완료되었습니다",
        shipping: "상품이 발송되었습니다",
        sold: "거래가 완료되었습니다",
    };
    return createNotification({
        userId: data.userId,
        type: "transaction_update",
        title: "거래 상태 업데이트",
        message: `"${data.productTitle}" 거래가 ${statusMessages[actualStatus] || "상태가 변경되었습니다"}`,
        data: {
            transactionId: data.transactionId,
            status: actualStatus, // 실제 상태 사용
            statusLabel: statusLabel, // 상태 라벨 추가
            productTitle: data.productTitle,
            amount: data.amount,
            counterpartName: data.counterpartName,
            itemId: data.itemId,
        },
        link: `/profile/transactions`,
        priority: "high",
    });
}
async function createProductSoldNotification(data) {
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
//# sourceMappingURL=notifications.js.map