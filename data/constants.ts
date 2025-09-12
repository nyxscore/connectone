export const INSTRUMENT_CATEGORIES = [
  {
    key: "guitar",
    label: "기타",
    icon: "🎸",
  },
  {
    key: "piano",
    label: "피아노",
    icon: "🎹",
  },
  {
    key: "violin",
    label: "바이올린",
    icon: "🎻",
  },
  {
    key: "drums",
    label: "드럼",
    icon: "🥁",
  },
  {
    key: "bass",
    label: "베이스",
    icon: "🎸",
  },
  {
    key: "wind",
    label: "관악기",
    icon: "🎺",
  },
  {
    key: "brass",
    label: "금관악기",
    icon: "🎺",
  },
  {
    key: "percussion",
    label: "타악기",
    icon: "🥁",
  },
  {
    key: "keyboard",
    label: "키보드",
    icon: "⌨️",
  },
  {
    key: "synthesizer",
    label: "신시사이저",
    icon: "🎛️",
  },
  {
    key: "amplifier",
    label: "앰프",
    icon: "🔊",
  },
  {
    key: "accessories",
    label: "악세서리",
    icon: "🎵",
  },
];

export const REGIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원도",
  "충청북도",
  "충청남도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

export const PRODUCT_CONDITIONS = [
  { value: "S", label: "S급 (새제품)", description: "사용하지 않은 새제품" },
  {
    value: "A",
    label: "A급 (거의 새것)",
    description: "매우 좋은 상태, 흠집 거의 없음",
  },
  {
    value: "B",
    label: "B급 (양호)",
    description: "좋은 상태, 약간의 사용감 있음",
  },
  { value: "C", label: "C급 (보통)", description: "보통 상태, 사용감 있음" },
  {
    value: "D",
    label: "D급 (하자있음)",
    description: "하자가 있지만 사용 가능",
  },
];

export const TRANSACTION_STATUS = {
  PENDING: "pending",
  PAID_HOLD: "paid_hold",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  RELEASED: "released",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;

export const TRANSACTION_STATUS_LABELS = {
  [TRANSACTION_STATUS.PENDING]: "결제 대기",
  [TRANSACTION_STATUS.PAID_HOLD]: "결제 완료",
  [TRANSACTION_STATUS.SHIPPED]: "배송 중",
  [TRANSACTION_STATUS.DELIVERED]: "배송 완료",
  [TRANSACTION_STATUS.RELEASED]: "거래 완료",
  [TRANSACTION_STATUS.REFUNDED]: "환불 완료",
  [TRANSACTION_STATUS.CANCELLED]: "거래 취소",
} as const;

export const USER_GRADES = {
  C: "Chord",
  D: "Duo",
  E: "Ensemble",
  F: "Forte",
  G: "Grand",
  A: "Allegro",
  B: "Bravura",
  S: "System", // Admin
} as const;

export const CONDITION_GRADES = [
  { key: "A", label: "A급 - 새것과 같음", color: "green" },
  { key: "B", label: "B급 - 매우 양호", color: "blue" },
  { key: "C", label: "C급 - 양호", color: "yellow" },
  { key: "D", label: "D급 - 보통", color: "orange" },
  { key: "E", label: "E급 - 사용 가능", color: "red" },
];

export const SHIPPING_TYPES = [
  { key: "direct", label: "직거래" },
  { key: "courier", label: "택배" },
  { key: "pickup", label: "픽업" },
];
