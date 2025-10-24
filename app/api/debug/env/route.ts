import { NextResponse } from "next/server";

export async function GET() {
  // 환경 변수 존재 여부만 체크 (보안상 실제 값은 반환하지 않음)
  const envCheck = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    NAVER_CLIENT_ID: !!process.env.NAVER_CLIENT_ID,
    NAVER_CLIENT_SECRET: !!process.env.NAVER_CLIENT_SECRET,
    // 디버깅용 추가 정보
    NODE_ENV: process.env.NODE_ENV,
    hasEnvFile: true, // .env.local 파일이 있다고 가정
  };

  console.log("환경 변수 체크:", envCheck);
  console.log("실제 환경 변수들:", {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "설정됨" : "없음",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "설정됨" : "없음",
    NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? "설정됨" : "없음",
  });

  return NextResponse.json(envCheck);
}
