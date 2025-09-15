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
import { MessageCircle, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

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
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🎵</span>
              <span className="text-xl font-bold text-blue-600">
                ConnecTone
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link
              href="/list"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              상품 목록
            </Link>
            <Link
              href="/qa"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              Q&A
            </Link>
            {user && (
              <>
                <Link
                  href="/sell"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  상품 등록
                </Link>
                <Link
                  href="/chat"
                  className="relative text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>채팅</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-3 w-3 shadow-lg animate-pulse"></span>
                    )}
                  </div>
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </header>
  );
}
