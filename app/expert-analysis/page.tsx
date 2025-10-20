"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExpertAnalysisPage() {
  const router = useRouter();

  useEffect(() => {
    // 홈으로 리다이렉트
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">페이지를 이동하는 중...</p>
      </div>
    </div>
  );
}
