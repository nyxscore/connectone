"use client";

import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { UserProfile } from "../../data/profile/types";
import { getGradeInfo } from "../../lib/profile/api";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { X, MapPin, Calendar, Star, TrendingUp, User } from "lucide-react";

interface SellerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerProfile: UserProfile | null;
}

export function SellerProfileModal({
  isOpen,
  onClose,
  sellerProfile,
}: SellerProfileModalProps) {
  if (!isOpen || !sellerProfile) return null;

  const gradeInfo = getGradeInfo(sellerProfile.grade);

  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">판매자 프로필</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 프로필 내용 */}
        <div className="p-6">
          {/* 기본 정보 */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {sellerProfile.photoURL ? (
                <img
                  src={sellerProfile.photoURL}
                  alt={sellerProfile.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {sellerProfile.nickname}
              </h3>
              <div className="flex items-center space-x-3 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${gradeInfo.bgColor} ${gradeInfo.color}`}
                >
                  <span className="mr-1">{gradeInfo.emoji}</span>
                  {gradeInfo.displayName}
                </span>
                {sellerProfile.region && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {sellerProfile.region}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 활동 통계 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {sellerProfile.tradesCount}
              </div>
              <div className="text-sm text-gray-600">총 거래</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {sellerProfile.reviewsCount}
              </div>
              <div className="text-sm text-gray-600">받은 후기</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {sellerProfile.responseRate || 0}%
              </div>
              <div className="text-sm text-gray-600">응답률</div>
            </div>
          </div>

          {/* 등급 설명 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                <span className="mr-1">{gradeInfo.emoji}</span>
                {gradeInfo.displayName}
              </span>
            </div>
            <p className="text-sm text-gray-600">{gradeInfo.description}</p>
          </div>

          {/* 가입일 */}
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatDate(sellerProfile.createdAt)} 가입</span>
          </div>

          {/* 자기소개 */}
          {sellerProfile.introShort && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                한 줄 소개
              </h4>
              <p className="text-sm text-gray-600">
                {sellerProfile.introShort}
              </p>
            </div>
          )}

          {sellerProfile.introLong && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                자기소개
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {sellerProfile.introLong}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
