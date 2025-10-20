"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Music,
  Loader2,
  Edit,
  Save,
  X,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface AnalysisRequest {
  id: string;
  userId: string;
  userNickname: string;
  fileName: string;
  audioUrl: string;
  analysisCategory: string;
  additionalRequest?: string;
  status: string;
  paymentStatus: string;
  paidAmount: number;
  requestedAt: any;
}

export default function AdminExpertFeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<AnalysisRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // 피드백 폼 데이터
  const [expertName, setExpertName] = useState("");
  const [expertTitle, setExpertTitle] = useState("");
  const [overallScore, setOverallScore] = useState(75);
  const [pitchScore, setPitchScore] = useState(75);
  const [rhythmScore, setRhythmScore] = useState(75);
  const [expressionScore, setExpressionScore] = useState(75);
  const [techniqueScore, setTechniqueScore] = useState(75);
  const [strengths, setStrengths] = useState<string[]>(["", "", ""]);
  const [improvements, setImprovements] = useState<string[]>(["", "", ""]);
  const [detailedComments, setDetailedComments] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([
    "",
    "",
    "",
  ]);

  useEffect(() => {
    if (!authLoading && user) {
      // 관리자 권한 확인
      if (!user.isAdmin) {
        toast.error("관리자 권한이 필요합니다.");
        router.push("/");
        return;
      }
      loadRequests();
    }
  }, [authLoading, user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, query, where, orderBy, getDocs } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      // 입금 확인 완료된 요청만 가져오기
      const q = query(
        collection(db, "expert_analysis_requests"),
        where("paymentStatus", "in", ["completed", "pending_confirmation"]),
        orderBy("requestedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AnalysisRequest[];

      setRequests(data);
    } catch (error) {
      console.error("요청 목록 로딩 실패:", error);
      toast.error("요청 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRequest = (request: AnalysisRequest) => {
    setSelectedRequest(request);
    setIsEditing(true);

    // 기존 피드백이 있으면 불러오기
    const existing = (request as any).analysisResult;
    if (existing) {
      setExpertName((request as any).expertName || "");
      setExpertTitle((request as any).expertTitle || "");
      setOverallScore(existing.overallScore || 75);
      setPitchScore(existing.scoreBreakdown?.pitch || 75);
      setRhythmScore(existing.scoreBreakdown?.rhythm || 75);
      setExpressionScore(existing.scoreBreakdown?.expression || 75);
      setTechniqueScore(existing.scoreBreakdown?.technique || 75);
      setStrengths(existing.strengths || ["", "", ""]);
      setImprovements(existing.improvements || ["", "", ""]);
      setDetailedComments(existing.detailedComments || "");
      setRecommendations(existing.recommendations || ["", "", ""]);
    } else {
      // 초기화
      setExpertName("");
      setExpertTitle("");
      setOverallScore(75);
      setPitchScore(75);
      setRhythmScore(75);
      setExpressionScore(75);
      setTechniqueScore(75);
      setStrengths(["", "", ""]);
      setImprovements(["", "", ""]);
      setDetailedComments("");
      setRecommendations(["", "", ""]);
    }
  };

  const handleSaveFeedback = async () => {
    if (!selectedRequest) return;

    // 유효성 검사
    if (!expertName.trim()) {
      toast.error("전문가 이름을 입력해주세요.");
      return;
    }

    if (!detailedComments.trim()) {
      toast.error("전문가 코멘트를 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );

      const db = getDb();
      const requestRef = doc(
        db,
        "expert_analysis_requests",
        selectedRequest.id
      );

      await updateDoc(requestRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        expertId: user?.uid,
        expertName: expertName.trim(),
        expertTitle: expertTitle.trim() || "",
        analysisResult: {
          overallScore,
          scoreBreakdown: {
            pitch: pitchScore,
            rhythm: rhythmScore,
            expression: expressionScore,
            technique: techniqueScore,
          },
          strengths: strengths.filter(s => s.trim()),
          improvements: improvements.filter(i => i.trim()),
          detailedComments: detailedComments.trim(),
          recommendations: recommendations.filter(r => r.trim()),
        },
      });

      toast.success("피드백이 저장되었습니다!");
      setIsEditing(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error("피드백 저장 실패:", error);
      toast.error("피드백 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (request: AnalysisRequest) => {
    if (request.status === "completed") {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          완료
        </span>
      );
    }
    if (request.paymentStatus === "pending_confirmation") {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          입금확인대기
        </span>
      );
    }
    if (request.status === "in_progress") {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          분석중
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
        대기중
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            접근 권한이 없습니다
          </h2>
          <Button onClick={() => router.push("/")}>홈으로 가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            전문가 피드백 관리
          </h1>
          <p className="text-gray-600">
            입금 확인된 요청에 대한 전문가 피드백을 작성하고 관리합니다
          </p>
        </div>

        {isEditing && selectedRequest ? (
          /* 피드백 작성 폼 */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                피드백 작성: {selectedRequest.userNickname}님
              </h2>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedRequest(null);
                }}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </div>

            {/* 요청 정보 */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">분석 분야:</span>{" "}
                  <span className="font-semibold">
                    {selectedRequest.analysisCategory}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">파일명:</span>{" "}
                  <span className="font-semibold">
                    {selectedRequest.fileName}
                  </span>
                </div>
                {selectedRequest.additionalRequest && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">추가 요청:</span>{" "}
                    <span className="font-semibold">
                      {selectedRequest.additionalRequest}
                    </span>
                  </div>
                )}
              </div>

              {/* 오디오 플레이어 */}
              <div className="mt-3">
                <audio
                  src={selectedRequest.audioUrl}
                  controls
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* 전문가 정보 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    전문가 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={expertName}
                    onChange={e => setExpertName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    전문가 직함
                  </label>
                  <input
                    type="text"
                    value={expertTitle}
                    onChange={e => setExpertTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="보컬 트레이너"
                  />
                </div>
              </div>

              {/* 점수 입력 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  점수 평가
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      종합 점수: {overallScore}점
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={overallScore}
                      onChange={e => setOverallScore(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      음정 정확도: {pitchScore}점
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pitchScore}
                      onChange={e => setPitchScore(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      리듬 안정성: {rhythmScore}점
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={rhythmScore}
                      onChange={e => setRhythmScore(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      표현력: {expressionScore}점
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={expressionScore}
                      onChange={e =>
                        setExpressionScore(parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      테크닉: {techniqueScore}점
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={techniqueScore}
                      onChange={e =>
                        setTechniqueScore(parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 강점 */}
              <div>
                <h3 className="text-lg font-bold text-green-600 mb-4">
                  ✅ 강점
                </h3>
                {strengths.map((strength, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      value={strength}
                      onChange={e => {
                        const newStrengths = [...strengths];
                        newStrengths[index] = e.target.value;
                        setStrengths(newStrengths);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={`강점 ${index + 1}`}
                    />
                  </div>
                ))}
                <Button
                  onClick={() => setStrengths([...strengths, ""])}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  + 강점 추가
                </Button>
              </div>

              {/* 개선점 */}
              <div>
                <h3 className="text-lg font-bold text-orange-600 mb-4">
                  📈 개선점
                </h3>
                {improvements.map((improvement, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      value={improvement}
                      onChange={e => {
                        const newImprovements = [...improvements];
                        newImprovements[index] = e.target.value;
                        setImprovements(newImprovements);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={`개선점 ${index + 1}`}
                    />
                  </div>
                ))}
                <Button
                  onClick={() => setImprovements([...improvements, ""])}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  + 개선점 추가
                </Button>
              </div>

              {/* 전문가 코멘트 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  💬 전문가 상세 코멘트 <span className="text-red-500">*</span>
                </h3>
                <textarea
                  value={detailedComments}
                  onChange={e => setDetailedComments(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="회원님의 음악에 대한 상세한 피드백을 작성해주세요..."
                />
              </div>

              {/* 추천 연습법 */}
              <div>
                <h3 className="text-lg font-bold text-blue-600 mb-4">
                  📚 추천 연습법
                </h3>
                {recommendations.map((rec, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      value={rec}
                      onChange={e => {
                        const newRecs = [...recommendations];
                        newRecs[index] = e.target.value;
                        setRecommendations(newRecs);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`추천 연습법 ${index + 1}`}
                    />
                  </div>
                ))}
                <Button
                  onClick={() => setRecommendations([...recommendations, ""])}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  + 연습법 추가
                </Button>
              </div>

              {/* 저장 버튼 */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleSaveFeedback}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-lg font-bold"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      피드백 저장 및 완료
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* 요청 목록 */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              피드백 대기 목록 ({requests.length}건)
            </h2>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">대기 중인 요청이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {request.userNickname}님
                          </h3>
                          {getStatusBadge(request)}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">분석 분야:</span>{" "}
                            {request.analysisCategory}
                          </p>
                          <p>
                            <span className="font-medium">파일명:</span>{" "}
                            {request.fileName}
                          </p>
                          <p>
                            <span className="font-medium">신청일:</span>{" "}
                            {request.requestedAt
                              ?.toDate?.()
                              ?.toLocaleDateString("ko-KR")}
                          </p>
                          {request.additionalRequest && (
                            <p>
                              <span className="font-medium">추가 요청:</span>{" "}
                              {request.additionalRequest}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">
                          {request.paidAmount.toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    {/* 오디오 플레이어 */}
                    <div className="mb-4">
                      <audio
                        src={request.audioUrl}
                        controls
                        className="w-full"
                      />
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditRequest(request)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {request.status === "completed"
                          ? "피드백 수정"
                          : "피드백 작성"}
                      </Button>
                      {request.status === "completed" && (
                        <Button
                          onClick={() => router.push(`/feedback/${request.id}`)}
                          variant="outline"
                        >
                          결과 보기
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}





