"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import {
  X,
  Star,
  Calendar,
  AlertTriangle,
  Shield,
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

          {/* 회원 등급 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">회원 등급</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                {sellerProfile.grade || "C"}등급
              </span>
              <span className="text-sm text-gray-600">
                {sellerProfile.grade === "Bronze" ? "Chord" : 
                 sellerProfile.grade === "Silver" ? "Melody" :
                 sellerProfile.grade === "Gold" ? "Harmony" :
                 sellerProfile.grade === "Platinum" ? "Symphony" :
                 sellerProfile.grade === "Diamond" ? "Concert" : "Chord"}
              </span>
            </div>
          </div>

          {/* 활동 통계 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3">활동 통계</h4>
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sellerProfile.tradesCount || 0}
                </div>
                <div className="text-xs text-gray-600">거래 완료</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sellerProfile.averageRating ? Math.round(sellerProfile.averageRating) : 0}
                </div>
                <div className="text-xs text-gray-600">리뷰</div>
              </div>
            </div>
          </div>

          {/* 자기소개 */}
          {sellerProfile.bio && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">자기소개</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {sellerProfile.bio}
              </p>
            </div>
          )}

          {/* 가입일 */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {sellerProfile.createdAt
                ? getDaysAgo(sellerProfile.createdAt)
                : "가입일 미상"}
            </span>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
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