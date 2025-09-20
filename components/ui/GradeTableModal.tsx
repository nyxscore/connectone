"use client";

import React from "react";
import { User } from "@/data/types";
import { getGradeInfo } from "@/lib/profile/api";

interface GradeTableModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function GradeTableModal({
  user,
  isOpen,
  onClose,
}: GradeTableModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">회원등급표</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">
          <div className="space-y-4 max-w-md mx-auto">
            {["C", "D", "E", "F", "G", "A", "B"].map(grade => {
              const gradeData = getGradeInfo(grade);
              const isCurrentGrade = grade === user.grade;

              return (
                <div
                  key={grade}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                    isCurrentGrade
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {/* 이모지 */}
                  <div className="text-4xl mb-3">{gradeData.emoji}</div>

                  {/* 회원등급 */}
                  <div className="font-semibold text-gray-900 text-lg mb-2">
                    {gradeData.displayName}
                  </div>

                  {/* 등급혜택 */}
                  <div className="text-sm text-gray-600 mb-2">
                    {gradeData.description}
                  </div>

                  {/* 현재 등급 표시 */}
                  {isCurrentGrade && (
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-blue-600 font-medium">
                        현재 등급
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 현재 등급 강조 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{getGradeInfo(user.grade).emoji}</div>
              <div>
                <div className="font-bold text-blue-900 text-lg">
                  현재 등급: {getGradeInfo(user.grade).displayName}
                </div>
                <div className="text-sm text-blue-700">
                  {getGradeInfo(user.grade).description}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
