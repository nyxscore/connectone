"use client";

import { useState, useEffect } from "react";
import { QaList } from "../../../components/qa/QaList";
import { getQaStats } from "../../../lib/qna/api";
import { QaStats } from "../../../data/qna/types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import {
  MessageCircle,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function QaPage() {
  const [stats, setStats] = useState<QaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await getQaStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error("통계 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">공개 Q&A</h1>
          <p className="text-gray-600">
            궁금한 점을 질문하고 답변을 받아보세요
          </p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">전체 질문</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalQuestions.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    해결된 질문
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.resolvedQuestions.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    미해결 질문
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.unresolvedQuestions.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">전체 답변</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalAnswers.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 인기 태그 */}
        {stats && stats.popularTags.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">인기 태그</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.popularTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  #{tag.tag} ({tag.count})
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 질문 작성 버튼 */}
        <div className="mb-6">
          <Link href="/qa/write">
            <Button size="lg" className="w-full sm:w-auto">
              <MessageCircle className="w-5 h-5 mr-2" />새 질문 작성하기
            </Button>
          </Link>
        </div>

        {/* 질문 목록 */}
        <QaList showFilters={true} showStats={false} />
      </div>
    </div>
  );
}
