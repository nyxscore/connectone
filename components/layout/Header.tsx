"use client";

import Link from "next/link";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { ProfileDropdown } from "../profile/ProfileDropdown";
import {
  getTotalUnreadMessageCount,
  subscribeToUnreadCount,
} from "../../lib/chat/api";
import { MessageCircle, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const { user, loading, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 읽지 않은 메시지 개수 로드
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    // 초기 로드
    const loadUnreadCount = async () => {
      try {
        const result = await getTotalUnreadMessageCount(user.uid);
        if (result.success) {
          setUnreadCount(result.count || 0);
        }
      } catch (error) {
        console.error("읽지 않은 메시지 개수 로드 실패:", error);
      }
    };

    loadUnreadCount();

    // 실시간 구독
    const unsubscribe = subscribeToUnreadCount(
      user.uid,
      count => {
        setUnreadCount(count);
      },
      error => {
        console.error("읽지 않은 메시지 구독 오류:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center -space-x-2">
              <img
                src="/logo1.png"
                alt="ConnecTone Logo 1"
                className="h-7 w-auto object-contain sm:h-9"
              />
              <img
                src="/logo2.png"
                alt="ConnecTone Logo 2"
                className="h-6 w-auto object-contain sm:h-8"
              />
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/list"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              상품 목록
            </Link>
            <Link
              href={user ? "/product/new" : "/auth/login?next=/product/new"}
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              상품 등록
            </Link>
            <Link
              href={user ? "/chat" : "/auth/login?next=/chat"}
              className="relative text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>채팅</span>
                {user && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full h-2 w-2 shadow-lg animate-pulse"></span>
                )}
              </div>
            </Link>
          </nav>

          {/* 데스크톱 사용자 메뉴 */}
          <div className="hidden md:flex items-center space-x-4">
            <ProfileDropdown />
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center space-x-2">
            {/* 모바일 채팅 알림 */}
            {user && unreadCount > 0 && (
              <Link href="/chat" className="relative p-2">
                <MessageCircle className="w-6 h-6 text-gray-700" />
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full h-2.5 w-2.5 flex items-center justify-center text-xs text-white font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 - 프로필 우선 배치 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            {/* 사용자 프로필 섹션 - 맨 위로 이동 */}
            <div className="px-4 py-4 border-b border-gray-200">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : user ? (
                <div className="flex items-center justify-between">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-3 transition-colors flex-1"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {user.photoURL || user.profileImage ? (
                        <img
                          src={user.photoURL || user.profileImage}
                          alt={user.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-medium text-gray-600">
                          {user.nickname?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-base font-medium text-gray-700">
                        {user.nickname}
                      </div>
                    </div>
                  </Link>
                  
                  {/* 로그아웃 버튼 */}
                  <button
                    onClick={async () => {
                      if (confirm("로그아웃 하시겠습니까?")) {
                        await logout();
                        setIsMobileMenuOpen(false);
                        window.location.href = "/";
                      }
                    }}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md font-medium transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" size="sm" className="w-full">
                      로그인
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* 메뉴 항목들 */}
            {user && (
              <div className="px-4 py-3 space-y-1">
                <Link
                  href="/profile/items"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                >
                  내 상품
                </Link>
                <Link
                  href="/profile/transactions"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                >
                  거래 현황
                </Link>
                <Link
                  href="/profile/transactions"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                >
                  거래내역
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
