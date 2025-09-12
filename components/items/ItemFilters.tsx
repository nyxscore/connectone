"use client";

import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ItemListFilters } from "../../lib/api/products";
import { INSTRUMENT_CATEGORIES, REGIONS } from "../../data/constants";
import { Search, Filter, SortAsc, SortDesc, X } from "lucide-react";

interface ItemFiltersProps {
  filters: ItemListFilters;
  sortBy: "createdAt" | "price";
  sortOrder: "desc" | "asc";
  onFiltersChange: (filters: ItemListFilters) => void;
  onSortChange: (sortBy: "createdAt" | "price") => void;
  onSortOrderChange: (sortOrder: "desc" | "asc") => void;
  onClearFilters: () => void;
}

export function ItemFilters({
  filters,
  sortBy,
  sortOrder,
  onFiltersChange,
  onSortChange,
  onSortOrderChange,
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

  const handleSortChange = (newSortBy: "createdAt" | "price") => {
    if (sortBy === newSortBy) {
      onSortOrderChange(sortOrder === "desc" ? "asc" : "desc");
    } else {
      onSortChange(newSortBy);
      onSortOrderChange("desc");
    }
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined && value !== ""
  );

  return (
    <Card className="p-6 mb-8">
      <div className="space-y-4">
        {/* 검색바 */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="브랜드나 모델명으로 검색..."
                value={filters.keyword || ""}
                onChange={e => handleFilterChange("keyword", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={showFilters ? "bg-gray-100" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <Select
                  value={filters.category || ""}
                  onChange={e => handleFilterChange("category", e.target.value)}
                >
                  <option value="">전체</option>
                  {INSTRUMENT_CATEGORIES.map(category => (
                    <option key={category.key} value={category.key}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지역
                </label>
                <Select
                  value={filters.region || ""}
                  onChange={e => handleFilterChange("region", e.target.value)}
                >
                  <option value="">전체</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </Select>
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

        {/* 정렬 옵션 */}
        <div className="flex items-center space-x-4 pt-4 border-t">
          <span className="text-sm font-medium text-gray-700">정렬:</span>
          <Button
            variant={sortBy === "createdAt" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("createdAt")}
          >
            {sortBy === "createdAt" && sortOrder === "desc" ? (
              <SortDesc className="w-4 h-4 mr-1" />
            ) : (
              <SortAsc className="w-4 h-4 mr-1" />
            )}
            최신순
          </Button>
          <Button
            variant={sortBy === "price" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("price")}
          >
            {sortBy === "price" && sortOrder === "asc" ? (
              <SortAsc className="w-4 h-4 mr-1" />
            ) : (
              <SortDesc className="w-4 h-4 mr-1" />
            )}
            가격순
          </Button>
        </div>
      </div>
    </Card>
  );
}
