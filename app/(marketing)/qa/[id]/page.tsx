"use client";

import { QaDetail } from "../../../../components/qa/QaDetail";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { useParams } from "next/navigation";

export default function QaDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QaDetail
          questionId={id}
          userId={user?.uid}
          showBackButton={true}
        />
      </div>
    </div>
  );
}
