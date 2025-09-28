"use client";

import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { PriceRangeSlider } from "../ui/PriceRangeSlider";
import { ItemListFilters } from "../../lib/api/products";
import { INSTRUMENT_CATEGORIES, REGIONS } from "../../data/constants/index";
import { Search, Filter, SortAsc, SortDesc, X } from "lucide-react";

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

  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined && value !== ""
  );

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
            {/* 거래 가능 섹션 */}
            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={filters.available || false}
                  onChange={e =>
                    handleFilterChange("available", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="available"
                  className="text-sm font-medium text-gray-700"
                >
                  거래 가능
                </label>
              </div>
            </div>

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

        {/* 카테고리 필터 - 심플한 버튼 형태 */}
        <div className="pt-4 border-t">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            카테고리
          </span>
          <div className="flex flex-wrap gap-2">
            {/* 전체 버튼 */}
            <Button
              variant={!filters.category ? "primary" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("category", undefined)}
              className="text-xs sm:text-sm"
            >
              전체
            </Button>

            {/* 카테고리 버튼들 */}
            {INSTRUMENT_CATEGORIES.map(category => (
              <Button
                key={category.key}
                variant={
                  filters.category === category.key ? "primary" : "outline"
                }
                size="sm"
                onClick={() => handleFilterChange("category", category.key)}
                className="text-xs sm:text-sm"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
