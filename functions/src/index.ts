import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Next.js API 라우트를 Firebase Functions로 마이그레이션
setGlobalOptions({
  region: "us-central1",
});

// API 라우트를 Firebase Functions로 프록시
export const api = onRequest(
  {
    cors: true,
    region: "us-central1",
  },
  async (req, res) => {
    const { pathname } = new URL(req.url || "", `http://localhost`);
    const apiPath = pathname.replace("/api", "");

    console.log(`API 호출: ${req.method} ${apiPath}`);

    // API 라우트별 처리
    try {
      let handled = false;

      // 채팅 관련 API
      if (apiPath.startsWith("/chat/")) {
        if (apiPath === "/chat/send-message" && req.method === "POST") {
          await handleChatSendMessage(req, res);
          handled = true;
        } else if (apiPath === "/chat/start" && req.method === "POST") {
          await handleChatStart(req, res);
          handled = true;
        }
      }
      // 상품 관련 API
      else if (apiPath.startsWith("/products/")) {
        if (apiPath.startsWith("/products/") && req.method === "GET") {
          await handleProducts(req, res);
          handled = true;
        }
      }
      // 프로필 관련 API
      else if (apiPath.startsWith("/profile/")) {
        if (apiPath === "/profile/my-items" && req.method === "GET") {
          await handleProfileMyItems(req, res);
          handled = true;
        }
      }
      // 거래 관련 API
      else if (apiPath.startsWith("/transactions/")) {
        if (apiPath === "/transactions/create" && req.method === "POST") {
          await handleTransactionsCreate(req, res);
          handled = true;
        }
      }
      // 결제 관련 API
      else if (apiPath.startsWith("/payment/")) {
        if (apiPath === "/payment/cancel-escrow" && req.method === "POST") {
          await handlePaymentCancelEscrow(req, res);
          handled = true;
        }
      }

      if (handled) {
        return;
      }

      // 기본 응답
      res.status(404).json({
        error: "API endpoint not found",
        path: apiPath,
        method: req.method,
      });
      return;
    } catch (error) {
      console.error("API 오류:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// 채팅 메시지 전송 처리
async function handleChatSendMessage(req: any, res: any) {
  try {
    const body = await getRequestBody(req);
    const { chatId, message } = body;

    if (!chatId || !message) {
      res.status(400).json({
        success: false,
        error: "필수 필드가 누락되었습니다.",
      });
      return;
    }

    // 실제 채팅 메시지 전송 로직 구현
    // 임시로 성공 응답
    res.status(200).json({
      success: true,
      message: "메시지가 전송되었습니다.",
    });
  } catch (error) {
    console.error("메시지 전송 실패:", error);
    res.status(500).json({
      success: false,
      error: "메시지 전송에 실패했습니다.",
    });
  }
}

// 채팅 시작 처리
async function handleChatStart(req: any, res: any) {
  const body = await getRequestBody(req);

  // 임시 응답 (실제 로직은 나중에 구현)
  res.status(200).json({
    success: true,
    chatId: `${body.buyerUid}_${body.sellerUid}_${body.itemId}`,
    message: "Chat started",
  });
}

// 상품 조회 처리
async function handleProducts(req: any, res: any) {
  const { searchParams } = new URL(req.url || "", "http://localhost");
  const itemId = searchParams.get("itemId");

  if (itemId) {
    // 임시 응답 (실제 로직은 나중에 구현)
    res.status(200).json({
      success: true,
      item: { id: itemId, title: "Sample Product" },
    });
  } else {
    res.status(400).json({ error: "itemId is required" });
  }
}

// 프로필 상품 조회 처리
async function handleProfileMyItems(req: any, res: any) {
  try {
    const { searchParams } = new URL(req.url || "", "http://localhost");
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "all";

    if (!userId) {
      res.status(400).json({ success: false, error: "사용자 ID가 필요합니다." });
      return;
    }

    let items: any[] = [];

    if (type === "all" || type === "selling") {
      // 판매중인 상품 (active 상태)
      const sellingQuery = query(
        collection(db, "items"),
        where("sellerUid", "==", userId),
        where("status", "==", "active")
      );
      const sellingSnapshot = await getDocs(sellingQuery);
      sellingSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
    }

    if (type === "all" || type === "trading") {
      // 거래중인 상품 (판매자 관점 + 구매자 관점)
      const sellerTradingQuery = query(
        collection(db, "items"),
        where("sellerUid", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const buyerTradingQuery = query(
        collection(db, "items"),
        where("buyerUid", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const [sellerTradingSnapshot, buyerTradingSnapshot] = await Promise.all([
        getDocs(sellerTradingQuery),
        getDocs(buyerTradingQuery),
      ]);

      // 판매자 관점 거래중 상품 추가
      sellerTradingSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      // 구매자 관점 거래중 상품 추가 (중복 제거)
      buyerTradingSnapshot.forEach(doc => {
        if (!items.find(item => item.id === doc.id)) {
          items.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    if (type === "all" || type === "buying") {
      // 구매중인 상품 (구매자 관점) - buyerUid와 buyerId 두 필드 모두 확인
      const buyingUidQuery = query(
        collection(db, "items"),
        where("buyerUid", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const buyingIdQuery = query(
        collection(db, "items"),
        where("buyerId", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const [buyingUidSnapshot, buyingIdSnapshot] = await Promise.all([
        getDocs(buyingUidQuery),
        getDocs(buyingIdQuery),
      ]);

      // buyerUid로 찾은 상품들 추가
      buyingUidSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      // buyerId로 찾은 상품들 추가 (중복 제거)
      buyingIdSnapshot.forEach(doc => {
        if (!items.find(item => item.id === doc.id)) {
          items.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    if (type === "sold") {
      // 거래완료된 상품 (판매자 관점 + 구매자 관점)
      const sellerSoldQuery = query(
        collection(db, "items"),
        where("sellerUid", "==", userId),
        where("status", "==", "sold")
      );

      const buyerSoldQuery = query(
        collection(db, "items"),
        where("buyerUid", "==", userId),
        where("status", "==", "sold")
      );

      const [sellerSoldSnapshot, buyerSoldSnapshot] = await Promise.all([
        getDocs(sellerSoldQuery),
        getDocs(buyerSoldQuery),
      ]);

      // 판매자 관점 거래완료 상품 추가
      sellerSoldSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      // 구매자 관점 거래완료 상품 추가 (중복 제거)
      buyerSoldSnapshot.forEach(doc => {
        if (!items.find(item => item.id === doc.id)) {
          items.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // 중복 제거 (같은 상품이 여러 카테고리에 속할 수 있음)
    const uniqueItems = items.filter(
      (item, index, self) => index === self.findIndex(t => t.id === item.id)
    );

    // 정렬 (createdAt 기준 내림차순)
    uniqueItems.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    res.status(200).json({
      success: true,
      items: uniqueItems,
      userType: "seller",
    });
  } catch (error) {
    console.error("프로필 상품 조회 실패:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "상품 조회에 실패했습니다.",
    });
  }
}

// 거래 생성 처리
async function handleTransactionsCreate(_req: any, res: any) {
  // 임시 응답 (실제 로직은 나중에 구현)
  res.status(200).json({
    success: true,
    transactionId: "temp_transaction_id",
    message: "Transaction created",
  });
}

// 안전결제 취소 처리
async function handlePaymentCancelEscrow(_req: any, res: any) {
  // 임시 응답 (실제 로직은 나중에 구현)
  res.status(200).json({
    success: true,
    message: "Escrow cancelled",
  });
}

// 요청 본문 파싱 헬퍼
async function getRequestBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}
