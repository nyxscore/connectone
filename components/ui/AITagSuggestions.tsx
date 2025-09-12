"use client";

import { useState, useEffect } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import {
  inspectImages,
  generateAiTagsFromInspection,
  getRecommendedCondition,
  InspectionResult,
} from "../../lib/api/inspection";
import {
  Sparkles,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface AITagSuggestionsProps {
  imageUrls: string[];
  onTagsChange: (tags: string[]) => void;
  onConditionChange?: (condition: "A" | "B" | "C" | "D") => void;
  className?: string;
}

export function AITagSuggestions({
  imageUrls,
  onTagsChange,
  onConditionChange,
  className = "",
}: AITagSuggestionsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inspectionResults, setInspectionResults] = useState<
    InspectionResult[]
  >([]);
  const [error, setError] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // 이미지가 변경될 때마다 분석 초기화
  useEffect(() => {
    if (imageUrls.length > 0) {
      setHasAnalyzed(false);
      setSuggestedTags([]);
      setSelectedTags([]);
      setInspectionResults([]);
      setError("");
    }
  }, [imageUrls]);

  const analyzeImages = async () => {
    if (imageUrls.length === 0) return;

    setIsAnalyzing(true);
    setError("");

    try {
      const results = await inspectImages(imageUrls);

      // 성공한 결과만 필터링
      const successfulResults = results
        .filter(r => r.success && r.data)
        .map(r => r.data!);

      if (successfulResults.length === 0) {
        setError("AI 분석에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      setInspectionResults(successfulResults);

      // AI 태그 생성
      const aiTags = generateAiTagsFromInspection(successfulResults);
      setSuggestedTags(aiTags);

      // 추천 상태 등급
      const recommendedCondition = getRecommendedCondition(successfulResults);
      if (recommendedCondition && onConditionChange) {
        onConditionChange(recommendedCondition);
      }

      setHasAnalyzed(true);
      toast.success("AI 분석이 완료되었습니다!");
    } catch (error) {
      console.error("AI 분석 실패:", error);
      setError("AI 분석 중 오류가 발생했습니다.");
      toast.error("AI 분석에 실패했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      return newTags;
    });
  };

  // selectedTags가 변경될 때마다 onTagsChange 호출
  useEffect(() => {
    onTagsChange(selectedTags);
  }, [selectedTags]);

  const selectAllTags = () => {
    setSelectedTags(suggestedTags);
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const getTagColor = (tag: string) => {
    if (tag.includes("등급")) return "bg-blue-100 text-blue-800";
    if (tag.includes("있음") || tag.includes("있음"))
      return "bg-yellow-100 text-yellow-800";
    if (tag.includes("필요") || tag.includes("권장"))
      return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI 분석 결과
            </h3>
            {hasAnalyzed && <CheckCircle className="w-5 h-5 text-green-500" />}
          </div>

          {!hasAnalyzed && (
            <Button
              type="button"
              onClick={analyzeImages}
              disabled={isAnalyzing}
              size="sm"
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 분석 시작
                </>
              )}
            </Button>
          )}
        </div>

        {/* 분석 결과 요약 */}
        {hasAnalyzed && inspectionResults.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-900">분석 완료</span>
            </div>
            <div className="text-sm text-purple-700">
              {imageUrls.length}개 이미지를 분석하여 {suggestedTags.length}개의
              태그를 제안했습니다.
            </div>
            <div className="mt-2">
              <Button
                type="button"
                onClick={analyzeImages}
                disabled={isAnalyzing}
                size="sm"
                variant="ghost"
                className="text-purple-600 hover:text-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                다시 분석
              </Button>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* 제안된 태그들 */}
        {suggestedTags.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                제안된 태그 ({selectedTags.length}/{suggestedTags.length}{" "}
                선택됨)
              </h4>
              <div className="space-x-2">
                <Button
                  type="button"
                  onClick={selectAllTags}
                  size="sm"
                  variant="outline"
                  disabled={selectedTags.length === suggestedTags.length}
                >
                  전체 선택
                </Button>
                <Button
                  type="button"
                  onClick={clearAllTags}
                  size="sm"
                  variant="outline"
                  disabled={selectedTags.length === 0}
                >
                  전체 해제
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-blue-500 text-white"
                      : `${getTagColor(tag)} hover:bg-opacity-80`
                  }`}
                >
                  {selectedTags.includes(tag) ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <X className="w-3 h-3 mr-1" />
                  )}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI 감정 마크 */}
        {hasAnalyzed && inspectionResults.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">AI 감정 완료</h4>
                  <p className="text-sm text-gray-600">
                    {inspectionResults.length}개 이미지 분석 완료
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {inspectionResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 bg-white px-3 py-1 rounded-full border border-purple-200"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {result.conditionHint}급
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 분석 전 안내 */}
        {!hasAnalyzed && !isAnalyzing && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              AI로 이미지를 분석해보세요
            </h4>
            <p className="text-gray-600 mb-4">
              업로드한 이미지를 AI가 분석하여 상태 등급과 결함을 자동으로
              감지합니다.
            </p>
            <Button
              type="button"
              onClick={analyzeImages}
              disabled={isAnalyzing}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI 분석 시작
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
