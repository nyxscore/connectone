import { getItem } from "../../../lib/api/products";
import { SellItem } from "../../../data/types";
import { TransactionPageClient } from "../../../components/transaction/TransactionPageClient";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Loader2, AlertCircle } from "lucide-react";

// Next.js 정적 생성 요구사항
export async function generateStaticParams() {
  try {
    // 실제 상품 ID들을 가져와서 정적 생성
    const { getItemList } = await import("../../../lib/api/products");
    const result = await getItemList({ limit: 100 }); // 최대 100개 상품

    if (result.success && result.items) {
      return result.items.map(item => ({
        id: item.id,
      }));
    }
  } catch (error) {
    console.error("generateStaticParams 에러:", error);
  }

  // 에러 시 빈 배열 반환
  return [];
}

interface TransactionPageProps {
  params: {
    id: string;
  };
}

export default async function TransactionPage({
  params,
}: TransactionPageProps) {
  const { id } = params;

  try {
    // 상품 정보 조회
    const result = await getItem(id);

    if (!result.success || !result.item) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">거래 정보를 찾을 수 없습니다.</p>
            <Button onClick={() => window.history.back()}>뒤로가기</Button>
          </div>
        </div>
      );
    }

    // Firebase Timestamp 객체를 일반 객체로 변환
    const serializedItem = {
      ...result.item,
      createdAt: result.item.createdAt?.toDate ? result.item.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: result.item.updatedAt?.toDate ? result.item.updatedAt.toDate().toISOString() : new Date().toISOString(),
    };

    return <TransactionPageClient item={serializedItem} />;
  } catch (error) {
    console.error("거래 정보 로드 실패:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">
            거래 정보를 불러오는데 실패했습니다.
          </p>
          <Button onClick={() => window.history.back()}>뒤로가기</Button>
        </div>
      </div>
    );
  }
}
