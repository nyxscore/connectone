"use client";

import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { ItemCard } from "../../components/items/ItemCard";
import { ItemFilters } from "../../components/items/ItemFilters";
import { useItemsQuery } from "../../hooks/useItemsQuery";
import { SellItem } from "../../data/types";
import { ItemDetailModal } from "../../components/items/ItemDetailModal";

export default function ListPage() {
  const [selectedItem, setSelectedItem] = useState<SellItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    filters,
    sortBy,
    sortOrder,
    setFilters,
    setSortBy,
    setSortOrder,
    loadMore,
    refresh,
    clearError,
  } = useItemsQuery({
    limit: 20,
  });

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleItemClick = (item: SellItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleCloseModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">상품 목록</h1>
          <p className="text-gray-600">중고 악기를 찾아보세요</p>
        </div>

        {/* 검색 및 필터 */}
        <ItemFilters
          filters={filters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFiltersChange={setFilters}
          onSortChange={setSortBy}
          onSortOrderChange={setSortOrder}
          onClearFilters={handleClearFilters}
        />

        {/* 상품 목록 */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refresh}>다시 시도</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              상품이 없습니다
            </h3>
            <p className="text-gray-600">다른 검색 조건을 시도해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <ItemCard key={item.id} item={item} onClick={handleItemClick} />
            ))}
          </div>
        )}

        {/* 더보기 버튼 */}
        {hasMore && !loadingMore && (
          <div className="text-center mt-8">
            <Button onClick={loadMore} size="lg">
              더 많은 상품 보기
            </Button>
          </div>
        )}

        {loadingMore && (
          <div className="text-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상품을 불러오는 중...</p>
          </div>
        )}
      </div>

      {/* 상품 상세 모달 */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={showItemModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
