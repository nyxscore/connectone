import { NextRequest, NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";

// Google Cloud Vision API 클라이언트 초기화
const vision = new ImageAnnotatorClient({
  keyFilename: "./lib/config/connetone-f7c505e1a75c.json",
  projectId: "connetone",
});

interface AITag {
  type: "brand" | "model" | "text" | "logo";
  value: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "이미지 URL이 필요합니다." },
        { status: 400 }
      );
    }

    // base64 이미지인 경우 처리
    let imageRequest: any;
    if (imageUrl.startsWith("data:image")) {
      // base64 이미지
      const base64Data = imageUrl.split(",")[1];
      imageRequest = {
        image: {
          content: base64Data,
        },
      };
    } else {
      // 일반 URL
      imageRequest = {
        image: {
          source: { imageUri: imageUrl },
        },
      };
    }

    console.log("Vision API 요청 시작:", imageUrl.substring(0, 50));

    // Vision API로 이미지 분석 (올바른 방식)
    const [textResult] = await vision.textDetection(imageRequest);
    const [logoResult] = await vision.logoDetection(imageRequest);

    console.log("Vision API 응답 성공");

    const aiTags: AITag[] = [];

    // 텍스트에서 브랜드/모델 추출
    if (textResult?.textAnnotations) {
      const texts = textResult.textAnnotations;

      for (const text of texts) {
        const content = text.description?.toLowerCase() || "";

        // 악기 브랜드 키워드 매칭
        const brandKeywords = [
          "fender",
          "gibson",
          "martin",
          "taylor",
          "yamaha",
          "roland",
          "korg",
          "casio",
          "kawai",
          "steinway",
          "bosendorfer",
          "selmer",
          "bach",
          "conn",
          "king",
          "holton",
          "pearl",
          "tama",
          "dw",
          "zildjian",
          "sabian",
          "paiste",
          "moog",
          "nord",
          "access",
          "virus",
        ];

        // 모델 패턴 매칭 (숫자와 문자 조합)
        const modelPatterns = [
          /[a-z]+\s*\d+[a-z]*/gi, // 예: stratocaster, les paul, p125
          /\d+[a-z]+/gi, // 예: 114ce, p45
          /[a-z]+\d+/gi, // 예: fender1, yamaha2
        ];

        // 브랜드 감지
        for (const keyword of brandKeywords) {
          if (content.includes(keyword)) {
            aiTags.push({
              type: "brand",
              value: keyword.charAt(0).toUpperCase() + keyword.slice(1),
              confidence: 0.8,
            });
          }
        }

        // 모델 감지
        for (const pattern of modelPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            for (const match of matches) {
              if (match.length > 2 && match.length < 20) {
                aiTags.push({
                  type: "model",
                  value: match,
                  confidence: 0.7,
                });
              }
            }
          }
        }

        // 일반 텍스트도 저장 (낮은 신뢰도)
        if (content.length > 2 && content.length < 50) {
          aiTags.push({
            type: "text",
            value: text.description || "",
            confidence: 0.5,
          });
        }
      }
    }

    // 로고 감지 결과 처리
    if (logoResult?.logoAnnotations) {
      for (const logo of logoResult.logoAnnotations) {
        if (logo.description) {
          aiTags.push({
            type: "logo",
            value: logo.description,
            confidence: logo.score || 0.6,
          });
        }
      }
    }

    // 중복 제거 및 신뢰도 순 정렬
    const uniqueTags = aiTags.filter(
      (tag, index, self) =>
        index ===
        self.findIndex(t => t.value.toLowerCase() === tag.value.toLowerCase())
    );

    const sortedTags = uniqueTags.sort((a, b) => b.confidence - a.confidence);

    // 브랜드와 모델을 우선적으로 추출
    const brands = sortedTags.filter(tag => tag.type === "brand");
    const models = sortedTags.filter(tag => tag.type === "model");
    const logos = sortedTags.filter(tag => tag.type === "logo");
    const texts = sortedTags.filter(tag => tag.type === "text");

    return NextResponse.json({
      success: true,
      data: {
        aiTags: sortedTags,
        suggestions: {
          brands: brands.slice(0, 5), // 상위 5개 브랜드
          models: models.slice(0, 5), // 상위 5개 모델
          logos: logos.slice(0, 3), // 상위 3개 로고
          texts: texts.slice(0, 10), // 상위 10개 텍스트
        },
      },
    });
  } catch (error: any) {
    console.error("Vision API 분석 실패:", error);

    // Vision API 활성화되지 않았을 때
    if (
      error?.message?.includes("Cloud Vision API has not been used") ||
      error?.message?.includes("PERMISSION_DENIED")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vision API가 활성화되지 않았습니다. Google Cloud Console에서 Cloud Vision API를 활성화해주세요.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "이미지 분석에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
