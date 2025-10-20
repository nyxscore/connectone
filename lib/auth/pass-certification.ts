/**
 * PASS 본인인증 서비스
 *
 * 가입: 각 통신사별로 계약 필요
 * SKT: https://www.sktelecom.com/pass
 * KT: https://pass.kt.com
 * LG U+: https://pass.uplus.co.kr
 *
 * 장점: 무료, 실제 통신사 인증, 실명 확인
 * 단점: 연동 복잡, 각 통신사별 계약 필요
 */

export interface PassCertificationResult {
  success: boolean;
  name?: string; // 실명
  phone?: string; // 핸드폰 번호
  birth?: string; // 생년월일 (YYYYMMDD)
  gender?: "male" | "female"; // 성별
  carrier?: "SKT" | "KT" | "LGU" | "MVNO"; // 통신사
  certified_at?: number; // 인증 시각
  error?: string;
}

/**
 * PASS 본인인증 팝업 열기
 */
export const openPassCertification = (): Promise<PassCertificationResult> => {
  return new Promise((resolve, reject) => {
    try {
      // PASS SDK 로드 확인
      if (typeof window === "undefined") {
        reject(new Error("브라우저 환경에서만 사용 가능합니다."));
        return;
      }

      // PASS 앱 설치 확인
      const checkPassApp = () => {
        const userAgent = navigator.userAgent;

        // 모바일 환경 확인
        if (!/Mobile|Android|iPhone|iPad/.test(userAgent)) {
          resolve({
            success: false,
            error: "PASS 인증은 모바일에서만 가능합니다.",
          });
          return;
        }

        // PASS 앱 스킴 확인
        const passSchemes = [
          "supertoss://", // 토스 (SKT)
          "ktauthtest://", // KT
          "upluspass://", // LG U+
        ];

        let hasPassApp = false;
        for (const scheme of passSchemes) {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = scheme;
          document.body.appendChild(iframe);

          setTimeout(() => {
            document.body.removeChild(iframe);
            hasPassApp = true;
          }, 100);
        }

        if (!hasPassApp) {
          // PASS 앱이 없으면 앱 설치 안내
          resolve({
            success: false,
            error: "PASS 앱을 먼저 설치해주세요.",
          });
          return;
        }

        // PASS 인증 시작
        startPassCertification(resolve, reject);
      };

      // 약간의 딜레이 후 PASS 앱 확인
      setTimeout(checkPassApp, 500);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * PASS 인증 시작
 */
const startPassCertification = (
  resolve: (result: PassCertificationResult) => void,
  reject: (error: any) => void
) => {
  try {
    // 실제 PASS 연동은 복잡하므로, Mock 데이터로 시뮬레이션
    // 실제 구현 시에는 각 통신사의 PASS SDK를 사용해야 합니다.

    console.log("🔐 PASS 본인인증 시작");

    // Mock PASS 인증 결과 (실제로는 PASS SDK에서 받아옴)
    setTimeout(() => {
      const mockResult: PassCertificationResult = {
        success: true,
        name: "홍길동",
        phone: "01012345678",
        birth: "19900101",
        gender: "male",
        carrier: "SKT",
        certified_at: Date.now(),
      };

      console.log("✅ PASS 본인인증 완료:", mockResult);
      resolve(mockResult);
    }, 2000); // 2초 후 완료 시뮬레이션
  } catch (error) {
    console.error("❌ PASS 인증 오류:", error);
    reject(error);
  }
};

/**
 * PASS 앱 설치 안내
 */
export const showPassInstallGuide = () => {
  const userAgent = navigator.userAgent;

  if (/iPhone|iPad/.test(userAgent)) {
    // iOS
    return {
      title: "PASS 앱 설치 필요",
      message: "App Store에서 'PASS' 앱을 설치해주세요.",
      storeUrl: "https://apps.apple.com/kr/app/pass/id1170479831",
      carrier: "통신사별 PASS 앱을 설치해주세요.",
    };
  } else if (/Android/.test(userAgent)) {
    // Android
    return {
      title: "PASS 앱 설치 필요",
      message: "Google Play Store에서 'PASS' 앱을 설치해주세요.",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.sktelecom.pass",
      carrier: "통신사별 PASS 앱을 설치해주세요.",
    };
  } else {
    // PC
    return {
      title: "모바일에서만 가능",
      message: "PASS 인증은 모바일에서만 가능합니다.",
      storeUrl: null,
      carrier: "스마트폰에서 접속해주세요.",
    };
  }
};

/**
 * Mock PASS 인증 (테스트용)
 */
export const mockPassCertification = (): Promise<PassCertificationResult> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
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


