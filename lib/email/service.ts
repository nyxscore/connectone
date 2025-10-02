import {
  EmailNotification,
  EmailTemplate,
  NotificationType,
  NotificationSettings,
} from "../../data/types";
import {
  EMAIL_TEMPLATES,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
} from "./templates";

// 이메일 서비스 클래스
export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || "";
    this.fromEmail = process.env.FROM_EMAIL || "noreply@connetone.com";
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  // 이메일 발송
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      // 실제 이메일 서비스 연동 (SendGrid, AWS SES, Nodemailer 등)
      // 여기서는 Mock 구현
      console.log("📧 이메일 발송:", {
        to: notification.userId, // 실제로는 사용자 이메일 주소
        subject: notification.title,
        template: notification.templateId,
        data: notification.data,
      });

      // Mock: 90% 성공률
      const success = Math.random() > 0.1;

      if (success) {
        console.log("✅ 이메일 발송 성공");
        return true;
      } else {
        console.log("❌ 이메일 발송 실패");
        return false;
      }
    } catch (error) {
      console.error("이메일 발송 오류:", error);
      return false;
    }
  }

  // 템플릿으로 이메일 생성
  async createEmailFromTemplate(
    userId: string,
    type: NotificationType,
    data: Record<string, any>
  ): Promise<EmailNotification> {
    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      throw new Error(`템플릿을 찾을 수 없습니다: ${type}`);
    }

    // 변수 치환
    const processedData = this.processTemplateData(template, data);

    const notification: EmailNotification = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title: this.replaceVariables(template.subject, processedData),
      content: this.replaceVariables(template.htmlContent, processedData),
      templateId: template.id,
      data: processedData,
      status: "pending",
      createdAt: new Date(),
    };

    return notification;
  }

  // 템플릿 데이터 처리
  private processTemplateData(
    template: EmailTemplate,
    data: Record<string, any>
  ): Record<string, any> {
    const processedData = { ...data };

    // 기본 URL 추가
    processedData.unsubscribeUrl = `${this.baseUrl}/profile/notifications`;
    processedData.supportUrl = `${this.baseUrl}/support`;

    // 상태별 데이터 처리
    if (template.id === "transaction_update") {
      const status = data.status;
      processedData.statusColor = STATUS_COLORS[status] || "#6b7280";
      processedData.statusLabel = STATUS_LABELS[status] || status;
      processedData.statusDescription = STATUS_DESCRIPTIONS[status] || "";
      processedData.transactionUrl = `${this.baseUrl}/profile/transactions/${data.transactionId}`;
    }

    // 메시지 템플릿 데이터 처리
    if (template.id === "new_message") {
      processedData.senderInitial = data.senderName?.charAt(0) || "?";
      processedData.chatUrl = `${this.baseUrl}/chat/${data.chatId}`;
    }

    // 운송 견적 템플릿 데이터 처리
    if (template.id === "logistics_quote") {
      processedData.quoteUrl = `${this.baseUrl}/item/${data.productId}`;
      processedData.insuranceIncluded = data.insurance ? "포함" : "미포함";
    }

    return processedData;
  }

  // 변수 치환
  private replaceVariables(content: string, data: Record<string, any>): string {
    let processedContent = content;

    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processedContent = processedContent.replace(regex, String(value || ""));
    });

    return processedContent;
  }

  // 사용자 알림 설정 확인
  async shouldSendNotification(
    userId: string,
    type: NotificationType
  ): Promise<boolean> {
    try {
      // 실제로는 데이터베이스에서 사용자 설정 조회
      // 여기서는 Mock 구현
      const settings: NotificationSettings = {
        id: `settings_${userId}`,
        userId,
        emailNotifications: {
          newMessage: true,
          transactionUpdate: true,
          logisticsQuote: true,
          questionAnswer: true,
          paymentStatus: true,
          productInterest: true,
          systemAnnouncement: true,
        },
        pushNotifications: {
          enabled: false,
          newMessage: false,
          transactionUpdate: false,
          logisticsQuote: false,
          questionAnswer: false,
          paymentStatus: false,
          productInterest: false,
          systemAnnouncement: false,
        },
        updatedAt: new Date(),
      };

      const notificationKey = this.getNotificationKey(type);
      return settings.emailNotifications[notificationKey] || false;
    } catch (error) {
      console.error("알림 설정 확인 오류:", error);
      return true; // 오류 시 기본적으로 알림 발송
    }
  }

  // 알림 타입을 설정 키로 변환
  private getNotificationKey(
    type: NotificationType
  ): keyof NotificationSettings["emailNotifications"] {
    const keyMap: Record<
      NotificationType,
      keyof NotificationSettings["emailNotifications"]
    > = {
      new_message: "newMessage",
      transaction_update: "transactionUpdate",
      logistics_quote: "logisticsQuote",
      question_answer: "questionAnswer",
      payment_status: "paymentStatus",
      product_interest: "productInterest",
      system_announcement: "systemAnnouncement",
    };

    return keyMap[type] || "newMessage";
  }

  // 배치 이메일 발송
  async sendBatchEmails(notifications: EmailNotification[]): Promise<{
    success: number;
    failed: number;
    results: Array<{ id: string; success: boolean; error?: string }>;
  }> {
    const results = await Promise.allSettled(
      notifications.map(async notification => {
        const success = await this.sendEmail(notification);
        return { id: notification.id, success };
      })
    );

    const success = results.filter(
      r => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - success;

    return {
      success,
      failed,
      results: results.map((result, index) => ({
        id: notifications[index].id,
        success: result.status === "fulfilled" && result.value.success,
        error: result.status === "rejected" ? result.reason : undefined,
      })),
    };
  }
}

// 싱글톤 인스턴스
export const emailService = new EmailService();















