import { Request, Response } from "express";
import { EscrowService } from "./core-functions";
import {
  PaymentRequest,
  ShipmentRequest,
  RefundRequest,
  DisputeRequest,
} from "./types";

// 결제 시작
export async function initiatePayment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "인증이 필요합니다." });
    }

    const request: PaymentRequest = {
      transactionId: req.body.transactionId,
      amount: req.body.amount,
      method: req.body.method || "card",
      pgProvider: req.body.pgProvider || "toss",
      idempotencyKey:
        req.body.idempotencyKey || `payment_${Date.now()}_${userId}`,
    };

    const result = await EscrowService.initiatePayment(userId, request);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("결제 시작 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 결제 확인 (PG 웹훅)
export async function confirmPayment(req: Request, res: Response) {
  try {
    const { transactionId, pgTransactionId, status } = req.body;

    // PG 서명 검증 (실제 구현에서는 PG에서 제공하는 검증 로직 사용)
    const isValidSignature = await verifyPGSignature(req.body, req.headers);
    if (!isValidSignature) {
      return res
        .status(400)
        .json({ success: false, error: "잘못된 서명입니다." });
    }

    // 중복 처리 방지
    const existingPayment = await prisma.payment.findFirst({
      where: { pgTransactionId },
    });

    if (existingPayment && existingPayment.pgStatus === "completed") {
      return res.json({ success: true, message: "이미 처리된 결제입니다." });
    }

    const result = await EscrowService.confirmPayment(
      transactionId,
      pgTransactionId,
      status
    );
    res.json(result);
  } catch (error) {
    console.error("결제 확인 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 취소 요청
export async function requestCancel(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "인증이 필요합니다." });
    }

    const { transactionId, reason } = req.body;
    const result = await EscrowService.requestCancel(
      userId,
      transactionId,
      reason
    );

    res.json(result);
  } catch (error) {
    console.error("취소 요청 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 취소 승인
export async function approveCancel(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "인증이 필요합니다." });
    }

    const { transactionId } = req.body;
    const result = await EscrowService.approveCancel(userId, transactionId);

    res.json(result);
  } catch (error) {
    console.error("취소 승인 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 배송 등록
export async function registerShipment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "인증이 필요합니다." });
    }

    const request: ShipmentRequest = req.body;
    const result = await EscrowService.registerShipment(userId, request);

    res.json(result);
  } catch (error) {
    console.error("배송 등록 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 배송 업데이트 (택배사 웹훅)
export async function updateShipment(req: Request, res: Response) {
  try {
    const payload = req.body;
    const result = await EscrowService.handleShipmentWebhook(payload);

    res.json(result);
  } catch (error) {
    console.error("배송 업데이트 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 배송 확인
export async function confirmDelivery(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "인증이 필요합니다." });
    }

    const { transactionId } = req.body;
    const result = await EscrowService.confirmDelivery(userId, transactionId);

    res.json(result);
  } catch (error) {
    console.error("배송 확인 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 구매 확정
export async function confirmPurchase(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "인증이 필요합니다." });
    }

    const { transactionId } = req.body;
    const result = await EscrowService.confirmPurchase(userId, transactionId);

    res.json(result);
  } catch (error) {
    console.error("구매 확정 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 환불 처리
export async function processRefund(req: Request, res: Response) {
  try {
    const request: RefundRequest = req.body;
    const result = await EscrowService.processRefund(request);

    res.json(result);
  } catch (error) {
    console.error("환불 처리 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 분쟁 신고
export async function openDispute(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "인증이 필요합니다." });
    }

    const request: DisputeRequest = req.body;
    const result = await EscrowService.openDispute(userId, request);

    res.json(result);
  } catch (error) {
    console.error("분쟁 신고 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 증빙 업로드
export async function uploadEvidence(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "인증이 필요합니다." });
    }

    const { transactionId, evidenceUrls } = req.body;
    const result = await EscrowService.uploadEvidence(
      userId,
      transactionId,
      evidenceUrls
    );

    res.json(result);
  } catch (error) {
    console.error("증빙 업로드 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 관리자 분쟁 해결
export async function resolveDispute(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user?.isAdmin) {
      return res
        .status(403)
        .json({ success: false, error: "관리자 권한이 필요합니다." });
    }

    const { transactionId, resolution, refundAmount } = req.body;
    const result = await EscrowService.resolveDispute(
      userId,
      transactionId,
      resolution,
      refundAmount
    );

    res.json(result);
  } catch (error) {
    console.error("분쟁 해결 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 거래 상태 조회
export async function getTransactionStatus(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;
    const userId = req.user?.id;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: { select: { id: true, nickname: true } },
        seller: { select: { id: true, nickname: true } },
        listing: { select: { id: true, title: true, price: true } },
        payments: true,
        shipments: true,
        refunds: true,
        disputes: true,
        eventLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, error: "거래를 찾을 수 없습니다." });
    }

    // 권한 확인
    if (
      userId !== transaction.buyerId &&
      userId !== transaction.sellerId &&
      !req.user?.isAdmin
    ) {
      return res
        .status(403)
        .json({ success: false, error: "권한이 없습니다." });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error("거래 상태 조회 오류:", error);
    res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}

// 헬퍼 함수들
async function verifyPGSignature(payload: any, headers: any): Promise<boolean> {
  // 실제 구현에서는 PG에서 제공하는 서명 검증 로직 사용
  // 예: Toss Payments의 경우 X-Toss-Signature 헤더 검증
  return true; // 테스트용
}

// 라우터 설정 예시
export const escrowRoutes = {
  // 결제 관련
  "POST /payment/initiate": initiatePayment,
  "POST /payment/confirm": confirmPayment,
  "POST /payment/cancel-request": requestCancel,
  "POST /payment/cancel-approve": approveCancel,
  "POST /payment/confirm": confirmPurchase,
  "POST /payment/refund": processRefund,

  // 배송 관련
  "POST /shipment/register": registerShipment,
  "POST /shipment/update": updateShipment,
  "POST /shipment/confirm": confirmDelivery,

  // 분쟁 관련
  "POST /dispute/open": openDispute,
  "POST /dispute/upload-evidence": uploadEvidence,
  "POST /dispute/resolve": resolveDispute,

  // 조회
  "GET /transaction/:id": getTransactionStatus,

  // 웹훅
  "POST /webhook/pg": confirmPayment,
  "POST /webhook/courier": updateShipment,
};














