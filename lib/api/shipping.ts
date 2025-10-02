// 배송조회 API 함수들

export interface ShippingInfo {
  courier: string;
  trackingNumber: string;
  status: string;
  progress: Array<{
    time: string;
    location: string;
    status: string;
    description: string;
  }>;
}

// 택배사 코드 매핑
const COURIER_CODES: Record<string, string> = {
  CJ대한통운: "cj",
  한진택배: "hanjin",
  롯데택배: "lotte",
  로젠택배: "logen",
  우체국택배: "epost",
  쿠팡: "coupang",
  DHL: "dhl",
  FedEx: "fedex",
  UPS: "ups",
};

// 배송조회 API 호출 (실제로는 각 택배사 API 연동 필요)
export async function trackShipping(
  courier: string,
  trackingNumber: string
): Promise<{ success: boolean; data?: ShippingInfo; error?: string }> {
  try {
    const courierCode = COURIER_CODES[courier];

    if (!courierCode) {
      return {
        success: false,
        error: "지원하지 않는 택배사입니다.",
      };
    }

    // 실제 구현에서는 각 택배사의 API를 호출해야 함
    // 여기서는 모의 데이터를 반환
    const mockData: ShippingInfo = {
      courier,
      trackingNumber,
      status: "배송중",
      progress: [
        {
          time: "2024-01-15 09:00",
          location: "서울 강남구",
          status: "집하",
          description: "집하처리",
        },
        {
          time: "2024-01-15 14:30",
          location: "서울 강남구",
          status: "출고",
          description: "배송지로 출고",
        },
        {
          time: "2024-01-15 18:45",
          location: "인천광역시",
          status: "배송중",
          description: "배송지로 이동중",
        },
      ],
    };

    // 실제 API 호출 시뮬레이션 (1초 지연)
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      data: mockData,
    };
  } catch (error) {
    console.error("배송조회 오류:", error);
    return {
      success: false,
      error: "배송조회 중 오류가 발생했습니다.",
    };
  }
}

// 택배사별 배송조회 URL 생성
export function getTrackingUrl(
  courier: string,
  trackingNumber: string
): string {
  const courierCode = COURIER_CODES[courier];

  const urls: Record<string, string> = {
    cj: `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnb=util&cnb=tracking&wblNo=${trackingNumber}`,
    hanjin: `https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillNumber.do?mCode=MN038&schLang=KR&wblNo=${trackingNumber}`,
    lotte: `https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=${trackingNumber}`,
    logen: `https://www.ilogen.com/web/personal/trace/${trackingNumber}`,
    epost: `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?displayHeader=N&sid1=${trackingNumber}`,
    coupang: `https://www.coupang.com/np/tracking/${trackingNumber}`,
    dhl: `https://www.dhl.com/ko-ko/home/tracking.html?trackingNumber=${trackingNumber}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    ups: `https://www.ups.com/track?trackingNumber=${trackingNumber}`,
  };

  return (
    urls[courierCode] ||
    `https://www.google.com/search?q=${courier}+${trackingNumber}`
  );
}
