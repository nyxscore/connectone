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
                음악을 사랑하는 사람들을 위한
                <br />
                안전한 중고 거래
              </p>

              <p
                className="text-xs sm:text-sm md:text-base lg:text-lg text-blue-200 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-4 leading-relaxed"
                style={{ fontFamily: "Paperozi, sans-serif" }}
              >
                AI 감정 시스템과 안전거래로 믿을 수 있는 거래를 경험하세요
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
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center max-w-sm sm:max-w-md md:max-w-none mx-auto">
                  <Link href="/product/new" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 hover:shadow-xl py-3 sm:py-4"
                      style={{ fontFamily: "Paperozi, sans-serif" }}
                    >
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      상품 등록하기
                    </Button>
                  </Link>
                  <Link href="/list" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl py-3 sm:py-4"
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Animation */}
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
              {/* Underline Animation */}
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

      {/* Feature Details Sections */}
      <FeatureSections />

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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
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
      </section>

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
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link href="/list" className="hover:text-white transition-colors">
                상품 목록
              </Link>
              <Link
                href="/profile"
                className="hover:text-white transition-colors"
              >
                프로필
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
