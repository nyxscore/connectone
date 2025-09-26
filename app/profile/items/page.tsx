"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getUserItems } from "../../../lib/api/products";
import { ItemDetailModal } from "../../../components/items/ItemDetailModal";
import { ItemCard } from "../../../components/items/ItemCard";
import EditProductModal from "../../../components/product/EditProductModal";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import {
  Loader2,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUp,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

export default function MyItemsPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [myItems, setMyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth/login?next=/profile/items");
      return;
    }

    if (currentUser) {
      loadMyItems();
    }
  }, [currentUser, authLoading, router]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showItemMenu) {
        const target = event.target as Element;
        if (!target.closest(".item-menu")) {
          setShowItemMenu(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showItemMenu]);

  const loadMyItems = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const result = await getUserItems(currentUser.uid, 50); // 더 많은 상품 로드
      if (result.success && result.items) {
        setMyItems(result.items);
      } else {
        console.error("내 상품 로딩 실패:", result.error);
      }
    } catch (error) {
      console.error("내 상품 로딩 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleItemEdit = (item: any) => {
    setShowItemMenu(null);
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleItemDelete = async (item: any) => {
    setShowItemMenu(null);

    if (window.confirm("정말로 이 상품을 삭제하시겠습니까?")) {
      try {
        const { deleteItem } = await import("../../../lib/api/products");
        const result = await deleteItem(item.id, currentUser?.uid || "");

        if (result.success) {
          toast.success("상품이 삭제되었습니다.");
          loadMyItems();
        } else {
          toast.error(result.error || "상품 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("상품 삭제 실패:", error);
        toast.error("상품 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleItemBump = async (item: any) => {
    setShowItemMenu(null);

    try {
      const { updateItem } = await import("../../../lib/api/products");
      const result = await updateItem(item.id, currentUser?.uid || "", {
        updatedAt: new Date(),
      });

      if (result.success) {
        toast.success("상품이 끌어올려졌습니다!");
        loadMyItems();
      } else {
        toast.error(result.error || "끌어올리기에 실패했습니다.");
      }
    } catch (error) {
      console.error("끌어올리기 실패:", error);
      toast.error("끌어올리기 중 오류가 발생했습니다.");
    }
  };

  const handleEditComplete = () => {
    setShowEditModal(false);
    setEditingItem(null);
    loadMyItems();
  };

  const formatDate = (date: any) => {
    if (!date) return "";

    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      if (isNaN(dateObj.getTime())) return "";

      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return "방금 전";
      else if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
      else if (diffInHours < 24) return `${diffInHours}시간 전`;
      else if (diffInDays < 7) return `${diffInDays}일 전`;
      else return dateObj.toLocaleDateString("ko-KR");
    } catch (error) {
      return "";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/profile")}
                size="sm"
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                프로필로 돌아가기
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                내가 등록한 상품
              </h1>
            </div>
            <Button onClick={() => router.push("/sell")} variant="primary">
              <Plus className="w-4 h-4 mr-2" />새 상품 등록
            </Button>
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {myItems.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-6 text-lg">
              등록한 상품이 없습니다.
            </p>
            <Button
              onClick={() => router.push("/sell")}
              variant="primary"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />첫 상품 등록하기
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {myItems.map(item => (
              <div key={item.id} className="relative group">
                <ItemCard item={item} onClick={handleItemClick} />

                {/* 점 메뉴 버튼 - ItemCard 위에 오버레이 */}
                <div className="absolute top-2 right-2 item-menu z-10">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowItemMenu(
                        showItemMenu === item.id ? null : item.id
                      );
                    }}
                    className="bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {showItemMenu === item.id && (
                    <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleItemEdit(item);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>수정</span>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleItemBump(item);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                      >
                        <ArrowUp className="w-4 h-4" />
                        <span>끌어올리기</span>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleItemDelete(item);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>삭제</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상품 상세 모달 */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={showItemModal}
          onClose={() => {
            setShowItemModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {/* 상품 수정 모달 */}
      {editingItem && (
        <EditProductModal
          productId={editingItem.id}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSuccess={handleEditComplete}
        />
      )}
    </div>
  );
}
