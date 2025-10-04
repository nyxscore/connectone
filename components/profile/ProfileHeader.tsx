"use client";

import { Button } from "../ui/Button";
import { ArrowLeft, Settings, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserProfile } from "../../data/profile/types";
import { getGradeInfo } from "../../lib/profile/api";

interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile: boolean;
  onEdit?: () => void;
}

export function ProfileHeader({
  user,
  isOwnProfile,
  onEdit,
}: ProfileHeaderProps) {
  const router = useRouter();
  const gradeInfo = getGradeInfo(user.grade);

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>

          <div className="flex items-center space-x-2">
            {!isOwnProfile && (
              <Button variant="outline" size="sm" className="flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
