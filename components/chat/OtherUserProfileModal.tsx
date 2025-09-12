"use client";

import { useState, useEffect } from "react";
import { getUserProfile } from "../../lib/auth";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { User, X, MapPin, Calendar, Star, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface OtherUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  userNickname: string;
  userProfileImage?: string;
}

export function OtherUserProfileModal({
  isOpen,
  onClose,
  userUid,
  userNickname,
  userProfileImage,
}: OtherUserProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userUid) {
      loadProfile();
    }
  }, [isOpen, userUid]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile(userUid);
      setProfile(userProfile);
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">프로필 정보</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 프로필 내용 */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">프로필을 불러오는 중...</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* 프로필 사진 및 기본 정보 */}
              <div className="text-center">
                <div className="relative inline-block">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.nickname}
                      className="w-20 h-20 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                      <User className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  {profile.nickname}
                </h3>
                <p className="text-gray-600 mt-1">
                  {profile.region || "지역 정보 없음"}
                </p>
              </div>

              {/* 등급 정보 */}
              {profile.grade && (
                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-gray-900">
                      회원 등급
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        profile.grade === "A"
                          ? "bg-orange-100 text-orange-800"
                          : profile.grade === "B"
                            ? "bg-yellow-100 text-yellow-800"
                            : profile.grade === "C"
                              ? "bg-gray-100 text-gray-800"
                              : profile.grade === "D"
                                ? "bg-sky-100 text-sky-800"
                                : profile.grade === "E"
                                  ? "bg-green-100 text-green-800"
                                  : profile.grade === "F"
                                    ? "bg-blue-100 text-blue-800"
                                    : profile.grade === "G"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {profile.grade}등급
                    </span>
                    <span className="text-sm text-gray-600">
                      {profile.grade === "A"
                        ? "Allegro"
                        : profile.grade === "B"
                          ? "Bravura"
                          : profile.grade === "C"
                            ? "Chord"
                            : profile.grade === "D"
                              ? "Duo"
                              : profile.grade === "E"
                                ? "Ensemble"
                                : profile.grade === "F"
                                  ? "Forte"
                                  : profile.grade === "G"
                                    ? "Grand"
                                    : "Unknown"}
                    </span>
                  </div>
                </Card>
              )}

              {/* 활동 통계 */}
              <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">활동 통계</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {profile.tradeCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">거래 완료</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {profile.reviewCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">리뷰</p>
                  </div>
                </div>
              </Card>

              {/* 자기소개 */}
              {profile.introShort && (
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">자기소개</h4>
                  <p className="text-gray-700">{profile.introShort}</p>
                </Card>
              )}

              {/* 가입일 */}
              {profile.createdAt && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDistanceToNow(
                      profile.createdAt.toDate
                        ? profile.createdAt.toDate()
                        : new Date(profile.createdAt),
                      { addSuffix: true, locale: ko }
                    )}{" "}
                    가입
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">프로필을 불러올 수 없습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t">
          <Button onClick={onClose} className="w-full" variant="outline">
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
