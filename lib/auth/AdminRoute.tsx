"use client";

import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { getFirebaseAuth as getAuth } from "../api/firebase-ultra-safe";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Firebase Custom Claims로 관리자 권한 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const auth = getAuth();
        if (!auth?.currentUser) {
          setIsAdmin(false);
          setCheckingAdmin(false);
          return;
        }

        // Firebase Custom Claims 확인
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        const hasAdminClaim = idTokenResult.claims.admin === true;
        const isGradeA = user.grade === "A";

        console.log("🔒 관리자 권한 확인:", {
          uid: user.uid,
          hasAdminClaim,
          isGradeA,
          claims: idTokenResult.claims,
        });

        // Custom Claims 또는 Grade A 둘 중 하나라도 만족하면 관리자
        const adminStatus = hasAdminClaim || isGradeA;
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          console.warn("⚠️ 관리자 권한 없음 - 메인 페이지로 리다이렉트");
          router.push("/");
        }
      } catch (error) {
        console.error("❌ 관리자 권한 확인 실패:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!isLoading) {
      checkAdminStatus();
    }
  }, [user, isLoading, router]);

  if (isLoading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700">
            {isLoading ? "로딩 중..." : "관리자 권한 확인 중..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user || isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600">
            관리자 페이지에 접근하려면 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  // 이중 검증 통과한 경우에만 children 렌더링
  if (isAdmin === true) {
    return <>{children}</>;
  }

  // 기본적으로 접근 거부
  return null;
}
