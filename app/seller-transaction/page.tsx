"use client";

import { useSearchParams } from "next/navigation";
import { SellerTransactionPageClient } from "../../components/transaction/SellerTransactionPageClient";
import { useEffect, useState, Suspense } from "react";
import { getItem } from "../../lib/api/products";
import { SellItem } from "../../data/types";
import { Loader2 } from "lucide-react";

function SellerTransactionContent() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get("id");
  const [item, setItem] = useState<SellItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        setError("상품 ID가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const result = await getItem(itemId);

        if (!result.success || !result.item) {
          setError("상품을 찾을 수 없습니다.");
          return;
        }

        const itemData = result.item;

        // 데이터 직렬화 (Firebase Timestamp를 ISO string으로 변환)
        const serializedItem = {
          ...itemData,
          createdAt:
            itemData.createdAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          updatedAt:
            itemData.updatedAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
        };

        setItem(serializedItem);
      } catch (error) {
        console.error("상품 정보 로드 실패:", error);
        setError("상품 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            오류가 발생했습니다
          </h1>
          <p className="text-gray-600">{error || "상품을 찾을 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  return <SellerTransactionPageClient item={item} />;
}

export default function SellerTransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      }
    >
      <SellerTransactionContent />
    </Suspense>
  );
}
