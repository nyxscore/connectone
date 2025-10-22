import { UserGrade, GradeInfo, UserProgress, User } from "../../data/types";

// 등급 정보 정의
export const GRADE_INFO: Record<UserGrade, GradeInfo> = {
  C: {
    grade: "C",
    name: "Chord",
    description: "화음 - 시작하는 단계",
    color: "text-gray-600 bg-gray-100",
    requirements: {
      safeTransactions: 0,
      averageRating: 0,
      disputeFree: true,
      totalTrades: 0,
    },
  },
  D: {
    grade: "D",
    name: "Duo",
    description: "듀오 - 함께하는 단계",
    color: "text-blue-600 bg-blue-100",
    requirements: {
      safeTransactions: 3,
      averageRating: 4.0,
      disputeFree: true,
      totalTrades: 5,
    },
  },
  E: {
    grade: "E",
    name: "Ensemble",
    description: "앙상블 - 조화로운 단계",
    color: "text-green-600 bg-green-100",
    requirements: {
      safeTransactions: 8,
      averageRating: 4.2,
      disputeFree: true,
      totalTrades: 15,
    },
  },
  F: {
    grade: "F",
    name: "Forte",
    description: "포르테 - 강한 단계",
    color: "text-purple-600 bg-purple-100",
    requirements: {
      safeTransactions: 15,
      averageRating: 4.4,
      disputeFree: true,
      totalTrades: 30,
    },
  },
  G: {
    grade: "G",
    name: "Grand",
    description: "그랜드 - 웅장한 단계",
    color: "text-orange-600 bg-orange-100",
    requirements: {
      safeTransactions: 25,
      averageRating: 4.6,
      disputeFree: true,
      totalTrades: 50,
    },
  },
  A: {
    grade: "A",
    name: "Allegro",
    description: "알레그로 - 빠른 단계",
    color: "text-red-600 bg-red-100",
    requirements: {
      safeTransactions: 40,
      averageRating: 4.8,
      disputeFree: true,
      totalTrades: 80,
    },
  },
  B: {
    grade: "B",
    name: "Bravura",
    description: "브라부라 - 기교적인 단계",
    color: "text-yellow-600 bg-yellow-100",
    requirements: {
      safeTransactions: 60,
      averageRating: 4.9,
      disputeFree: true,
      totalTrades: 120,
    },
  },
};

// 등급 순서
export const GRADE_ORDER: UserGrade[] = ["C", "D", "E", "F", "G", "A", "B"];

// 사용자 등급 계산
export function calculateUserGrade(user: User): UserGrade {
  const { safeTransactionCount, averageRating, disputeCount, tradeCount } =
    user;
  const disputeFree = disputeCount === 0;

  // B 등급 (최고 등급)
  if (
    safeTransactionCount >= 60 &&
    averageRating >= 4.9 &&
    disputeFree &&
    tradeCount >= 120
  ) {
    return "B";
  }

  // A 등급
  if (
    safeTransactionCount >= 40 &&
    averageRating >= 4.8 &&
    disputeFree &&
    tradeCount >= 80
  ) {
    return "A";
  }

  // G 등급
  if (
    safeTransactionCount >= 25 &&
    averageRating >= 4.6 &&
    disputeFree &&
    tradeCount >= 50
  ) {
    return "G";
  }

  // F 등급
  if (
    safeTransactionCount >= 15 &&
    averageRating >= 4.4 &&
    disputeFree &&
    tradeCount >= 30
  ) {
    return "F";
  }

  // E 등급
  if (
    safeTransactionCount >= 8 &&
    averageRating >= 4.2 &&
    disputeFree &&
    tradeCount >= 15
  ) {
    return "E";
  }

  // D 등급
  if (
    safeTransactionCount >= 3 &&
    averageRating >= 4.0 &&
    disputeFree &&
    tradeCount >= 5
  ) {
    return "D";
  }

  // C 등급 (기본 등급)
  return "C";
}

