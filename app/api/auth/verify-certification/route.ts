import { NextRequest, NextResponse } from "next/server";

/**
 * PortOne 본인인증 결과 검증 API
 *
 * 프론트엔드에서 받은 imp_uid로 PortOne 서버에 실제 인증 정보를 조회합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const { imp_uid } = await request.json();

    if (!imp_uid) {
      return NextResponse.json(
        { success: false, error: "imp_uid가 필요합니다." },
        { status: 400 }
      );
    }

    const impKey = process.env.NEXT_PUBLIC_PORTONE_API_KEY;
    const impSecret = process.env.PORTONE_API_SECRET;

    if (!impKey || !impSecret) {
      console.error("❌ PortOne API 키가 설정되지 않았습니다.");

      // Mock 모드: 테스트용 데이터 반환
      if (
        process.env.NODE_ENV === "development" ||
        imp_uid.startsWith("mock_")
      ) {
        console.log("🧪 Mock 모드: 테스트용 본인인증 데이터 반환");
        return NextResponse.json({
          success: true,
          imp_uid: imp_uid,
          name: "홍길동",
          phone: "01012345678",
          birth: "19900101",
          gender: "male",
          carrier: "SKT",
          certified_at: Date.now(),
        });
      }

      return NextResponse.json(
        { success: false, error: "PortOne API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 1. PortOne Access Token 발급
    const tokenResponse = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imp_key: impKey,
        imp_secret: impSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("PortOne 토큰 발급 실패");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.response.access_token;

    // 2. 본인인증 정보 조회
    const certResponse = await fetch(
      `https://api.iamport.kr/certifications/${imp_uid}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!certResponse.ok) {
      throw new Error("본인인증 정보 조회 실패");
    }

    const certData = await certResponse.json();

    if (certData.code !== 0) {
      return NextResponse.json({
        success: false,
        error: certData.message,
      });
    }

    // 3. 인증 결과 반환
    const certification = certData.response;
    return NextResponse.json({
      success: true,
      imp_uid: certification.imp_uid,
      merchant_uid: certification.merchant_uid,
      name: certification.name,
      phone: certification.phone,
      birth: certification.birth,
      gender: certification.gender,
      carrier: certification.carrier,
      certified_at: certification.certified_at,
    });
  } catch (error) {
    console.error("본인인증 검증 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "검증 실패",
      },
      { status: 500 }
    );
  }
}


