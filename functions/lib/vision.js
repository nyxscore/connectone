"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeImage = void 0;
const functions = __importStar(require("firebase-functions"));
const vision_1 = __importDefault(require("@google-cloud/vision"));
// Vision API 클라이언트 초기화
const visionClient = new vision_1.default.ImageAnnotatorClient({
    projectId: "connetone",
});
exports.analyzeImage = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c;
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
        let imageRequest;
        if (imageUrl.startsWith("data:image")) {
            // base64 이미지
            const base64Data = imageUrl.split(",")[1];
            imageRequest = {
                image: {
                    content: base64Data,
                },
            };
        }
        else {
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
        const aiTags = [];
        // 텍스트에서 브랜드/모델 추출
        if (textResult === null || textResult === void 0 ? void 0 : textResult.textAnnotations) {
            const texts = textResult.textAnnotations;
            for (const text of texts) {
                const content = ((_a = text.description) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
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
        if (logoResult === null || logoResult === void 0 ? void 0 : logoResult.logoAnnotations) {
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
        const uniqueTags = aiTags.filter((tag, index, self) => index ===
            self.findIndex((t) => t.value.toLowerCase() === tag.value.toLowerCase()));
        const sortedTags = uniqueTags.sort((a, b) => b.confidence - a.confidence);
        // 브랜드와 모델을 우선적으로 추출
        const brands = sortedTags.filter((tag) => tag.type === "brand");
        const models = sortedTags.filter((tag) => tag.type === "model");
        const logos = sortedTags.filter((tag) => tag.type === "logo");
        const textTags = sortedTags.filter((tag) => tag.type === "text");
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
    }
    catch (error) {
        console.error("Vision API 분석 실패:", error);
        // Vision API 활성화되지 않았을 때
        if (((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes("Cloud Vision API has not been used")) ||
            ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes("PERMISSION_DENIED"))) {
            res.status(503).json({
                success: false,
                error: "Vision API가 활성화되지 않았습니다. Google Cloud Console에서 Cloud Vision API를 활성화해주세요.",
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: error instanceof Error
                ? error.message
                : "이미지 분석에 실패했습니다.",
        });
    }
});
//# sourceMappingURL=vision.js.map