"use client";

import { useState, forwardRef } from "react";
import categories from "@/data/categories.json";

const CategorySearch = forwardRef<
  HTMLInputElement,
  {
    topCategory: any;
    onSelectItem: (item: string) => void;
    selectedItem: string;
  }
>(function CategorySearch({ topCategory, onSelectItem, selectedItem }, ref) {
  const [query, setQuery] = useState("");

  // 검색 결과 필터링
  const filteredItems =
    topCategory?.items?.filter((item: string) => {
      const q = query.toLowerCase();
      const itemLower = item.toLowerCase();
      
      // 직접 매칭
      if (itemLower.includes(q)) return true;
      
      // 특별한 검색 매칭 (플루트 -> 플룻)
      if (q === "플루트" && itemLower === "플룻") return true;
      if (q === "flute" && itemLower === "플룻") return true;
      
      return false;
    }) || [];

  return (
    <div className="space-y-4">
      {/* 검색창 */}
      <div className="space-y-2">
        <input
          ref={ref}
          type="text"
          placeholder={`${topCategory.name} 내 검색`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              console.log("CategorySearch: 엔터키 눌림 - 폼 제출 방지됨");
            }
          }}
          className="w-full border rounded-lg p-3 text-lg"
        />
      </div>

      {/* 악기 목록 */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {topCategory.name} 악기 목록
        </h3>

        {/* 검색 결과 또는 전체 목록 표시 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(query.length > 1 ? filteredItems : topCategory?.items || []).map(
            (item: string) => {
              const isSelected = selectedItem === item;
              return (
                <button
                  key={item}
                  type="button"
                  className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:shadow-sm"
                  }
                `}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("CategorySearch: 악기 선택됨", item);
                    onSelectItem(item);
                  }}
                >
                  <div className="text-center">
                    <div className="font-medium">{item}</div>
                    {isSelected && (
                      <div className="text-xs text-blue-600 mt-1">선택됨 ✓</div>
                    )}
                  </div>
                </button>
              );
            }
          )}
        </div>

        {/* 검색 결과 없음 */}
        {query.length > 1 && filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            "{query}"에 대한 검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
});

export default CategorySearch;
