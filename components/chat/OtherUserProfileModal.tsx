"use client";

import { useState, useEffect } from "react";
import { getUserProfile } from "../../lib/profile/api";
import { reportUser, blockUser } from "../../lib/chat/api";
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

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

  const handleReport = async () => {
    if (!user?.uid || !reportReason) {
      toast.error("신고 사유를 선택해주세요.");
      return;
    }

    try {
      const result = await reportUser(
        user.uid,
        userUid,
        reportReason,
        reportDescription
      );

      if (result.success) {
        toast.success("신고가 접수되었습니다.");
        setShowReportModal(false);
        setReportReason("");
        setReportDescription("");
      } else {
        toast.error(result.error || "신고 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("신고 처리 실패:", error);
      toast.error("신고 처리 중 오류가 발생했습니다.");
    }
  };

  const handleBlock = async () => {
    if (!user?.uid) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (
      confirm(
        `${userNickname}님을 차단하시겠습니까?\n차단하면 해당 사용자와의 모든 채팅이 삭제됩니다.`
      )
    ) {
      try {
        const result = await blockUser(user.uid, userUid);

        if (result.success) {
          toast.success("사용자가 차단되었습니다.");
          onBlocked?.();
          onClose();
        } else {
          toast.error(result.error || "차단 처리에 실패했습니다.");
        }
      } catch (error) {
        console.error("차단 처리 실패:", error);
        toast.error("차단 처리 중 오류가 발생했습니다.");
      }
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
                    {(() => {
                      try {
                        let date: Date;
                        if (
                          profile.createdAt.toDate &&
                          typeof profile.createdAt.toDate === "function"
                        ) {
                          date = profile.createdAt.toDate();
                        } else if (profile.createdAt.seconds) {
                          date = new Date(profile.createdAt.seconds * 1000);
                        } else {
                          date = new Date(profile.createdAt);
                        }

                        if (isNaN(date.getTime())) return "가입일 정보 없음";

                        const now = new Date();
                        const diffInMs = now.getTime() - date.getTime();
                        const diffInDays = Math.floor(
                          diffInMs / (1000 * 60 * 60 * 24)
                        );

                        if (diffInDays < 1) return "오늘 가입";
                        else if (diffInDays < 7)
                          return `${diffInDays}일 전 가입`;
                        else if (diffInDays < 30)
                          return `${Math.floor(diffInDays / 7)}주 전 가입`;
                        else if (diffInDays < 365)
                          return `${Math.floor(diffInDays / 30)}개월 전 가입`;
                        else return `${Math.floor(diffInDays / 365)}년 전 가입`;
                      } catch (error) {
                        return "가입일 정보 없음";
                      }
                    })()}
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
        <div className="p-4 border-t space-y-3">
          {/* 신고/차단 버튼 */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowReportModal(true)}
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              신고하기
            </Button>
            <Button
              onClick={handleBlock}
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

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                사용자 신고
              </h3>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  신고 사유
                </label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">사유를 선택해주세요</option>
                  <option value="spam">스팸/광고</option>
                  <option value="harassment">괴롭힘/욕설</option>
                  <option value="fraud">사기/부정거래</option>
                  <option value="inappropriate">부적절한 내용</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 설명 (선택사항)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  placeholder="신고 사유를 자세히 설명해주세요"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t flex space-x-2">
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("");
                  setReportDescription("");
                }}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleReport}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!reportReason}
              >
                신고하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
