/**
 * PortOne (구 아임포트) 본인인증 서비스
 *
 * 가입: https://admin.portone.io
 * 문서: https://developers.portone.io/docs/ko/auth/guide
 *
 * 설정 방법:
 * 1. PortOne 관리자 콘솔에서 가입
 * 2. "본인인증" 메뉴에서 API 키 발급
 * 3. .env.local에 추가:
 *    NEXT_PUBLIC_PORTONE_IMP_CODE=impXXXXXXXX
 *    NEXT_PUBLIC_PORTONE_API_KEY=your_api_key
 *    PORTONE_API_SECRET=your_api_secret
 */

export interface CertificationResult {
  success: boolean;
  imp_uid?: string; // 본인인증 고유번호
  merchant_uid?: string; // 가맹점 거래 고유번호
  name?: string; // 실명
  phone?: string; // 핸드폰 번호
  birth?: string; // 생년월일 (YYYYMMDD)
  gender?: "male" | "female"; // 성별
  carrier?: "SKT" | "KT" | "LGU" | "MVNO"; // 통신사
  certified_at?: number; // 인증 시각 (timestamp)
  error_code?: string;
  error_msg?: string;
}

/**
 * PortOne 본인인증 팝업 열기
 */
export const openCertificationPopup = (): Promise<CertificationResult> => {
  return new Promise((resolve, reject) => {
    // IMP 라이브러리 로드 확인
    if (typeof window === "undefined" || !(window as any).IMP) {
      reject(new Error("PortOne 라이브러리가 로드되지 않았습니다."));
      return;
    }

    const IMP = (window as any).IMP;
    const impCode = process.env.NEXT_PUBLIC_PORTONE_IMP_CODE;

    if (!impCode) {
      reject(new Error("PortOne IMP 코드가 설정되지 않았습니다."));
      return;
    }

    // PortOne 초기화
    IMP.init(impCode);

    // 고유 거래번호 생성
    const merchant_uid = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 본인인증 요청
    IMP.certification(
      {
        merchant_uid: merchant_uid,
        m_redirect_url: `${window.location.origin}/auth/certification/callback`, // 모바일 리다이렉트
        popup: true, // PC에서 팝업 사용
      },
      (response: any) => {
        if (response.success) {
          console.log("✅ 본인인증 성공:", response);
          resolve({
            success: true,
            imp_uid: response.imp_uid,
            merchant_uid: response.merchant_uid,
          });
        } else {
          console.error("❌ 본인인증 실패:", response);
          resolve({
            success: false,
            error_code: response.error_code,
            error_msg: response.error_msg,
          });
        }
      }
    );
  });
};

/**
 * 서버에서 본인인증 결과 검증
 * (프론트엔드에서 받은 imp_uid로 실제 인증 정보 조회)
 */
export const verifyCertification = async (
  imp_uid: string
): Promise<CertificationResult> => {
  try {
    const response = await fetch("/api/auth/verify-certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imp_uid }),
    });

    if (!response.ok) {
      throw new Error("본인인증 검증 실패");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("본인인증 검증 오류:", error);
    return {
      success: false,
      error_msg: error instanceof Error ? error.message : "검증 실패",
    };
  }
};

/**
 * Mock 본인인증 (테스트용)
 */
export const mockCertification = (): Promise<CertificationResult> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        imp_uid: `mock_${Date.now()}`,
        merchant_uid: `cert_mock_${Date.now()}`,
        name: "홍길동",
        phone: "01012345678",
        birth: "19900101",
        gender: "male",
        carrier: "SKT",
        certified_at: Date.now(),
      });
    }, 1000);
  });
};


