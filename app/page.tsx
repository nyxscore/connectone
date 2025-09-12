"use client";

import { useAuth } from "../lib/hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
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

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Music className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
              ConnecTone
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              음악을 사랑하는 사람들을 위한
            </p>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
              안전한 중고 악기 거래 플랫폼
            </p>

            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              AI 감정 시스템과 에스크로 서비스로 믿을 수 있는 거래를 경험하세요
            </p>

            {user ? (
              <div className="space-y-6 animate-fade-in-up animation-delay-800">
                <p className="text-xl font-medium text-gray-800">
                  안녕하세요,{" "}
                  <span className="text-blue-600 animate-pulse">
                    {user.nickname}
                  </span>
                  님! 👋
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/sell">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    >
                      <Music className="w-5 h-5 mr-2" />
                      상품 등록하기
                    </Button>
                  </Link>
                  <Link href="/list">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto border-2 transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      상품 둘러보기
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up animation-delay-800">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      회원가입
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto border-2 transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                    >
                      로그인
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-500 animate-fade-in animation-delay-1000">
                  무료로 시작하고, 언제든지 중단할 수 있습니다
                </p>
              </div>
            )}
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
                  왜 ConnecTone일까요?
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up animation-delay-200">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                AI 감정 시스템
              </h3>
              <p className="text-gray-600">
                업로드한 이미지를 AI가 분석하여 정확한 상태 등급과 결함을
                자동으로 감지합니다
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up animation-delay-400">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                에스크로 서비스
              </h3>
              <p className="text-gray-600">
                안전한 거래를 위한 중간 보관 서비스로 구매자와 판매자 모두를
                보호합니다
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up animation-delay-600">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                신뢰도 시스템
              </h3>
              <p className="text-gray-600">
                거래 이력을 바탕으로 한 등급 시스템으로 신뢰할 수 있는 거래
                상대를 찾으세요
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up animation-delay-800">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">1:1 채팅</h3>
              <p className="text-gray-600">
                실시간 채팅으로 구매자와 판매자가 직접 소통하며 거래를 진행할 수
                있습니다
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up animation-delay-1000">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Clock className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                빠른 거래
              </h3>
              <p className="text-gray-600">
                간편한 등록과 검색으로 원하는 악기를 빠르게 찾고 거래할 수
                있습니다
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up animation-delay-1200">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                검증된 상품
              </h3>
              <p className="text-gray-600">
                AI 분석과 수동 검토를 통해 품질이 검증된 상품만을 거래합니다
              </p>
            </Card>
          </div>
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100"
                >
                  무료로 시작하기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/list">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-blue-600"
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
              <Link href="/qa" className="hover:text-white transition-colors">
                Q&A
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
