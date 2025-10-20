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
exports.notificationTrigger = exports.NotificationTriggerService = void 0;
const service_1 = require("../email/service");
const notifications_1 = require("../api/notifications");
// 알림 트리거 서비스
class NotificationTriggerService {
    // 새 메시지 알림
    async triggerNewMessage(data) {
        // Firestore에 알림 생성
        try {
            await (0, notifications_1.createNewMessageNotification)(data);
            console.log("✅ Firestore 새 메시지 알림 생성 완료:", data.userId);
        }
        catch (error) {
            console.error("❌ Firestore 새 메시지 알림 생성 실패:", error);
        }
        // 기존 이메일 알림 트리거
        await this.triggerNotification({
            type: "new_message",
            userId: data.userId,
            data: {
                senderName: data.senderName,
                productTitle: data.productTitle,
                messagePreview: data.messagePreview,
                chatId: data.chatId,
            },
            priority: "normal",
        });
    }
    // 거래 상태 업데이트 알림
    async triggerTransactionUpdate(data) {
        // Firestore에 알림 생성
        try {
            await (0, notifications_1.createTransactionUpdateNotification)({
                userId: data.userId,
                transactionId: data.transactionId,
                status: data.status,
                productTitle: data.productTitle,
                amount: data.amount,
                counterpartName: data.counterpartName,
                itemId: data.itemId, // 상품 ID 전달
            });
            console.log("✅ Firestore 거래 상태 알림 생성 완료:", data.userId);
        }
        catch (error) {
            console.error("❌ Firestore 거래 상태 알림 생성 실패:", error);
        }
        // 기존 이메일 알림 트리거
        await this.triggerNotification({
            type: "transaction_update",
            userId: data.userId,
            data: {
                transactionId: data.transactionId,
                status: data.status,
                productTitle: data.productTitle,
                productBrand: data.productBrand,
                productModel: data.productModel,
                amount: data.amount,
                counterpartName: data.counterpartName,
                updatedAt: new Date().toLocaleString("ko-KR"),
            },
            priority: "high",
        });
    }
    // 운송 견적 알림
    async triggerLogisticsQuote(data) {
        await this.triggerNotification({
            type: "logistics_quote",
            userId: data.userId,
            data: {
                productId: data.productId,
                productTitle: data.productTitle,
                estimatedPrice: data.estimatedPrice,
                fromAddress: data.fromAddress,
                toAddress: data.toAddress,
                estimatedDays: data.estimatedDays,
                insurance: data.insurance,
                carrierName: data.carrierName,
                serviceType: data.serviceType,
            },
            priority: "normal",
        });
    }
    // 질문 답변 알림
    async triggerQuestionAnswer(data) {
        await this.triggerNotification({
            type: "question_answer",
            userId: data.userId,
            data: {
                productId: data.productId,
                productTitle: data.productTitle,
                questionId: data.questionId,
                answer: data.answer,
                sellerName: data.sellerName,
            },
            priority: "normal",
        });
    }
    // 결제 상태 알림
    async triggerPaymentStatus(data) {
        await this.triggerNotification({
            type: "payment_status",
            userId: data.userId,
            data: {
                transactionId: data.transactionId,
                status: data.status,
                amount: data.amount,
                productTitle: data.productTitle,
            },
            priority: "high",
        });
    }
    // 상품 관심 알림
    async triggerProductInterest(data) {
        await this.triggerNotification({
            type: "product_interest",
            userId: data.userId,
            data: {
                productId: data.productId,
                productTitle: data.productTitle,
                interestType: data.interestType,
                price: data.price,
                previousPrice: data.previousPrice,
            },
            priority: "low",
        });
    }
    // 시스템 공지 알림
    async triggerSystemAnnouncement(data) {
        await this.triggerNotification({
            type: "system_announcement",
            userId: data.userId,
            data: {
                title: data.title,
                content: data.content,
                announcementType: data.announcementType,
            },
            priority: "urgent",
        });
    }
    // 구매확인 완료 알림 (판매자에게)
    async triggerPurchaseConfirmation(data) {
        // Firestore에 알림 생성
        try {
            const { createNotification } = await Promise.resolve().then(() => __importStar(require("../api/notifications")));
            await createNotification({
                userId: data.userId,
                type: "transaction_update",
                title: "구매확인 완료",
                message: `${data.buyerNickname}님이 "${data.productTitle}" 상품의 구매를 확인했습니다. 거래가 완료되었습니다! 🎉`,
                link: "/profile/transactions",
                isRead: false,
            });
            console.log("✅ Firestore 구매확인 알림 생성 완료:", data.userId);
        }
        catch (error) {
            console.error("❌ Firestore 구매확인 알림 생성 실패:", error);
        }
    }
    // 공통 알림 트리거
    async triggerNotification(data) {
        try {
            // 알림 설정 확인
            const shouldSend = await service_1.emailService.shouldSendNotification(data.userId, data.type);
            if (!shouldSend) {
                console.log(`알림 발송 건너뛰기: ${data.type} (사용자 설정)`);
                return;
            }
            // 이메일 생성
            const emailNotification = await service_1.emailService.createEmailFromTemplate(data.userId, data.type, data.data);
            // 이메일 발송
            const success = await service_1.emailService.sendEmail(emailNotification);
            if (success) {
                console.log(`✅ 알림 발송 성공: ${data.type} -> ${data.userId}`);
            }
            else {
                console.log(`❌ 알림 발송 실패: ${data.type} -> ${data.userId}`);
            }
            // 알림 트리거 기록 (실제로는 데이터베이스에 저장)
            const trigger = {
                id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: data.type,
                userId: data.userId,
                data: data.data,
                priority: data.priority,
                status: success ? "completed" : "failed",
                createdAt: new Date(),
                processedAt: new Date(),
            };
            console.log("📝 알림 트리거 기록:", trigger);
        }
        catch (error) {
            console.error("알림 트리거 오류:", error);
        }
    }
    // 배치 알림 처리
    async processBatchNotifications(triggers) {
        const results = await Promise.allSettled(triggers.map(async (trigger) => {
            await this.triggerNotification({
                type: trigger.type,
                userId: trigger.userId,
                data: trigger.data,
                priority: trigger.priority,
            });
        }));
        const success = results.filter(r => r.status === "fulfilled").length;
        const failed = results.length - success;
        return { success, failed };
    }
}
exports.NotificationTriggerService = NotificationTriggerService;
// 싱글톤 인스턴스
exports.notificationTrigger = new NotificationTriggerService();
//# sourceMappingURL=trigger.js.map