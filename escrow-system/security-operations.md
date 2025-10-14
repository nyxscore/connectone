# 보안 및 운영 고려사항

## 1. 데이터베이스 트랜잭션 및 상태 검증

### 원자성 보장

```typescript
// 모든 중요한 상태 전이는 트랜잭션 내에서 실행
export async function updateTransactionStatus(
  transactionId: string,
  fromStatus: TransactionStatus,
  toStatus: TransactionStatus,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return await prisma.$transaction(async tx => {
    // 1. 현재 상태 재검증 (Optimistic Locking)
    const currentTransaction = await tx.transaction.findUnique({
      where: {
        id: transactionId,
        status: fromStatus, // 현재 상태와 일치하는지 확인
      },
      select: { id: true, status: true, updatedAt: true },
    });

    if (!currentTransaction) {
      throw new Error(`거래 상태 불일치: ${transactionId}`);
    }

    // 2. 상태 전이 검증
    const validation = EscrowStateMachine.validateTransition(
      transactionId,
      fromStatus,
      toStatus,
      "buyer", // 또는 적절한 트리거
      {
        /* 조건들 */
      }
    );

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // 3. 상태 업데이트
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: toStatus,
        updatedAt: new Date(),
        // 버전 필드로 동시성 제어
        version: { increment: 1 },
      },
    });

    // 4. 이벤트 로그 생성
    await tx.eventLog.create({
      data: {
        transactionId,
        userId,
        eventType: "status_change",
        fromStatus,
        toStatus,
        description: `상태가 ${fromStatus}에서 ${toStatus}로 변경되었습니다.`,
        metadata: { timestamp: new Date().toISOString() },
      },
    });

    return { success: true };
  });
}
```

### Idempotency Key 처리

```typescript
// 중복 요청 방지를 위한 Idempotency Key 검증
export async function processPaymentWithIdempotency(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const idempotencyKey =
    request.idempotencyKey || generateIdempotencyKey(request);

  // Redis 또는 DB에서 중복 검사
  const existingRequest = await redis.get(`idempotency:${idempotencyKey}`);
  if (existingRequest) {
    return JSON.parse(existingRequest);
  }

  // 실제 처리
  const result = await processPayment(request);

  // 결과를 캐시에 저장 (24시간 TTL)
  await redis.setex(
    `idempotency:${idempotencyKey}`,
    86400,
    JSON.stringify(result)
  );

  return result;
}
```

## 2. 결제 및 환불 이중 승인 시스템

### 콜드/온체크포인트 계정 분리

```typescript
interface PaymentAccount {
  accountId: string;
  accountType: "hot" | "cold"; // 온체크포인트, 콜드체크포인트
  dailyLimit: number;
  monthlyLimit: number;
  requiresApproval: boolean;
}

class PaymentApprovalSystem {
  async processHighValuePayment(
    amount: number,
    transactionId: string
  ): Promise<{ requiresApproval: boolean; approvalId?: string }> {
    const threshold = 1000000; // 100만원 이상

    if (amount >= threshold) {
      // 고액 결제는 콜드체크포인트 계정 사용
      const approvalId = await this.createApprovalRequest({
        transactionId,
        amount,
        accountType: "cold",
        requiresApproval: true,
      });

      // 관리자 알림 발송
      await this.notifyAdmins({
        type: "high_value_payment",
        transactionId,
        amount,
        approvalId,
      });

      return { requiresApproval: true, approvalId };
    }

    return { requiresApproval: false };
  }

  async approvePayment(approvalId: string, adminId: string): Promise<boolean> {
    // 관리자 권한 검증
    const admin = await this.verifyAdmin(adminId);
    if (!admin || !admin.canApprovePayments) {
      throw new Error("승인 권한이 없습니다.");
    }

    // 이중 승인 확인 (2명의 관리자 승인 필요)
    const approvals = await this.getApprovals(approvalId);
    if (approvals.length < 2) {
      await this.addApproval(approvalId, adminId);
      return false; // 아직 승인 부족
    }

    // 결제 실행
    await this.executePayment(approvalId);
    return true;
  }
}
```

### 정산/환불 작업 로그

```typescript
interface SettlementLog {
  id: string;
  transactionId: string;
  amount: number;
  type: "settlement" | "refund";
  fromAccount: string;
  toAccount: string;
  approvedBy: string[];
  executedAt: Date;
  metadata: Record<string, any>;
}

class SettlementAuditSystem {
  async logSettlementAction(
    transactionId: string,
    amount: number,
    type: "settlement" | "refund",
    accounts: { from: string; to: string },
    approvedBy: string[]
  ): Promise<void> {
    await prisma.settlementLog.create({
      data: {
        transactionId,
        amount,
        type,
        fromAccount: accounts.from,
        toAccount: accounts.to,
        approvedBy,
        executedAt: new Date(),
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: "escrow-system",
          version: "1.0.0",
        },
      },
    });
  }
}
```

## 3. 민감 데이터 암호화

### 계좌번호 암호화

