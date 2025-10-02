import { useCallback } from "react";

interface PostcodeData {
  zonecode: string; // 우편번호
  address: string; // 기본주소 (도로명주소 또는 지번주소)
  addressEnglish: string; // 영문주소
  addressType: "R" | "J"; // R: 도로명주소, J: 지번주소
  bname: string; // 법정동명
  buildingName: string; // 건물명
  apartment: string; // 공동주택여부 (Y/N)
  jibunAddress: string; // 지번주소
  roadAddress: string; // 도로명주소
  sido: string; // 시도
  sigungu: string; // 시군구
  sigunguCode: string; // 시군구코드
  userSelectedType: "R" | "J"; // 사용자가 선택한 주소타입
  userLanguageType: "K" | "E"; // 사용자가 선택한 언어타입
}

interface UseDaumPostcodeProps {
  onComplete: (data: PostcodeData) => void;
  onClose?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  width?: number | string;
  height?: number | string;
  maxSuggestItems?: number;
  showMoreHints?: boolean;
  hideMapBtn?: boolean;
  hideEngBtn?: boolean;
  alwaysShowEngAddr?: boolean;
  submitMode?: boolean;
  useBanner?: boolean;
  useSuggest?: boolean;
  autoMapping?: boolean;
  autoMappingRoad?: boolean;
  autoMappingJibun?: boolean;
  theme?: {
    bgColor?: string;
    searchBgColor?: string;
    contentBgColor?: string;
    pageBgColor?: string;
    textColor?: string;
    queryTextColor?: string;
    postcodeTextColor?: string;
    emphTextColor?: string;
    outlineColor?: string;
  };
}

export const useDaumPostcode = () => {
  const openPostcode = useCallback((props: UseDaumPostcodeProps) => {
    if (typeof window === "undefined" || !(window as any).daum) {
      console.error("다음 주소 API가 로드되지 않았습니다.");
      return;
    }

    const Postcode = (window as any).daum.Postcode;

    new Postcode({
      oncomplete: props.onComplete,
      onclose: props.onClose,
      onresize: props.onResize,
      width: props.width || "100%",
      height: props.height || "100%",
      maxSuggestItems: props.maxSuggestItems || 5,
      showMoreHints: props.showMoreHints || false,
      hideMapBtn: props.hideMapBtn || false,
      hideEngBtn: props.hideEngBtn || false,
      alwaysShowEngAddr: props.alwaysShowEngAddr || false,
      submitMode: props.submitMode || false,
      useBanner: props.useBanner || true,
      useSuggest: props.useSuggest || true,
      autoMapping: props.autoMapping || true,
      autoMappingRoad: props.autoMappingRoad || true,
      autoMappingJibun: props.autoMappingJibun || true,
      theme: props.theme || {
        bgColor: "#ffffff",
        searchBgColor: "#ffffff",
        contentBgColor: "#ffffff",
        pageBgColor: "#ffffff",
        textColor: "#000000",
        queryTextColor: "#000000",
        postcodeTextColor: "#000000",
        emphTextColor: "#009900",
        outlineColor: "#e0e0e0",
      },
    }).open();
  }, []);

  return { openPostcode };
};

export type { PostcodeData, UseDaumPostcodeProps };
