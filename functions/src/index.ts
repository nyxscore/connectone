import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

// Node.js 20 런타임 설정
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

    // 기본 응답
    res.status(200).json({
      success: true,
      message: "Firebase Functions API (Node.js 20)",
      path: apiPath,
      method: req.method,
    });
  }
);
