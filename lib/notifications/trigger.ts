import {
  NotificationType,
  EmailNotification,
  NotificationTrigger,
} from "../../data/types";
import { emailService } from "../email/service";

// 알림 트리거 서비스
export class NotificationTriggerService {
  // 새 메시지 알림
  async triggerNewMessage(data: {
    userId: string;
    senderName: string;
    productTitle: string;
    messagePreview: string;
    chatId: string;
  }): Promise<void> {
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
  async triggerTransactionUpdate(data: {
    userId: string;
    transactionId: string;
    status: string;
    productTitle: string;
    productBrand: string;
    productModel: string;
    amount: number;
    counterpartName: string;
  }): Promise<void> {
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
  async triggerLogisticsQuote(data: {
    userId: string;
    productId: string;
    productTitle: string;
    estimatedPrice: number;
    fromAddress: string;
    toAddress: string;
    estimatedDays: number;
    insurance: boolean;
    carrierName: string;
    serviceType: string;
  }): Promise<void> {
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
  async triggerQuestionAnswer(data: {
    userId: string;
    productId: string;
    productTitle: string;
    questionId: string;
    answer: string;
    sellerName: string;
  }): Promise<void> {
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
  async triggerPaymentStatus(data: {
    userId: string;
    transactionId: string;
    status: string;
    amount: number;
    productTitle: string;
  }): Promise<void> {
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
  async triggerProductInterest(data: {
    userId: string;
    productId: string;
    productTitle: string;
    interestType: "view" | "favorite" | "price_drop";
    price?: number;
    previousPrice?: number;
  }): Promise<void> {
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
  async triggerSystemAnnouncement(data: {
    userId: string;
    title: string;
    content: string;
    announcementType: "maintenance" | "feature" | "security" | "general";
  }): Promise<void> {
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

  // 공통 알림 트리거
  private async triggerNotification(data: {
    type: NotificationType;
    userId: string;
    data: Record<string, any>;
    priority: "low" | "normal" | "high" | "urgent";
  }): Promise<void> {
    try {
      // 알림 설정 확인
      const shouldSend = await emailService.shouldSendNotification(
        data.userId,
        data.type
      );
      if (!shouldSend) {
        console.log(`알림 발송 건너뛰기: ${data.type} (사용자 설정)`);
        return;
      }

      // 이메일 생성
      const emailNotification = await emailService.createEmailFromTemplate(
        data.userId,
        data.type,
        data.data
      );

      // 이메일 발송
      const success = await emailService.sendEmail(emailNotification);

      if (success) {
        console.log(`✅ 알림 발송 성공: ${data.type} -> ${data.userId}`);
      } else {
        console.log(`❌ 알림 발송 실패: ${data.type} -> ${data.userId}`);
      }

      // 알림 트리거 기록 (실제로는 데이터베이스에 저장)
      const trigger: NotificationTrigger = {
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
    } catch (error) {
      console.error("알림 트리거 오류:", error);
    }
  }

  // 배치 알림 처리
  async processBatchNotifications(triggers: NotificationTrigger[]): Promise<{
    success: number;
    failed: number;
  }> {
    const results = await Promise.allSettled(
      triggers.map(async trigger => {
        await this.triggerNotification({
          type: trigger.type,
          userId: trigger.userId,
          data: trigger.data,
          priority: trigger.priority,
        });
      })
    );

    const success = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - success;

    return { success, failed };
  }
}

// 싱글톤 인스턴스
export const notificationTrigger = new NotificationTriggerService();





