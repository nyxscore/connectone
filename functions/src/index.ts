import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

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
    // Next.js API 라우트 로직을 여기에 구현
    // 임시로 기본 응답
    res.status(200).json({
      message: "API is working!",
      path: req.path,
      method: req.method,
    });
  }
);
