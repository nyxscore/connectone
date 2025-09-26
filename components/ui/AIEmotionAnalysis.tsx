"use client";

import { useState, useEffect } from "react";
import { Brain, Star, TrendingUp, AlertCircle } from "lucide-react";

interface EmotionAnalysisResult {
  emotionScore: number; // 0-100
  conditionGrade: "A" | "B" | "C" | "D";
  suggestedPrice: number;
  confidence: number; // 0-1
  detectedFeatures: string[];
  recommendations: string[];
}

interface AIEmotionAnalysisProps {
  imageDataUrl: string;
  onAnalysisComplete: (result: EmotionAnalysisResult) => void;
  onConditionChange: (condition: "A" | "B" | "C" | "D") => void;
}

export const AIEmotionAnalysis = ({
  imageDataUrl,
  onAnalysisComplete,
  onConditionChange,
}: AIEmotionAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EmotionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (imageDataUrl) {
      analyzeImage();
    }
  }, [imageDataUrl]);

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 실제 AI 분석 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 시뮬레이션된 분석 결과
      const mockResult: EmotionAnalysisResult = {
        emotionScore: Math.floor(Math.random() * 30) + 70, // 70-100
        conditionGrade: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)] as
          | "A"
          | "B"
          | "C"
          | "D",
        suggestedPrice: Math.floor(Math.random() * 200000) + 100000, // 100,000-300,000
        confidence: 0.85 + Math.random() * 0.15, // 0.85-1.0
        detectedFeatures: [
          "깔끔한 외관",
          "미세한 사용감",
          "우수한 상태",
          "원래 색상 유지",
        ],
        recommendations: [
          "좋은 조명에서 촬영하세요",
          "다양한 각도에서 촬영해보세요",
          "상품의 특징을 강조해보세요",
        ],
      };

      setResult(mockResult);
      onAnalysisComplete(mockResult);
      onConditionChange(mockResult.conditionGrade);
    } catch (err) {
      console.error("AI 분석 오류:", err);
      setError("AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getEmotionColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getConditionLabel = (grade: "A" | "B" | "C" | "D") => {
    const labels = {
      A: "A급 - 거의 새것",
      B: "B급 - 양호한 상태",
      C: "C급 - 사용감 있음",
      D: "D급 - 많은 사용감",
    };
    return labels[grade];
  };

  const getConditionColor = (grade: "A" | "B" | "C" | "D") => {
    const colors = {
      A: "text-blue-600 bg-blue-100",
      B: "text-green-600 bg-green-100",
      C: "text-yellow-600 bg-yellow-100",
      D: "text-red-600 bg-red-100",
    };
    return colors[grade];
  };

  if (isAnalyzing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          AI 분석 중...
        </h3>
        <p className="text-blue-700 text-sm">
          상품의 상태를 분석하고 있습니다. 잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">분석 실패</h3>
        <p className="text-red-700 text-sm mb-4">{error}</p>
        <button
          onClick={analyzeImage}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* 촬영된 이미지 표시 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">촬영된 이미지</h4>
        <div className="relative">
          <img
            src={imageDataUrl}
            alt="AI 감정 분석 이미지"
            className="w-full max-w-md mx-auto rounded-lg shadow-md"
          />
          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg">
            <Brain className="w-3 h-3" />
            <span>AI 감정</span>
          </div>
        </div>
      </div>

      {/* 분석 결과 헤더 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI 분석 결과
            </h3>
          </div>
          <div className="text-sm text-gray-600">
            신뢰도: {Math.round(result.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* 감정 점수 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">감정 점수</h4>
          <span
            className={`text-2xl font-bold ${getEmotionColor(result.emotionScore)}`}
          >
            {result.emotionScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${
              result.emotionScore >= 90
                ? "bg-green-500"
                : result.emotionScore >= 80
                  ? "bg-blue-500"
                  : result.emotionScore >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${result.emotionScore}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {result.emotionScore >= 90
            ? "매우 우수한 상태입니다!"
            : result.emotionScore >= 80
              ? "좋은 상태입니다."
              : result.emotionScore >= 70
                ? "양호한 상태입니다."
                : "개선이 필요합니다."}
        </p>
      </div>

      {/* 상태 등급 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">추천 상태 등급</h4>
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(result.conditionGrade)}`}
        >
          {getConditionLabel(result.conditionGrade)}
        </div>
      </div>

      {/* 추천 가격 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">AI 추천 가격</h4>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {result.suggestedPrice.toLocaleString()}원
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          시장 분석을 바탕으로 한 추천 가격입니다.
        </p>
      </div>

      {/* 감지된 특징 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">감지된 특징</h4>
        <div className="grid grid-cols-2 gap-2">
          {result.detectedFeatures.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 개선 권장사항 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-3">개선 권장사항</h4>
        <ul className="space-y-1">
          {result.recommendations.map((recommendation, index) => (
            <li
              key={index}
              className="text-sm text-amber-800 flex items-start space-x-2"
            >
              <span className="text-amber-600 mt-0.5">•</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
