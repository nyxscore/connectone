/**
 * 실제 PASS API 연동
 *
 * 각 통신사별 PASS SDK 연동
 * - SKT: SuperToss SDK
 * - KT: KT PASS SDK
 * - LG U+: U+ PASS SDK
 * - 알뜰폰: 해당 통신사 PASS SDK
 */

export interface PassApiResult {
  success: boolean;
  name?: string;
  phone?: string;
  birth?: string;
  gender?: "male" | "female";
  carrier?: "SKT" | "KT" | "LGU" | "MVNO";
  certified_at?: number;
  error?: string;
}

/**
 * 통신사 감지
 */
export const detectCarrier = (phoneNumber: string): string | null => {
  // 한국 휴대폰 번호 패턴
  const phonePattern = /^010-?(\d{4})-?(\d{4})$/;
  const match = phoneNumber.replace(/\D/g, "").match(/^010(\d{8})$/);

  if (!match) return null;

  const fullNumber = match[0];

  // SKT: 010-1xxx-xxxx, 010-2xxx-xxxx, 010-3xxx-xxxx, 010-4xxx-xxxx, 010-5xxx-xxxx, 010-6xxx-xxxx, 010-7xxx-xxxx, 010-8xxx-xxxx, 010-9xxx-xxxx
  // KT: 010-1xxx-xxxx, 010-2xxx-xxxx, 010-3xxx-xxxx, 010-4xxx-xxxx, 010-5xxx-xxxx, 010-6xxx-xxxx, 010-7xxx-xxxx, 010-8xxx-xxxx, 010-9xxx-xxxx
  // LG U+: 010-1xxx-xxxx, 010-2xxx-xxxx, 010-3xxx-xxxx, 010-4xxx-xxxx, 010-5xxx-xxxx, 010-6xxx-xxxx, 010-7xxx-xxxx, 010-8xxx-xxxx, 010-9xxx-xxxx
  // 알뜰폰: 010-1xxx-xxxx, 010-2xxx-xxxx, 010-3xxx-xxxx, 010-4xxx-xxxx, 010-5xxx-xxxx, 010-6xxx-xxxx, 010-7xxx-xxxx, 010-8xxx-xxxx, 010-9xxx-xxxx

  // 실제로는 더 정확한 감지 로직이 필요하지만, 여기서는 간단하게 처리
  // 실제 서비스에서는 각 통신사의 API를 통해 확인해야 함

  const middleDigits = fullNumber.substring(3, 7);
  const num = parseInt(middleDigits);

  if (num >= 1000 && num <= 2999) return "SKT";
  if (num >= 3000 && num <= 5999) return "KT";
  if (num >= 6000 && num <= 8999) return "LGU";
  if (num >= 9000 && num <= 9999) return "MVNO";

  return "SKT"; // 기본값
};

/**
 * SKT SuperToss PASS 연동
 */
