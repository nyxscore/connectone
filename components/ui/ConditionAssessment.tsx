"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./Card";
import { Button } from "./Button";
import { ConditionAssessment, Defect, ConditionGrade } from "../../data/types";
import {
  inspectImage,
  getConditionLabel,
  getConditionColor,
  getSeverityLabel,
  getDefectTypeLabel,
  getScoreDescription,
} from "../../lib/api/inspection";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

interface ConditionAssessmentProps {
  imageUrl: string;
  onConditionSelect?: (condition: string) => void;
  currentCondition?: string;
}

export function ConditionAssessmentComponent({
  imageUrl,
  onConditionSelect,
  currentCondition = "",
}: ConditionAssessmentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<ConditionAssessment | null>(
    null
  );
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      analyzeCondition();
    }
  }, [imageUrl]);

  const analyzeCondition = async () => {
    setIsAnalyzing(true);
    setError("");

    try {
      const result = await inspectImage(imageUrl);

      if (result.success && result.data) {
        // InspectionResult를 ConditionAssessment로 변환
        const assessment: ConditionAssessment = {
          conditionHint: result.data.conditionHint as ConditionGrade,
          defects: result.data.defects.map(defect => ({
            type: defect as any,
            severity: "moderate" as const,
            description: defect,
            location: "전체",
            confidence: 0.8,
          })),
          overallScore: result.data.confidence * 100,
          recommendations: result.data.suggestions,
          confidence: result.data.confidence,
        };
        setAssessment(assessment);
      } else {
        setError(result.error || "상태 분석에 실패했습니다.");
      }
    } catch (err) {
      setError("상태 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConditionSelect = (condition: string) => {
    if (onConditionSelect) {
      onConditionSelect(condition);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "minor":
        return <Info className="w-4 h-4 text-blue-500" />;
      case "moderate":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "major":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "moderate":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "major":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  if (isAnalyzing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <div>
            <h3 className="font-medium text-blue-900">AI 상태 분석 중...</h3>
            <p className="text-sm text-blue-700">
              악기의 외관 상태를 분석하고 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-red-900">상태 분석 실패</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeCondition}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-900">AI 상태 분석 완료</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-green-600"
        >
          {showDetails ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {showDetails ? "간단히" : "자세히"}
        </Button>
      </div>

      {/* 상태 등급 및 점수 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(assessment.conditionHint)}`}
          >
            {getConditionLabel(assessment.conditionHint)} (
            {assessment.conditionHint})
          </div>
          <p className="text-xs text-gray-600 mt-1">AI 추천 등급</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {assessment.overallScore}점
          </div>
          <p className="text-xs text-gray-600">
            {getScoreDescription(assessment.overallScore)}
          </p>
        </div>
      </div>

      {/* 상태 등급 선택 버튼 */}
      {onConditionSelect && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            상태 등급 선택:
          </p>
          <div className="flex space-x-2">
            {["A", "B", "C", "D"].map(grade => (
              <Button
                key={grade}
                variant={currentCondition === grade ? "primary" : "outline"}
                size="sm"
                onClick={() => handleConditionSelect(grade)}
                className="text-xs"
              >
                {grade}등급
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 상세 정보 */}
      {showDetails && (
        <div className="space-y-4">
          {/* 감지된 결함 */}
          {assessment.defects.length > 0 ? (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                감지된 결함 ({assessment.defects.length}개)
              </h4>
              <div className="space-y-2">
                {assessment.defects.map((defect, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getSeverityColor(defect.severity)}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getSeverityIcon(defect.severity)}
                      <span className="font-medium">
                        {getDefectTypeLabel(defect.type)}
                      </span>
                      <span className="text-xs opacity-75">
                        ({getSeverityLabel(defect.severity)})
                      </span>
                    </div>
                    {defect.location && (
                      <p className="text-xs opacity-75 mb-1">
                        위치: {defect.location}
                      </p>
                    )}
                    {defect.description && (
                      <p className="text-xs">{defect.description}</p>
                    )}
                    <div className="text-xs opacity-75 mt-1">
                      신뢰도: {Math.round(defect.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-green-700">
                감지된 결함이 없습니다. 상태가 매우 좋습니다!
              </p>
            </div>
          )}

          {/* 권장사항 */}
          {assessment.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">권장사항</h4>
              <ul className="space-y-1">
                {assessment.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start space-x-2"
                  >
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 분석 신뢰도 */}
          <div className="text-center text-xs text-gray-500">
            분석 신뢰도: {Math.round(assessment.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
