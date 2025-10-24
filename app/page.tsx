"use client";

import { useAuth } from "../lib/hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FeatureCards } from "../components/landing/FeatureCards";
import { FeatureSections } from "../components/landing/FeatureSections";
import { TypingAnimation } from "../components/ui/TypingAnimation";
import Link from "next/link";
import {
  Music,
  Shield,
  Users,
  Star,
  ArrowRight,
  Search,
  Heart,
  Clock,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Client-side error:", error);
      setHasError(true);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            문제가 발생했습니다
          </h2>
          <p className="text-gray-600 mb-4">
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-indigo-800">
      {/* 세련된 점들 배경 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* 왼쪽 점들 */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
        <div
          className="absolute top-20 left-32 w-1 h-1 bg-blue-300/70 rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-32 left-16 w-2 h-2 bg-white/50 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-40 left-48 w-1 h-1 bg-blue-200/60 rounded-full animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute top-60 left-24 w-2 h-2 bg-white/40 rounded-full animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute top-80 left-40 w-1 h-1 bg-blue-300/50 rounded-full animate-pulse"
          style={{ animationDelay: "2.5s" }}
        ></div>
        <div
          className="absolute top-96 left-56 w-2 h-2 bg-white/30 rounded-full animate-pulse"
          style={{ animationDelay: "0.8s" }}
        ></div>

        {/* 오른쪽 점들 */}
        <div
          className="absolute top-16 right-20 w-2 h-2 bg-white/60 rounded-full animate-pulse"
          style={{ animationDelay: "1.2s" }}
        ></div>
        <div
          className="absolute top-28 right-36 w-1 h-1 bg-blue-300/70 rounded-full animate-pulse"
          style={{ animationDelay: "2.8s" }}
        ></div>
        <div
          className="absolute top-44 right-12 w-2 h-2 bg-white/50 rounded-full animate-pulse"
          style={{ animationDelay: "0.3s" }}
        ></div>
        <div
          className="absolute top-64 right-44 w-1 h-1 bg-blue-200/60 rounded-full animate-pulse"
          style={{ animationDelay: "1.8s" }}
        ></div>
        <div
          className="absolute top-84 right-28 w-2 h-2 bg-white/40 rounded-full animate-pulse"
          style={{ animationDelay: "2.2s" }}
        ></div>
        <div
          className="absolute top-100 right-52 w-1 h-1 bg-blue-300/50 rounded-full animate-pulse"
          style={{ animationDelay: "0.6s" }}
        ></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6 relative">
              {/* 로고 배경 그라데이션 원형 - 모바일 최적화 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-radial from-white via-white/50 to-transparent"></div>
              </div>

              {/* 배경 애니메이션 효과 - 모바일 최적화 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-pulse"></div>
                <div
                  className="absolute w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full bg-gradient-to-r from-purple-400/15 via-pink-400/15 to-blue-400/15 animate-spin"
                  style={{ animationDuration: "8s" }}
                ></div>
                <div
                  className="absolute w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-64 lg:h-64 rounded-full bg-gradient-to-r from-pink-400/10 via-blue-400/10 to-purple-400/10 animate-pulse"
                  style={{ animationDuration: "4s" }}
                ></div>

                {/* 물제비 파동 효과 - 모바일 최적화 */}
                <div
                  className="absolute w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full border border-blue-300/15 animate-ping"
                  style={{ animationDuration: "4s", animationDelay: "0s" }}
                ></div>
                <div
                  className="absolute w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] lg:w-[600px] lg:h-[600px] rounded-full border border-purple-300/10 animate-ping"
                  style={{ animationDuration: "4s", animationDelay: "2s" }}
                ></div>

                {/* 흐르는 음악 파동 - 모바일 최적화 */}
                <div
                  className="absolute w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] md:w-[350px] md:h-[350px] lg:w-[450px] lg:h-[450px] rounded-full border-2 border-blue-400/30 animate-spin"
                  style={{ animationDuration: "12s" }}
                ></div>
                <div
                  className="absolute w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] lg:w-[550px] lg:h-[550px] rounded-full border border-purple-400/25 animate-spin"
                  style={{
                    animationDuration: "15s",
                    animationDirection: "reverse",
                  }}
                ></div>
                <div
                  className="absolute w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] lg:w-[650px] lg:h-[650px] rounded-full border border-pink-400/20 animate-spin"
                  style={{ animationDuration: "18s" }}
                ></div>
              </div>

              {/* 음표 애니메이션 - 모바일 최적화 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="absolute -top-4 sm:-top-6 md:-top-8 -left-4 sm:-left-6 md:-left-8 text-lg sm:text-xl md:text-2xl text-blue-400/30 animate-bounce"
                  style={{ animationDelay: "0s" }}
                >
                  ♪
                </div>
                <div
                  className="absolute -top-2 sm:-top-3 md:-top-4 -right-6 sm:-right-8 md:-right-12 text-base sm:text-lg md:text-xl text-purple-400/30 animate-bounce"
                  style={{ animationDelay: "1s" }}
                >
                  ♫
                </div>
                <div
                  className="absolute top-4 sm:top-6 md:top-8 -left-8 sm:-left-12 md:-left-16 text-sm sm:text-base md:text-lg text-pink-400/30 animate-bounce"
                  style={{ animationDelay: "2s" }}
                >
                  ♪
                </div>
                <div
                  className="absolute top-2 sm:top-3 md:top-4 -right-4 sm:-right-6 md:-right-8 text-base sm:text-lg md:text-xl text-blue-400/30 animate-bounce"
                  style={{ animationDelay: "3s" }}
                >
                  ♫
                </div>
                <div
                  className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 -left-6 sm:-left-8 md:-left-12 text-sm sm:text-base md:text-lg text-purple-400/30 animate-bounce"
                  style={{ animationDelay: "4s" }}
                >
                  ♪
                </div>
                <div
                  className="absolute -bottom-4 sm:-bottom-6 md:-bottom-8 -right-8 sm:-right-12 md:-right-16 text-lg sm:text-xl md:text-2xl text-pink-400/30 animate-bounce"
                  style={{ animationDelay: "5s" }}
                >
                  ♫
                </div>
              </div>

              {/* 메인 로고 텍스트 - 모바일 최적화 */}
              <div className="relative z-10">
                <h1
                  className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-1 sm:mb-2 md:mb-4 leading-tight"
                  style={{ fontFamily: "Paperozi, sans-serif" }}
                >
                  ConnecTone
                </h1>
                <div
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-white font-medium"
                  style={{ fontFamily: "Paperozi, sans-serif" }}
                >
                  커넥톤
                </div>
              </div>
            </div>

            <div className="mt-12 sm:mt-16 md:mt-24 lg:mt-32">
              <p
                className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-blue-100 mb-3 sm:mb-4 max-w-3xl mx-auto px-4 leading-relaxed"
                style={{ fontFamily: "Paperozi, sans-serif" }}
              >
                모든 음악이 연결되는 곳, 커넥톤
              </p>

              <p
                className="text-xs sm:text-sm md:text-base lg:text-lg text-blue-200 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-4 leading-relaxed"
                style={{ fontFamily: "Paperozi, sans-serif" }}
              >
                AI 분석과 전문가 피드백, 그리고 믿을 수 있는 악기 거래까지
              </p>
            </div>

            {user ? (
              <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in-up animation-delay-800 px-4">
                <p
                  className="text-base sm:text-lg md:text-xl font-medium text-white text-center leading-relaxed"
                  style={{ fontFamily: "Paperozi, sans-serif" }}
                >
                  안녕하세요,{" "}
                  <span className="animate-gradient-flow font-bold">
                    {user.nickname}
                  </span>
                  님! 👋
                </p>
                <div className="flex justify-center">
                  <Link href="/list" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl py-3 sm:py-4 px-8"
                      style={{ fontFamily: "Paperozi, sans-serif" }}
                    >
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      상품 둘러보기
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in-up animation-delay-800 px-4">
                <div className="flex flex-col gap-3 sm:gap-4 justify-center max-w-sm mx-auto">
                  <Link href="/auth/signup" className="w-full">
                    <Button
                      size="lg"
                      className="w-full text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 hover:shadow-xl py-3 sm:py-4"
                      style={{ fontFamily: "Paperozi, sans-serif" }}
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      회원가입
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="w-full">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-sm sm:text-base border-2 transform hover:scale-105 transition-all duration-300 hover:shadow-xl py-3 sm:py-4"
                      style={{ fontFamily: "Paperozi, sans-serif" }}
                    >
                      로그인
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lesson #1 */}
      <section className="py-8 bg-gradient-to-r from-purple-600 to-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-bold text-lg sm:text-xl shadow-lg">
              <svg
                className="w-6 h-6 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Lesson #1
            </div>
          </div>
        </div>
      </section>

      {/* AI음악분석 Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* 모바일 최적화된 헤더 */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight"
              style={{ fontFamily: "Paperozi, sans-serif" }}
            >
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI음악분석으로 완성하는
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> </span>당신의 음악
              </span>
            </h2>
            <p
              className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2"
              style={{ fontFamily: "Paperozi, sans-serif" }}
            >
              AI 분석과 현직 프로의 전문 피드백으로
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>음악 실력을 한 단계
              업그레이드하세요
            </p>
          </div>

          {/* 모바일 최적화된 카드 그리드 */}
          <div className="space-y-6 sm:space-y-8 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-8">
            {/* AI 분석 카드 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-100">
              <div className="text-center mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3
                  className="text-lg sm:text-xl font-bold text-gray-900 mb-3"
                  style={{ fontFamily: "Paperozi, sans-serif" }}
                >
                  AI 음성 분석
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  고급 AI 알고리즘이 당신의 음성과 연주를 정밀 분석하여 개선점을
                  찾아드립니다
                </p>
              </div>
              <ul className="space-y-3 text-sm sm:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>음정 정확도 분석</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>리듬감 측정</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>음색 품질 평가</span>
                </li>
              </ul>
            </div>

            {/* 전문가 피드백 카드 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-100">
              <div className="text-center mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3
                  className="text-lg sm:text-xl font-bold text-gray-900 mb-3"
                  style={{ fontFamily: "Paperozi, sans-serif" }}
                >
                  현직 프로 피드백
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  음악계 현직 전문가들이 AI 분석 결과를 바탕으로 맞춤형 조언을
                  제공합니다
                </p>
              </div>
              <ul className="space-y-3 text-sm sm:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>개인별 맞춤 조언</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>실전 연습 방법</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>단계별 실력 향상</span>
                </li>
              </ul>
            </div>

            {/* 실시간 모니터링 카드 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-indigo-100 md:col-span-2 lg:col-span-1">
              <div className="text-center mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3
                  className="text-lg sm:text-xl font-bold text-gray-900 mb-3"
                  style={{ fontFamily: "Paperozi, sans-serif" }}
                >
                  실시간 모니터링
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  연습 과정을 실시간으로 추적하고 진전 상황을 시각적으로
                  확인하세요
                </p>
              </div>
              <ul className="space-y-3 text-sm sm:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>실시간 성능 지표</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>진전도 차트</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>목표 달성 추적</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 모바일 최적화된 CTA 버튼 */}
          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <Link href="/vocal-analysis">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl py-4 px-8 text-base sm:text-lg font-semibold"
                style={{ fontFamily: "Paperozi, sans-serif" }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                AI음악분석 체험하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Lesson #2 */}
      <section className="py-8 bg-gradient-to-r from-blue-600 to-green-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-bold text-lg sm:text-xl shadow-lg">
              <svg
                className="w-6 h-6 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Lesson #2
            </div>
          </div>
        </div>
      </section>

      {/* 모든 악기 한곳에서 Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "Paperozi, sans-serif" }}
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                중고 악기 거래는 커넥톤
              </span>
            </h2>
            <p
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: "Paperozi, sans-serif" }}
            >
              모든 악기와 음악 관련 용품을 한 곳에서 만나보세요
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">🎸</div>
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                기타
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                클래식/어쿠스틱/일렉트릭
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">🎹</div>
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                피아노
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                디지털/어쿠스틱
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">🥁</div>
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                드럼
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                어쿠스틱/전자드럼
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">🎺</div>
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                관악기
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                트럼펫/색소폰/플루트
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">🎻</div>
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                현악기
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                바이올린/첼로/비올라
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">🎤</div>
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                음향장비
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                마이크/앰프/믹서
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">🎼</div>
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                국악기
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                가야금/거문고/해금
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">🎹</div>
              <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                키보드
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                신시사이저/워크스테이션
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p
              className="text-lg text-gray-600 font-medium"
              style={{ fontFamily: "Paperozi, sans-serif" }}
            >
              그 외 모든 악기와 음악 관련 용품까지! 🎶
            </p>
          </div>

          {/* 커넥톤만의 특별한 차별화 기능 */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <h3
                className="text-xl md:text-2xl font-bold text-gray-800 mb-2"
                style={{ fontFamily: "Paperozi, sans-serif" }}
              >
                커넥톤만의 특별한 차별화
              </h3>
              <p className="text-gray-600">
                안전하고 특별한 서비스로 완벽한 악기 거래를 경험하세요
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* 안전거래 */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                    안전거래
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    에스크로 시스템으로
                    <br />
                    100% 안전한 거래
                  </p>
                </div>
              </div>

              {/* 전문가 감정 */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 sm:p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                    전문가 감정
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    현직 전문가가
                    <br />
                    정확한 시세 제공
                  </p>
                </div>
              </div>

              {/* 화물택배 */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                    화물택배
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    대형 악기까지
                    <br />
                    안전한 배송 서비스
                  </p>
                </div>
              </div>

              {/* 시세 서비스 */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 sm:p-6 border border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                    시세 서비스
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    실시간 시세로
                    <br />
                    공정한 거래 가격
                  </p>
                </div>
              </div>
            </div>

            {/* 기대감을 주는 메시지 */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                곧 출시될 특별한 서비스들
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - 주석처리됨 */}
      {/* <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block relative">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 relative z-10">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  <TypingAnimation
                    text="왜 ConnecTone일까요?"
                    speed={150}
                    delay={1000}
                    showCursor={true}
                  />
                </span>
              </h2>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 transform scale-x-0 animate-grow-line"></div>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mt-6">
              <span className="inline-block animate-typing">
                음악인들을 위한 특별한 기능들
              </span>
            </p>
          </div>

          <FeatureCards />
        </div>
      </section>

      <FeatureSections /> */}

      {/* Logo Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <img
            src="/ConnecTone_Logo.jpg"
            alt="ConnecTone Logo"
            className="w-96 h-96 mx-auto object-contain"
          />
        </div>
      </section>

      {/* CTA Section - 주석처리됨 */}
      {/* <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            지금 시작하세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            음악의 새로운 시작, ConnecTone과 함께하세요
          </p>

          {!user && (
            <div className="flex flex-col gap-4 justify-center max-w-sm mx-auto">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="w-full bg-white text-blue-600 hover:bg-gray-100"
                >
                  무료로 시작하기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/list">
                <Button
                  size="lg"
                  className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                >
                  상품 둘러보기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-blue-400 mr-2" />
              <span className="text-2xl font-bold">ConnecTone</span>
            </div>
            <p className="text-gray-400 mb-4">
              음악을 사랑하는 사람들을 위한 안전한 거래 플랫폼
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
