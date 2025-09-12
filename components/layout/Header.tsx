"use client";

import Link from "next/link";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { logout } from "../../lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  채팅
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
