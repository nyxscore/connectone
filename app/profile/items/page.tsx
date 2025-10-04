"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { ItemCard } from "../../../../components/items/ItemCard";
import { ProductDetailModal } from "../../../../components/product/ProductDetailModal";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { getUserItems } from "../../../../lib/api/items";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function MyItemsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            내 상품 관리
          </h1>
          <p className="text-gray-600">
            이 페이지는 임시로 비활성화되었습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
