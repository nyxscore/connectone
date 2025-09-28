"use client";

import { useAuth } from "../../../lib/hooks/useAuth";
import { WishlistItems } from "../../../components/profile/WishlistItems";
import { Button } from "../../../components/ui/Button";
import { ArrowLeft, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <Button onClick={() => router.push("/auth/login")}>로그인하기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>뒤로</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-red-500" />
              <h1 className="text-xl font-semibold text-gray-900">찜한 상품</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 찜한 상품 목록 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <WishlistItems
          userId={user.uid}
            onItemClick={item => {
              // 상품 상세 페이지로 이동
              router.push(`/item/${item.id}`);
            }}
          showMoreButton={false}
        />
      </div>
    </div>
  );
}
