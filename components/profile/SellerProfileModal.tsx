"use client";

import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import {
  X,
  Star,
  MapPin,
  Calendar,
  CheckCircle,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  Award,
  TrendingUp,
  Clock,
  Package,
} from "lucide-react";
import { UserProfile } from "../../data/profile/types";
import { getOrCreateChat } from "../../lib/chat/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ReportBlockModal } from "../chat/ReportBlockModal";

interface SellerProfileModalProps {
  sellerProfile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: () => void;
  itemId?: string;
}

export function SellerProfileModal({
  sellerProfile,
  isOpen,
  onClose,
  onStartChat,
  itemId,
}: SellerProfileModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showReportBlockModal, setShowReportBlockModal] = useState(false);
  const [reportBlockModalTab, setReportBlockModalTab] = useState<
    "report" | "block"
  >("report");

  if (!isOpen || !sellerProfile) return null;

  const handleStartChat = async () => {
    if (!user?.uid || !sellerProfile?.uid) {
      console.log(
        "채팅 시작 불가: user.uid 또는 sellerProfile.uid가 없습니다."
      );
      return;
    }

    try {
      console.log("채팅 생성 시작:", {
        itemId: itemId || "unknown",
        buyerUid: user.uid,
        sellerUid: sellerProfile.uid,
      });

      const result = await getOrCreateChat(
        itemId || "unknown",
        user.uid,
        sellerProfile.uid
      );

      if (result.success && result.chatId) {
        console.log("채팅 생성 성공:", result.chatId);
        // 채팅 페이지로 이동
        router.push(`/chat?chatId=${result.chatId}`);
        onClose(); // 모달 닫기
      } else {
        console.error("채팅 생성 실패:", result.error);
        toast.error("채팅을 시작할 수 없습니다.");
      }
    } catch (error) {
      console.error("채팅 시작 중 오류:", error);
      toast.error("채팅을 시작하는 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    try {
      const dateObj =
        typeof date === "string"
          ? new Date(date)
          : date.toDate
            ? date.toDate()
            : new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      return dateObj.toLocaleDateString("ko-KR");
    } catch (error) {
      return "";
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case "C":
        return "text-green-600 bg-green-100";
      case "D":
        return "text-sky-600 bg-sky-100";
      case "E":
        return "text-emerald-600 bg-emerald-100";
      case "F":
        return "text-blue-600 bg-blue-100";
      case "G":
        return "text-purple-600 bg-purple-100";
      case "A":
        return "text-orange-600 bg-orange-100";
      case "B":
        return "text-yellow-600 bg-yellow-100";
      case "BRONZE":
        return "text-orange-600 bg-orange-100";
      case "SILVER":
        return "text-gray-600 bg-gray-100";
      case "GOLD":
        return "text-yellow-600 bg-yellow-100";
      case "PLATINUM":
        return "text-blue-600 bg-blue-100";
      case "DIAMOND":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-green-600 bg-green-100";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">프로필</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 프로필 기본 정보 */}
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
              {sellerProfile.profileImage || sellerProfile.photoURL ? (
                <img
                  src={sellerProfile.profileImage || sellerProfile.photoURL}
                  alt={sellerProfile.nickname || "판매자"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center">
                  {sellerProfile.nickname?.charAt(0)?.toUpperCase() ||
                    sellerProfile.username?.charAt(0)?.toUpperCase() ||
                    "S"}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {sellerProfile.nickname || "판매자"}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getGradeColor(
                    sellerProfile.grade || "C"
                  )}`}
                >
                  <span className="text-xs">🌱</span>
                  <span>
                    {(() => {
                      const grade = sellerProfile.grade || "C";
                      const gradeLabels = {
                        E: "Ensemble",
                        D: "Duo",
                        C: "Chord",
                        B: "Bravura",
                        A: "Allegro",
                      };
                      return (
                        gradeLabels[grade as keyof typeof gradeLabels] ||
                        "Chord"
                      );
                    })()}
                  </span>
                </span>
              </div>

              {/* 한줄소개 - 닉네임 밑에 표시 */}
              {sellerProfile.introShort && (
                <p className="text-gray-600 mb-3 text-sm italic font-medium">
                  "{sellerProfile.introShort}"
                </p>
              )}

              {/* 지역과 날짜 정보 제거 */}

              {/* 평점 및 거래 통계 - 모바일에서 반응형으로 표시 */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-gray-900">
                    {sellerProfile.averageRating?.toFixed(1) || "0.0"}/5.0
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-gray-900">
                    거래 {sellerProfile.tradesCount || 0}회
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-gray-900">
                    응답률 {sellerProfile.responseRate || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 인증 상태 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              인증 상태
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    sellerProfile.isPhoneVerified
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700">
                  {sellerProfile.isPhoneVerified
                    ? "휴대폰 인증완료"
                    : "휴대폰 미인증"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    sellerProfile.isEmailVerified
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700">
                  {sellerProfile.isEmailVerified
                    ? "이메일 인증완료"
                    : "이메일 미인증"}
                </span>
              </div>
            </div>
          </div>

          {/* 자기소개 카드만 표시 */}
          {sellerProfile.introLong && (
            <Card className="p-4">
              <div className="mb-2">
                <h4 className="font-semibold text-gray-900">자기소개</h4>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {sellerProfile.introLong}
              </div>
            </Card>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                router.push(`/profile/items?userId=${sellerProfile.uid}`);
                onClose();
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Package className="w-5 h-5 mr-2" />
              판매 상품 보기
            </Button>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  setReportBlockModalTab("report");
                  setShowReportBlockModal(true);
                }}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <Shield className="w-4 h-4 mr-1" />
                신고하기
              </Button>
              <Button
                onClick={() => {
                  setReportBlockModalTab("block");
                  setShowReportBlockModal(true);
                }}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-1" />
                차단하기
              </Button>
            </div>
            <Button onClick={onClose} variant="outline" className="w-full">
              닫기
            </Button>
          </div>
        </div>
      </div>

      {/* 신고/차단 모달 */}
      {showReportBlockModal && (
        <ReportBlockModal
          isOpen={showReportBlockModal}
          onClose={() => setShowReportBlockModal(false)}
          reportedUid={sellerProfile?.uid || ""}
          reportedNickname={sellerProfile?.nickname || ""}
          initialTab={reportBlockModalTab}
        />
      )}
    </div>
  );
}
