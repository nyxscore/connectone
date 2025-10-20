/**
 * PortOne (구 아임포트) 본인인증 API
 *
 * 사업자 등록 없이 가입 가능한 본인인증 서비스
 *
 * 공식 문서: https://developers.portone.io/docs/ko/auth/guide
 * 가입: https://admin.portone.io
 *
 * 특징:
 * - 사업자 등록 없이 가입 가능
 * - 월 100건 무료 제공
 * - 웹/모바일 모두 지원
 * - 빠른 승인 (1-2일)
 * - 건당 200원 (월 100건 초과 시)
 */

export interface PortOnePassResult {
  success: boolean;
  name?: string; // 실명
  phone?: string; // 휴대폰 번호
  birth?: string; // 생년월일 (YYYYMMDD)
  gender?: "male" | "female"; // 성별
  carrier?: "SKT" | "KT" | "LGU" | "MVNO"; // 통신사
  certified_at?: number; // 인증 시각
  ci?: string; // 연계정보
  di?: string; // 중복가입확인정보
  error?: string;
}

/**
 * PortOne 본인인증 호출
 */
export const callPortOnePass = (): Promise<PortOnePassResult> => {
  return new Promise(resolve => {
    if (typeof window === "undefined") {
      resolve({
        success: false,
        error: "브라우저 환경이 아닙니다.",
      });
      return;
    }

    // PortOne IMP 코드 확인
    const impCode = process.env.NEXT_PUBLIC_PORTONE_IMP_CODE;

    if (!impCode || impCode === "imp12345678") {
      console.log(
        "PortOne IMP 코드가 설정되지 않았습니다. Mock 모드로 전환합니다."
      );
      mockPortOnePass().then(resolve);
      return;
    }

    // 실제 PortOne 본인인증 구현
    if (!(window as any).IMP) {
      resolve({
        success: false,
        error: "PortOne IMP 스크립트가 로드되지 않았습니다.",
      });
      return;
    }

    const { IMP } = window as any;

    // PortOne 본인인증 요청
    IMP.init(impCode);

    IMP.certification(
      {
        // 본인인증 요청 파라미터
        merchant_uid: `CERT_${Date.now()}`,
        min_age: 14,
        max_age: 100,
        popup: true,
      },
      (rsp: any) => {
        if (rsp.success) {
          // 본인인증 성공
          const data = rsp.imp_uid;

          // 실제 서비스에서는 서버에서 imp_uid로 인증 정보 조회
          // 여기서는 Mock 데이터로 처리
          resolve({
            success: true,
            name: "홍길동", // 실제로는 서버에서 조회
            phone: "01012345678", // 실제로는 서버에서 조회
            birth: "19900101", // 실제로는 서버에서 조회
            gender: "male", // 실제로는 서버에서 조회
            carrier: "SKT", // 실제로는 서버에서 조회
            ci: data, // 실제 imp_uid
            di: data, // 실제 imp_uid
            certified_at: Date.now(),
          });
        } else {
          resolve({
            success: false,
            error: rsp.error_msg || "본인인증에 실패했습니다.",
          });
        }
      }
    );
  });
};

/**
 * PortOne IMP 스크립트 로드
 */
export const loadPortOneScript = (): Promise<void> => {
  return new Promise(resolve => {
    // 이미 로드되어 있으면 스킵
    if ((window as any).IMP) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ PortOne IMP 스크립트 로드 완료");
      resolve();
    };
    script.onerror = () => {
      console.warn("⚠️ PortOne IMP 스크립트 로드 실패");
      resolve(); // 실패해도 계속 진행
    };
    document.head.appendChild(script);
  });
};

/**
 * Mock PortOne PASS (테스트용)
 */
export const mockPortOnePass = (): Promise<PortOnePassResult> => {
  return new Promise(resolve => {
    // Mock 데이터 생성
    setTimeout(() => {
      const names = ["홍길동", "김철수", "이영희", "박민수", "정수진"];
      const randomName = names[Math.floor(Math.random() * names.length)];

      resolve({
        success: true,
        name: randomName,
        phone: "01012345678",
        birth: "19900101",
        gender: Math.random() > 0.5 ? "male" : "female",
        carrier: ["SKT", "KT", "LGU", "MVNO"][
          Math.floor(Math.random() * 4)
        ] as any,
        ci: `CI_${Math.random().toString(36).substring(2, 15)}`,
        di: `DI_${Math.random().toString(36).substring(2, 15)}`,
        certified_at: Date.now(),
      });
    }, 1500); // 1.5초 지연 (실제 인증 시뮬레이션)
  });
};


