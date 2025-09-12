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
import { UserProfile, TradeItem } from "../../data/profile/types";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { ProfileStats } from "../../components/profile/ProfileStats";
import { ProfileAbout } from "../../components/profile/ProfileAbout";
import { TradeList } from "../../components/profile/TradeList";
import { Card } from "../../components/ui/Card";
import { Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function MyProfilePage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth/login?next=/profile");
      return;
    }

    if (currentUser) {
      loadProfile();
      loadTrades();
    }
  }, [currentUser, authLoading, router]);

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

  const handleAvatarUpload = async (photoURL: string) => {
    if (!currentUser) return;

    try {
      // 프로필 업데이트
      const updateResult = await updateUserProfile(currentUser.uid, {
        photoURL: photoURL || null, // 빈 문자열이면 null로 설정
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
    // ProfileAbout 컴포넌트에서 편집 모드로 전환
    // 이는 ProfileAbout 컴포넌트 내부에서 처리됨
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

          {/* 자기소개 */}
          <ProfileAbout
            user={profile}
            isOwnProfile={true}
            onUpdate={handleProfileUpdate}
          />

          {/* 최근 거래 */}
          <TradeList trades={trades} loading={tradesLoading} />
        </div>
      </div>
    </div>
  );
}
