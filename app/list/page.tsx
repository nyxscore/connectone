"use client";

import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { ItemCard } from "../../components/items/ItemCard";
import { ItemFilters } from "../../components/items/ItemFilters";
import { useItemsQuery } from "../../hooks/useItemsQuery";
import { SellItem } from "../../data/types";
import { ItemDetailModal } from "../../components/items/ItemDetailModal";
import ProductDetailModal from "../../components/product/ProductDetailModal";
import { EnhancedChatModal } from "../../components/chat/EnhancedChatModal";

export default function ListPage() {
  const [selectedItem, setSelectedItem] = useState<SellItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatItemId, setChatItemId] = useState<string | null>(null);
  const [chatSellerUid, setChatSellerUid] = useState<string | null>(null);

  const {
    items,
    loading,
    loadingMore,
    filtering,
    hasMore,
    error,
    filters,
    setFilters,
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
    setShowProductModal(true); // ProductDetailModal 사용 (결제 기능 포함)
  };

  const handleCloseModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedItem(null);
  };

  const handleOpenChat = (itemId: string, sellerUid: string) => {
    console.log("📱 채팅 열기 요청:", { itemId, sellerUid });
    setChatItemId(itemId);
    setChatSellerUid(sellerUid);
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    console.log("📱 채팅 닫기");
    setShowChatModal(false);
    setChatItemId(null);
    setChatSellerUid(null);
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
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                상품 목록
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                중고 악기를 찾아보세요
              </p>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <ItemFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          showFilters={showFilters}
          onToggleFilters={setShowFilters}
        />

        {/* 상품 목록 */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refresh}>다시 시도</Button>
          </div>
        ) : items.length === 0 && !filtering ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              상품이 없습니다
            </h3>
            <p className="text-gray-600">다른 검색 조건을 시도해보세요.</p>
          </div>
        ) : (
          <div className="relative">
            {/* 필터링 중 오버레이 */}
            {filtering && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">필터링 중...</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {items.map(item => (
                <ItemCard key={item.id} item={item} onClick={handleItemClick} />
              ))}
            </div>
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

      {/* 상품 상세 모달 (결제 기능 포함) */}
      <ProductDetailModal
        item={selectedItem}
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onOpenChat={handleOpenChat}
      />

      {/* 채팅 모달 (상품 상세 모달 외부) */}
      {chatItemId && chatSellerUid && (
        <EnhancedChatModal
          isOpen={showChatModal}
          onClose={handleCloseChat}
          itemId={chatItemId}
          sellerUid={chatSellerUid}
        />
      )}
    </div>
  );
}
