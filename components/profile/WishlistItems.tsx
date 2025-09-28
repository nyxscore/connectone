"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ItemCard } from "../items/ItemCard";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import { SellItem } from "../../data/types";
import { getItem } from "../../lib/api/products";

interface WishlistItemsProps {
  userId: string;
  onItemClick?: (item: SellItem) => void;
}

export function WishlistItems({ userId, onItemClick }: WishlistItemsProps) {
  const [wishlistItems, setWishlistItems] = useState<SellItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWishlistItems();
  }, [userId]);

  const loadWishlistItems = async () => {
    try {
      setLoading(true);
      setError("");

      // 로컬 스토리지에서 찜한 상품 ID 목록 가져오기
      const wishlistData = localStorage.getItem(`wishlist_${userId}`);
      console.log("찜한 상품 데이터:", wishlistData);
      
      if (!wishlistData) {
        console.log("찜한 상품 데이터가 없습니다.");
        setWishlistItems([]);
        return;
      }

      const wishlistIds = JSON.parse(wishlistData);
      console.log("찜한 상품 ID 목록:", wishlistIds);
      
      if (wishlistIds.length === 0) {
        console.log("찜한 상품이 없습니다.");
        setWishlistItems([]);
        return;
      }

      // 찜한 상품들의 상세 정보 가져오기
      const items = await Promise.all(
        wishlistIds.map(async (itemId: string) => {
          try {
            const result = await getItem(itemId);
            if (result.success && result.item) {
              return result.item;
            }
            return null;
          } catch (error) {
            console.error(`상품 ${itemId} 로드 실패:`, error);
            return null;
          }
        })
      );

      // null이 아닌 상품들만 필터링
      const validItems = items.filter(item => item !== null);
      console.log("로드된 찜한 상품들:", validItems);
      setWishlistItems(validItems);
    } catch (error) {
      console.error("찜한 상품 로드 실패:", error);
      setError("찜한 상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = (itemId: string) => {
    try {
      const wishlistData = localStorage.getItem(`wishlist_${userId}`);
      if (wishlistData) {
        const wishlistIds = JSON.parse(wishlistData);
        const updatedIds = wishlistIds.filter((id: string) => id !== itemId);
        localStorage.setItem(`wishlist_${userId}`, JSON.stringify(updatedIds));
        setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error("찜 목록에서 제거 실패:", error);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">찜한 상품을 불러오는 중...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadWishlistItems} variant="outline">
            다시 시도
          </Button>
        </div>
      </Card>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            찜한 상품이 없습니다
          </h3>
          <p className="text-gray-600 mb-6">마음에 드는 상품을 찜해보세요!</p>
          <Button onClick={() => (window.location.href = "/list")}>
            상품 둘러보기
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            찜한 상품 ({wishlistItems.length}개)
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = "/profile/wishlist")}
        >
          더보기
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wishlistItems.map(item => (
          <div key={item.id} className="relative group">
            <ItemCard
              item={item}
              onClick={onItemClick || (() => {})} // 상품 클릭 시 상세 모달 열기 등
            />
            <button
              onClick={() => removeFromWishlist(item.id)}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              title="찜 목록에서 제거"
            >
              <Heart className="w-4 h-4 text-red-500 fill-current" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
