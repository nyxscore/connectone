"use client";

import { UserGrade } from "../../data/types";
import { getGradeInfo, getGradeColor } from "../../lib/utils/gradeSystem";
import { Award } from "lucide-react";

interface UserGradeBadgeProps {
  grade: UserGrade;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

export function UserGradeBadge({
  grade,
  size = "md",
  showDescription = false,
}: UserGradeBadgeProps) {
  // 유효한 등급인지 확인
  if (!grade || !["C", "D", "E", "F", "G", "A", "B"].includes(grade)) {
    grade = "C" as UserGrade; // 기본값
  }

  const gradeInfo = getGradeInfo(grade);
  const colorClasses = getGradeColor(grade);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // gradeInfo가 없으면 기본 배지 표시
  if (!gradeInfo) {
    return (
      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
        C
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`inline-flex items-center space-x-1 rounded-full font-medium ${colorClasses} ${sizeClasses[size]}`}
      >
        <Award className={iconSizes[size]} />
        <span>{gradeInfo.grade}</span>
        <span className="hidden sm:inline">({gradeInfo.name})</span>
      </div>
      {showDescription && (
        <span className="text-sm text-gray-600">{gradeInfo.description}</span>
      )}
    </div>
  );
}
