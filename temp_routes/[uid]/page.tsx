"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getUserProfile } from "../../../lib/profile/api";
import { UserProfile } from "../../../data/profile/types";
import { ProfileHeader } from "../../../components/profile/ProfileHeader";
import { ProfileStats } from "../../../components/profile/ProfileStats";
import { ProfileAbout } from "../../../components/profile/ProfileAbout";
import { Loader2, AlertCircle } from "lucide-react";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const uid = params.uid as string;

  useEffect(() => {
    if (uid) {
      loadProfile();
    }
  }, [uid]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await getUserProfile(uid);

      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError(result.error || "사용자를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("프로필 로드 실패:", err);
      setError("프로필을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
            사용자를 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === profile.uid;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader user={profile} isOwnProfile={isOwnProfile} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 프로필 통계 */}
          <ProfileStats user={profile} />

          {/* 자기소개 */}
          <ProfileAbout user={profile} isOwnProfile={isOwnProfile} />
        </div>
      </div>
    </div>
  );
}
