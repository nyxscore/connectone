"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { logout } from "../../lib/auth";
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
} from "lucide-react";
import toast from "react-hot-toast";

// Mock 알림 타입
interface Notification {
  id: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  link?: string; // 알림 클릭 시 이동할 링크
  type?: "chat" | "product" | "transaction" | "system"; // 알림 종류
}

export function ProfileDropdown() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock 알림 데이터 (나중에 실제 API로 교체)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      message: "새로운 채팅 메시지가 도착했습니다.",
      createdAt: new Date(),
      isRead: false,
      link: "/chat",
      type: "chat",
    },
    {
      id: "2",
      message: "상품이 판매되었습니다.",
      createdAt: new Date(Date.now() - 3600000),
      isRead: false,
      link: "/profile/items",
      type: "product",
    },
    {
      id: "3",
      message: "거래가 완료되었습니다.",
      createdAt: new Date(Date.now() - 7200000),
      isRead: true,
      link: "/profile/transactions",
      type: "transaction",
    },
  ]);

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

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
      await logout();
      toast.success("로그아웃되었습니다.");
      router.push("/");
      setIsOpen(false);
    } catch (error) {
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // 개별 알림 삭제
  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("알림이 삭제되었습니다.");
  };

  // 모든 알림 삭제
  const handleDeleteAllNotifications = () => {
    setNotifications([]);
    toast.success("모든 알림이 삭제되었습니다.");
  };

  // 알림 클릭 - 읽음 처리 + 해당 페이지로 이동
  const handleNotificationClick = (notification: Notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
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
        <Link href="/auth/signup">
          <Button size="sm">회원가입</Button>
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
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.nickname}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* 사용자 정보 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
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
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
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
                {notifications.length > 0 ? (
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
                            {new Date(notification.createdAt).toLocaleString(
                              "ko-KR",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
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
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 mr-3" />
              프로필 보기
            </Link>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-100 my-1"></div>

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
