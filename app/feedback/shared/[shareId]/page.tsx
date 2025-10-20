"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Star,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface FeedbackData {
  id: string;
  userNickname: string;
  analysisCategory: string;
  completedAt: any;
  expertName?: string;
  expertTitle?: string;
  analysisResult?: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    detailedComments: string;
    recommendations: string[];
    scoreBreakdown: {
      pitch: number;
      rhythm: number;
      expression: number;
      technique: number;
    };
  };
  shareableUntil?: any;
}

export default function SharedFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  const shareId = params.shareId as string;

  useEffect(() => {
    loadSharedFeedback();
  }, [shareId]);

  const loadSharedFeedback = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );

      const db = getDb();
      const q = query(
        collection(db, "expert_analysis_requests"),
        where("shareableLink", "==", shareId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("공유된 피드백을 찾을 수 없습니다.");
        setExpired(true);
        return;
      }

      const data = snapshot.docs[0].data() as FeedbackData;

      // 만료 확인
      if (data.shareableUntil) {
        const expiryDate = data.shareableUntil.toDate();
        if (new Date() > expiryDate) {
          toast.error("공유 링크가 만료되었습니다.");
          setExpired(true);
          return;
        }
      }

      setFeedback({ ...data, id: snapshot.docs[0].id });
    } catch (error) {
      console.error("공유 피드백 로딩 실패:", error);
      toast.error("피드백을 불러올 수 없습니다.");
      setExpired(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">피드백을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (expired || !feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            공유 링크가 만료되었거나 유효하지 않습니다
          </h2>
          <p className="text-gray-600 mb-6">
            링크를 다시 확인하거나 회원님께 새로운 링크를 요청해주세요.
          </p>
          <Button onClick={() => router.push("/")}>홈으로 가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 상단 배너 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ConnecTone 전문가 피드백
                </h1>
                <p className="text-sm text-gray-600">
                  {feedback.userNickname}님의 {feedback.analysisCategory} 분석
                  리포트
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full">
                <Award className="w-4 h-4" />
                <span className="font-bold text-xs">CERTIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* 피드백 내용 (동일한 내용) */}
        {feedback.analysisResult ? (
          <div className="space-y-6">
            {/* 종합 평가 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-6 h-6" />
                종합 평가
              </h2>
              <div className="flex items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-black">
                      {feedback.analysisResult.overallScore}
                    </span>
                    <span className="text-2xl font-bold opacity-80">/ 100</span>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <=
                          Math.round(feedback.analysisResult!.overallScore / 20)
                            ? "fill-yellow-300 text-yellow-300"
                            : "text-white opacity-30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 세부 점수 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                세부 평가
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(
                  feedback.analysisResult.scoreBreakdown || {}
                ).map(([key, score]) => {
                  const labels: { [key: string]: string } = {
                    pitch: "음정 정확도",
                    rhythm: "리듬 안정성",
                    expression: "표현력",
                    technique: "테크닉",
                  };
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {labels[key]}
                        </span>
                        <span className="text-2xl font-bold text-purple-600">
                          {score}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            score >= 80
                              ? "bg-green-500"
                              : score >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* 강점 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-xl font-bold text-green-600 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                강점
              </h2>
              <ul className="space-y-3">
                {feedback.analysisResult.strengths?.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <span className="flex-1">{strength}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* 개선점 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                개선점
              </h2>
              <ul className="space-y-3">
                {feedback.analysisResult.improvements?.map(
                  (improvement, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-600 font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <span className="flex-1">{improvement}</span>
                    </li>
                  )
                )}
              </ul>
            </motion.div>

            {/* 전문가 코멘트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                💬 전문가 상세 코멘트
              </h2>
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {feedback.analysisResult.detailedComments}
                </p>
              </div>
            </motion.div>

            {/* 추천 연습법 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-xl font-bold text-blue-600 mb-6 flex items-center gap-2">
                📚 추천 연습법
              </h2>
              <ul className="space-y-3">
                {feedback.analysisResult.recommendations?.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* 하단 워터마크 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-2 border-purple-200">
              <p className="text-lg font-bold text-purple-600 mb-2">
                🎵 ConnecTone
              </p>
              <p className="text-sm text-gray-600 mb-2">
                이 리포트는 ConnecTone의 인증 전문가가 작성했습니다
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>
                  발급일:{" "}
                  {feedback.completedAt
                    ?.toDate?.()
                    ?.toLocaleDateString("ko-KR")}
                </span>
              </div>
              {feedback.shareableUntil && (
                <p className="text-xs text-gray-400 mt-2">
                  이 링크는{" "}
                  {feedback.shareableUntil.toDate().toLocaleDateString("ko-KR")}
                  까지 유효합니다
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-3">
                  나도 전문가 피드백을 받고 싶다면?
                </p>
                <Button
                  onClick={() => router.push("/expert-analysis")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  전문가 피드백 신청하기
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">피드백이 아직 작성되지 않았습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
