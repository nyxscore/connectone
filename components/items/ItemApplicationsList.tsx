"use client";

import { useState, useEffect } from "react";
import {
  getItemApplications,
  approveApplication,
  ItemApplication,
} from "../../lib/api/products";
import { getUserProfile } from "../../lib/profile/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CheckCircle, XCircle, User, Star, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ItemApplicationsListProps {
  itemId: string;
  onApplicationApproved?: () => void;
}

interface ApplicationWithProfile extends ItemApplication {
  buyerProfile?: {
    nickname: string;
    profileImage?: string;
    averageRating?: number;
    tradesCount?: number;
  };
}

export function ItemApplicationsList({
  itemId,
  onApplicationApproved,
}: ItemApplicationsListProps) {
  const [applications, setApplications] = useState<ApplicationWithProfile[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  // 신청자 목록 로드
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const result = await getItemApplications(itemId);

        if (result.success && result.applications) {
          // 각 신청자의 프로필 정보 가져오기
          const applicationsWithProfiles = await Promise.all(
            result.applications.map(async app => {
              try {
                const profileResult = await getUserProfile(app.buyerUid);
                return {
                  ...app,
                  buyerProfile: profileResult.success
                    ? {
                        nickname: profileResult.data?.nickname || "알 수 없음",
                        profileImage:
                          profileResult.data?.profileImage ||
                          profileResult.data?.photoURL,
                        averageRating: profileResult.data?.averageRating || 0,
                        tradesCount: profileResult.data?.tradesCount || 0,
                      }
                    : undefined,
                };
              } catch (error) {
                console.error("프로필 로드 실패:", app.buyerUid, error);
                return {
                  ...app,
                  buyerProfile: {
                    nickname: "알 수 없음",
                    profileImage: undefined,
                    averageRating: 0,
                    tradesCount: 0,
                  },
                };
              }
            })
          );

          setApplications(applicationsWithProfiles);
        } else {
          console.error("신청자 목록 로드 실패:", result.error);
        }
      } catch (error) {
        console.error("신청자 목록 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      loadApplications();
    }
  }, [itemId]);

  // 신청 승인
  const handleApprove = async (applicationId: string, buyerUid: string) => {
    if (approving) return;

    setApproving(applicationId);
    try {
      const result = await approveApplication(applicationId, itemId, buyerUid);

      if (result.success) {
        toast.success("구매신청을 승인했습니다!");
        setApplications(prev => prev.filter(app => app.id !== applicationId));
        onApplicationApproved?.();
      } else {
        toast.error(result.error || "승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 실패:", error);
      toast.error("승인 중 오류가 발생했습니다.");
    } finally {
      setApproving(null);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "시간 미상";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "방금 전";
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      return `${diffDays}일 전`;
    } catch (error) {
      return "시간 미상";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-600">구매신청자 목록을 불러오는 중...</span>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center p-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">아직 구매신청자가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        구매신청자 목록 ({applications.length}명)
      </h3>

      {applications.map(application => (
        <Card key={application.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* 프로필 이미지 */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {application.buyerProfile?.profileImage ? (
                  <img
                    src={application.buyerProfile.profileImage}
                    alt={application.buyerProfile.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-500" />
                )}
              </div>

              {/* 신청자 정보 */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {application.buyerProfile?.nickname || "알 수 없음"}
                  </h4>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {application.buyerProfile?.averageRating?.toFixed(1) ||
                        "0.0"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    거래 {application.buyerProfile?.tradesCount || 0}회
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTimeAgo(application.appliedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* 승인 버튼 */}
            <Button
              onClick={() =>
                handleApprove(application.id, application.buyerUid)
              }
              disabled={approving === application.id}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {approving === application.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              {approving === application.id ? "승인 중..." : "승인"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
