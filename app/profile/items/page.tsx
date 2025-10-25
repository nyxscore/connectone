"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useSession } from "next-auth/react";
import { ItemDetailModal } from "../../../components/items/ItemDetailModal";
import { ItemCard } from "../../../components/items/ItemCard";
import EditProductModal from "../../../components/product/EditProductModal";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { getMyItems } from "../../../lib/api/profile";
import {
  Loader2,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUp,
  Plus,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

function MyItemsPageContent() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // NextAuth 세션이 있으면 Firebase Auth 대신 사용
  const isAuthenticated = currentUser || session?.user;
  const isLoading = authLoading || sessionStatus === "loading";
  const searchParams = useSearchParams();
  const [myItems, setMyItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null);
  const [paymentCompletedItems, setPaymentCompletedItems] = useState<any[]>([]);

  // URL에서 userId 파라미터 가져오기
  const targetUserId = searchParams.get("userId");
  const isViewingOtherUser = targetUserId && targetUserId !== currentUser?.uid;

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<
    "selling" | "trading" | "buying" | "sold" | "payment_completed" | "shipping"
  >("selling");

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

  const loadMyItems = useCallback(async () => {
    const userId = targetUserId || currentUser?.uid;
    if (!userId) return;

    try {
      setLoading(true);

      if (activeTab === "payment_completed") {
        // 결제 완료된 상품 로드
        setMyItems(paymentCompletedItems);
        console.log("결제 완료 상품 표시:", paymentCompletedItems.length, "개");
      } else {
        // 새로운 API 사용
        const result = await getMyItems({
          userId,
          type: activeTab as
            | "selling"
            | "trading"
            | "buying"
            | "sold"
            | "shipping",
        });

        if (result.success && result.items) {
          setMyItems(result.items);
          console.log(
            `${activeTab} 상품 로드 완료:`,
            result.items.length,
            "개"
          );
        } else {
          console.error(`${activeTab} 상품 로드 실패:`, result.error);
          setMyItems([]);
        }
      }
    } catch (error) {
      console.error("상품 로딩 중 오류:", error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, currentUser?.uid, activeTab]);

  // 결제 완료된 상품 로드
  const loadPaymentCompletedItems = useCallback(async () => {
    const userId = targetUserId || currentUser?.uid;
    if (!userId) return;

    try {
      const result = await getMyItems({
        userId,
        type: "payment_completed",
      });

      if (result.success && result.items) {
        setPaymentCompletedItems(result.items);
        console.log("결제 완료 상품 로드 완료:", result.items.length, "개");
      } else {
        setPaymentCompletedItems([]);
      }
    } catch (error) {
      console.error("결제 완료 상품 로드 실패:", error);
      setPaymentCompletedItems([]);
    }
  }, [targetUserId, currentUser?.uid]);

  // 데이터 로드 useEffect (함수 정의 후에 위치)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !targetUserId) {
      router.push("/auth/login?next=/profile/items");
      return;
    }

    if (isAuthenticated || targetUserId) {
      loadMyItems();
      loadPaymentCompletedItems();
    }
  }, [
    isAuthenticated,
    isLoading,
    targetUserId,
    activeTab,
    loadMyItems,
    loadPaymentCompletedItems,
  ]);

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

  if (isLoading || loading) {
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
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* 모바일: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                onClick={() => router.push("/profile")}
                size="sm"
                variant="outline"
                className="text-xs sm:text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
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

                {/* 결제 완료된 상품 알림 */}
                {!isViewingOtherUser && paymentCompletedItems.length > 0 && (
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>결제 완료 {paymentCompletedItems.length}개</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 (다른 사용자 상품 보기일 때는 숨김) */}
      {!isViewingOtherUser && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-3 sm:px-4">
            <div className="flex space-x-2 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("selling")}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "selling"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                판매중
              </button>
              <button
                onClick={() => setActiveTab("trading")}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "trading"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                거래중
              </button>
              <button
                onClick={() => setActiveTab("buying")}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "buying"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                구매중
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "shipping"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                배송중
              </button>
              <button
                onClick={() => setActiveTab("sold")}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "sold"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                거래완료
              </button>
              {/* 결제 완료된 상품 탭 */}
              {paymentCompletedItems.length > 0 && (
                <button
                  onClick={() => setActiveTab("payment_completed")}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                    activeTab === "payment_completed"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="hidden sm:inline">결제 완료된 상품</span>
                  <span className="sm:hidden">결제완료</span>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-xs">
                    {paymentCompletedItems.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상품 목록 */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-4 sm:pb-8">
        {filteredItems.length === 0 ? (
          <Card className="p-6 sm:p-12 text-center">
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 mb-3 sm:mb-6 text-sm sm:text-lg font-medium">
                  {isViewingOtherUser
                    ? "등록한 상품이 없습니다."
                    : activeTab === "selling"
                      ? "등록한 상품이 없습니다."
                      : activeTab === "trading"
                        ? "거래중인 상품이 없습니다."
                        : activeTab === "buying"
                          ? "구매중인 상품이 없습니다."
                          : activeTab === "shipping"
                            ? "배송중인 상품이 없습니다."
                            : activeTab === "payment_completed"
                              ? "결제 완료된 상품이 없습니다."
                              : "거래완료된 상품이 없습니다."}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {isViewingOtherUser
                    ? ""
                    : activeTab === "selling"
                      ? "새로운 상품을 등록해보세요."
                      : activeTab === "trading"
                        ? "현재 진행중인 거래가 없습니다."
                        : activeTab === "buying"
                          ? "구매중인 상품이 없습니다."
                          : activeTab === "shipping"
                            ? "배송중인 상품이 없습니다."
                            : activeTab === "payment_completed"
                              ? "결제가 완료된 상품이 없습니다."
                              : "완료된 거래가 없습니다."}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="relative group">
                <ItemCard
                  item={item}
                  onClick={handleItemClick}
                  currentUserId={currentUser?.uid}
                  buyerUid={item.buyerUid}
                />

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
                        {/* 끌어올리기 버튼 - 판매중(active) 상태일 때만 표시 */}
                        {item.status === "active" && (
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
                        )}
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
