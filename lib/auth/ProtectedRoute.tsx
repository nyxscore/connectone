"use client";

import { useAuth } from "../hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // NextAuth 세션이 있으면 Firebase Auth 대신 사용
  const isUserAuthenticated = user || session?.user;
  const isUserLoading = isLoading || sessionStatus === "loading";

  useEffect(() => {
    // 로딩 중이 아니고, 사용자가 없을 때만 리다이렉트
    if (!isUserLoading && !isUserAuthenticated) {
      // 현재 페이지 URL을 callbackUrl로 전달
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [isUserLoading, isUserAuthenticated, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isUserAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
