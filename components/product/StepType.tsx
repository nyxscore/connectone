"use client";

import { motion } from "framer-motion";
import { ShoppingCart, CreditCard } from "lucide-react";

interface StepTypeProps {
  value: "sell" | "buy";
  onChange: (value: "sell" | "buy") => void;
  onBack?: () => void;
}

const TRADE_TYPES = [
  {
    key: "sell",
    label: "판매하기",
    description: "내가 가진 악기를 판매합니다",
    icon: ShoppingCart,
    color: "bg-green-500",
  },
  {
    key: "buy",
    label: "구매하기",
    description: "원하는 악기를 구매합니다",
    icon: CreditCard,
    color: "bg-blue-500",
  },
];

export default function StepType({ value, onChange, onBack }: StepTypeProps) {
  const handleTypeSelect = (type: "sell" | "buy") => {
    onChange(type);
  };

  return (
    <div className="space-y-6">
      {/* 이전 버튼 */}
      {onBack && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>이전</span>
          </button>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          거래 유형을 선택해주세요
        </h2>
        <p className="text-gray-600">어떤 거래를 원하시나요?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {TRADE_TYPES.map((type, index) => {
          const isSelected = value === type.key;
          const IconComponent = type.icon;

          return (
            <motion.div
              key={type.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="button"
                onClick={() => handleTypeSelect(type.key as "sell" | "buy")}
                className={`
                  w-full p-8 rounded-xl border-2 transition-all duration-200
                  ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                      : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md"
                  }
                `}
                aria-label={`${type.label} 거래 유형 선택`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div
                    className={`
                      p-4 rounded-full transition-colors duration-200
                      ${isSelected ? "bg-white/20" : `${type.color} text-white`}
                    `}
                  >
                    <IconComponent className="w-8 h-8" />
                  </div>

                  <div className="text-center">
                    <div className="font-bold text-xl mb-2">{type.label}</div>
                    <div className="text-sm opacity-80">{type.description}</div>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
