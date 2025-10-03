"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getUserItems } from "../../../lib/api/products";
import ProductDetailModal from "../../../components/product/ProductDetailModal";
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
  }, [currentUser, authLoading, targetUserId, activeTab]);

  // 상품 상태 변경 이벤트 리스너
  useEffect(() => {
    const handleItemStatusChanged = (event: CustomEvent) => {
      console.log("상품 상태 변경 감지:", event.detail);
      // 상품 상태가 변경되면 목록 새로고침
      loadMyItems();
    };

    window.addEventListener(
      "itemStatusChanged",
      handleItemStatusChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        "itemStatusChanged",
        handleItemStatusChanged as EventListener
      );
    };
  }, [activeTab]);

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

    console.log("loadMyItems 시작:", {
      userId,
      activeTab,
      targetUserId,
      currentUserId: currentUser?.uid,
    });

    try {
      setLoading(true);

      if (activeTab === "buying") {
        console.log("구매중인 상품 로드 시작");
        // 구매중인 상품 로드 (buyerUid가 현재 사용자인 상품들)
        const { collection, query, where, getDocs } = await import(
          "firebase/firestore"
        );
        const { db } = await import("../../../lib/api/firebase");

        const itemsRef = collection(db, "items");
        const q = query(
          itemsRef,
          where("buyerUid", "==", userId),
          where("status", "in", ["reserved", "escrow_completed", "shipping"])
        );

        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("구매중인 상품 쿼리 결과:", {
          userId,
          querySnapshotSize: querySnapshot.docs.length,
          items: items.map(item => ({
            id: item.id,
            status: item.status,
            buyerUid: item.buyerUid,
            sellerUid: item.sellerUid,
            title: item.title,
          })),
        });

        // 클라이언트 사이드에서 정렬 (createdAt 기준 내림차순)
        const sortedItems = items.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setMyItems(sortedItems);
      } else if (activeTab === "trading") {
        // 거래중인 상품 로드 (판매자 또는 구매자가 현재 사용자인 reserved 상태 상품들)
        const { collection, query, where, getDocs } = await import(
          "firebase/firestore"
        );
        const { db } = await import("../../../lib/api/firebase");

        const itemsRef = collection(db, "items");

        // 판매자용 쿼리: sellerUid가 현재 사용자이고 status가 reserved 또는 escrow_completed
        const sellerQuery = query(
          itemsRef,
          where("sellerUid", "==", userId),
          where("status", "in", ["reserved", "escrow_completed"])
        );

        // 구매자용 쿼리: buyerUid가 현재 사용자이고 status가 reserved 또는 escrow_completed
        const buyerQuery = query(
          itemsRef,
          where("buyerUid", "==", userId),
          where("status", "in", ["reserved", "escrow_completed"])
        );

        // 두 쿼리 모두 실행
        const [sellerSnapshot, buyerSnapshot] = await Promise.all([
          getDocs(sellerQuery),
          getDocs(buyerQuery),
        ]);

        // 결과 합치기 (중복 제거)
        const sellerItems = sellerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const buyerItems = buyerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 중복 제거 (같은 상품이 판매자와 구매자 쿼리 결과에 모두 있을 수 있음)
        const allItems = [...sellerItems, ...buyerItems];
        const uniqueItems = allItems.filter(
          (item, index, self) => index === self.findIndex(t => t.id === item.id)
        );

        const items = uniqueItems;

        console.log("거래중인 상품 쿼리 결과:", {
          userId,
          sellerItemsCount: sellerItems.length,
          buyerItemsCount: buyerItems.length,
          totalItemsCount: items.length,
          items: items.map(item => ({
            id: item.id,
            status: item.status,
            sellerUid: item.sellerUid,
            buyerUid: item.buyerUid,
            title: item.title,
          })),
        });

        // 각 아이템의 상세 데이터도 로그로 확인
        items.forEach(item => {
          console.log(`아이템 ${item.id} 상세 데이터:`, {
            sellerUid: item.sellerUid,
            buyerUid: item.buyerUid,
            status: item.status,
            title: item.title,
            hasBuyerUid: !!item.buyerUid,
            hasSellerUid: !!item.sellerUid,
          });

          // 전체 아이템 데이터도 확인
          console.log(`아이템 ${item.id} 전체 데이터:`, item);
        });

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
  }, [targetUserId, currentUser?.uid, activeTab]);

  // 상태별 필터링
  useEffect(() => {
    let filtered = myItems;

    // URL 파라미터 필터 (기존)
    const status = searchParams.get("status");
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    setFilteredItems(filtered);
  }, [myItems, searchParams]);

  // 거래 상태 변경 이벤트 리스너 - loadMyItems 정의 후에 등록
  useEffect(() => {
    const handleItemStatusChanged = () => {
      console.log("거래 상태 변경 이벤트 감지 - 데이터 새로고침");
      loadMyItems();
    };

    window.addEventListener("itemStatusChanged", handleItemStatusChanged);
    return () => {
      window.removeEventListener("itemStatusChanged", handleItemStatusChanged);
    };
  }, [loadMyItems]);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleTradingItemClick = async (item: any) => {
    // 거래중인 상품 클릭 시 채팅창으로 이동 (채팅방이 없으면 자동 생성)
    const buyerUid = item.buyerId || item.buyerUid;
    const sellerUid = item.sellerUid;

    console.log("거래중 상품 클릭:", {
      itemId: item.id,
      buyerUid,
      sellerUid,
      currentUserId: currentUser?.uid,
      isSeller: item.sellerUid === currentUser?.uid,
    });

    if (!buyerUid || !sellerUid) {
      console.error("채팅 ID 생성 실패: buyerUid 또는 sellerUid가 없습니다");
      alert("채팅 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      // 채팅방 생성 또는 가져오기 API 호출
      const { getOrCreateChat } = await import("../../../lib/chat/api");
      const result = await getOrCreateChat(
        item.id,
        buyerUid,
        sellerUid,
        "💰 안전결제가 완료되어 거래가 시작되었습니다!"
      );

      if (result.success) {
        window.open(`/chat?chatId=${result.chatId}`, "_blank");
      } else {
        console.error("채팅방 생성 실패:", result.error);
        alert("채팅방을 생성할 수 없습니다.");
      }
    } catch (error) {
      console.error("채팅방 생성 중 오류:", error);
      alert("채팅방 생성 중 오류가 발생했습니다.");
    }
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
      // 끌어올리기는 단순히 상품 목록을 새로고침하는 것으로 처리
      toast.success("상품이 끌어올려졌습니다!");
      loadMyItems();
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
          // 판매중/구매중 탭일 때는 기존 UI 사용
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="relative group">
                <ItemCard
                  item={item}
                  onClick={
                    activeTab === "trading"
                      ? () => handleTradingItemClick(item)
                      : handleItemClick
                  }
                  isTradingTab={activeTab === "trading"}
                />

                {/* 점 메뉴 버튼 - ItemCard 위에 오버레이 (자신의 상품일 때만, 거래중 탭 제외) */}
                {!isViewingOtherUser && activeTab !== "trading" && (
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

      {/* 상품 상세 모달 (결제 기능 포함) */}
      <ProductDetailModal
        item={selectedItem}
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setSelectedItem(null);
        }}
      />

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