```typescript
import crypto from "crypto";

class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly key = process.env.ENCRYPTION_KEY!;

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from("escrow-system", "utf8"));

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };
  }

  decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): string {
    const decipher = crypto.createDecipher(
      this.algorithm,
      Buffer.from(this.key, "hex")
    );

    decipher.setAAD(Buffer.from("escrow-system", "utf8"));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

// 사용 예시
const encryptionService = new EncryptionService();

// 계좌번호 저장 시
const encryptedAccount = encryptionService.encrypt(accountNumber);
await prisma.user.update({
  where: { id: userId },
  data: {
    encryptedAccountNumber: encryptedAccount.encrypted,
    accountIv: encryptedAccount.iv,
    accountTag: encryptedAccount.tag,
  },
});

// 계좌번호 조회 시
const user = await prisma.user.findUnique({ where: { id: userId } });
const accountNumber = encryptionService.decrypt({
  encrypted: user.encryptedAccountNumber,
  iv: user.accountIv,
  tag: user.accountTag,
});
```

## 4. 관리자 대시보드 및 분쟁 관리

### 분쟁 대시보드

```typescript
interface DisputeDashboard {
  openDisputes: number;
  pendingReviews: number;
  resolvedThisWeek: number;
  averageResolutionTime: number;
  disputeBreakdown: {
    qualityIssue: number;
    nonDelivery: number;
    wrongItem: number;
    sellerNonResponse: number;
  };
}

class AdminDashboard {
  async getDisputeOverview(): Promise<DisputeDashboard> {
    const [openDisputes, pendingReviews, resolvedThisWeek] = await Promise.all([
      prisma.dispute.count({ where: { status: "open" } }),
      prisma.dispute.count({ where: { status: "investigating" } }),
      prisma.dispute.count({
        where: {
          status: "resolved",
          resolvedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const disputeBreakdown = await prisma.dispute.groupBy({
      by: ["type"],
      where: { status: { in: ["open", "investigating"] } },
      _count: { type: true },
    });

    return {
      openDisputes,
      pendingReviews,
      resolvedThisWeek,
      averageResolutionTime: await this.getAverageResolutionTime(),
      disputeBreakdown: this.formatDisputeBreakdown(disputeBreakdown),
    };
  }

  async getDisputeDetails(disputeId: string): Promise<any> {
    return await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: {
          include: {
            buyer: { select: { id: true, nickname: true, email: true } },
            seller: { select: { id: true, nickname: true, email: true } },
            listing: { select: { title: true, images: true } },
            shipments: true,
            eventLogs: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
  }

  async resolveDispute(
    disputeId: string,
    resolution: string,
    adminId: string,
    refundAmount?: number
  ): Promise<{ success: boolean }> {
    return await prisma.$transaction(async tx => {
      // 분쟁 해결
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: "resolved",
          resolution,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      });

      // 환불 처리 (필요한 경우)
      if (refundAmount && refundAmount > 0) {
        const dispute = await tx.dispute.findUnique({
          where: { id: disputeId },
          include: { transaction: true },
        });

        await this.processRefund(
          dispute.transactionId,
          refundAmount,
          "관리자 분쟁 해결"
        );
      }

      return { success: true };
    });
  }
}
```

## 5. 모니터링 및 알림

### 시스템 모니터링

```typescript
class SystemMonitor {
  async checkSystemHealth(): Promise<{
    status: "healthy" | "warning" | "critical";
    issues: string[];
  }> {
    const issues: string[] = [];

    // 1. 데이터베이스 연결 확인
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      issues.push("데이터베이스 연결 실패");
    }

    // 2. Redis 연결 확인
    try {
      await redis.ping();
    } catch (error) {
      issues.push("Redis 연결 실패");
    }

    // 3. PG 서비스 상태 확인
    const pgHealth = await this.checkPaymentGatewayHealth();
    if (!pgHealth) {
      issues.push("결제 게이트웨이 서비스 장애");
    }

    // 4. 대기 중인 트랜잭션 확인
    const pendingTransactions = await prisma.transaction.count({
      where: {
        status: { in: ["PAID", "IN_ESCROW", "REFUND_PENDING"] },
        updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (pendingTransactions > 10) {
      issues.push(
        `${pendingTransactions}개의 오래된 트랜잭션이 대기 중입니다.`
      );
    }

    return {
      status:
        issues.length === 0
          ? "healthy"
          : issues.length > 3
            ? "critical"
            : "warning",
      issues,
    };
  }

  async sendAlert(
    level: "info" | "warning" | "critical",
    message: string
  ): Promise<void> {
    // Slack, 이메일, SMS 등으로 알림 발송
    console.log(`[${level.toUpperCase()}] ${message}`);

    if (level === "critical") {
      // 긴급 알림 발송
      await this.sendEmergencyAlert(message);
    }
  }
}
```

## 6. 백업 및 복구

### 데이터 백업 전략

```typescript
class BackupService {
  async createTransactionBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `backups/transactions-${timestamp}.json`;

    // 중요한 거래 데이터만 백업
    const transactions = await prisma.transaction.findMany({
      where: {
        status: { in: ["PAID", "IN_ESCROW", "AWAITING_SHIPMENT", "SHIPPED"] },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: {
        payments: true,
        shipments: true,
        eventLogs: true,
      },
    });

    await fs.writeFile(backupPath, JSON.stringify(transactions, null, 2));

    // S3 또는 다른 클라우드 스토리지에 업로드
    await this.uploadToCloud(backupPath);
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    const backupData = await fs.readFile(backupPath, "utf8");
    const transactions = JSON.parse(backupData);

    await prisma.$transaction(async tx => {
      for (const transaction of transactions) {
        await tx.transaction.upsert({
          where: { id: transaction.id },
          update: transaction,
          create: transaction,
        });
      }
    });
  }
}
```

이러한 보안 및 운영 고려사항들을 통해 안전하고 신뢰할 수 있는 에스크로 시스템을 구축할 수 있습니다.



