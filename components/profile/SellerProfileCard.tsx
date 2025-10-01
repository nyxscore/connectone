"use client";

import { User, Star, MapPin } from "lucide-react";
import { getGradeInfo } from "@/lib/profile/api";
import { UserProfile } from "@/data/profile/types";

interface SellerProfileCardProps {
  sellerProfile: UserProfile | null;
  seller?: {
    displayName?: string;
    grade?: string;
  } | null;
  region?: string;
  onClick?: () => void;
  showClickable?: boolean;
}

export function SellerProfileCard({
  sellerProfile,
  seller,
  region,
  onClick,
  showClickable = true,
}: SellerProfileCardProps) {
  return (
    <div
      className={`pt-4 border-t border-gray-200 ${
        showClickable && onClick
          ? "cursor-pointer hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {sellerProfile?.photoURL ? (
              <img
                src={sellerProfile.photoURL}
                alt={sellerProfile.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {sellerProfile?.nickname || seller?.displayName || "판매자"}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm text-gray-500">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                {(() => {
                  const grade = sellerProfile?.grade || seller?.grade || "C";
                  const gradeInfo = getGradeInfo(grade);
                  return gradeInfo.displayName;
                })()}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                {sellerProfile?.region || region}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">거래 횟수</span>
            <p className="font-semibold">{sellerProfile?.tradesCount || 0}회</p>
          </div>
          <div>
            <span className="text-gray-500">평점</span>
            <p className="font-semibold">
              {sellerProfile?.averageRating
                ? `${sellerProfile.averageRating.toFixed(1)}점`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
