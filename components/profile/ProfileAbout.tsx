"use client";

import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { UserProfile } from "../../data/profile/types";
import { Edit, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileUpdateSchema,
  ProfileUpdateInput,
} from "../../data/profile/schemas";
import { updateUserProfile } from "../../lib/profile/api";
import toast from "react-hot-toast";

interface ProfileAboutProps {
  user: UserProfile;
  isOwnProfile: boolean;
  onUpdate?: (updatedUser: UserProfile) => void;
}

export function ProfileAbout({
  user,
  isOwnProfile,
  onUpdate,
}: ProfileAboutProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      nickname: user.nickname,
      region: user.region,
      introShort: user.introShort || "",
      introLong: user.introLong || "",
    },
  });

  const watchedIntroShort = watch("introShort");
  const watchedIntroLong = watch("introLong");

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit = async (data: ProfileUpdateInput) => {
    setLoading(true);
    try {
      const result = await updateUserProfile(user.uid, data);

      if (result.success) {
        toast.success("프로필이 업데이트되었습니다.");
        setIsEditing(false);

        // 부모 컴포넌트에 업데이트된 정보 전달
        if (onUpdate) {
          onUpdate({
            ...user,
            ...data,
          } as UserProfile);
        }
      } else {
        toast.error(result.error || "프로필 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      toast.error("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">자기소개</h2>
          {isOwnProfile && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                닉네임
              </label>
              <input
                {...register("nickname")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="닉네임을 입력하세요"
              />
              {errors.nickname && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nickname.message}
                </p>
              )}
            </div>

            {/* 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <div className="flex space-x-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center"
              >
                {loading ? (
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading ? "저장 중..." : "저장"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* 한 줄 소개 */}
            {user.introShort && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  한 줄 소개
                </h3>
                <p className="text-gray-900">{user.introShort}</p>
              </div>
            )}

            {/* 자세한 자기소개 */}
            {user.introLong && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  자기소개
                </h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {user.introLong}
                </p>
              </div>
            )}

            {/* 빈 상태 */}
            {!user.introShort && !user.introLong && (
              <div className="text-center py-8 text-gray-500">
                {isOwnProfile ? (
                  <div>
                    <p className="mb-2">아직 자기소개가 없습니다.</p>
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      자기소개 작성하기
                    </Button>
                  </div>
                ) : (
                  <p>자기소개가 없습니다.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