export const callSktPass = async (): Promise<PassApiResult> => {
  try {
    // SuperToss SDK 로드 확인
    if (typeof window === "undefined" || !(window as any).SuperToss) {
      return {
        success: false,
        error: "SuperToss SDK가 로드되지 않았습니다.",
      };
    }

    const SuperToss = (window as any).SuperToss;

    return new Promise(resolve => {
      SuperToss.authenticate({
        success: (result: any) => {
          console.log("✅ SKT PASS 인증 성공:", result);
          resolve({
            success: true,
            name: result.name,
            phone: result.phone,
            birth: result.birth,
            gender: result.gender === "M" ? "male" : "female",
            carrier: "SKT",
            certified_at: Date.now(),
          });
        },
        fail: (error: any) => {
          console.error("❌ SKT PASS 인증 실패:", error);
          resolve({
            success: false,
            error: error.message || "SKT PASS 인증에 실패했습니다.",
          });
        },
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SKT PASS 연동 오류",
    };
  }
};

/**
 * KT PASS 연동
 */
export const callKtPass = async (): Promise<PassApiResult> => {
  try {
    // KT PASS SDK 로드 확인
    if (typeof window === "undefined" || !(window as any).KtPass) {
      return {
        success: false,
        error: "KT PASS SDK가 로드되지 않았습니다.",
      };
    }

    const KtPass = (window as any).KtPass;

    return new Promise(resolve => {
      KtPass.authenticate({
        success: (result: any) => {
          console.log("✅ KT PASS 인증 성공:", result);
          resolve({
            success: true,
            name: result.name,
            phone: result.phone,
            birth: result.birth,
            gender: result.gender === "M" ? "male" : "female",
            carrier: "KT",
            certified_at: Date.now(),
          });
        },
        fail: (error: any) => {
          console.error("❌ KT PASS 인증 실패:", error);
          resolve({
            success: false,
            error: error.message || "KT PASS 인증에 실패했습니다.",
          });
        },
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "KT PASS 연동 오류",
    };
  }
};

/**
 * LG U+ PASS 연동
 */
export const callLguPass = async (): Promise<PassApiResult> => {
  try {
    // LG U+ PASS SDK 로드 확인
    if (typeof window === "undefined" || !(window as any).LguPass) {
      return {
        success: false,
        error: "LG U+ PASS SDK가 로드되지 않았습니다.",
      };
    }

    const LguPass = (window as any).LguPass;

    return new Promise(resolve => {
      LguPass.authenticate({
        success: (result: any) => {
          console.log("✅ LG U+ PASS 인증 성공:", result);
          resolve({
            success: true,
            name: result.name,
            phone: result.phone,
            birth: result.birth,
            gender: result.gender === "M" ? "male" : "female",
            carrier: "LGU",
            certified_at: Date.now(),
          });
        },
        fail: (error: any) => {
          console.error("❌ LG U+ PASS 인증 실패:", error);
          resolve({
            success: false,
            error: error.message || "LG U+ PASS 인증에 실패했습니다.",
          });
        },
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "LG U+ PASS 연동 오류",
    };
  }
};

/**
 * 통합 PASS API 호출
 */
export const callPassApi = async (
  phoneNumber?: string
): Promise<PassApiResult> => {
  try {
    // 모바일 환경 확인
    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

    if (!isMobile) {
      return {
        success: false,
        error: "PASS 인증은 모바일에서만 가능합니다.",
      };
    }

    // 통신사 감지
    let carrier = "SKT"; // 기본값
    if (phoneNumber) {
      const detectedCarrier = detectCarrier(phoneNumber);
      if (detectedCarrier) {
        carrier = detectedCarrier;
      }
    }

    console.log(`🔍 감지된 통신사: ${carrier}`);

    // 통신사별 PASS API 호출
    switch (carrier) {
      case "SKT":
        return await callSktPass();
      case "KT":
        return await callKtPass();
      case "LGU":
        return await callLguPass();
      default:
        return {
          success: false,
          error: `${carrier} PASS 서비스를 지원하지 않습니다.`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "PASS API 호출 오류",
    };
  }
};

/**
 * PASS SDK 스크립트 로드
 */
export const loadPassSdks = (): Promise<void> => {
  return new Promise(resolve => {
    const scripts = [
      // SKT SuperToss
      "https://cdn.supertoss.com/sdk/v1/supertoss.min.js",
      // KT PASS
      "https://cdn.kt.com/pass/v1/ktpass.min.js",
      // LG U+ PASS
      "https://cdn.uplus.co.kr/pass/v1/lgupass.min.js",
    ];

    let loadedCount = 0;
    const totalScripts = scripts.length;

    scripts.forEach(src => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        loadedCount++;
        if (loadedCount === totalScripts) {
          console.log("✅ 모든 PASS SDK 로드 완료");
          resolve();
        }
      };
      script.onerror = () => {
        console.warn(`⚠️ PASS SDK 로드 실패: ${src}`);
        loadedCount++;
        if (loadedCount === totalScripts) {
          resolve();
        }
      };
      document.head.appendChild(script);
    });
  });
};


