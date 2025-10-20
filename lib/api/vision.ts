export interface AITag {
  type: "brand" | "model" | "text" | "logo";
  value: string;
  confidence: number;
}

export interface VisionAnalysisResult {
  aiTags: AITag[];
  suggestions: {
    brands: AITag[];
    models: AITag[];
    logos: AITag[];
    texts: AITag[];
  };
}

// Vision API로 이미지 분석
export async function analyzeImage(
  imageUrl: string
): Promise<{ success: boolean; data?: VisionAnalysisResult; error?: string }> {
  try {
    const response = await fetch("/api/vision/analyze", {
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
        error: result.error || "이미지 분석에 실패했습니다.",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Vision API 호출 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "이미지 분석에 실패했습니다.",
    };
  }
}

// 브랜드/모델 추천 생성
export function generateSuggestions(aiTags: AITag[]) {
  const brands = aiTags
    .filter(tag => tag.type === "brand")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  const models = aiTags
    .filter(tag => tag.type === "model")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return {
    brands: brands.map(tag => tag.value),
    models: models.map(tag => tag.value),
  };
}





































