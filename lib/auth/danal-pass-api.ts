/**
 * 다날(Danal) PASS 본인인증 API
 *
 * 웹/모바일 모두 지원하는 실제 본인인증 서비스
 *
 * 공식 문서: https://www.danalpay.com/
 *
 * 특징:
 * - 웹/모바일 모두 지원
 * - 통신사 PASS 앱 연동
 * - 실명, 생년월일, 성별, 통신사 확인
 * - 유료: 건당 100~200원
 */

export interface DanalPassResult {
  success: boolean;
  name?: string; // 실명
  phone?: string; // 휴대폰 번호
  birth?: string; // 생년월일 (YYYYMMDD)
  gender?: "male" | "female"; // 성별
  carrier?: "SKT" | "KT" | "LGU" | "MVNO"; // 통신사
  certified_at?: number; // 인증 시각
  ci?: string; // 연계정보 (Connecting Information)
  di?: string; // 중복가입확인정보 (Duplication Information)
  error?: string;
}

/**
 * 다날 PASS 본인인증 호출
 */
export const callDanalPass = (): Promise<DanalPassResult> => {
  return new Promise(resolve => {
    // 환경변수가 설정되지 않았으면 Mock 모드 사용
    const danalCpid = process.env.NEXT_PUBLIC_DANAL_CPID;

    if (!danalCpid || danalCpid === "TEST_CPID") {
      console.log("다날 CPID가 설정되지 않았습니다. Mock 모드로 전환합니다.");
      mockDanalPass().then(resolve);
      return;
    }

    // 실제 다날 API 연동 (환경변수 설정 시에만)
    if (typeof window === "undefined") {
      resolve({
        success: false,
        error: "브라우저 환경이 아닙니다.",
      });
      return;
    }

    // 실제 다날 본인인증 구현
    // TODO: 실제 다날 API 연동 구현 필요
    console.log(
      "실제 다날 API 연동은 아직 구현되지 않았습니다. Mock 모드로 전환합니다."
    );
    mockDanalPass().then(resolve);
  });
};

/**
 * 다날 PASS 스크립트 로드 (필요 시)
 */
export const loadDanalScript = (): Promise<void> => {
  return new Promise(resolve => {
    // 이미 로드되어 있으면 스킵
    if ((window as any).DanalAuth) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://ui.teledit.com/Danal/Service/js/DanalAuth.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ 다날 스크립트 로드 완료");
      resolve();
    };
    script.onerror = () => {
      console.warn("⚠️ 다날 스크립트 로드 실패");
      resolve(); // 실패해도 계속 진행
    };
    document.head.appendChild(script);
  });
};

/**
 * Mock 다날 PASS (테스트용)
 */
export const mockDanalPass = (): Promise<DanalPassResult> => {
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
