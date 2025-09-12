"use client";

import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  console.log("ProtectedRoute 상태:", {
    isAuthenticated,
    isLoading,
    user: !!user,
    userObject: user,
  });

  useEffect(() => {
    console.log("ProtectedRoute useEffect 실행:", {
      isLoading,
      isAuthenticated,
      user: !!user,
    });

    // 로딩 중이 아니고, 사용자가 없을 때만 리다이렉트
    if (!isLoading && !user) {
      console.log("로그인되지 않음, 로그인 페이지로 리다이렉트");
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
