"use client";

import { useParams } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QaDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">QA 페이지</h1>
        <p className="text-gray-600">이 페이지는 임시로 생성되었습니다.</p>
      </div>
    </div>
  );
}
