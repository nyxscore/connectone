"use client";

import { getGradeInfo } from "@/lib/profile/api";
import { useState } from "react";

interface GradeProgressCardsProps {
  currentGrade: string;
}

export function GradeProgressCards({ currentGrade }: GradeProgressCardsProps) {
  const grades = ["C", "D", "E", "F", "G", "A", "B"];
  const [hoveredGrade, setHoveredGrade] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-center w-full mb-4">
        {grades.map((grade, index) => {
          const gradeInfo = getGradeInfo(grade);
          const isCurrentGrade = grade === currentGrade;
          const isCompleted = grades.indexOf(currentGrade) > index;

          return (
            <div key={grade} className="flex items-center">
              {/* 등급 카드 컨테이너 */}
              <div className="flex flex-col items-center relative">
                {/* 등급 카드 */}
                <div
                  className={`
                relative w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
                ${
                  selectedGrade === grade
                    ? "border-purple-500 bg-purple-50 shadow-lg scale-110 ring-2 ring-purple-200"
                    : isCurrentGrade
                      ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                      : isCompleted
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 bg-gray-50"
                }
              `}
                  onMouseEnter={() => setHoveredGrade(grade)}
                  onMouseLeave={() => setHoveredGrade(null)}
                  onClick={() => {
                    setSelectedGrade(selectedGrade === grade ? null : grade);
                  }}
                >
                  {/* 이모지 */}
                  <div className="text-2xl">{gradeInfo.emoji}</div>

                  {/* 현재 등급 표시 */}
                  {isCurrentGrade && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}

                  {/* 완료된 등급 체크마크 */}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 등급명 텍스트 */}
                <div className="mt-2">
                  <div
                    className={`text-xs font-medium text-center ${
                      selectedGrade === grade
                        ? "text-purple-600 font-bold"
                        : isCurrentGrade
                          ? "text-blue-600"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                    }`}
                  >
                    {gradeInfo.label}
                  </div>
                </div>

                {/* 툴팁 */}
                {hoveredGrade === grade && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
                    <div className="font-medium">{gradeInfo.displayName}</div>
                    <div className="text-xs text-gray-300">
                      {gradeInfo.description}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>

              {/* 점선 화살표 (마지막 카드가 아닐 때만) */}
              {index < grades.length - 1 && (
                <div className="mx-1 flex items-center">
                  <svg
                    className="w-6 h-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {/* 점선 */}
                    <line
                      x1="2"
                      y1="1.5"
                      x2="18"
                      y2="1.5"
                      strokeWidth="3"
                      strokeDasharray="4,2"
                      strokeLinecap="round"
                    />
                    {/* 화살표 머리 */}
                    <path
                      strokeWidth="3"
                      strokeDasharray="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 0.5l2 1.5l-2 1.5"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 등급 상세 정보 */}
      {selectedGrade && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            {(() => {
              const gradeInfo = getGradeInfo(selectedGrade);
              return (
                <div>
                  <div className="text-lg font-bold text-blue-800 mb-1">
                    {gradeInfo.displayName}
                  </div>
                  <div className="text-sm text-blue-600">
                    {gradeInfo.description}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
