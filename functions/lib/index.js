"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
// Node.js 20 런타임 설정
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
    // 기본 응답
    res.status(200).json({
        success: true,
        message: "Firebase Functions API (Node.js 20)",
        path: apiPath,
        method: req.method,
    });
});
//# sourceMappingURL=index.js.map