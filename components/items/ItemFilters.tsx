"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { PriceRangeSlider } from "../ui/PriceRangeSlider";
import { ItemListFilters } from "../../lib/api/products";
import { INSTRUMENT_CATEGORIES, REGIONS } from "../../data/constants/index";
import { Search, Filter, SortAsc, SortDesc, X } from "lucide-react";
import categoriesData from "../../data/categories.json";

interface ItemFiltersProps {
  filters: ItemListFilters;
  onFiltersChange: (filters: ItemListFilters) => void;
  onClearFilters: () => void;
  showFilters?: boolean;
  onToggleFilters?: (show: boolean) => void;
}

export function ItemFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  showFilters = false,
  onToggleFilters,
}: ItemFiltersProps) {
  const [internalShowFilters, setInternalShowFilters] = useState(showFilters);

  // 외부에서 showFilters가 제공되면 그것을 사용, 아니면 내부 상태 사용
  const isFiltersOpen = onToggleFilters ? showFilters : internalShowFilters;
  const setFiltersOpen = onToggleFilters
    ? onToggleFilters
    : setInternalShowFilters;

  const handleFilterChange = (
    key: keyof ItemListFilters,
    value: string | number | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    // status는 제외 (항상 있을 수 있는 기본 필터)
    if (key === "status") return false;
    return value !== undefined && value !== "";
  });

  return (
    <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="space-y-4">
        {/* 검색바 */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="브랜드나 모델명으로 검색..."
                value={filters.keyword || ""}
                onChange={e => handleFilterChange("keyword", e.target.value)}
                className="pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>
          </div>
          <Button
            onClick={() => setFiltersOpen(!isFiltersOpen)}
            variant="outline"
            className={`${isFiltersOpen ? "bg-gray-100" : ""} w-full sm:w-auto`}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {
                  Object.values(filters).filter(
                    v => v !== undefined && v !== ""
                  ).length
                }
              </span>
            )}
          </Button>
        </div>

        {/* 필터 옵션들 - 세로 정렬 */}
        {isFiltersOpen && (
          <div className="pt-4 border-t">
            {/* 지역 섹션 */}
            <div className="py-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                지역
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.region || ""}
                onChange={e => handleFilterChange("region", e.target.value)}
              >
                <option value="">전체</option>
                {REGIONS.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* 가격 범위 섹션 */}
            <div className="py-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                가격 범위
              </label>
              <PriceRangeSlider
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onPriceChange={(min, max) => {
                  handleFilterChange("minPrice", min);
                  handleFilterChange("maxPrice", max);
                }}
              />
            </div>

            {/* 필터 초기화 버튼 */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={onClearFilters}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  필터 초기화
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 카테고리 필터 - 계층적 구조 */}
        <div className="pt-4 border-t">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            카테고리
          </span>

          {/* 1단계: 메인 카테고리 */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant={!filters.category ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                onFiltersChange({
                  ...filters,
                  category: undefined,
                  subcategory: undefined,
                  detailCategory: undefined,
                });
              }}
              className="text-xs sm:text-sm"
            >
              전체
            </Button>

            {INSTRUMENT_CATEGORIES.map(category => (
              <Button
                key={category.key}
                variant={
                  filters.category === category.key ? "primary" : "outline"
                }
                size="sm"
                onClick={() => {
                  onFiltersChange({
                    ...filters,
                    category: category.key,
                    subcategory: undefined,
                    detailCategory: undefined,
                  });
                }}
                className="text-xs sm:text-sm"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* 2단계: 서브카테고리 (예: 피아노, 기타, 색소폰 등) */}
          {filters.category &&
            (() => {
              const categoryData = categoriesData.categories.find(
                cat =>
                  cat.name ===
                  INSTRUMENT_CATEGORIES.find(ic => ic.key === filters.category)
                    ?.label
              );

              if (!categoryData) return null;

              // items 배열에서 중간 카테고리 추출
              const subcategories = categoryData.items.map(item =>
                typeof item === "string" ? item : item.name
              );

              return (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700 mb-3 block">
                    세부 카테고리
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={!filters.subcategory ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        onFiltersChange({
                          ...filters,
                          subcategory: undefined,
                          detailCategory: undefined,
                        });
                      }}
                      className="text-xs"
                    >
                      전체
                    </Button>
                    {subcategories.map(subcat => (
                      <Button
                        key={subcat}
                        variant={
                          filters.subcategory === subcat ? "primary" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          onFiltersChange({
                            ...filters,
                            subcategory: subcat,
                            detailCategory: undefined,
                          });
                        }}
                        className="text-xs"
                      >
                        {subcat}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })()}

          {/* 3단계: 상세 카테고리 (예: 그랜드 피아노, 디지털 피아노 등) */}
          {filters.category &&
            filters.subcategory &&
            (() => {
              const categoryData = categoriesData.categories.find(
                cat =>
                  cat.name ===
                  INSTRUMENT_CATEGORIES.find(ic => ic.key === filters.category)
                    ?.label
              );

              if (!categoryData) return null;

              // 선택된 서브카테고리의 상세 카테고리 찾기
              const subcategoryData = categoryData.items.find(
                item =>
                  typeof item !== "string" && item.name === filters.subcategory
              );

              if (
                !subcategoryData ||
                typeof subcategoryData === "string" ||
                !subcategoryData.subcategories
              ) {
                return null;
              }

              return (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700 mb-3 block">
                    상세 종류
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={!filters.detailCategory ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        onFiltersChange({
                          ...filters,
                          detailCategory: undefined,
                        });
                      }}
                      className="text-xs"
                    >
                      전체
                    </Button>
                    {subcategoryData.subcategories.map(detail => (
                      <Button
                        key={detail}
                        variant={
                          filters.detailCategory === detail
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          onFiltersChange({
                            ...filters,
                            detailCategory: detail,
                          });
                        }}
                        className="text-xs"
                      >
                        {detail}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })()}
        </div>

        {/* 거래 상태 필터 - 항상 보이는 버튼 형태 */}
        <div className="pt-4 border-t">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            거래 상태
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!filters.status ? "primary" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("status", undefined)}
              className="text-xs sm:text-sm"
            >
              전체
            </Button>
            <Button
              variant={filters.status === "available" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("status", "available")}
              className="text-xs sm:text-sm bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
            >
              거래가능
            </Button>
            <Button
              variant={filters.status === "reserved" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("status", "reserved")}
              className="text-xs sm:text-sm bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              거래중
            </Button>
            <Button
              variant={filters.status === "sold" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("status", "sold")}
              className="text-xs sm:text-sm bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              판매완료
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
