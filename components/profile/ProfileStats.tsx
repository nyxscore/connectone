"use client";

import { Card } from "../ui/Card";
import { UserProfile } from "../../data/profile/types";
import { getGradeInfo, uploadAvatar, deleteAvatar } from "../../lib/profile/api";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  TrendingUp,
  Star,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
// 등급 관련 import 제거 (응답률로 변경)

interface ProfileStatsProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  onAvatarUpdate?: (photoURL: string) => void;
}

export function ProfileStats({
  user,
  isOwnProfile = false,
  onAvatarUpdate,
}: ProfileStatsProps) {
  const gradeInfo = getGradeInfo(user.grade);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
  };

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAvatarChange = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onAvatarUpdate) {
        try {
          // 파일 크기 체크 (5MB 제한)
          if (file.size > 5 * 1024 * 1024) {
            toast.error("파일 크기는 5MB 이하여야 합니다.");
            return;
          }

          // 이미지 파일 타입 체크
          if (!file.type.startsWith("image/")) {
            toast.error("이미지 파일만 업로드 가능합니다.");
            return;
          }

          // Firebase Storage에 업로드
          const result = await uploadAvatar(user.uid, file);

          if (result.success && result.data) {
            onAvatarUpdate(result.data);
            toast.success("아바타가 업데이트되었습니다.");
          } else {
            toast.error(result.error || "업로드에 실패했습니다.");
          }
        } catch (error) {
          console.error("아바타 업로드 실패:", error);
          toast.error("업로드 중 오류가 발생했습니다.");
        }
      }
    };
    input.click();
    setShowMenu(false);
  };

  const handleAvatarDelete = async () => {
    if (!onAvatarUpdate) return;
    
    try {
      // 실제 Firebase Storage와 Firestore에서 삭제
      const result = await deleteAvatar(user.uid, user.photoURL);
      
      if (result.success) {
        onAvatarUpdate(""); // UI 업데이트
        toast.success("프로필 사진이 삭제되었습니다.");
      } else {
        toast.error(result.error || "프로필 사진 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로필 사진 삭제 실패:", error);
      toast.error("프로필 사진 삭제 중 오류가 발생했습니다.");
    }
    
    setShowMenu(false);
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center space-x-6 mb-6">
          {/* 아바타 */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-24 h-24 rounded-full overflow-hidden bg-gray-100 ${
                isOwnProfile
                  ? "cursor-pointer hover:opacity-80 transition-opacity"
                  : ""
              }`}
              onClick={isOwnProfile ? handleAvatarChange : undefined}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <span className="text-3xl font-bold mb-1">
                    {user.nickname.charAt(0).toUpperCase()}
                  </span>
                  {isOwnProfile && (
                    <span className="text-xs opacity-60">📷</span>
                  )}
                </div>
              )}
            </div>

            {/* 점점점 메뉴 */}
            {isOwnProfile && (
              <div className="relative" ref={menuRef}>
                <button
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors shadow-md"
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  title="프로필 사진 메뉴"
                >
                  <MoreVertical className="w-3 h-3 text-gray-800" />
                </button>

                {/* 드롭다운 메뉴 */}
                {showMenu && (
                  <div className="absolute top-6 right-0 bg-white rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={handleAvatarChange}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      사진 변경
                    </button>
                    {user.photoURL && (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                        onClick={handleAvatarDelete}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        사진 삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900 truncate">
                {user.nickname}
              </h1>

              {/* 등급 배지 */}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${gradeInfo.bgColor} ${gradeInfo.color} flex-shrink-0`}
              >
                <span className="mr-1">{gradeInfo.emoji}</span>
                {gradeInfo.displayName}
              </span>
            </div>

            <div className="flex items-center text-gray-600 space-x-6 mb-4">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{user.region}</span>
              </div>

              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  {formatDate(user.createdAt)} 가입
                </span>
              </div>
            </div>

            {/* 활동 지표 */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {user.tradesCount}
                </div>
                <div className="text-sm text-gray-600">총 거래</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {user.reviewsCount}
                </div>
                <div className="text-sm text-gray-600">받은 후기</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {user.responseRate || 0}%
                </div>
                <div className="text-sm text-gray-600">응답률</div>
              </div>
            </div>
          </div>
        </div>

        {/* 등급표 모달 제거됨 - 응답률로 변경 */}
      </div>
    </Card>
  );
}
