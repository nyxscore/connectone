"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import {
  X,
  Star,
  Calendar,
  AlertTriangle,
  Shield,
  MessageCircle,
  MapPin,
  CheckCircle,
  Phone,
  Mail,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react";
import { UserProfile } from "../../data/profile/types";

interface SellerProfileModalProps {
  sellerProfile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: () => void;
}

export function SellerProfileModal({
  sellerProfile,
  isOpen,
  onClose,
  onStartChat,
}: SellerProfileModalProps) {
  if (!isOpen || !sellerProfile) return null;

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

  const getDaysAgo = (date: any) => {
    if (!date) return "";
    try {
      const dateObj =
        typeof date === "string"
          ? new Date(date)
          : date.toDate
            ? date.toDate()
            : new Date(date);
      if (isNaN(dateObj.getTime())) return "";

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "1일 전 가입";
      return `${diffDays}일 전 가입`;
    } catch (error) {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">프로필 정보</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 프로필 사진과 이름 */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 mx-auto mb-3">
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
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {sellerProfile.nickname || "판매자"}
            </h3>
            <p className="text-sm text-gray-600">
              {sellerProfile.region || "지역 미설정"}
            </p>
          </div>



          {/* 평점 및 통계 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">평점 및 통계</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sellerProfile.averageRating?.toFixed(1) || "0.0"}
                </div>
                <div className="text-xs text-gray-600">평균 평점</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sellerProfile.tradesCount || 0}
                </div>
                <div className="text-xs text-gray-600">거래 횟수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {sellerProfile.responseRate || 0}%
                </div>
                <div className="text-xs text-gray-600">응답률</div>
              </div>
            </div>
          </div>

          {/* 인증 상태 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">인증 상태</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">휴대폰 인증</span>
                </div>
                <div className="flex items-center space-x-1">
                  {sellerProfile.isPhoneVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    sellerProfile.isPhoneVerified ? "text-green-600" : "text-red-500"
                  }`}>
                    {sellerProfile.isPhoneVerified ? "완료" : "미완료"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">이메일 인증</span>
                </div>
                <div className="flex items-center space-x-1">
                  {sellerProfile.isEmailVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    sellerProfile.isEmailVerified ? "text-green-600" : "text-red-500"
                  }`}>
                    {sellerProfile.isEmailVerified ? "완료" : "미완료"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 거래 성과 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">거래 성과</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">총 거래 횟수</span>
                <span className="text-sm font-medium text-gray-900">
                  {sellerProfile.tradesCount || 0}건
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">평균 평점</span>
                <span className="text-sm font-medium text-gray-900">
                  {sellerProfile.averageRating?.toFixed(1) || "0.0"}점
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">응답률</span>
                <span className="text-sm font-medium text-gray-900">
                  {sellerProfile.responseRate || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* 활동 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">활동 정보</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">가입일</span>
                <span className="text-sm font-medium text-gray-900">
                  {sellerProfile.createdAt
                    ? getDaysAgo(sellerProfile.createdAt)
                    : "미상"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">등급</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  sellerProfile.grade === "Bronze" ? "bg-orange-100 text-orange-700" :
                  sellerProfile.grade === "Silver" ? "bg-gray-100 text-gray-700" :
                  sellerProfile.grade === "Gold" ? "bg-yellow-100 text-yellow-700" :
                  sellerProfile.grade === "Platinum" ? "bg-blue-100 text-blue-700" :
                  sellerProfile.grade === "Diamond" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {sellerProfile.grade === "Bronze" ? "Chord" :
                   sellerProfile.grade === "Silver" ? "Melody" :
                   sellerProfile.grade === "Gold" ? "Harmony" :
                   sellerProfile.grade === "Platinum" ? "Symphony" :
                   sellerProfile.grade === "Diamond" ? "Concert" : "Chord"}
                </span>
              </div>
            </div>
          </div>

          {/* 소개글 */}
          {sellerProfile.bio && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">소개글</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {sellerProfile.bio}
              </p>
            </div>
          )}


          {/* 액션 버튼들 */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            {onStartChat && (
              <Button
                onClick={onStartChat}
                className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                채팅하기
              </Button>
            )}
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  // 신고하기 기능
                  console.log("신고하기 클릭됨");
                }}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                신고하기
              </Button>
              <Button
                onClick={() => {
                  // 차단하기 기능
                  console.log("차단하기 클릭됨");
                }}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <Shield className="w-4 h-4 mr-1" />
                차단하기
              </Button>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
