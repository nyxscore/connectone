"use client";

import { motion } from "framer-motion";
import categories from "@/data/categories.json";

interface CategoryCardsProps {
  onSelect: (cat: any) => void;
  selectedCategory?: any;
}

export default function CategoryCards({
  onSelect,
  selectedCategory,
}: CategoryCardsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          카테고리를 선택해주세요
        </h2>
        <p className="text-gray-600">어떤 종류의 악기를 등록하시나요?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.categories.map((cat, index) => {
          const isSelected = selectedCategory?.id === cat.id;
          return (
            <motion.button
              key={cat.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:text-blue-600 hover:shadow-md hover:border-blue-300"
              }`}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                console.log("CategoryCards: 카테고리 선택됨", cat);
                onSelect(cat);
              }}
              aria-label={`${cat.name} 카테고리 선택`}
              role="button"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="text-3xl sm:text-4xl">
                  {getCategoryIcon(cat.id)}
                </div>
                <div className="font-semibold text-xs sm:text-sm leading-tight text-center">
                  {cat.name}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// 카테고리별 아이콘 매핑
function getCategoryIcon(categoryId: string): string {
  const iconMap: Record<string, string> = {
    keyboard: "🎹",
    strings: "🎸",
    winds: "🎺",
    percussion: "🥁",
    korean: "🎵",
    electronic: "🎛️",
    audio: "🎧",
    accessories: "🎼",
  };

  return iconMap[categoryId] || "🎵";
}
