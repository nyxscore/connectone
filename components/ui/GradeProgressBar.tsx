"use client";

import { UserProgress, UserGrade } from "../../data/types";
import { getGradeInfo, getGradeColor } from "../../lib/utils/gradeSystem";
import {
  Star,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle,
  Award,
  Target,
} from "lucide-react";

interface GradeProgressBarProps {
  progress?: UserProgress;
  grade?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  showDetails?: boolean;
}

export function GradeProgressBar({
  progress,
  grade,
  showDetails = true,
}: GradeProgressBarProps) {
  // grade prop이 있으면 간단한 등급 표시, progress가 있으면 상세 진행률 표시
  if (grade) {
    const gradeInfo = getGradeInfo(grade as UserGrade);
    return (
      <div className="flex items-center space-x-2">
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade as UserGrade)}`}
        >
          {gradeInfo.grade}등급
        </div>
        <span className="text-sm text-gray-600">{gradeInfo.name}</span>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const currentGradeInfo = getGradeInfo(progress.currentGrade);
  const nextGradeInfo = progress.nextGrade
    ? getGradeInfo(progress.nextGrade)
    : null;

  const getRequirementIcon = (requirement: string, isMet: boolean) => {
    switch (requirement) {
      case "safeTransactions":
        return (
          <Shield
            className={`w-4 h-4 ${isMet ? "text-green-600" : "text-gray-400"}`}
          />
        );
      case "averageRating":
        return (
          <Star
            className={`w-4 h-4 ${isMet ? "text-green-600" : "text-gray-400"}`}
          />
        );
      case "disputeFree":
        return (
          <CheckCircle
            className={`w-4 h-4 ${isMet ? "text-green-600" : "text-red-400"}`}
          />
        );
      case "totalTrades":
        return (
          <TrendingUp
            className={`w-4 h-4 ${isMet ? "text-green-600" : "text-gray-400"}`}
          />
        );
      default:
        return (
          <Target
            className={`w-4 h-4 ${isMet ? "text-green-600" : "text-gray-400"}`}
          />
        );
    }
  };

  const getRequirementLabel = (requirement: string) => {
    switch (requirement) {
      case "safeTransactions":
        return "안전거래";
      case "averageRating":
        return "평균 평점";
      case "disputeFree":
        return "분쟁 무사고";
      case "totalTrades":
        return "총 거래수";
      default:
        return requirement;
    }
  };

  const getRequirementValue = (requirement: string) => {
    switch (requirement) {
      case "safeTransactions":
        return `${progress.progress.safeTransactions}/${progress.requirements.safeTransactions}`;
      case "averageRating":
        return `${progress.progress.averageRating.toFixed(1)}/${progress.requirements.averageRating}`;
      case "disputeFree":
        return progress.progress.disputeFree ? "완료" : "미완료";
      case "totalTrades":
        return `${progress.progress.totalTrades}/${progress.requirements.totalTrades}`;
      default:
        return "";
    }
  };

  const isRequirementMet = (requirement: string) => {
    switch (requirement) {
      case "safeTransactions":
        return (
          progress.progress.safeTransactions >=
          progress.requirements.safeTransactions
        );
      case "averageRating":
        return (
          progress.progress.averageRating >= progress.requirements.averageRating
        );
      case "disputeFree":
        return progress.progress.disputeFree;
      case "totalTrades":
        return (
          progress.progress.totalTrades >= progress.requirements.totalTrades
        );
      default:
        return false;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* 현재 등급 표시 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Award className="w-6 h-6 text-yellow-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              현재 등급: {currentGradeInfo.grade} ({currentGradeInfo.name})
            </h3>
            <p className="text-sm text-gray-600">
              {currentGradeInfo.description}
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(progress.currentGrade)}`}
        >
          {currentGradeInfo.grade}등급
        </div>
      </div>

      {/* 다음 등급까지 진행률 */}
      {progress.nextGrade && nextGradeInfo ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              다음 등급: {nextGradeInfo.grade} ({nextGradeInfo.name})
            </span>
            <span className="text-sm text-gray-500">
              {progress.progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.progressPercentage}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="text-center py-4">
            <Award className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-lg font-semibold text-gray-900">
              최고 등급 달성!
            </p>
            <p className="text-sm text-gray-600">모든 조건을 완료하셨습니다.</p>
          </div>
        </div>
      )}

      {/* 상세 조건 표시 */}
      {showDetails && progress.nextGrade && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            다음 등급 달성 조건
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(progress.requirements).map(([key, value]) => {
              const isMet = isRequirementMet(key);
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isMet
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getRequirementIcon(key, isMet)}
                    <span className="text-sm font-medium text-gray-700">
                      {getRequirementLabel(key)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${isMet ? "text-green-600" : "text-gray-600"}`}
                    >
                      {getRequirementValue(key)}
                    </span>
                    {isMet && (
                      <CheckCircle className="w-4 h-4 text-green-600 ml-1 inline" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 분쟁 무사고 특별 표시 */}
      {!progress.progress.disputeFree && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">
                분쟁 이력이 있습니다
              </p>
              <p className="text-xs text-red-700">
                분쟁이 해결되면 등급 승급이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
