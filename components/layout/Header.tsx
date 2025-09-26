"use client";

import Link from "next/link";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { logout } from "../../lib/auth";
import { useRouter } from "next/navigation";
import {
  getTotalUnreadMessageCount,
  subscribeToUnreadCount,
} from "../../lib/chat/api";
import { MessageCircle, Bell, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
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

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("로그아웃되었습니다.");
      router.push("/");
    } catch (error) {
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

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
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  안녕하세요, {user.nickname}님
                </span>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    프로필
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  로그아웃
                </Button>
              </div>
            ) : (
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
            )}
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

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/list"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                상품 목록
              </Link>
              <Link
                href={user ? "/product/new" : "/auth/login?next=/product/new"}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                상품 등록
              </Link>
              <Link
                href={user ? "/chat" : "/auth/login?next=/chat"}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center justify-between">
                  <span>채팅</span>
                  {user && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>

            {/* 모바일 사용자 메뉴 */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : user ? (
                <div className="px-4 space-y-3">
                  <div className="text-sm text-gray-700">
                    안녕하세요, {user.nickname}님
                  </div>
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        프로필
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      로그아웃
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-4 space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" size="sm" className="w-full">
                      로그인
                    </Button>
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button size="sm" className="w-full">
                      회원가입
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
