"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Package,
  Heart,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Bell,
  Trash2,
  ShoppingCart,
  Coins,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribeToNotifications,
  subscribeToUnreadNotificationCount,
} from "../../lib/api/notifications";
import { Notification } from "../../data/types";

export function ProfileDropdown() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 실제 알림 데이터
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // 알림 데이터 로드 및 실시간 구독
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }

    // 초기 알림 로드
    const loadNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        const result = await getUserNotifications(user.uid, 20);
        if (result.success && result.notifications) {
          setNotifications(result.notifications);
        }
      } catch (error) {
        console.error("알림 로드 실패:", error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    loadNotifications();

    // 실시간 알림 구독
    const unsubscribeNotifications = subscribeToNotifications(
      user.uid,
      newNotifications => {
        setNotifications(newNotifications);
      },
      error => {
        console.error("알림 구독 오류:", error);
      }
    );

    // 실시간 읽지 않은 알림 개수 구독
    const unsubscribeUnreadCount = subscribeToUnreadNotificationCount(
      user.uid,
      count => {
        setUnreadNotificationCount(count);
      },
      error => {
        console.error("읽지 않은 알림 개수 구독 오류:", error);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.uid]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await logout();
    } catch (error) {
      console.error("로그아웃 실패:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
      // 로그아웃 실패해도 홈으로 이동
      router.push("/");
    }
  };

  // 개별 알림 삭제
  const handleDeleteNotification = async (id: string) => {
    if (!user?.uid) return;

    try {
      const result = await deleteNotification(id, user.uid);
      if (result.success) {
        toast.success("알림이 삭제되었습니다.");
      } else {
        toast.error(result.error || "알림 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("알림 삭제 오류:", error);
      toast.error("알림 삭제에 실패했습니다.");
    }
  };

  // 모든 알림 삭제
  const handleDeleteAllNotifications = async () => {
    if (!user?.uid) return;

    try {
      const result = await deleteAllNotifications(user.uid);
      if (!result.success) {
        toast.error(result.error || "알림 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("알림 삭제 오류:", error);
      toast.error("알림 삭제에 실패했습니다.");
    }
  };

  // 알림 클릭 - 읽음 처리 + 해당 페이지로 이동
  const handleNotificationClick = async (notification: Notification) => {
    if (!user?.uid) return;

    // 읽지 않은 알림이면 읽음 처리
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id, user.uid);
      } catch (error) {
        console.error("알림 읽음 처리 오류:", error);
      }
    }

    // 링크가 있으면 해당 페이지로 이동
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">
            로그인
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {user.nickname?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-700">
            {user.nickname}
          </span>
          <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full text-white text-xs font-bold shadow-sm">
              P
            </span>
            {(user.points || 0).toLocaleString()} 포인트
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* 사용자 정보 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-600">
                    {user.nickname?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {user.nickname}
                </div>
                {/* 이메일 제거됨 */}
              </div>
            </div>
            {/* 포인트 잔액 */}
            <Link
              href="/profile/points"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 hover:from-blue-100 hover:to-purple-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full text-white text-sm font-bold shadow-sm">
                  P
                </span>
                <span className="text-sm font-medium text-gray-700">
                  내 포인트
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {(user.points || 0).toLocaleString()} 포인트
              </span>
            </Link>
          </div>

          {/* 알림 섹션 (접을 수 있음) */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <Bell className="w-4 h-4 mr-3" />
                알림
                {unreadNotificationCount > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadNotificationCount}
                  </span>
                )}
              </div>
              {isNotificationOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* 알림 목록 */}
            {isNotificationOpen && (
              <div className="px-2 pb-2 max-h-64 overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">
                      알림을 불러오는 중...
                    </p>
                  </div>
                ) : notifications.length > 0 ? (
                  <>
                    <div className="flex justify-end px-2 py-1">
                      <button
                        onClick={handleDeleteAllNotifications}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        모두 삭제
                      </button>
                    </div>
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`flex items-start justify-between px-3 py-2 rounded-lg group cursor-pointer transition-colors ${
                          notification.isRead
                            ? "hover:bg-gray-50"
                            : "bg-blue-50 hover:bg-blue-100"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-1 pr-2">
                          {/* 읽지 않은 알림은 진한 파란색, 읽은 알림은 회색 */}
                          <p
                            className={`text-xs ${
                              notification.isRead
                                ? "text-gray-600"
                                : "text-blue-900 font-medium"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.createdAt &&
                              new Date(
                                notification.createdAt.seconds * 1000
                              ).toLocaleString("ko-KR", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation(); // 알림 클릭 이벤트 방지
                            handleDeleteNotification(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-gray-500">알림이 없습니다</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 프로필 보기 */}
          <div className="py-1 border-b border-gray-100">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 mr-3" />
              프로필 보기
            </Link>

            {/* 채팅 */}
            <Link
              href="/chat"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle className="w-4 h-4 mr-3" />
              채팅
            </Link>
          </div>

          {/* 내 상품 섹션 */}
          <div className="py-1">
            <Link
              href="/profile/items"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <Package className="w-4 h-4 mr-3" />내 상품
            </Link>

            <Link
              href="/profile/wishlist"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <Heart className="w-4 h-4 mr-3" />
              찜한 상품
            </Link>

            <Link
              href="/profile/transactions"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <CreditCard className="w-4 h-4 mr-3" />
              거래 내역
            </Link>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-3" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
