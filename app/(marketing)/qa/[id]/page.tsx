"use client";

import { QaDetail } from "../../../../components/qa/QaDetail";
import { useAuth } from "../../../../lib/hooks/useAuth";

interface QaDetailPageProps {
  params: {
    id: string;
  };
}

export default function QaDetailPage({ params }: QaDetailPageProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QaDetail
          questionId={params.id}
          userId={user?.uid}
          showBackButton={true}
        />
      </div>
    </div>
  );
}
