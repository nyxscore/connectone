"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../../components/ui/Button";
import { ItemCard } from "../../components/items/ItemCard";
import { ItemFilters } from "../../components/items/ItemFilters";
import { useItemsQuery } from "../../hooks/useItemsQuery";
import { SellItem } from "../../data/types";
import { ItemDetailModal } from "../../components/items/ItemDetailModal";
import ProductDetailModal from "../../components/product/ProductDetailModal";
import { EnhancedChatModal } from "../../components/chat/EnhancedChatModal";
import { useAuth } from "../../lib/hooks/useAuth";

export default function ListPage() {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<SellItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatItemId, setChatItemId] = useState<string | null>(null);
  const [chatSellerUid, setChatSellerUid] = useState<string | null>(null);

  // 무한 스크롤을 위한 ref
  const observerTarget = useRef<HTMLDivElement>(null);

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
    limit: 50, // 20개에서 50개로 증가
  });

  // 페이지 마운트 시 필터 초기화 (한 번만 실행)
  useEffect(() => {
    console.log("ListPage 마운트됨 - 필터 초기화");
    setFilters({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 한 번만 실행

  // 무한 스크롤 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // 관찰 대상이 화면에 보이고, 더 불러올 상품이 있고, 현재 로딩 중이 아닐 때
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !filtering
        ) {
          console.log("📜 스크롤 하단 도달 - 자동 로드");
          loadMore();
        }
      },
      {
        threshold: 0.1, // 10%만 보여도 트리거
        rootMargin: "100px", // 하단 100px 전에 미리 로드
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, filtering, loadMore]);

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

  // 필터링: 취소된 상품만 숨김
  const filteredItems = items.filter(item => {
    // 취소된 상품만 숨김
    return item.status !== "cancelled";
  });

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                상품 목록
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                중고 악기를 찾아보세요
              </p>
            </div>
            
            {/* 상품 등록하기 버튼 */}
            <div className="w-full sm:w-auto">
              <Button
                onClick={() => {
                  if (user) {
                    window.location.href = "/product/new";
                  } else {
                    window.location.href = "/auth/login?next=/product/new";
                  }
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>상품 등록하기</span>
                </span>
              </Button>
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
        ) : filteredItems.length === 0 && !filtering ? (
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
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} onClick={handleItemClick} />
              ))}
            </div>
          </div>
        )}

        {/* 무한 스크롤 트리거 & 로딩 인디케이터 */}
        {hasMore && (
          <div ref={observerTarget} className="text-center mt-8 py-4">
            {loadingMore && (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">상품을 불러오는 중...</p>
              </>
            )}
          </div>
        )}

        {/* 더 이상 상품이 없을 때 */}
        {!hasMore && filteredItems.length > 0 && (
          <div className="text-center mt-8 py-4">
            <p className="text-gray-500">모든 상품을 불러왔습니다 ✨</p>
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
