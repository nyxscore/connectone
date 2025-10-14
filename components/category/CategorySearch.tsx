"use client";

import { useState, forwardRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  const [selectedMainCategory, setSelectedMainCategory] = useState<
    string | null
  >(null);

  // 모든 아이템을 플랫하게 만들어서 검색 및 표시
  const getAllItems = () => {
    const items: string[] = [];
    topCategory?.items?.forEach((item: any) => {
      if (typeof item === "string") {
        items.push(item);
      } else if (item.subcategories) {
        // 서브카테고리가 있는 경우 (예: 기타)
        items.push(item.name);
      }
    });
    return items;
  };

  // 검색 결과 필터링
  const filteredItems =
    getAllItems().filter((item: string) => {
      const q = query.toLowerCase();
      const itemLower = item.toLowerCase();

      // 직접 매칭
      if (itemLower.includes(q)) return true;

      // 특별한 검색 매칭 (플루트 -> 플룻)
      if (q === "플루트" && itemLower === "플룻") return true;
      if (q === "flute" && itemLower === "플룻") return true;

      return false;
    }) || [];

  // 서브카테고리 아이템 가져오기
  const getSubcategoryItems = (mainItemName: string) => {
    const mainItem = topCategory?.items?.find(
      (item: any) => typeof item === "object" && item.name === mainItemName
    );
    return mainItem?.subcategories || [];
  };

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
          {(query.length > 1 ? filteredItems : getAllItems()).map(
            (item: string) => {
              const hasSubcategories = getSubcategoryItems(item).length > 0;
              const isMainCategorySelected = selectedMainCategory === item;

              // 선택된 서브카테고리가 있는지 확인
              const selectedSubcategory = hasSubcategories
                ? getSubcategoryItems(item).find(
                    subItem => selectedItem === subItem
                  )
                : null;

              // 선택 상태 결정 (메인 카테고리 또는 서브카테고리 선택)
              const isSelected = selectedItem === item || selectedSubcategory;

              // 표시할 텍스트 결정
              const displayText = selectedSubcategory || item;

              return (
                <div key={item} className="relative">
                  {/* 메인 카테고리 카드 */}
                  <button
                    type="button"
                    className={`
                    w-full p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:shadow-sm"
                    }
                  `}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();

                      // 다른 카드가 선택된 경우 기존 드롭다운 닫기
                      if (
                        selectedMainCategory &&
                        selectedMainCategory !== item
                      ) {
                        setSelectedMainCategory(null);
                      }

                      if (hasSubcategories) {
                        // 서브카테고리가 있는 경우
                        if (selectedSubcategory) {
                          // 이미 서브카테고리가 선택된 경우 드롭다운 열기
                          setSelectedMainCategory(item);
                        } else {
                          // 서브카테고리가 선택되지 않은 경우 드롭다운 토글
                          setSelectedMainCategory(
                            isMainCategorySelected ? null : item
                          );
                        }
                      } else {
                        // 서브카테고리가 없는 경우 바로 선택하고 다른 드롭다운 닫기
                        console.log("CategorySearch: 악기 선택됨", item);
                        onSelectItem(item);
                        setSelectedMainCategory(null); // 다른 카드 선택 시 드롭다운 닫기
                      }
                    }}
                  >
                    <div className="text-center">
                      <div className="font-medium flex items-center justify-center">
                        <span>{displayText}</span>
                        {hasSubcategories && !selectedSubcategory && (
                          <span className="ml-1">
                            {isMainCategorySelected ? (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* 서브카테고리 드롭다운 - 카드 위에 오버레이 */}
                  {isMainCategorySelected && hasSubcategories && (
                    <div
                      className="absolute top-0 left-0 right-0 z-10 bg-white border-2 border-blue-500 rounded-lg shadow-lg overflow-hidden"
                      style={{
                        transform: "translateY(-100%)",
                        marginTop: "-8px",
                        maxHeight: "200px",
                      }}
                    >
                      <div className="text-xs font-medium text-gray-600 py-2 px-3 border-b border-gray-200 bg-gray-50">
                        {item} 종류
                      </div>
                      <div
                        className="overflow-y-auto"
                        style={{ maxHeight: "168px" }}
                      >
                        {getSubcategoryItems(item).map((subItem: string) => {
                          const isSubSelected = selectedItem === subItem;
                          return (
                            <button
                              key={subItem}
                              type="button"
                              className={`
                              w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                              ${
                                isSubSelected
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }
                              border-b border-gray-100 last:border-b-0
                            `}
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log(
                                  "CategorySearch: 서브카테고리 선택됨",
                                  subItem
                                );
                                onSelectItem(subItem);
                                // 서브카테고리 선택 후 드롭다운 닫기
                                setSelectedMainCategory(null);
                              }}
                            >
                              {subItem}
                              {isSubSelected && " ✓"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
