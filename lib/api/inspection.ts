// AI 검사 관련 API 함수

export interface InspectionResult {
  conditionHint: "A" | "B" | "C" | "D";
  defects: string[];
  confidence: number;
  suggestions: string[];
}

export interface InspectionResponse {
  success: boolean;
  data?: InspectionResult;
  error?: string;
}

// AI 검사 API 호출
export async function inspectImage(
  imageUrl: string
): Promise<InspectionResponse> {
  try {
    const response = await fetch("/api/inspect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "AI 검사에 실패했습니다.",
      };
    }

    return result;
  } catch (error) {
    console.error("AI 검사 API 호출 실패:", error);
    return {
      success: false,
      error: "AI 검사 서버와 연결할 수 없습니다.",
    };
  }
}

// 여러 이미지에 대한 AI 검사 (배치 처리)
export async function inspectImages(
  imageUrls: string[]
): Promise<InspectionResponse[]> {
  try {
    const promises = imageUrls.map(url => inspectImage(url));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("배치 AI 검사 실패:", error);
    return imageUrls.map(() => ({
      success: false,
      error: "AI 검사에 실패했습니다.",
    }));
  }
}

// AI 검사 결과를 기반으로 aiTags 생성
export function generateAiTagsFromInspection(
  results: InspectionResult[]
): string[] {
  const tags: string[] = [];

  results.forEach(result => {
    // 상태 등급 태그
    tags.push(`${result.conditionHint}등급 추정`);

    // 결함 태그
    result.defects.forEach(defect => {
      const defectTags = {
        scratch: "스크래치 있음",
        dent: "찌그러짐 있음",
        rust: "녹슬음 있음",
        crack: "균열 있음",
        fade: "색상 퇴색",
        stain: "얼룩 있음",
        wear: "마모 있음",
        discoloration: "변색 있음",
      };

      if (defectTags[defect as keyof typeof defectTags]) {
        tags.push(defectTags[defect as keyof typeof defectTags]);
      }
    });

    // 제안 사항 태그
    result.suggestions.forEach(suggestion => {
      tags.push(suggestion);
    });
  });

  // 중복 제거
  return [...new Set(tags)];
}

// 신뢰도 기반으로 결과 필터링
export function filterResultsByConfidence(
  results: InspectionResult[],
  minConfidence: number = 0.7
): InspectionResult[] {
  return results.filter(result => result.confidence >= minConfidence);
}

// 가장 높은 신뢰도를 가진 상태 등급 반환
export function getRecommendedCondition(
  results: InspectionResult[]
): "A" | "B" | "C" | "D" | null {
  if (results.length === 0) return null;

  const highestConfidence = Math.max(...results.map(r => r.confidence));
  const bestResult = results.find(r => r.confidence === highestConfidence);

  return bestResult?.conditionHint || null;
}
