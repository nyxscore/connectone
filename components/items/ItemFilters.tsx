"use client";

import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ItemListFilters } from "../../lib/api/products";
import { INSTRUMENT_CATEGORIES, REGIONS } from "../../data/constants/index";
import { Search, Filter, SortAsc, SortDesc, X } from "lucide-react";

interface ItemFiltersProps {
  filters: ItemListFilters;
  onFiltersChange: (filters: ItemListFilters) => void;
  onClearFilters: () => void;
}

export function ItemFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ItemFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

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
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={`${showFilters ? "bg-gray-100" : ""} w-full sm:w-auto`}
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

        {/* 필터 옵션들 */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.category || ""}
                  onChange={e => handleFilterChange("category", e.target.value)}
                >
                  <option value="">전체</option>
                  {INSTRUMENT_CATEGORIES.map(category => (
                    <option key={category.key} value={category.key}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최소 가격
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice || ""}
                  onChange={e =>
                    handleFilterChange(
                      "minPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 가격
                </label>
                <Input
                  type="number"
                  placeholder="무제한"
                  value={filters.maxPrice || ""}
                  onChange={e =>
                    handleFilterChange(
                      "maxPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>

            {/* 필터 초기화 버튼 */}
            {hasActiveFilters && (
              <div className="flex justify-end">
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

        {/* 카테고리 필터 */}
        <div className="pt-4 border-t">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            카테고리:
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!filters.category ? "primary" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("category", undefined)}
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
                onClick={() => handleFilterChange("category", category.key)}
              >
                {category.icon} {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
