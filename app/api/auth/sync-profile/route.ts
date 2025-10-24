import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { uid, email, name, image, provider, providerId } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // Firebase DB 연결 비활성화 (임시)
    // TODO: Firebase Firestore API 활성화 후 다시 활성화
    console.log("프로필 동기화 요청 (Firebase DB 비활성화):", {
      uid,
      email,
      name,
      provider
    });

    return NextResponse.json({ 
      success: true, 
      message: "프로필 동기화 완료 (Firebase DB 비활성화)" 
    });
  } catch (error) {
    console.error("프로필 동기화 실패:", error);
    return NextResponse.json(
      { success: false, error: "프로필 동기화에 실패했습니다." },
      { status: 500 }
    );
  }
}