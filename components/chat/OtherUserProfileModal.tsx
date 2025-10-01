"use client";

import { useState, useEffect } from "react";
import { getUserProfile } from "../../lib/profile/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import {
  User,
  X,
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { ReportBlockModal } from "./ReportBlockModal";

interface OtherUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  userNickname: string;
  userProfileImage?: string;
  onBlocked?: () => void;
}

export function OtherUserProfileModal({
  isOpen,
  onClose,
  userUid,
  userNickname,
  userProfileImage,
  onBlocked,
}: OtherUserProfileModalProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showReportBlockModal, setShowReportBlockModal] = useState(false);
  const [reportBlockModalTab, setReportBlockModalTab] = useState<
    "report" | "block"
  >("report");

  useEffect(() => {
    if (isOpen && userUid) {
      loadProfile();
    }
  }, [isOpen, userUid]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log("OtherUserProfileModal - 프로필 로드 시작:", {
        userUid,
        userNickname,
      });
      const userProfileResult = await getUserProfile(userUid);
      console.log(
        "OtherUserProfileModal - 프로필 로드 결과:",
        userProfileResult
      );

      if (userProfileResult.success && userProfileResult.data) {
        setProfile(userProfileResult.data);
        console.log(
          "OtherUserProfileModal - 프로필 데이터 설정:",
          userProfileResult.data
        );
        console.log("OtherUserProfileModal - 자기소개 필드들:", {
          introShort: userProfileResult.data.introShort,
          introLong: userProfileResult.data.introLong,
        });
      } else {
        console.error("프로필 로드 실패:", userProfileResult.error);
        setProfile(null);
      }
    } catch (error) {
      console.error("프로필 로드 실패:", error);
      setProfile(null);
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
                  {(() => {
                    console.log("프로필 이미지 렌더링:", {
                      profileImage: profile.profileImage,
                      photoURL: profile.photoURL,
                      hasProfileImage: !!(
                        profile.profileImage || profile.photoURL
                      ),
                    });
                    return null;
                  })()}
                  {profile.profileImage || profile.photoURL ? (
                    <img
                      src={profile.profileImage || profile.photoURL}
                      alt={profile.nickname || profile.displayName || "사용자"}
                      className="w-20 h-20 rounded-full object-cover mx-auto"
                      onError={e => {
                        console.error(
                          "프로필 이미지 로드 실패:",
                          profile.profileImage || profile.photoURL
                        );
                        e.currentTarget.style.display = "none";
                      }}
                      onLoad={() => {
                        console.log(
                          "프로필 이미지 로드 성공:",
                          profile.profileImage || profile.photoURL
                        );
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                      <User className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  {profile.nickname || profile.displayName || "알 수 없음"}
                </h3>
                {/* 한줄소개 - 닉네임 밑에 표시 */}
                {profile.introShort && (
                  <p className="text-gray-600 mt-2 text-sm italic font-medium">
                    "{profile.introShort}"
                  </p>
                )}
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
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                        profile.grade === "A"
                          ? "bg-orange-100 text-orange-600"
                          : profile.grade === "B"
                            ? "bg-yellow-100 text-yellow-600"
                            : profile.grade === "C"
                              ? "bg-green-100 text-green-600"
                              : profile.grade === "D"
                                ? "bg-sky-100 text-sky-600"
                                : profile.grade === "E"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : profile.grade === "F"
                                    ? "bg-blue-100 text-blue-600"
                                    : profile.grade === "G"
                                      ? "bg-purple-100 text-purple-600"
                                      : "bg-green-100 text-green-600"
                      }`}
                    >
                      <span className="text-xs">🌱</span>
                      <span>
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
                                  : "Chord"}
                      </span>
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
              {profile.introLong && (
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">자기소개</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {profile.introLong}
                  </p>
                </Card>
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
        <div className="p-4 border-t space-y-3">
          {/* 신고/차단 버튼 */}
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                setReportBlockModalTab("report");
                setShowReportBlockModal(true);
              }}
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              신고하기
            </Button>
            <Button
              onClick={() => {
                setReportBlockModalTab("block");
                setShowReportBlockModal(true);
              }}
              variant="outline"
              className="flex-1 text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              차단하기
            </Button>
          </div>

          <Button onClick={onClose} className="w-full" variant="outline">
            닫기
          </Button>
        </div>
      </div>

      {/* 신고/차단 모달 */}
      {showReportBlockModal && (
        <ReportBlockModal
          isOpen={showReportBlockModal}
          onClose={() => setShowReportBlockModal(false)}
          reportedUid={userUid}
          reportedNickname={userNickname}
          initialTab={reportBlockModalTab}
        />
      )}
    </div>
  );
}
