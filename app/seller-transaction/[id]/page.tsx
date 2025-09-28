import { notFound } from "next/navigation";
import { getItem } from "../../../lib/api/products";
import { SellerTransactionPageClient } from "../../../components/transaction/SellerTransactionPageClient";

interface SellerTransactionPageProps {
  params: {
    id: string;
  };
}

export default async function SellerTransactionPage({
  params,
}: SellerTransactionPageProps) {
  const { id } = params;

  try {
    const result = await getItem(id);
    
    if (!result.success || !result.item) {
      notFound();
    }

    const item = result.item;

    // 데이터 직렬화 (Firebase Timestamp를 ISO string으로 변환)
    const serializedItem = {
      ...item,
      createdAt: item.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: item.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };

    return <SellerTransactionPageClient item={serializedItem} />;
  } catch (error) {
    console.error("상품 정보 로드 실패:", error);
    notFound();
  }
}

export async function generateStaticParams() {
  return [];
}
