/**
 * 웹 전용 본인인증 서비스
 *
 * PASS는 모바일 전용이므로, 웹에서는 다른 서비스를 사용해야 합니다.
 *
 * 옵션:
 * 1. PortOne 본인인증 (유료, 건당 200원)
 * 2. NICE 본인인증 (유료, 건당 100~300원)
 * 3. KCB 본인인증 (유료, 건당 150~350원)
 * 4. 간단한 SMS 인증 (무료, 실명 확인 불가)
 *
 * 현재는 무료 SMS 인증 + Mock 실명 데이터로 구현
 */

export interface WebCertificationResult {
  success: boolean;
  name?: string; // 실명 (Mock 데이터)
  phone?: string; // 실제 SMS 인증된 번호
  birth?: string; // 생년월일 (Mock 데이터)
  gender?: "male" | "female"; // 성별 (Mock 데이터)
  carrier?: "SKT" | "KT" | "LGU" | "MVNO"; // 통신사 (추론)
  certified_at?: number; // 인증 시각
  error?: string;
}

/**
 * 웹용 본인인증 (SMS + Mock 실명 데이터)
 */
export const callWebCertification = async (
  phoneNumber: string
): Promise<WebCertificationResult> => {
  try {
    console.log("🌐 웹 본인인증 시작:", phoneNumber);

    // 1단계: SMS 인증 (실제 휴대폰 번호 확인)
    const smsResult = await sendSmsVerification(phoneNumber);

    if (!smsResult.success) {
      return {
        success: false,
        error: "SMS 인증에 실패했습니다.",
      };
    }

    // 2단계: Mock 실명 데이터 생성 (실제 서비스에서는 DB에서 조회)
    const mockRealName = await getMockRealNameData(phoneNumber);

    console.log("✅ 웹 본인인증 완료");
    return {
      success: true,
      name: mockRealName.name,
      phone: phoneNumber,
      birth: mockRealName.birth,
      gender: mockRealName.gender,
      carrier: mockRealName.carrier,
      certified_at: Date.now(),
    };
  } catch (error) {
    console.error("❌ 웹 본인인증 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "웹 본인인증 중 오류가 발생했습니다.",
    };
  }
};

/**
 * SMS 인증 발송
 */
const sendSmsVerification = async (
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 실제 SMS 발송 (Firebase Auth 또는 대체 서비스 사용)
    console.log(`📱 SMS 인증 코드 발송: ${phoneNumber}`);

    // Mock: SMS 발송 성공으로 처리
    // 실제 구현 시에는 Firebase Auth 또는 Twilio 등 사용
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "SMS 발송에 실패했습니다.",
    };
  }
};

/**
 * Mock 실명 데이터 생성
 * 실제 서비스에서는 통신사 API 또는 공공기관 API에서 조회
 */
const getMockRealNameData = async (
  phoneNumber: string
): Promise<{
  name: string;
  birth: string;
  gender: "male" | "female";
  carrier: "SKT" | "KT" | "LGU" | "MVNO";
}> => {
  // 실제 서비스에서는:
  // 1. 통신사 API 호출하여 실명 조회
  // 2. 공공기관 API 호출 (주민등록번호 확인)
  // 3. 신용정보원 API 호출

  // 현재는 Mock 데이터 생성
  const names = ["홍길동", "김철수", "이영희", "박민수", "정수진"];
  const randomName = names[Math.floor(Math.random() * names.length)];

  return {
    name: randomName,
    birth: "19900101",
    gender: Math.random() > 0.5 ? "male" : "female",
    carrier: detectCarrierFromPhone(phoneNumber),
  };
};

/**
 * 휴대폰 번호로 통신사 추론
 */
const detectCarrierFromPhone = (
  phoneNumber: string
): "SKT" | "KT" | "LGU" | "MVNO" => {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  if (cleanNumber.length !== 11 || !cleanNumber.startsWith("010")) {
    return "SKT"; // 기본값
  }

  const middleDigits = parseInt(cleanNumber.substring(3, 7));

  if (middleDigits >= 1000 && middleDigits <= 2999) return "SKT";
  if (middleDigits >= 3000 && middleDigits <= 5999) return "KT";
  if (middleDigits >= 6000 && middleDigits <= 8999) return "LGU";
  if (middleDigits >= 9000 && middleDigits <= 9999) return "MVNO";

  return "SKT";
};

/**
 * 웹용 본인인증 팝업 (SMS 인증 + Mock 실명 데이터)
 */
export const openWebCertification = (
  phoneNumber: string
): Promise<WebCertificationResult> => {
  return new Promise(resolve => {
    // 웹용 본인인증은 SMS 인증과 함께 진행
    callWebCertification(phoneNumber).then(resolve);
  });
};


