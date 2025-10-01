"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AudioSpectrumDashboardProps {
  selling: {
    registered: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  currentStatus?: "registered" | "inProgress" | "completed" | "cancelled";
  onStatusClick?: (status: string) => void;
}

interface StatusBar {
  id: string;
  label: string;
  count: number;
  color: string;
  bgColor: string;
  height: number;
}

export function AudioSpectrumDashboard({
  selling,
  currentStatus = "registered",
  onStatusClick,
}: AudioSpectrumDashboardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const maxCount = Math.max(...Object.values(selling), 1);

  const statusBars: StatusBar[] = [
    {
      id: "registered",
      label: "판매중",
      count: selling.registered,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-t from-blue-600 to-blue-400",
      height: Math.max(30, (selling.registered / maxCount) * 120),
    },
    {
      id: "inProgress",
      label: "거래중",
      count: selling.inProgress,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-t from-orange-600 to-orange-400",
      height: Math.max(30, (selling.inProgress / maxCount) * 120),
    },
    {
      id: "completed",
      label: "판매완료",
      count: selling.completed,
      color: "text-green-600",
      bgColor: "bg-gradient-to-t from-green-600 to-green-400",
      height: Math.max(30, (selling.completed / maxCount) * 120),
    },
    {
      id: "cancelled",
      label: "취소대기",
      count: selling.cancelled,
      color: "text-gray-600",
      bgColor: "bg-gradient-to-t from-gray-600 to-gray-400",
      height: Math.max(30, (selling.cancelled / maxCount) * 120),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const barVariants = {
    hidden: { scaleY: 0, opacity: 0 },
    visible: (isActive: boolean) => ({
      scaleY: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  const activeBarVariants = {
    animate: {
      scaleY: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">판매 현황</h2>
        <p className="text-gray-600">오디오 스펙트럼으로 확인하는 거래 흐름</p>
      </motion.div>

      <motion.div
        className="flex items-end justify-center space-x-2 sm:space-x-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {statusBars.map((bar, index) => {
          const isActive = bar.id === currentStatus;
          const totalCount = Object.values(selling).reduce(
            (sum, count) => sum + count,
            0
          );

          return (
            <motion.div
              key={bar.id}
              className="flex flex-col items-center space-y-3 cursor-pointer hover:opacity-80 transition-opacity"
              custom={isActive}
              variants={barVariants}
              onClick={() => onStatusClick?.(bar.id)}
            >
              {/* 막대 그래프 */}
              <div className="relative flex flex-col items-center">
                {/* 막대 상단 반짝임 효과 */}
                {isActive && (
                  <motion.div
                    className="w-2 h-2 bg-white rounded-full mb-1"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                <motion.div
                  className={`w-6 sm:w-10 rounded-t-md ${bar.bgColor} shadow-lg relative overflow-hidden`}
                  style={{ height: `${bar.height}px` }}
                  variants={isActive ? activeBarVariants : {}}
                  animate={isActive ? "animate" : "visible"}
                >
                  {/* 막대 내부 반짝이는 효과 */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-white opacity-20"
                      animate={{
                        opacity: [0.2, 0.6, 0.2],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {/* 막대 하단 밝은 부분 */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-white opacity-30 rounded-b-md" />
                </motion.div>

                {/* 막대 하단 베이스 */}
                <div
                  className={`w-6 sm:w-10 h-1 ${bar.bgColor} opacity-60 rounded-b-md`}
                  style={{ marginTop: "1px" }}
                />
              </div>

              {/* 상태 라벨과 숫자 */}
              <div className="text-center">
                <div className={`text-sm font-semibold ${bar.color} mb-1`}>
                  {bar.label}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {bar.count}건
                </div>
                {totalCount > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((bar.count / totalCount) * 100)}%
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 하단 정보 */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="inline-flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>판매중</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>거래중</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>완료</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>취소대기</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
