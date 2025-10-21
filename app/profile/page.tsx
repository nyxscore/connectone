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
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { INSTRUMENT_CATEGORIES } from "../../data/constants/index";
import { EmailInputModal } from "../../components/auth/EmailInputModal";
import { PhoneInputModal } from "../../components/auth/PhoneInputModal";
import { Star } from "lucide-react";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

// 후기 카드 컴포넌트
const ReviewCard = ({
  review,
  isReceived = false,
  currentUser,
}: {
  review: any;
  isReceived?: boolean;
  currentUser: any;
}) => {
  const [reviewerProfile, setReviewerProfile] = useState<any>(null);
  const [itemData, setItemData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviewData = async () => {
      try {
        const { getUserProfile } = await import("../../lib/profile/api");
        const targetUid = isReceived
          ? review.reviewerUid
          : review.reviewedUserUid;

        console.log("=== ReviewCard 데이터 확인 ===");
        console.log("isReceived (내가 받은 후기?):", isReceived);
        console.log("review.reviewerUid (후기 작성자):", review.reviewerUid);
        console.log(
          "review.reviewedUserUid (후기 받은 사람):",
          review.reviewedUserUid
        );
        console.log("targetUid (표시할 프로필):", targetUid);
        console.log("review.itemId:", review.itemId);
        console.log("review 전체 데이터:", review);

        // 현재 사용자 UID 확인을 위한 추가 로그
        console.log("현재 사용자 UID:", currentUser?.uid);
        console.log(
          "후기 작성자와 현재 사용자 비교:",
          review.reviewerUid === currentUser?.uid
        );
        console.log(
          "후기 받은 사람과 현재 사용자 비교:",
          review.reviewedUserUid === currentUser?.uid
        );

        const result = await getUserProfile(targetUid);
        if (result.success && result.data) {
          setReviewerProfile(result.data);
        }

        // 상품 정보 불러오기
        if (review.itemId) {
          console.log("🔍 상품 정보 로딩 시작");
          console.log("itemId:", review.itemId);
          console.log("itemId 타입:", typeof review.itemId);

          try {
            const { getDb } = await import("@/lib/api/firebase-lazy");
            const { doc, getDoc } = await import("firebase/firestore");
            const db = getDb();
            const itemRef = doc(db, "items", review.itemId);

            console.log("Firestore 문서 참조:", itemRef.path);

            const itemSnap = await getDoc(itemRef);

            console.log("문서 존재 여부:", itemSnap.exists());
            console.log("문서 데이터:", itemSnap.data());

            if (itemSnap.exists()) {
              const itemData = { id: itemSnap.id, ...itemSnap.data() };
              setItemData(itemData);
              console.log("✅ 상품 정보 로드 성공!");
              console.log("상품명 (title):", itemData.title);
              console.log("상품명 (name):", itemData.name);
              console.log("가격:", itemData.price);
              console.log("이미지:", itemData.images?.[0]);
              console.log("전체 상품 데이터:", itemData);
            } else {
              console.log("❌ 상품을 찾을 수 없음!");
              console.log("찾으려는 itemId:", review.itemId);

              // 임시로 더미 데이터 표시
              setItemData({
                id: review.itemId,
                name: `[삭제된 상품] (ID: ${review.itemId})`,
                price: 0,
                images: [],
              });
            }
          } catch (error) {
            console.error("❌ 상품 정보 로딩 오류:", error);
            setItemData({
              id: review.itemId,
              name: `[오류] 상품 정보 불러오기 실패`,
              price: 0,
              images: [],
            });
          }
        } else {
          console.log("⚠️ itemId가 없습니다!");
          console.log("review 객체:", review);
        }
      } catch (error) {
        console.error("후기 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviewData();
  }, [review, isReceived]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* 상품 정보 */}
      {itemData && (
        <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-100">
          {itemData.images?.[0] && (
            <img
              src={itemData.images[0]}
              alt={itemData.title || itemData.name || "상품"}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate mb-1">
              {itemData.title || itemData.name || "상품명 없음"}
            </p>
            <p className="text-xs text-gray-500">
              {itemData.price?.toLocaleString() || "0"}원
            </p>
          </div>
        </div>
      )}

      {!itemData && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <p className="text-sm text-gray-500">상품 정보를 불러오는 중...</p>
        </div>
      )}

      {/* 후기 내용 */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {reviewerProfile?.photoURL ? (
            <img
              src={reviewerProfile.photoURL}
              alt={reviewerProfile.nickname || "사용자"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {reviewerProfile?.nickname?.charAt(0) || "?"}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col mb-2">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {reviewerProfile?.nickname || "알 수 없음"}
              </h4>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {isReceived ? "후기 작성자" : "후기 받은 사람"}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">
                ({review.rating}/5)
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {review.comment || "후기 내용이 없습니다."}
          </p>
          <p className="text-xs text-gray-500">
            {review.createdAt?.toDate?.()?.toLocaleDateString() ||
              "날짜 정보 없음"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function MyProfilePage() {
  const {
    user: currentUser,
    isLoading: authLoading,
    updateUser,
    refreshUser,
  } = useAuth();
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

  // 인증 모달 상태
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  // 비밀번호 변경 상태
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // 거래지역 변경 상태
  const [showRegionEdit, setShowRegionEdit] = useState(false);
  const [editingRegion, setEditingRegion] = useState("");

  // 탭 상태
  const [activeTab, setActiveTab] = useState<
    "profile" | "received-reviews" | "written-reviews"
  >("profile");

  // 후기 데이터 상태
  const [receivedReviews, setReceivedReviews] = useState<any[]>([]);
  const [writtenReviews, setWrittenReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth/login?next=/profile");
      return;
    }

    if (currentUser) {
      loadProfile();
      loadMyItems();
      loadReviews();
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

  const loadReviews = async () => {
    if (!currentUser) return;

    try {
      setReviewsLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, query, where, getDocs, orderBy } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      // 받은 후기 불러오기
      const receivedQuery = query(
        collection(db, "userReviews"),
        where("reviewedUserUid", "==", currentUser.uid)
      );
      const receivedSnapshot = await getDocs(receivedQuery);
      const receivedData = receivedSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          // createdAt으로 내림차순 정렬 (최신순)
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      console.log("=== 받은 후기 조회 결과 ===");
      console.log("받은 후기 개수:", receivedData.length);
      console.log("받은 후기 데이터:", receivedData);

      // 내가 작성한 후기 불러오기
      const writtenQuery = query(
        collection(db, "userReviews"),
        where("reviewerUid", "==", currentUser.uid)
      );
      const writtenSnapshot = await getDocs(writtenQuery);
      const writtenData = writtenSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          // createdAt으로 내림차순 정렬 (최신순)
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      console.log("=== 작성한 후기 조회 결과 ===");
      console.log("작성한 후기 개수:", writtenData.length);
      console.log("작성한 후기 데이터:", writtenData);

      setReceivedReviews(receivedData);
      setWrittenReviews(writtenData);

      console.log("받은 후기:", receivedData.length, "개");
      console.log("작성한 후기:", writtenData.length, "개");
    } catch (error) {
      console.error("후기 로딩 실패:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  // 비밀번호 변경 함수
  const handlePasswordChange = async () => {
    if (!currentUser) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    // 유효성 검사
    if (!currentPassword.trim()) {
      toast.error("현재 비밀번호를 입력해주세요.");
      return;
    }

    if (!newPassword.trim()) {
      toast.error("새 비밀번호를 입력해주세요.");
      return;
    }

    if (newPassword.length < 10) {
      toast.error("새 비밀번호는 10자 이상이어야 합니다.");
      return;
    }

    // 비밀번호 강도 검사: 소문자 + 숫자 + 특수문자
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasLowerCase || !hasNumbers || !hasSpecialChar) {
      toast.error("새 비밀번호는 소문자, 숫자, 특수문자를 포함해야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("현재 비밀번호와 새 비밀번호가 같습니다.");
      return;
    }

    setChangingPassword(true);

    try {
      const { getAuth } = await import("../../lib/api/firebase-ultra-safe");
      const auth = await getAuth();
      const firebaseUser = auth.currentUser;

      if (!firebaseUser || !firebaseUser.email) {
        toast.error("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      // 현재 사용자 재인증
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );

      console.log("🔑 사용자 재인증 중...");
      await reauthenticateWithCredential(firebaseUser, credential);
      console.log("✅ 재인증 성공");

      // 비밀번호 업데이트
      console.log("🔐 비밀번호 업데이트 중...");
      await updatePassword(firebaseUser, newPassword);
      console.log("✅ 비밀번호 업데이트 성공");

      toast.success("비밀번호가 성공적으로 변경되었습니다!");

      // 폼 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error("❌ 비밀번호 변경 실패:", error);

      if (error.code === "auth/wrong-password") {
        toast.error("현재 비밀번호가 올바르지 않습니다.");
      } else if (error.code === "auth/weak-password") {
        toast.error("새 비밀번호가 너무 약합니다.");
      } else if (error.code === "auth/requires-recent-login") {
        toast.error("보안을 위해 다시 로그인해주세요.");
      } else {
        toast.error(
          `비밀번호 변경 실패: ${error.message || "알 수 없는 오류"}`
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // 거래지역 변경 함수
  const handleRegionChange = async () => {
    if (!currentUser) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    try {
      const result = await updateUserProfile(currentUser.uid, {
        region: editingRegion.trim() || null,
      });

      if (result.success) {
        toast.success("거래지역이 변경되었습니다.");
        setProfile(prev =>
          prev ? { ...prev, region: editingRegion.trim() || null } : null
        );
        setShowRegionEdit(false);
        setEditingRegion("");
      } else {
        toast.error(result.error || "거래지역 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("거래지역 변경 실패:", error);
      toast.error("거래지역 변경 중 오류가 발생했습니다.");
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

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              프로필
            </button>
            <button
              onClick={() => setActiveTab("received-reviews")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "received-reviews"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              내가 받은 후기
            </button>
            <button
              onClick={() => setActiveTab("written-reviews")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "written-reviews"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              내가 작성한 후기
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 프로필 탭 컨텐츠 */}
        {activeTab === "profile" && (
          <div className="space-y-4 sm:space-y-6">
            {/* 프로필 통계 (아바타 포함) */}
            <ProfileStats
              user={profile}
              isOwnProfile={true}
              onAvatarUpdate={handleAvatarUpload}
            />

            {/* 회원 등급 정보 */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  나의 회원 등급
                </h3>
                <Button
                  onClick={() => setShowGradeModal(true)}
                  size="sm"
                  variant="outline"
                  className="text-xs sm:text-sm"
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
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    배송지 관리
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShippingAddress(true)}
                  className="flex items-center text-xs sm:text-sm"
                >
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">배송지 관리</span>
                  <span className="sm:hidden">관리</span>
                </Button>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm">
                거래 시 사용할 배송지 정보를 관리하세요.
              </p>
            </Card>

            {/* 계정 설정 */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                계정 설정
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {/* 이메일 */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        이메일 인증
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {profile.emailVerified
                          ? `${profile.email} (인증완료)`
                          : `${profile.email} (인증되지 않음)`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={profile.emailVerified ? "outline" : "primary"}
                    onClick={() => setShowEmailInput(true)}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">
                      {profile.emailVerified ? "재인증" : "인증하기"}
                    </span>
                    <span className="sm:hidden">
                      {profile.emailVerified ? "재인증" : "인증"}
                    </span>
                  </Button>
                </div>

                {/* 비밀번호 */}
                <div
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        비밀번호
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        ••••••••
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 sm:p-2"
                    onClick={() => setShowPasswordChange(true)}
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>

                {/* 지역 */}
                <div
                  onClick={() => {
                    setEditingRegion(profile.region || "");
                    setShowRegionEdit(true);
                  }}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        거래 지역
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {profile.region || "설정되지 않음"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 sm:p-2"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingRegion(profile.region || "");
                      setShowRegionEdit(true);
                    }}
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>

                {/* 핸드폰 인증 (SMS만) */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        핸드폰 인증 (SMS)
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {profile.phoneVerified
                          ? `인증완료 ${profile.phoneNumber || ""}`
                          : "SMS 코드로 간편 인증"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={profile.phoneVerified ? "outline" : "primary"}
                    onClick={() => setShowPhoneInput(true)}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">
                      {profile.phoneVerified ? "변경" : "인증하기"}
                    </span>
                    <span className="sm:hidden">
                      {profile.phoneVerified ? "변경" : "인증"}
                    </span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* 강사로 활동하기 */}
            {!profile.isInstructor ? (
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-blue-600 rounded-full p-2">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        강사로 활동하기
                      </h3>
                    </div>
                    <p className="text-gray-700 mb-4">
                      음악 레슨으로 수익을 창출하세요! 누구나 간편하게 강사
                      등록이 가능합니다.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span>즉시 등록 가능</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span>자유로운 가격 설정</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span>안전한 결제 시스템</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span>레슨 일정 관리</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push("/instructor/profile/edit")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      강사 프로필 등록하기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-green-600 rounded-full p-2">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          강사 활동 중
                        </h3>
                        <p className="text-sm text-gray-600">
                          {profile.instructorSince
                            ? `${new Date(profile.instructorSince).toLocaleDateString()} 시작`
                            : "환영합니다!"}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">
                      강사 대시보드에서 레슨 상담 요청을 확인하고, 프로필을
                      관리하세요.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => router.push("/instructor/dashboard")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        강사 대시보드
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        onClick={() => router.push("/instructor/profile/edit")}
                        variant="outline"
                      >
                        프로필 수정
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* 차단된 사용자 관리 */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      차단된 사용자 관리
                    </h3>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBlockedUsers(true)}
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">차단 관리</span>
                  <span className="sm:hidden">관리</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 받은 후기 탭 컨텐츠 */}
        {activeTab === "received-reviews" && (
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                내가 받은 후기 ({receivedReviews.length})
              </h3>
              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : receivedReviews.length > 0 ? (
                <div className="space-y-3">
                  {receivedReviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isReceived={true}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>아직 받은 후기가 없습니다.</p>
                  <p className="text-sm mt-2">
                    거래를 완료하면 후기를 받을 수 있습니다.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 내가 작성한 후기 탭 컨텐츠 */}
        {activeTab === "written-reviews" && (
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                내가 작성한 후기 ({writtenReviews.length})
              </h3>
              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : writtenReviews.length > 0 ? (
                <div className="space-y-3">
                  {writtenReviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isReceived={false}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>아직 작성한 후기가 없습니다.</p>
                  <p className="text-sm mt-2">
                    거래를 완료하면 후기를 작성할 수 있습니다.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}
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

      {/* 이메일 입력 모달 */}
      {currentUser && (
        <EmailInputModal
          isOpen={showEmailInput}
          onClose={() => setShowEmailInput(false)}
          currentEmail={currentUser.email || ""}
          onSuccess={() => {
            toast.success("이메일 인증이 완료되었습니다!");
            refreshUser(); // 사용자 정보 새로고침
          }}
        />
      )}

      {/* 핸드폰 입력 모달 */}
      <PhoneInputModal
        isOpen={showPhoneInput}
        onClose={() => setShowPhoneInput(false)}
        currentPhone={profile?.phoneNumber || ""}
        onSuccess={() => {
          toast.success("핸드폰 인증이 완료되었습니다!");
          refreshUser(); // 사용자 정보 새로고침
        }}
      />

      {/* 비밀번호 변경 모달 */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">비밀번호 변경</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="새 비밀번호 (10자 이상, 소문자+숫자+특수문자)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="flex-1"
                >
                  {changingPassword ? "변경 중..." : "변경"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 거래지역 변경 모달 */}
      {showRegionEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">거래지역 선택</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  거래지역
                </label>
                <select
                  value={editingRegion}
                  onChange={e => setEditingRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">지역을 선택하세요</option>
                  <option value="서울특별시">서울특별시</option>
                  <option value="부산광역시">부산광역시</option>
                  <option value="대구광역시">대구광역시</option>
                  <option value="인천광역시">인천광역시</option>
                  <option value="광주광역시">광주광역시</option>
                  <option value="대전광역시">대전광역시</option>
                  <option value="울산광역시">울산광역시</option>
                  <option value="세종특별자치시">세종특별자치시</option>
                  <option value="경기도">경기도</option>
                  <option value="강원도">강원도</option>
                  <option value="충청북도">충청북도</option>
                  <option value="충청남도">충청남도</option>
                  <option value="전라북도">전라북도</option>
                  <option value="전라남도">전라남도</option>
                  <option value="경상북도">경상북도</option>
                  <option value="경상남도">경상남도</option>
                  <option value="제주특별자치도">제주특별자치도</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  직거래를 주로 하시는 지역을 선택해주세요.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRegionEdit(false);
                    setEditingRegion("");
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button onClick={handleRegionChange} className="flex-1">
                  저장
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
