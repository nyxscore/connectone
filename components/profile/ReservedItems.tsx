"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ItemCard } from "../items/ItemCard";
import { MessageCircle, Loader2, AlertCircle, ShoppingBag } from "lucide-react";
import { SellItem } from "../../data/types";
import { getReservedItemsBySeller, getReservedItemsForBuyer } from "../../lib/api/products";
import { useAuth } from "../../lib/hooks/useAuth";

interface ReservedItemsProps {
  userId: string;
  isSeller?: boolean; // 판매자용인지 구매자용인지
}

export function ReservedItems({ userId, isSeller = false }: ReservedItemsProps) {
  const { user } = useAuth();
  const [reservedItems, setReservedItems] = useState<SellItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReservedItems();
  }, [userId, isSeller]);

  const loadReservedItems = async () => {
    try {
      setLoading(true);
      setError("");
      
      const result = isSeller 
        ? await getReservedItemsBySeller(userId)
        : await getReservedItemsForBuyer(userId);
      
      if (result.success && result.items) {
        setReservedItems(result.items);
      } else {
        setError(result.error || "거래중 상품을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("거래중 상품 로드 실패:", error);
      setError("거래중 상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (item: SellItem) => {
    // 채팅 모달 열기 또는 채팅 페이지로 이동
    if (user?.uid) {
      // 채팅 모달 열기 로직 (기존 채팅 시스템 사용)
      const chatModal = document.getElementById('chat-modal');
      if (chatModal) {
        chatModal.click();
      } else {
        // 채팅 페이지로 이동
        window.location.href = `/chat?itemId=${item.id}&sellerId=${item.sellerId}`;
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">거래중 상품을 불러오는 중...</span>
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
          <Button onClick={loadReservedItems} variant="outline">
            다시 시도
          </Button>
        </div>
      </Card>
    );
  }

  if (reservedItems.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isSeller ? "거래중인 상품이 없습니다" : "거래중인 찜한 상품이 없습니다"}
          </h3>
          <p className="text-gray-600">
            {isSeller 
              ? "아직 거래가 진행 중인 상품이 없습니다." 
              : "찜한 상품 중에서 거래가 진행 중인 상품이 없습니다."
            }
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            {isSeller ? "거래중인 상품" : "거래중인 찜한 상품"} ({reservedItems.length}개)
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reservedItems.map(item => (
          <div key={item.id} className="relative group">
            <ItemCard 
              item={item} 
              onClick={() => {}} // 상품 클릭 시 상세 모달 열기 등
            />
            
            {/* 거래중 상태 표시 */}
            <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
              거래중
            </div>
            
            {/* 채팅하기 버튼 */}
            <div className="absolute bottom-2 right-2">
              <Button
                size="sm"
                onClick={() => handleChatClick(item)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                채팅하기
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
