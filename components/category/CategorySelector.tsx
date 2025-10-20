"use client";

import { useState, useRef, useEffect } from "react";
import CategoryCards from "./CategoryCards";
import CategorySearch from "./CategorySearch";

interface CategorySelectorProps {
  value?: string;
  onChange?: (category: string) => void;
  onSelect?: (category: any) => void;
  onBack?: () => void;
}

export default function CategorySelector({
  value,
  onChange,
  onSelect,
  onBack,
}: CategorySelectorProps) {
  const [selectedTop, setSelectedTop] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleItemSelect = (item: string) => {
    console.log("CategorySelector: 악기 선택됨", item);
    setSelectedItem(item);
    if (onChange) {
      onChange(item);
    }
  };

  // 카테고리 선택 시 검색창 자동 포커스
  useEffect(() => {
    if (selectedTop && searchInputRef.current) {
      // 약간의 지연을 두어 DOM이 업데이트된 후 포커스
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [selectedTop]);

  return (
    <div className="w-full space-y-6 relative pb-20">
      {/* 뒤로가기 버튼 (onBack prop이 있을 때만 표시) */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
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
          <span className="font-medium">이전으로</span>
        </button>
      )}

      {/* 카테고리 카드들 - 항상 표시 */}
      <CategoryCards
        onSelect={cat => setSelectedTop(cat)}
        selectedCategory={selectedTop}
      />

      {/* 선택된 카테고리가 있을 때 검색창과 악기 목록 표시 */}
      {selectedTop && (
        <>
          <CategorySearch
            ref={searchInputRef}
            topCategory={selectedTop}
            onSelectItem={handleItemSelect}
            selectedItem={selectedItem}
          />
        </>
      )}

      {/* 하단 고정 바 */}
      {selectedItem && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-md p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex flex-col space-y-2">
              <div className="flex flex-wrap gap-2">
                {selectedTop && (
                  <span className="px-2 py-1 bg-gray-200 rounded text-sm">
                    {selectedTop.name}
                  </span>
                )}
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                  {selectedItem}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                악기가 선택되었습니다. 다음 단계에서 거래 유형을 선택하세요.
              </p>
            </div>
            <button
              type="button"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium"
              onClick={() => {
                const categoryData = {
                  name: selectedItem,
                  categoryPath: [selectedTop?.name, selectedItem].filter(
                    Boolean
                  ),
                  categoryId: `${selectedTop?.id}_${selectedItem.toLowerCase().replace(/\s+/g, "_")}`,
                };
                console.log("CategorySelector: onSelect 호출됨", categoryData);
                if (onSelect) {
                  onSelect(categoryData);
                } else if (onChange) {
                  onChange(selectedItem);
                }
              }}
            >
              다음 단계로 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
