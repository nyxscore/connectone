"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleRedirectResult } from "@/lib/auth/snsAuth";
import toast from "react-hot-toast";

function NaverCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleNaverCallback = async () => {
      try {
        const result = await handleRedirectResult();

        if (result) {
          toast.success("네이버 로그인이 완료되었습니다!");
          router.push("/");
        } else {
          toast.error("네이버 로그인에 실패했습니다.");
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("네이버 로그인 콜백 오류:", error);
        toast.error("로그인 중 오류가 발생했습니다.");
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    handleNaverCallback();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">네이버 로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function NaverCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">네이버 로그인 처리 중...</p>
          </div>
        </div>
      }
    >
      <NaverCallbackContent />
    </Suspense>
  );
}
