"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { motion } from "framer-motion";
import {
  Download,
  Share2,
  ArrowLeft,
  Loader2,
  Star,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle,
  FileText,
  Copy,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Link from "next/link";

interface FeedbackData {
  id: string;
  userId: string;
  userNickname: string;
  fileName: string;
  analysisCategory: string;
  additionalRequest?: string;
  status: string;
  paidAmount: number;
  requestedAt: any;
  completedAt: any;
  expertId?: string;
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
  shareableLink?: string;
  shareableUntil?: any;
}

export default function FeedbackViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const feedbackId = params.id as string;

  useEffect(() => {
    if (!authLoading) {
      loadFeedback();
    }
  }, [authLoading, feedbackId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { doc, getDoc } = await import("firebase/firestore");

      const db = getDb();
      const feedbackRef = doc(db, "expert_analysis_requests", feedbackId);
      const feedbackDoc = await getDoc(feedbackRef);

      if (!feedbackDoc.exists()) {
        toast.error("피드백을 찾을 수 없습니다.");
        router.push("/profile");
        return;
      }

      const data = feedbackDoc.data() as FeedbackData;

      // 권한 확인 (본인 또는 공유 링크)
      if (user && data.userId !== user.uid) {
        toast.error("접근 권한이 없습니다.");
        router.push("/profile");
        return;
      }

      setFeedback({ ...data, id: feedbackId });

      // 공유 링크 있으면 설정
      if (data.shareableLink) {
        setShareLink(
          `${window.location.origin}/feedback/shared/${data.shareableLink}`
        );
      }
    } catch (error) {
      console.error("피드백 로딩 실패:", error);
      toast.error("피드백을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      // PDF 생성 API 호출
      const response = await fetch("/api/generate-feedback-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId }),
      });

      if (!response.ok) {
        throw new Error("PDF 생성 실패");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ConnecTone_전문가피드백_${feedback?.userNickname}_${new Date().toLocaleDateString("ko-KR").replace(/\. /g, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF 다운로드가 완료되었습니다!");
    } catch (error) {
      console.error("PDF 다운로드 실패:", error);
      toast.error("PDF 다운로드에 실패했습니다.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // 공유 링크 생성
  const handleGenerateShareLink = async () => {
    setGeneratingLink(true);
    try {
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );

      const db = getDb();
      const uniqueId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // 7일 후 만료
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      await updateDoc(doc(db, "expert_analysis_requests", feedbackId), {
        shareableLink: uniqueId,
        shareableUntil: expiryDate,
        sharedAt: serverTimestamp(),
      });

      const link = `${window.location.origin}/feedback/shared/${uniqueId}`;
      setShareLink(link);
      toast.success("공유 링크가 생성되었습니다!");
    } catch (error) {
      console.error("공유 링크 생성 실패:", error);
      toast.error("공유 링크 생성에 실패했습니다.");
    } finally {
      setGeneratingLink(false);
    }
  };

  // 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    toast.success("링크가 복사되었습니다!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (typeof window !== "undefined" && (window as any).Kakao) {
      (window as any).Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: `🎵 ${feedback?.userNickname}님의 전문가 피드백`,
          description: `ConnecTone 전문가가 분석한 ${feedback?.analysisCategory} 피드백`,
          imageUrl: "https://connectone-8b414.web.app/logo1.png",
          link: {
            mobileWebUrl: shareLink,
            webUrl: shareLink,
          },
        },
        buttons: [
          {
            title: "피드백 보기",
            link: {
              mobileWebUrl: shareLink,
              webUrl: shareLink,
            },
          },
        ],
      });
      toast.success("카카오톡으로 공유되었습니다!");
    } else {
      toast.error("카카오톡 공유 기능을 사용할 수 없습니다.");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">피드백을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            피드백을 찾을 수 없습니다
          </h2>
          <Button onClick={() => router.push("/profile")}>
            프로필로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">프로필로 돌아가기</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h1 className="text-3xl font-bold text-gray-900">
                    전문가 피드백 리포트
                  </h1>
                </div>
                <p className="text-gray-600">
                  ConnecTone 인증 전문가의 상세한 분석 리포트
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full mb-2">
                  <Award className="w-4 h-4" />
                  <span className="font-bold text-sm">CERTIFIED</span>
                </div>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">회원님</p>
                <p className="font-semibold text-gray-900">
                  {feedback.userNickname}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">분석 분야</p>
                <p className="font-semibold text-gray-900">
                  {feedback.analysisCategory}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">전문가</p>
                <p className="font-semibold text-gray-900">
                  {feedback.expertName || "전문가"}{" "}
                  {feedback.expertTitle && `(${feedback.expertTitle})`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">분석 완료일</p>
                <p className="font-semibold text-gray-900">
                  {feedback.completedAt
                    ?.toDate?.()
                    ?.toLocaleDateString("ko-KR") || "진행중"}
                </p>
              </div>
            </div>

            {/* 공유 및 다운로드 버튼 */}
            <div className="flex gap-3">
              <Button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    PDF 생성 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    PDF 다운로드
                  </>
                )}
              </Button>

              {!shareLink ? (
                <Button
                  onClick={handleGenerateShareLink}
                  disabled={generatingLink}
                  variant="outline"
                  className="flex-1"
                >
                  {generatingLink ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      공유 링크 생성
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="flex-1"
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      복사됨!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      링크 복사
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* 공유 링크 표시 */}
            {shareLink && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-800 mb-1">
                      공유 링크가 생성되었습니다!
                    </p>
                    <p className="text-xs text-green-700 mb-2">
                      이 링크는 7일간 유효합니다
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm"
                      />
                      <Button
                        onClick={handleKakaoShare}
                        size="sm"
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                      >
                        카카오톡 공유
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* 피드백 내용 */}
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
                          Math.round(feedback.analysisResult.overallScore / 20)
                            ? "fill-yellow-300 text-yellow-300"
                            : "text-white opacity-30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-32 h-32 relative">
                  <svg
                    className="w-32 h-32 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="white"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${feedback.analysisResult.overallScore * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {feedback.analysisResult.overallScore}
                    </span>
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

            {/* 추가 요청사항이 있었다면 */}
            {feedback.additionalRequest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  💬 회원님의 질문
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700">{feedback.additionalRequest}</p>
                </div>
              </motion.div>
            )}

            {/* 하단 워터마크 */}
            <div className="text-center py-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
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
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">전문가가 분석 중입니다...</p>
            <p className="text-sm text-gray-500 mt-2">
              24-48시간 내에 결과를 받으실 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}





