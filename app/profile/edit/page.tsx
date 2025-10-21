"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getUserProfile, updateUserProfile } from "../../../lib/profile/api";
import { UserProfile } from "../../../data/profile/types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ArrowLeft, Save, X, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileUpdateSchema,
  ProfileUpdateInput,
} from "../../../data/profile/schemas";
import { KOREAN_REGIONS } from "../../../lib/utils";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

export default function ProfileEditPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 비밀번호 변경 관련 상태
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      nickname: "",
      region: "",
      introShort: "",
      introLong: "",
    },
  });

  const watchedIntroShort = watch("introShort");
  const watchedIntroLong = watch("introLong");

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth/login?next=/profile/edit");
      return;
    }

    if (currentUser) {
      loadProfile();
    }
  }, [currentUser, authLoading, router]);

  const loadProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const result = await getUserProfile(currentUser.uid);

      if (result.success && result.data) {
        setProfile(result.data);
        reset({
          nickname: result.data.nickname,
          region: result.data.region,
          introShort: result.data.introShort || "",
          introLong: result.data.introLong || "",
        });
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

  const onSubmit = async (data: ProfileUpdateInput) => {
    if (!currentUser) return;

    console.log("🔍 프로필 업데이트 시작:", data);
    setSaving(true);
    try {
      // 빈 문자열을 null로 변환하여 Firestore에 저장
      const updateData = {
        nickname: data.nickname?.trim(),
        region: data.region?.trim() || "",
        introShort: data.introShort?.trim() || "",
        introLong: data.introLong?.trim() || "",
      };

      console.log("📦 업데이트 데이터:", updateData);

      const result = await updateUserProfile(currentUser.uid, updateData);
      console.log("📦 프로필 업데이트 결과:", result);

      if (result.success) {
        toast.success("프로필이 업데이트되었습니다.");
        // 프로필 상태도 업데이트
        setProfile(prev => (prev ? { ...prev, ...updateData } : null));
        router.push("/profile");
      } else {
        console.error("❌ 프로필 업데이트 실패:", result.error);
        toast.error(result.error || "프로필 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 프로필 업데이트 실패:", error);
      toast.error("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/profile");
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
      console.log("🔐 비밀번호 변경 시작...");
      console.log("현재 사용자:", currentUser.email);

      // 현재 사용자 재인증
      const credential = EmailAuthProvider.credential(
        currentUser.email || "",
        currentPassword
      );

      console.log("🔑 사용자 재인증 중...");
      await reauthenticateWithCredential(currentUser, credential);
      console.log("✅ 재인증 성공");

      // 비밀번호 업데이트
      console.log("🔐 비밀번호 업데이트 중...");
      await updatePassword(currentUser, newPassword);
      console.log("✅ 비밀번호 업데이트 성공");

      toast.success("비밀번호가 성공적으로 변경되었습니다!");

      // 폼 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error("❌ 비밀번호 변경 실패:", error);
      console.error("에러 코드:", error.code);
      console.error("에러 메시지:", error.message);

      if (error.code === "auth/wrong-password") {
        toast.error("현재 비밀번호가 올바르지 않습니다.");
      } else if (error.code === "auth/weak-password") {
        toast.error("새 비밀번호가 너무 약합니다. 6자 이상 입력해주세요.");
      } else if (error.code === "auth/requires-recent-login") {
        toast.error("보안을 위해 다시 로그인해주세요.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      } else if (error.code === "auth/network-request-failed") {
        toast.error("네트워크 연결을 확인해주세요.");
      } else if (error.code === "auth/user-mismatch") {
        toast.error("사용자 정보가 일치하지 않습니다. 다시 로그인해주세요.");
      } else if (error.code === "auth/user-not-found") {
        toast.error("사용자를 찾을 수 없습니다. 다시 로그인해주세요.");
      } else {
        toast.error(
          `비밀번호 변경 실패: ${error.message || "알 수 없는 오류"}`
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // 비밀번호 표시/숨김 토글
  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            프로필을 불러올 수 없습니다
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">프로필 수정</h1>
            <div className="w-20"></div> {/* 공간 맞추기 */}
          </div>
        </div>
      </div>

      {/* 메인 내용 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                {...register("nickname")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="닉네임을 입력하세요"
                maxLength={20}
              />
              {errors.nickname && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nickname.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                최대 20자까지 입력 가능합니다.
              </p>
            </div>

            {/* 거래 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거래 지역
              </label>
              <div className="flex gap-2">
                <input
                  {...register("region")}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울시 강남구, 경기도 성남시"
                  maxLength={50}
                  onChange={e => {
                    // 실시간으로 입력값 업데이트
                    const value = e.target.value;
                    console.log("📍 거래지역 입력:", value);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentRegion = watch("region");
                    console.log("📍 거래지역 수정 버튼 클릭:", currentRegion);
                    toast.success("거래지역이 업데이트됩니다. 저장 버튼을 눌러주세요.");
                  }}
                  className="px-4"
                >
                  수정
                </Button>
              </div>
              {errors.region && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.region.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                직거래를 주로 하시는 지역을 입력해주세요. (선택사항)
              </p>
            </div>

            {/* 한 줄 소개 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                한 줄 소개
                <span className="text-gray-500 text-xs ml-1">
                  ({watchedIntroShort?.length || 0}/50)
                </span>
              </label>
              <input
                {...register("introShort")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="간단한 자기소개를 입력하세요"
                maxLength={50}
              />
              {errors.introShort && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.introShort.message}
                </p>
              )}
            </div>

            {/* 자세한 자기소개 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자세한 자기소개
                <span className="text-gray-500 text-xs ml-1">
                  ({watchedIntroLong?.length || 0}/500)
                </span>
              </label>
              <textarea
                {...register("introLong")}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="자세한 자기소개를 입력하세요"
                maxLength={500}
              />
              {errors.introLong && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.introLong.message}
                </p>
              )}
            </div>

            {/* 비밀번호 변경 섹션 */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  비밀번호 변경
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-sm"
                >
                  {showPasswordChange ? "닫기" : "변경하기"}
                </Button>
              </div>

              {showPasswordChange && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  {/* 현재 비밀번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      현재 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="현재 비밀번호를 입력하세요"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 새 비밀번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      새 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="새 비밀번호를 입력하세요 (10자 이상, 소문자+숫자+특수문자)"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("new")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 새 비밀번호 확인 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      새 비밀번호 확인
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="새 비밀번호를 다시 입력하세요"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 비밀번호 변경 버튼 */}
                  <div className="flex space-x-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setShowPasswordChange(false);
                      }}
                      disabled={changingPassword}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={
                        changingPassword ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                      className="flex-1"
                    >
                      {changingPassword ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          변경 중...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          비밀번호 변경
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>

              <Button
                type="submit"
                disabled={saving}
                onClick={() => {
                  console.log("🔍 저장 버튼 클릭됨");
                  console.log("현재 폼 데이터:", watch());
                  console.log("폼 에러:", errors);
                }}
                className="flex-1 flex items-center justify-center"
              >
                {saving ? (
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
