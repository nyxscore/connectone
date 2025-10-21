import * as functions from "firebase-functions";
import vision from "@google-cloud/vision";

// Vision API 클라이언트 초기화
const visionClient = new vision.ImageAnnotatorClient({
  projectId: "connetone",
});

interface AITag {
  type: "brand" | "model" | "text" | "logo";
  value: string;
  confidence: number;
}

export const analyzeImage = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      res.status(400).json({
        success: false,
        error: "이미지 URL이 필요합니다.",
      });
      return;
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

    // Vision API로 이미지 분석
    const [textResult] = await visionClient.textDetection(imageRequest);
    const [logoResult] = await visionClient.logoDetection(imageRequest);

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

        // 모델 패턴 매칭
        const modelPatterns = [
          /[a-z]+\s*\d+[a-z]*/gi,
          /\d+[a-z]+/gi,
          /[a-z]+\d+/gi,
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

        // 일반 텍스트도 저장
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
    const textTags = sortedTags.filter(tag => tag.type === "text");

    res.json({
      success: true,
      data: {
        aiTags: sortedTags,
        suggestions: {
          brands: brands.slice(0, 5),
          models: models.slice(0, 5),
          logos: logos.slice(0, 3),
          texts: textTags.slice(0, 10),
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
      res.status(503).json({
        success: false,
        error:
          "Vision API가 활성화되지 않았습니다. Google Cloud Console에서 Cloud Vision API를 활성화해주세요.",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "이미지 분석에 실패했습니다.",
    });
  }
});





