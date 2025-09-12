"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { getPublicQuestions, QaListOptions } from "../../lib/qna/api";
import { PublicQuestion, QaListFilters } from "../../data/qna/types";
import {
  formatQaDate,
  formatViews,
  formatLikes,
  getTagColor,
  truncateTitle,
  truncateContent,
} from "../../lib/qna/utils";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Heart,
  MessageCircle,
  CheckCircle,
  Clock,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";

interface QaListProps {
  initialQuestions?: PublicQuestion[];
  showFilters?: boolean;
  showStats?: boolean;
}

export function QaList({
  initialQuestions = [],
  showFilters = true,
  showStats = false,
}: QaListProps) {
  const [questions, setQuestions] =
    useState<PublicQuestion[]>(initialQuestions);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState("");

  // 필터 상태
  const [filters, setFilters] = useState<QaListFilters>({});
  const [sortBy, setSortBy] = useState<"createdAt" | "views" | "likes">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 초기 로드
  useEffect(() => {
    if (initialQuestions.length === 0) {
      loadQuestions(true);
    }
  }, [filters, sortBy, sortOrder]);

  const loadQuestions = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setQuestions([]);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const options: QaListOptions = {
        limit: 20,
        lastDoc: reset ? undefined : lastDoc,
        sortBy,
        sortOrder,
        filters,
      };

      const result = await getPublicQuestions(options);

      if (result.success && result.questions) {
        if (reset) {
          setQuestions(result.questions);
        } else {
          setQuestions(prev => [...prev, ...result.questions!]);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.questions.length === 20);
      } else {
        setError(result.error || "질문을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("질문을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadQuestions(false);
    }
  };

  const handleFilterChange = (
    key: keyof QaListFilters,
    value: string | string[] | boolean | undefined
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleSortChange = (newSortBy: "createdAt" | "views" | "likes") => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setFilters({});
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

  return (
    <div className="space-y-6">
      {/* 필터 및 정렬 */}
      {showFilters && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* 검색바 */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="제목이나 내용으로 검색..."
                    value={filters.keyword || ""}
                    onChange={e =>
                      handleFilterChange("keyword", e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                variant="outline"
              >
                <Filter className="w-4 h-4 mr-2" />
                필터
              </Button>
            </div>

            {/* 필터 옵션들 */}
            {showFilterPanel && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    해결 상태
                  </label>
                  <Select
                    value={
                      filters.isResolved === undefined
                        ? ""
                        : filters.isResolved.toString()
                    }
                    onChange={e => {
                      const value = e.target.value;
                      handleFilterChange(
                        "isResolved",
                        value === "" ? undefined : value === "true"
                      );
                    }}
                  >
                    <option value="">전체</option>
                    <option value="false">미해결</option>
                    <option value="true">해결됨</option>
                  </Select>
                </div>

                <div className="flex items-end space-x-2">
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    필터 초기화
                  </Button>
                </div>
              </div>
            )}

            {/* 정렬 옵션 */}
            <div className="flex items-center space-x-4 pt-4 border-t">
              <span className="text-sm font-medium text-gray-700">정렬:</span>
              <Button
                variant={sortBy === "createdAt" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("createdAt")}
              >
                {sortBy === "createdAt" && sortOrder === "desc" ? (
                  <SortDesc className="w-4 h-4 mr-1" />
                ) : (
                  <SortAsc className="w-4 h-4 mr-1" />
                )}
                최신순
              </Button>
              <Button
                variant={sortBy === "views" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("views")}
              >
                {sortBy === "views" && sortOrder === "desc" ? (
                  <SortDesc className="w-4 h-4 mr-1" />
                ) : (
                  <SortAsc className="w-4 h-4 mr-1" />
                )}
                조회순
              </Button>
              <Button
                variant={sortBy === "likes" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange("likes")}
              >
                {sortBy === "likes" && sortOrder === "desc" ? (
                  <SortDesc className="w-4 h-4 mr-1" />
                ) : (
                  <SortAsc className="w-4 h-4 mr-1" />
                )}
                인기순
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 질문 목록 */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => loadQuestions(true)}>다시 시도</Button>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            질문이 없습니다
          </h3>
          <p className="text-gray-600">첫 번째 질문을 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(question => (
            <Card
              key={question.id}
              className="hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 제목과 상태 */}
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        href={`/qa/${question.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {truncateTitle(question.title)}
                      </Link>
                      {question.isResolved && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          해결됨
                        </span>
                      )}
                    </div>

                    {/* 내용 미리보기 */}
                    <p className="text-gray-600 mb-3">
                      {truncateContent(question.content)}
                    </p>

                    {/* 태그들 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {question.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
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
                          {formatQaDate(question.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {formatViews(question.views)}
                        </span>
                        <span className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {formatLikes(question.likes)}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {question.answers.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 더보기 버튼 */}
      {hasMore && !loadingMore && (
        <div className="text-center">
          <Button onClick={handleLoadMore} size="lg">
            더 많은 질문 보기
          </Button>
        </div>
      )}

      {loadingMore && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">질문을 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}
