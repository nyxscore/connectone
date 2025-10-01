"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function MyItemsPageContent() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [myItems, setMyItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null);

  // URL에서 userId 파라미터 가져오기
  const targetUserId = searchParams.get("userId");
  const isViewingOtherUser = targetUserId && targetUserId !== currentUser?.uid;

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<"selling" | "trading" | "buying">(
    "selling"
  );

  useEffect(() => {
    if (!authLoading && !currentUser && !targetUserId) {
      router.push("/auth/login?next=/profile/items");
      return;
    }

    if (currentUser || targetUserId) {
      loadMyItems();
    }
  }, [currentUser, authLoading, router, targetUserId, activeTab]);

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
    const userId = targetUserId || currentUser?.uid;
    if (!userId) return;

    try {
      setLoading(true);

      if (activeTab === "buying") {
        // 구매중인 상품 로드 (buyerId가 현재 사용자인 상품들)
        const { collection, query, where, getDocs, orderBy } = await import(
          "firebase/firestore"
        );
        const { db } = await import("../../../lib/api/firebase");

        const itemsRef = collection(db, "items");
        const q = query(
          itemsRef,
          where("buyerId", "==", userId),
          where("status", "in", ["reserved", "escrow_completed"])
        );

        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 클라이언트 사이드에서 정렬 (createdAt 기준 내림차순)
        const sortedItems = items.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setMyItems(sortedItems);
      } else if (activeTab === "trading") {
        // 거래중인 상품 로드 (sellerId가 현재 사용자이고 status가 reserved인 상품들)
        const { collection, query, where, getDocs, orderBy } = await import(
          "firebase/firestore"
        );
        const { db } = await import("../../../lib/api/firebase");

        const itemsRef = collection(db, "items");
        const q = query(
          itemsRef,
          where("sellerId", "==", userId),
          where("status", "==", "reserved")
        );

        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 클라이언트 사이드에서 정렬 (createdAt 기준 내림차순)
        const sortedItems = items.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setMyItems(sortedItems);
      } else {
        // 판매중인 상품 로드 (기존 로직)
        const result = await getUserItems(userId, 50);
        if (result.success && result.items) {
          setMyItems(result.items);
        } else {
          console.error("상품 로딩 실패:", result.error);
        }
      }
    } catch (error) {
      console.error("상품 로딩 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 상태별 필터링
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      const filtered = myItems.filter(item => item.status === status);
      setFilteredItems(filtered);
    } else {
      setFilteredItems(myItems);
    }
  }, [myItems, searchParams]);

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
                {(() => {
                  const status = searchParams.get("status");
                  const baseTitle = isViewingOtherUser
                    ? "판매 상품"
                    : "내 상품";

                  switch (status) {
                    case "sold":
                      return isViewingOtherUser
                        ? "판매 완료된 상품"
                        : "판매 완료된 상품";
                    case "reserved":
                      return isViewingOtherUser
                        ? "거래중인 상품"
                        : "거래중인 상품";
                    case "active":
                      return isViewingOtherUser
                        ? "판매중인 상품"
                        : "판매중인 상품";
                    case "inactive":
                      return isViewingOtherUser
                        ? "판매중단된 상품"
                        : "판매중단된 상품";
                    default:
                      return baseTitle;
                  }
                })()}
              </h1>
            </div>
            {!isViewingOtherUser &&
              (activeTab === "selling" || activeTab === "trading") && (
                <Button onClick={() => router.push("/sell")} variant="primary">
                  <Plus className="w-4 h-4 mr-2" />새 상품 등록
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* 탭 메뉴 (다른 사용자 상품 보기일 때는 숨김) */}
      {!isViewingOtherUser && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("selling")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "selling"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                판매중인 상품
              </button>
              <button
                onClick={() => setActiveTab("trading")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "trading"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                거래중인 상품
              </button>
              <button
                onClick={() => setActiveTab("buying")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "buying"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                구매중인 상품
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 목록 */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-8">
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-6 text-lg">
              {isViewingOtherUser
                ? "등록한 상품이 없습니다."
                : activeTab === "selling"
                  ? "등록한 상품이 없습니다."
                  : activeTab === "trading"
                    ? "거래중인 상품이 없습니다."
                    : "구매중인 상품이 없습니다."}
            </p>
            {!isViewingOtherUser &&
              (activeTab === "selling" || activeTab === "trading") && (
                <Button
                  onClick={() => router.push("/sell")}
                  variant="primary"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />첫 상품 등록하기
                </Button>
              )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="relative group">
                <ItemCard item={item} onClick={handleItemClick} />

                {/* 점 메뉴 버튼 - ItemCard 위에 오버레이 (자신의 상품일 때만) */}
                {!isViewingOtherUser && (
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
                )}
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

export default function MyItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <MyItemsPageContent />
    </Suspense>
  );
}
