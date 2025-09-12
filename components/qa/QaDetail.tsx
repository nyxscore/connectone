"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  getPublicQuestion,
  incrementQuestionViews,
  toggleQuestionLike,
  createPublicAnswer,
  toggleAnswerLike,
} from "../../lib/qna/api";
import { PublicQuestion, PublicAnswer } from "../../data/qna/types";
import {
  formatQaDate,
  formatQaDetailedDate,
  formatViews,
  formatLikes,
  getTagColor,
  validateAnswerContent,
} from "../../lib/qna/utils";
import {
  Eye,
  Heart,
  MessageCircle,
  CheckCircle,
  Clock,
  Tag,
  User,
  Send,
  ThumbsUp,
  ArrowLeft,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface QaDetailProps {
  questionId: string;
  userId?: string;
  showBackButton?: boolean;
}

export function QaDetail({
  questionId,
  userId,
  showBackButton = true,
}: QaDetailProps) {
  const router = useRouter();
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [answers, setAnswers] = useState<PublicAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [newAnswer, setNewAnswer] = useState("");
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  useEffect(() => {
    if (questionId) {
      loadQuestion();
    }
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const result = await getPublicQuestion(questionId);

      if (result.success && result.question) {
        setQuestion(result.question);
        setAnswers(result.question.answers || []);
        setIsLiked(result.question.likedBy.includes(userId || ""));

        // 조회수 증가
        await incrementQuestionViews(questionId);
      } else {
        setError(result.error || "질문을 찾을 수 없습니다.");
      }
    } catch (err) {
      setError("질문을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!userId) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    try {
      const result = await toggleQuestionLike(questionId, userId);
      if (result.success) {
        setIsLiked(result.isLiked!);
        if (question) {
          setQuestion(prev =>
            prev
              ? {
                  ...prev,
                  likes: result.isLiked! ? prev.likes + 1 : prev.likes - 1,
                  likedBy: result.isLiked!
                    ? [...prev.likedBy, userId]
                    : prev.likedBy.filter(id => id !== userId),
                }
              : null
          );
        }
      } else {
        toast.error(result.error || "좋아요 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  const handleAnswerLike = async (answerId: string) => {
    if (!userId) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    try {
      const result = await toggleAnswerLike(answerId, userId);
      if (result.success) {
        setAnswers(prev =>
          prev.map(answer =>
            answer.id === answerId
              ? {
                  ...answer,
                  likes: result.isLiked! ? answer.likes + 1 : answer.likes - 1,
                  likedBy: result.isLiked!
                    ? [...answer.likedBy, userId]
                    : answer.likedBy.filter(id => id !== userId),
                }
              : answer
          )
        );
      } else {
        toast.error(result.error || "좋아요 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("답변 좋아요 처리 실패:", error);
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userId || !question) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const validation = validateAnswerContent(newAnswer);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    setIsSubmittingAnswer(true);
    try {
      const result = await createPublicAnswer({
        questionId: question.id,
        content: newAnswer.trim(),
        authorUid: userId,
        authorName: "사용자", // 실제로는 사용자 정보에서 가져와야 함
      });

      if (result.success) {
        setNewAnswer("");
        setShowAnswerForm(false);
        toast.success("답변이 등록되었습니다.");
        // 질문 다시 로드하여 최신 답변 반영
        await loadQuestion();
      } else {
        toast.error(result.error || "답변 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("답변 등록 실패:", error);
      toast.error("답변 등록에 실패했습니다.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: question?.title,
          text: question?.content,
          url: window.location.href,
        });
      } catch (err) {
        console.log("공유 취소됨");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("링크가 클립보드에 복사되었습니다!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">질문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          질문을 찾을 수 없습니다
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => router.push("/qa")}>
          Q&A 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      {showBackButton && (
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
      )}

      {/* 질문 카드 */}
      <Card>
        <div className="p-6">
          <div className="space-y-4">
            {/* 제목과 상태 */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {question.title}
                </h1>
                {question.isResolved && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    해결됨
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {question.authorName || "익명"}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatQaDetailedDate(question.createdAt)}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {formatViews(question.views)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? "text-red-500" : ""}
                >
                  <Heart
                    className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`}
                  />
                  {formatLikes(question.likes)}
                </Button>
              </div>
            </div>

            {/* 태그들 */}
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTagColor(tag)}`}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>

            {/* 질문 내용 */}
            <div className="prose max-w-none">
              <div
                className="text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 답변 섹션 */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              답변 ({answers.length})
            </h2>
            {userId && (
              <Button
                onClick={() => setShowAnswerForm(!showAnswerForm)}
                variant="outline"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                답변 작성
              </Button>
            )}
          </div>

          {/* 답변 작성 폼 */}
          {showAnswerForm && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">답변 작성</h3>
              <div className="space-y-3">
                <textarea
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  placeholder="답변을 작성해주세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnswerForm(false)}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitAnswer}
                    disabled={!newAnswer.trim() || isSubmittingAnswer}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmittingAnswer ? "등록 중..." : "답변 등록"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 답변 목록 */}
          {answers.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 답변이 없습니다.</p>
              <p className="text-sm text-gray-400">
                첫 번째 답변을 작성해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map(answer => (
                <div
                  key={answer.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="space-y-3">
                    {/* 답변 메타 정보 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {answer.authorName || "익명"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatQaDate(answer.createdAt)}
                        </span>
                        {answer.isAccepted && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            채택됨
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAnswerLike(answer.id)}
                        className={
                          answer.likedBy.includes(userId || "")
                            ? "text-red-500"
                            : ""
                        }
                      >
                        <ThumbsUp
                          className={`w-4 h-4 mr-1 ${answer.likedBy.includes(userId || "") ? "fill-current" : ""}`}
                        />
                        {formatLikes(answer.likes)}
                      </Button>
                    </div>

                    {/* 답변 내용 */}
                    <div
                      className="text-gray-700 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: answer.content }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!userId && (
            <div className="text-center py-8 border-t">
              <p className="text-sm text-gray-500">
                답변을 작성하려면{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:underline"
                >
                  로그인
                </Link>
                이 필요합니다
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
