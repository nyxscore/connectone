"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { getUserProfile } from "../../lib/profile/api";
import { getBlockedUsers, unblockUser } from "../../lib/chat/api";
import { useAuth } from "../../lib/hooks/useAuth";
import { Shield, X, User, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface BlockedUser {
  id: string;
  blockedUid: string;
  blockedAt: any;
  userInfo?: {
    nickname: string;
    profileImage?: string;
  };
}

interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnblock?: (blockedUid: string) => void;
}

export function BlockedUsersModal({
  isOpen,
  onClose,
  onUnblock,
}: BlockedUsersModalProps) {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBlockedUsers();
    }
  }, [isOpen]);

  const loadBlockedUsers = async () => {
    if (!user?.uid) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    console.log("차단된 사용자 목록 로드 시작:", user.uid);
    setLoading(true);
    try {
      const result = await getBlockedUsers(user.uid);
      console.log("차단된 사용자 목록 API 결과:", result);

      if (result.success && result.blockedUsers) {
        // 각 차단된 사용자의 프로필 정보 가져오기
        const usersWithProfile = await Promise.all(
          result.blockedUsers.map(async blockedUser => {
            try {
              const profileResult = await getUserProfile(
                blockedUser.blockedUid
              );
              return {
                ...blockedUser,
                userInfo: profileResult.success
                  ? {
                      nickname:
                        profileResult.data?.nickname ||
                        profileResult.data?.displayName ||
                        "알 수 없음",
                      profileImage:
                        profileResult.data?.photoURL ||
                        profileResult.data?.profileImage,
                    }
                  : {
                      nickname: "알 수 없음",
                      profileImage: undefined,
                    },
              };
            } catch (error) {
              console.error("프로필 정보 로드 실패:", error);
              return {
                ...blockedUser,
                userInfo: {
                  nickname: "알 수 없음",
                  profileImage: undefined,
                },
              };
            }
          })
        );

        console.log(
          "프로필 정보와 함께 처리된 차단된 사용자:",
          usersWithProfile
        );
        setBlockedUsers(usersWithProfile);
      } else {
        console.error("차단된 사용자 목록 로드 실패:", result.error);
        console.log("차단된 사용자 없음 또는 오류:", result);
        setBlockedUsers([]);
        if (result.error) {
          toast.error(
            result.error || "차단된 사용자 목록을 불러오는데 실패했습니다."
          );
        }
      }
    } catch (error) {
      console.error("차단된 사용자 목록 로드 실패:", error);
      toast.error("차단된 사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedUid: string) => {
    if (!confirm("차단을 해제하시겠습니까?")) {
      return;
    }

    if (!user?.uid) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setUnblocking(blockedUid);
    try {
      const result = await unblockUser(user.uid, blockedUid);

      if (result.success) {
        toast.success("차단이 해제되었습니다.");
        setBlockedUsers(prev =>
          prev.filter(user => user.blockedUid !== blockedUid)
        );
        onUnblock?.(blockedUid);
      } else {
        toast.error(result.error || "차단 해제에 실패했습니다.");
      }
    } catch (error) {
      console.error("차단 해제 실패:", error);
      toast.error("차단 해제에 실패했습니다.");
    } finally {
      setUnblocking(null);
    }
  };

  const formatDate = (timestamp: any) => {
    try {
      let date: Date;

      if (timestamp?.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime()) || !isFinite(date.getTime())) {
        return "알 수 없음";
      }

      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "알 수 없음";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              차단된 사용자
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 내용 */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
              <p className="text-gray-600">차단된 사용자를 불러오는 중...</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">
                차단된 사용자가 없습니다
              </p>
              <p className="text-gray-400 text-sm">
                차단한 사용자가 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map(blockedUser => (
                <Card key={blockedUser.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {blockedUser.userInfo?.profileImage ? (
                          <img
                            src={blockedUser.userInfo.profileImage}
                            alt={blockedUser.userInfo.nickname}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">
                            {blockedUser.userInfo?.nickname?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {blockedUser.userInfo?.nickname || "알 수 없음"}
                        </p>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDate(blockedUser.blockedAt)}에 차단됨
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUnblock(blockedUser.blockedUid)}
                      disabled={unblocking === blockedUser.blockedUid}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      {unblocking === blockedUser.blockedUid
                        ? "해제 중..."
                        : "차단 해제"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            차단을 해제하면 해당 사용자와 다시 채팅할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
