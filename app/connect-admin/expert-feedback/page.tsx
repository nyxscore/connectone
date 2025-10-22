"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useState, useEffect } from "react";
import {
  Music,
  Loader2,
  Edit,
  Save,
  X,
  CheckCircle,
  Clock,
  ChevronLeft,
  Play,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../lib/hooks/useAuth";

interface AnalysisRequest {
  id: string;
  userId: string;
  userNickname: string;
  userEmail?: string;
  fileName: string;
  audioUrl: string;
  analysisCategory: string;
  additionalRequest?: string;
  status: string;
  paymentStatus: string;
  paidAmount: number;
  requestedAt: any;
  completedAt?: any;
  expertId?: string;
  expertName?: string;
  expertTitle?: string;
  analysisResult?: {
    overallScore: number;
    scoreBreakdown: {
      pitch: number;
      rhythm: number;
      expression: number;
      technique: number;
    };
    strengths: string[];
    improvements: string[];
    detailedComments: string;
    recommendations: string[];
  };
}

export default function AdminExpertFeedbackPage() {
  const { user: currentAdmin } = useAuth();
  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<AnalysisRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, query, where, orderBy, getDocs } = await import(
        "firebase/firestore"
      );

      const db = getDb();

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

    const existing = request.analysisResult;
    if (existing) {
      setExpertName(request.expertName || "");
      setExpertTitle(request.expertTitle || "");
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
      resetForm();
    }
  };

  const resetForm = () => {
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
  };

  const handleSaveFeedback = async () => {
    if (!selectedRequest || !currentAdmin) return;

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
        expertId: currentAdmin.uid,
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

      const { logAdminAction } = await import("../../../lib/admin/auditLog");
      await logAdminAction({
        adminUid: currentAdmin.uid,
        adminNickname: currentAdmin.nickname || "관리자",
        action: "COMPLETE_EXPERT_FEEDBACK",
        targetType: "expert_analysis",
        targetId: selectedRequest.id,
        details: {
          userId: selectedRequest.userId,
          userNickname: selectedRequest.userNickname,
          expertName: expertName.trim(),
          overallScore,
        },
        status: "success",
      });

      toast.success("피드백이 저장되었습니다!");
      setIsEditing(false);
      setSelectedRequest(null);
      resetForm();
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

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                {!isEditing && (
                  <Link href="/connect-admin">
                    <Button variant="ghost" size="sm">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      대시보드
                    </Button>
                  </Link>
                )}
                <Music className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    전문가 피드백 관리
                  </h1>
                  <p className="text-xs text-gray-500">
                    {isEditing ? "피드백 작성" : `${requests.length}건의 요청`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isEditing && selectedRequest ? (
            /* 피드백 작성 폼 */
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    피드백 작성: {selectedRequest.userNickname}님
                  </h2>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedRequest(null);
                      resetForm();
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
                      {[
                        {
                          label: "종합 점수",
                          value: overallScore,
                          setter: setOverallScore,
                        },
                        {
                          label: "음정 정확도",
                          value: pitchScore,
                          setter: setPitchScore,
                        },
                        {
                          label: "리듬 안정성",
                          value: rhythmScore,
                          setter: setRhythmScore,
                        },
                        {
                          label: "표현력",
                          value: expressionScore,
                          setter: setExpressionScore,
                        },
                        {
                          label: "테크닉",
                          value: techniqueScore,
                          setter: setTechniqueScore,
                        },
                      ].map((item, idx) => (
                        <div key={idx}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {item.label}: {item.value}점
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={item.value}
                            onChange={e =>
                              item.setter(parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>
                      ))}
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
                      💬 전문가 상세 코멘트{" "}
                      <span className="text-red-500">*</span>
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
                      onClick={() =>
                        setRecommendations([...recommendations, ""])
                      }
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
              </CardContent>
            </Card>
          ) : (
            /* 요청 목록 */
            <div>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    피드백 대기 목록
                  </h2>
                  <p className="text-sm text-gray-600">
                    입금이 확인된 보컬 분석 요청에 대한 전문가 피드백을
                    작성합니다
                  </p>
                </CardContent>
              </Card>

              {requests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      대기 중인 요청이 없습니다
                    </h3>
                    <p className="text-gray-600">
                      입금이 확인된 새로운 요청이 없습니다.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {requests.map(request => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {request.userNickname}님
                              </h3>
                              {getStatusBadge(request)}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Music className="w-4 h-4 mr-2" />
                                <span className="font-medium">
                                  분석 분야:
                                </span>{" "}
                                {request.analysisCategory}
                              </div>
                              <div className="flex items-center">
                                <Play className="w-4 h-4 mr-2" />
                                <span className="font-medium">
                                  파일명:
                                </span>{" "}
                                {request.fileName}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="font-medium">
                                  신청일:
                                </span>{" "}
                                {request.requestedAt
                                  ?.toDate?.()
                                  ?.toLocaleDateString("ko-KR")}
                              </div>
                              {request.additionalRequest && (
                                <p>
                                  <span className="font-medium">
                                    추가 요청:
                                  </span>{" "}
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

                        <div className="mb-4">
                          <audio
                            src={request.audioUrl}
                            controls
                            className="w-full"
                          />
                        </div>

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
                            <Link
                              href={`/feedback/${request.id}`}
                              target="_blank"
                            >
                              <Button variant="outline">결과 보기</Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