// 다음 등급 계산
export function getNextGrade(currentGrade: UserGrade): UserGrade | null {
  const currentIndex = GRADE_ORDER.indexOf(currentGrade);
  if (currentIndex === -1 || currentIndex === GRADE_ORDER.length - 1) {
    return null;
  }
  return GRADE_ORDER[currentIndex + 1];
}

// 사용자 진행률 계산
export function calculateUserProgress(user: User): UserProgress {
  const currentGrade = calculateUserGrade(user);
  const nextGrade = getNextGrade(currentGrade);

  if (!nextGrade) {
    // 최고 등급인 경우
    return {
      currentGrade,
      nextGrade: null,
      progress: {
        safeTransactions: user.safeTransactionCount,
        averageRating: user.averageRating,
        disputeFree: user.disputeCount === 0,
        totalTrades: user.tradeCount,
      },
      requirements: GRADE_INFO[currentGrade].requirements,
      progressPercentage: 100,
    };
  }

  const currentRequirements = GRADE_INFO[currentGrade].requirements;
  const nextRequirements = GRADE_INFO[nextGrade].requirements;

  // 각 조건별 진행률 계산
  const safeTransactionProgress = Math.min(
    (user.safeTransactionCount / nextRequirements.safeTransactions) * 100,
    100
  );
  const ratingProgress = Math.min(
    (user.averageRating / nextRequirements.averageRating) * 100,
    100
  );
  const disputeProgress = user.disputeCount === 0 ? 100 : 0;
  const tradeProgress = Math.min(
    (user.tradeCount / nextRequirements.totalTrades) * 100,
    100
  );

  // 전체 진행률 (모든 조건의 평균)
  const progressPercentage = Math.round(
    (safeTransactionProgress +
      ratingProgress +
      disputeProgress +
      tradeProgress) /
      4
  );

  return {
    currentGrade,
    nextGrade,
    progress: {
      safeTransactions: user.safeTransactionCount,
      averageRating: user.averageRating,
      disputeFree: user.disputeCount === 0,
      totalTrades: user.tradeCount,
    },
    requirements: nextRequirements,
    progressPercentage,
  };
}

// 등급 정보 가져오기
export function getGradeInfo(grade: UserGrade): GradeInfo {
  if (!grade || !GRADE_INFO[grade]) {
    return GRADE_INFO["C"]; // 기본값
  }
  return GRADE_INFO[grade];
}

// 등급 색상 가져오기
export function getGradeColor(grade: UserGrade): string {
  if (!grade || !GRADE_INFO[grade]) {
    return GRADE_INFO["C"].color; // 기본값
  }
  return GRADE_INFO[grade].color;
}

// 등급 이름 가져오기
export function getGradeName(grade: UserGrade): string {
  if (!grade || !GRADE_INFO[grade]) {
    return GRADE_INFO["C"].name; // 기본값
  }
  return GRADE_INFO[grade].name;
}

// 등급 설명 가져오기
export function getGradeDescription(grade: UserGrade): string {
  if (!grade || !GRADE_INFO[grade]) {
    return GRADE_INFO["C"].description; // 기본값
  }
  return GRADE_INFO[grade].description;
}

// 다음 등급까지 필요한 조건 계산
export function getNextGradeRequirements(user: User): {
  safeTransactions: number;
  averageRating: number;
  disputeFree: boolean;
  totalTrades: number;
} {
  const nextGrade = getNextGrade(user.grade);
  if (!nextGrade) {
    return {
      safeTransactions: 0,
      averageRating: 0,
      disputeFree: true,
      totalTrades: 0,
    };
  }

  const requirements = GRADE_INFO[nextGrade].requirements;
  return {
    safeTransactions: Math.max(
      0,
      requirements.safeTransactions - user.safeTransactionCount
    ),
    averageRating: Math.max(0, requirements.averageRating - user.averageRating),
    disputeFree: user.disputeCount > 0,
    totalTrades: Math.max(0, requirements.totalTrades - user.tradeCount),
  };
}
