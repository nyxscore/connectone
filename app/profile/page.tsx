"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import {
  getUserProfile,
  getRecentTrades,
  uploadAvatar,
  updateUserProfile,
} from "../../lib/profile/api";
import { getUserItems } from "../../lib/api/products";
import { UserProfile, TradeItem } from "../../data/profile/types";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { ProfileStats } from "../../components/profile/ProfileStats";
import { ProfileAbout } from "../../components/profile/ProfileAbout";
import { TradeList } from "../../components/profile/TradeList";
import { WishlistItems } from "../../components/profile/WishlistItems";
import { ReservedItems } from "../../components/profile/ReservedItems";
import { TransactionDashboard } from "../../components/profile/TransactionDashboard";
import { BlockedUsersModal } from "../../components/profile/BlockedUsersModal";
import { ItemDetailModal } from "../../components/items/ItemDetailModal";
import EditProductModal from "../../components/product/EditProductModal";
import { GradeBenefitsSummary } from "../../components/ui/MemberGradeSystem";
import { GradeBenefitsModal } from "../../components/profile/GradeBenefitsModal";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Loader2,
  AlertCircle,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUp,
  MapPin,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { INSTRUMENT_CATEGORIES } from "../../data/constants/index";

export default function MyProfilePage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth/login?next=/profile");
      return;
    }

    if (currentUser) {
      loadProfile();
      loadTrades();
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

  const loadProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const result = await getUserProfile(currentUser.uid);

      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError(result.error || "프로필을 불러올 수 없습니다.");
      }
    } catch (err) {
      console.error("프로필 로드 실패:", err);
      setError("프로필을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadTrades = async () => {
    if (!currentUser) return;

    try {
      setTradesLoading(true);
      const result = await getRecentTrades(currentUser.uid, 5);

      if (result.success && result.data) {
        setTrades(result.data);
      }
    } catch (err) {
      console.error("거래 내역 로드 실패:", err);
    } finally {
      setTradesLoading(false);
    }
  };

  const loadMyItems = async () => {
    if (!currentUser) return;

    try {
      setItemsLoading(true);
      console.log("내 상품 로딩 시작:", currentUser.uid);
      const result = await getUserItems(currentUser.uid, 20);
      console.log("내 상품 로딩 결과:", result);
      if (result.success && result.items) {
        console.log("로딩된 상품 개수:", result.items.length);
        setMyItems(result.items);
      } else {
        console.error("내 상품 로딩 실패:", result.error);
      }
    } catch (error) {
      console.error("내 상품 로딩 중 오류:", error);

      // Firestore 인덱스 오류인 경우 인덱스 생성 링크 열기
      if (error instanceof Error && error.message.includes("index")) {
        const indexUrl =
          "https://console.firebase.google.com/v1/r/project/connectone-8b414/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9jb25uZWN0b25lLThiNDE0L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9pdGVtcy9pbmRleGVzL18QARoNCglzZWxsZXJVaWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC";
        console.log(
          "Firestore 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성하세요:"
        );
        console.log(indexUrl);

        // 사용자에게 알림
        toast.error("Firestore 인덱스가 필요합니다. 개발자 콘솔을 확인하세요.");

        // 인덱스 생성 페이지 열기
        window.open(indexUrl, "_blank");
      }
    } finally {
      setItemsLoading(false);
    }
  };

  const handleAvatarUpload = async (photoURL: string) => {
    if (!currentUser) return;

    try {
      // 프로필 업데이트
      const updateResult = await updateUserProfile(currentUser.uid, {
        photoURL: photoURL || undefined, // 빈 문자열이면 undefined로 설정
      });

      if (updateResult.success && profile) {
        setProfile({ ...profile, photoURL: photoURL || undefined });
        if (photoURL) {
          toast.success("아바타가 업데이트되었습니다.");
        } else {
          toast.success("프로필 사진이 삭제되었습니다.");
        }
      } else {
        toast.error(updateResult.error || "아바타 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("아바타 업데이트 실패:", error);
      toast.error("아바타 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const handleEdit = () => {
    router.push("/profile/edit");
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
        // 상품 삭제 API 호출
        const { deleteItem } = await import("../../lib/api/products");
        const result = await deleteItem(item.id, currentUser?.uid || "");

        if (result.success) {
          toast.success("상품이 삭제되었습니다.");
          // 상품 목록 새로고침
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

  const handleEditComplete = () => {
    setShowEditModal(false);
    setEditingItem(null);
    // 상품 목록 새로고침
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

  const getCategoryIcon = (category: string) => {
    const categoryInfo = INSTRUMENT_CATEGORIES.find(c => c.key === category);
    return categoryInfo?.icon || "🎵";
  };

  const getCategoryLabel = (category: string) => {
    const categoryInfo = INSTRUMENT_CATEGORIES.find(c => c.key === category);
    return categoryInfo?.label || category;
  };

  const handleItemBump = async (item: any) => {
    setShowItemMenu(null);

    try {
      // 상품 끌어올리기 API 호출
      const { updateItem } = await import("../../lib/api/products");
      const result = await updateItem(item.id, currentUser?.uid || "", {
        updatedAt: new Date(),
      });

      if (result.success) {
        toast.success("상품이 끌어올려졌습니다!");
        // 상품 목록 새로고침
        loadMyItems();
      } else {
        toast.error(result.error || "끌어올리기에 실패했습니다.");
      }
    } catch (error) {
      console.error("끌어올리기 실패:", error);
      toast.error("끌어올리기 중 오류가 발생했습니다.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            프로필을 불러올 수 없습니다
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader user={profile} isOwnProfile={true} onEdit={handleEdit} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 프로필 통계 (아바타 포함) */}
          <ProfileStats
            user={profile}
            isOwnProfile={true}
            onAvatarUpdate={handleAvatarUpload}
          />

          {/* 거래 현황 대시보드 */}
          <TransactionDashboard />

          {/* 회원 등급 정보 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                나의 회원 등급
              </h3>
              <Button
                onClick={() => setShowGradeModal(true)}
                size="sm"
                variant="outline"
              >
                등급 혜택 보기
              </Button>
            </div>
            <GradeBenefitsSummary currentGrade={currentUser?.grade} />
          </Card>

          {/* 자기소개 */}
          <ProfileAbout
            user={profile}
            isOwnProfile={true}
            onUpdate={handleProfileUpdate}
          />

          {/* 최근 거래 */}
          <TradeList trades={trades} loading={tradesLoading} />

          {/* 내가 등록한 상품 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                내가 등록한 상품
              </h3>
              <Button
                onClick={() => router.push("/profile/items")}
                size="sm"
                variant="outline"
              >
                전체 보기
              </Button>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">
                  상품을 불러오는 중...
                </span>
              </div>
            ) : myItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">등록한 상품이 없습니다.</p>
                <div className="space-x-3">
                  <Button
                    onClick={() => router.push("/product/new")}
                    variant="primary"
                  >
                    첫 상품 등록하기
                  </Button>
                  <Button
                    onClick={() => router.push("/profile/items")}
                    variant="outline"
                  >
                    전체 보기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myItems.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative group">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => handleItemClick(item)}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-gray-400 cursor-pointer"
                          onClick={() => handleItemClick(item)}
                        >
                          이미지 없음
                        </div>
                      )}

                      {/* 점 메뉴 버튼 */}
                      <div className="absolute top-2 right-2 item-menu">
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
                          <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
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
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                      {item.title || `${item.brand} ${item.model}`}
                    </h4>
                    <p className="text-base font-bold text-blue-600 mb-2">
                      {item.price?.toLocaleString("ko-KR")}원
                    </p>
                    <div className="flex items-center text-xs text-gray-600 space-x-2 mb-2">
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{item.region}</span>
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span className="truncate">
                          {formatDate(item.createdAt)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 truncate">
                        {getCategoryIcon(item.category)}{" "}
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "active"
                            ? "bg-green-100 text-green-800"
                            : item.status === "reserved"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "paid_hold"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.status === "active" && "판매중"}
                        {item.status === "reserved" && "예약중"}
                        {item.status === "paid_hold" && "결제완료"}
                        {item.status === "sold" && "거래완료"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 찜한 상품 */}
          {currentUser?.uid && (
            <WishlistItems 
              userId={currentUser.uid} 
              onItemClick={(item) => {
                // 상품 상세 페이지로 이동
                router.push(`/product/${item.id}`);
              }}
            />
          )}

          {/* 거래중인 상품 (판매자용) */}
          {currentUser?.uid && (
            <ReservedItems userId={currentUser.uid} isSeller={true} />
          )}

          {/* 거래중인 찜한 상품 (구매자용) */}
          {currentUser?.uid && (
            <ReservedItems userId={currentUser.uid} isSeller={false} />
          )}

          {/* 차단된 사용자 관리 */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    차단된 사용자 관리
                  </h3>
                  <p className="text-sm text-gray-600">
                    차단한 사용자를 확인하고 해제할 수 있습니다
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowBlockedUsers(true)}
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                차단 관리
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 차단된 사용자 모달 */}
      <BlockedUsersModal
        isOpen={showBlockedUsers}
        onClose={() => setShowBlockedUsers(false)}
        onUnblock={blockedUid => {
          console.log("사용자 차단 해제됨:", blockedUid);
          // 필요시 추가 처리
        }}
      />

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

      {/* 등급 혜택 모달 */}
      <GradeBenefitsModal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        currentGrade={currentUser?.grade}
      />
    </div>
  );
}
