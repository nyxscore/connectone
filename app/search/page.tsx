"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Filter, MapPin, Calendar, User } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  imageUrl?: string;
  sellerName: string;
  createdAt: string;
  status: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    location: "",
    status: "all"
  });
  const [showFilters, setShowFilters] = useState(false);

  // 검색 실행
  const handleSearch = async (searchTerm: string = searchQuery) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&${new URLSearchParams(filters)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("검색 오류:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 초기 검색 실행
  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, [query]);

  // 필터 변경 시 재검색
  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    }
  }, [filters]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const getCategoryEmoji = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      "기타": "🎸",
      "피아노": "🎹",
      "드럼": "🥁",
      "관악기": "🎺",
      "현악기": "🎻",
      "음향장비": "🎤",
      "국악기": "🎼",
      "키보드": "🎹"
    };
    return categoryMap[category] || "🎵";
  };

  return (
    <>
      <Head>
        <title>{query ? `"${query}" 검색 결과 - ConnecTone` : "악기 검색 - ConnecTone"}</title>
        <meta name="description" content={query ? `"${query}"에 대한 중고 악기 검색 결과입니다. 기타, 피아노, 드럼 등 모든 악기를 안전하게 거래하세요.` : "중고 악기 검색. 기타, 피아노, 드럼, 관악기, 현악기, 음향장비, 국악기 등 모든 악기를 검색하고 거래하세요."} />
        <meta name="keywords" content={`${query}, 중고악기, 악기거래, 기타, 피아노, 드럼, 관악기, 현악기, 음향장비, 국악기, ConnecTone`} />
        <meta property="og:title" content={query ? `"${query}" 검색 결과 - ConnecTone` : "악기 검색 - ConnecTone"} />
        <meta property="og:description" content={query ? `"${query}"에 대한 중고 악기 검색 결과입니다.` : "중고 악기 검색. 모든 악기를 안전하게 거래하세요."} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.connect-tone.com/search${query ? `?q=${encodeURIComponent(query)}` : ''}`} />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 검색 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {query ? `"${query}" 검색 결과` : "악기 검색"}
          </h1>
          
          {/* 검색바 */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="악기 검색 (예: 중고 기타, 피아노, 드럼...)"
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleSearch()} className="px-8">
              검색
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              필터
            </Button>
          </div>

          {/* 필터 섹션 */}
          {showFilters && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>검색 필터</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">전체</option>
                      <option value="기타">🎸 기타</option>
                      <option value="피아노">🎹 피아노</option>
                      <option value="드럼">🥁 드럼</option>
                      <option value="관악기">🎺 관악기</option>
                      <option value="현악기">🎻 현악기</option>
                      <option value="음향장비">🎤 음향장비</option>
                      <option value="국악기">🎼 국악기</option>
                      <option value="키보드">🎹 키보드</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최소 가격
                    </label>
                    <Input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최대 가격
                    </label>
                    <Input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      placeholder="무제한"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      지역
                    </label>
                    <Input
                      type="text"
                      value={filters.location}
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                      placeholder="지역명"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 검색 결과 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="mb-4 text-gray-600">
              총 {results.length}개의 상품을 찾았습니다
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {getCategoryEmoji(item.category)}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-sm text-gray-500 ml-2">
                        {getCategoryEmoji(item.category)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-blue-600">
                        {formatPrice(item.price)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === "판매중" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {item.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {item.sellerName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Link href={`/product/${item.id}`}>
                        <Button className="w-full">
                          상세보기
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              "{query}"에 대한 검색 결과를 찾을 수 없습니다.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">다른 키워드로 검색해보세요:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["중고 기타", "중고 피아노", "중고 드럼", "일렉기타", "어쿠스틱기타"].map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      setSearchQuery(keyword);
                      handleSearch(keyword);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              악기를 검색해보세요
            </h3>
            <p className="text-gray-600 mb-6">
              원하는 악기를 검색하여 중고 거래를 시작하세요
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">인기 검색어:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["중고 기타", "중고 피아노", "중고 드럼", "일렉기타", "어쿠스틱기타", "디지털피아노", "음향장비", "앰프"].map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      setSearchQuery(keyword);
                      handleSearch(keyword);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
