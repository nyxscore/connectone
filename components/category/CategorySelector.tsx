"use client";

import { useState, useRef, useEffect } from "react";
import CategoryCards from "./CategoryCards";
import CategorySearch from "./CategorySearch";

export default function CategorySelector({
  onSelect,
}: {
  onSelect: (category: any) => void;
}) {
  const [selectedTop, setSelectedTop] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleItemSelect = (item: string) => {
    console.log("CategorySelector: 악기 선택됨", item);
    setSelectedItem(item);
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium"
              onClick={() => {
                const categoryData = {
                  categoryPath: [selectedTop?.name, selectedItem].filter(
                    Boolean
                  ),
                  categoryId: `${selectedTop?.id}_${selectedItem.toLowerCase().replace(/\s+/g, "_")}`,
                };
                console.log("CategorySelector: onSelect 호출됨", categoryData);
                onSelect(categoryData);
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
