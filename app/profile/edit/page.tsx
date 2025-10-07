"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getUserProfile, updateUserProfile } from "../../../lib/profile/api";
import { UserProfile } from "../../../data/profile/types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ArrowLeft, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileUpdateSchema,
  ProfileUpdateInput,
} from "../../../data/profile/schemas";

export default function ProfileEditPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

    setSaving(true);
    try {
      const result = await updateUserProfile(currentUser.uid, data);

      if (result.success) {
        toast.success("프로필이 업데이트되었습니다.");
        router.push("/profile");
      } else {
        toast.error(result.error || "프로필 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      toast.error("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/profile");
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

            {/* 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역
              </label>
              <select
                {...register("region")}
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
              {errors.region && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.region.message}
                </p>
              )}
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














