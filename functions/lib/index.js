"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
// Next.js API 라우트를 Firebase Functions로 마이그레이션
(0, v2_1.setGlobalOptions)({
    region: "us-central1",
});
// API 라우트를 Firebase Functions로 프록시
exports.api = (0, https_1.onRequest)({
    cors: true,
    region: "us-central1",
}, async (req, res) => {
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
            }
            else if (apiPath === "/chat/start" && req.method === "POST") {
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
    }
    catch (error) {
        console.error("API 오류:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// 채팅 메시지 전송 처리
async function handleChatSendMessage(req, res) {
    const body = await getRequestBody(req);
    // 임시 응답 (실제 로직은 나중에 구현)
    res.status(200).json({
        success: true,
        message: "Chat message sent",
        chatId: body.chatId
    });
}
// 채팅 시작 처리
async function handleChatStart(req, res) {
    const body = await getRequestBody(req);
    // 임시 응답 (실제 로직은 나중에 구현)
    res.status(200).json({
        success: true,
        chatId: `${body.buyerUid}_${body.sellerUid}_${body.itemId}`,
        message: "Chat started"
    });
}
// 상품 조회 처리
async function handleProducts(req, res) {
    const { searchParams } = new URL(req.url || "", "http://localhost");
    const itemId = searchParams.get("itemId");
    if (itemId) {
        // 임시 응답 (실제 로직은 나중에 구현)
        res.status(200).json({
            success: true,
            item: { id: itemId, title: "Sample Product" }
        });
    }
    else {
        res.status(400).json({ error: "itemId is required" });
    }
}
// 프로필 상품 조회 처리
async function handleProfileMyItems(req, res) {
    const { searchParams } = new URL(req.url || "", "http://localhost");
    const userId = searchParams.get("userId");
    if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
    }
    // 임시 응답 (실제 로직은 나중에 구현)
    res.status(200).json({
        success: true,
        items: [],
        userType: "seller"
    });
}
// 거래 생성 처리
async function handleTransactionsCreate(_req, res) {
    // 임시 응답 (실제 로직은 나중에 구현)
    res.status(200).json({
        success: true,
        transactionId: "temp_transaction_id",
        message: "Transaction created"
    });
}
// 안전결제 취소 처리
async function handlePaymentCancelEscrow(_req, res) {
    // 임시 응답 (실제 로직은 나중에 구현)
    res.status(200).json({
        success: true,
        message: "Escrow cancelled"
    });
}
// 요청 본문 파싱 헬퍼
async function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                resolve(JSON.parse(body));
            }
            catch (error) {
                resolve({});
            }
        });
        req.on("error", reject);
    });
}
//# sourceMappingURL=index.js.map