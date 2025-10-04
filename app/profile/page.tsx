"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import {
  getUserProfile,
  uploadAvatar,
  updateUserProfile,
  deleteAvatar,
} from "../../lib/profile/api";
import { getUserItems } from "../../lib/api/products";
import { UserProfile } from "../../data/profile/types";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { ProfileStats } from "../../components/profile/ProfileStats";
import { ProfileAbout } from "../../components/profile/ProfileAbout";
import { WishlistItems } from "../../components/profile/WishlistItems";
import { ItemCard } from "../../components/items/ItemCard";
import { BlockedUsersModal } from "../../components/profile/BlockedUsersModal";
import { ItemDetailModal } from "../../components/items/ItemDetailModal";
import ProductDetailModal from "../../components/product/ProductDetailModal";
import ShippingAddressModal from "../../components/profile/ShippingAddressModal";
import {
  MemberGradeSystem,
  GradeBenefitsSummary,
} from "../../components/ui/MemberGradeSystem";
import { GradeBenefitsModal } from "../../components/profile/GradeBenefitsModal";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  MapPin,
  Smartphone,
  Mail,
  Edit2,
} from "lucide-react";
import toast from "react-hot-toast";
import { INSTRUMENT_CATEGORIES } from "../../data/constants/index";

export default function MyProfilePage() {
  const { user: currentUser, isLoading: authLoading, updateUser, refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showShippingAddress, setShowShippingAddress] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth/login?next=/profile");
      return;
    }

    if (currentUser) {
      loadProfile();
      loadMyItems();
    }
  }, [currentUser, authLoading, router]);

  // 외부 클릭 시 메뉴 닫기

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
      if (photoURL) {
        // 새 사진 업로드
        const updateResult = await updateUserProfile(currentUser.uid, {
          photoURL: photoURL,
        });

        if (updateResult.success && profile) {
          setProfile({ ...profile, photoURL: photoURL });

          // 헤더의 사용자 정보 새로고침 (최신 데이터 가져오기)
          await refreshUser();

          toast.success("아바타가 업데이트되었습니다.");
        } else {
          toast.error(updateResult.error || "아바타 업데이트에 실패했습니다.");
        }
      } else {
        // 프로필 사진 삭제
        const deleteResult = await deleteAvatar(
          currentUser.uid,
          profile?.photoURL
        );

        if (deleteResult.success && profile) {
          setProfile({ ...profile, photoURL: undefined });

          // 헤더의 사용자 정보 새로고침 (최신 데이터 가져오기)
          await refreshUser();

          toast.success("프로필 사진이 삭제되었습니다.");
        } else {
          toast.error(deleteResult.error || "프로필 사진 삭제에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("아바타 처리 실패:", error);
      toast.error("아바타 처리 중 오류가 발생했습니다.");
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

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedItem(null);
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
            <MemberGradeSystem currentGrade={currentUser?.grade} />
          </Card>

          {/* 자기소개 */}
          <ProfileAbout
            user={profile}
            isOwnProfile={true}
            onUpdate={handleProfileUpdate}
          />

          {/* 배송지 관리 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  배송지 관리
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShippingAddress(true)}
                className="flex items-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                배송지 관리
              </Button>
            </div>
            <p className="text-gray-600 text-sm">
              거래 시 사용할 배송지 정보를 관리하세요.
            </p>
          </Card>

          {/* 계정 설정 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              계정 설정
            </h3>
            <div className="space-y-3">
              {/* 이메일 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">이메일</p>
                    <p className="text-sm text-gray-600">{profile.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">변경 불가</span>
              </div>

              {/* 비밀번호 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      비밀번호
                    </p>
                    <p className="text-sm text-gray-600">••••••••</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              {/* 지역 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      거래 지역
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile.region || "설정되지 않음"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 핸드폰 인증 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      핸드폰 인증
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile.phoneVerified
                        ? `인증완료 ${profile.phoneNumber || ""}`
                        : "인증되지 않음"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={profile.phoneVerified ? "outline" : "primary"}
                  onClick={() => toast.info("핸드폰 인증 기능은 준비중입니다.")}
                >
                  {profile.phoneVerified ? "변경" : "인증하기"}
                </Button>
              </div>
            </div>
          </Card>

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

      {/* 상품 상세 모달 */}
      {selectedItem && (
        <ProductDetailModal
          item={selectedItem}
          isOpen={showProductModal}
          onClose={handleCloseProductModal}
        />
      )}

      {/* 등급 혜택 모달 */}
      <GradeBenefitsModal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        currentGrade={currentUser?.grade}
      />

      {/* 배송지 관리 모달 */}
      {currentUser && (
        <ShippingAddressModal
          isOpen={showShippingAddress}
          onClose={() => setShowShippingAddress(false)}
          userId={currentUser.uid}
        />
      )}
    </div>
  );
}
