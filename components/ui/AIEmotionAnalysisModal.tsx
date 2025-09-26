"use client";

import { useState } from "react";
import { Brain, Camera, RotateCcw, Upload } from "lucide-react";
import { Button } from "./Button";

interface AIEmotionAnalysisModalProps {
  imageUrl: string;
  analysisResult: {
    emotion: string;
    confidence: number;
    description: string;
  };
  onAddImage: () => void;
  onRetake: () => void;
  isUploading: boolean;
}

export const AIEmotionAnalysisModal = ({
  imageUrl,
  analysisResult,
  onAddImage,
  onRetake,
  isUploading,
}: AIEmotionAnalysisModalProps) => {
  return (
    <div className="space-y-4">
      {/* 촬영된 이미지 표시 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">촬영된 이미지</h4>
        <div className="relative">
          <img
            src={imageUrl}
            alt="AI 감정 분석 이미지"
            className="w-full max-w-md mx-auto rounded-lg shadow-md"
          />
          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg">
            <Brain className="w-3 h-3" />
            <span>AI</span>
          </div>
        </div>
      </div>

      {/* AI 분석 결과 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI 분석 결과</h3>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">분석</h4>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {analysisResult.emotion}
              </span>
              <span className="text-sm text-gray-600">
                신뢰도: {Math.round(analysisResult.confidence * 100)}%
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-1">분석 설명</h4>
            <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
              {analysisResult.description}
            </p>
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onRetake}
          className="flex-1"
          disabled={isUploading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          다시 촬영
        </Button>
        <Button
          type="button"
          onClick={onAddImage}
          className="flex-1"
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {isUploading ? "업로드 중..." : "이미지 추가"}
        </Button>
      </div>
    </div>
  );
};
