import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Music,
  Shield,
  Truck,
  MessageCircle,
  Search,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const categories = [
    { name: "건반악기", icon: "🎹", count: 156 },
    { name: "현악기", icon: "🎸", count: 234 },
    { name: "관악기", icon: "🎺", count: 89 },
    { name: "타악기", icon: "🥁", count: 67 },
    { name: "전자악기", icon: "🎛️", count: 123 },
    { name: "주변기기", icon: "🎧", count: 45 },
  ];

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "안전결제",
      description: "에스크로 서비스로 안전한 거래를 보장합니다.",
    },
    {
      icon: <Truck className="w-8 h-8 text-green-600" />,
      title: "운송 서비스",
      description: "대형 악기도 안전하게 배송해드립니다.",
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-purple-600" />,
      title: "실시간 채팅",
      description: "판매자와 직접 소통하며 거래하세요.",
    },
    {
      icon: <Search className="w-8 h-8 text-orange-600" />,
      title: "AI 검색",
      description: "사진으로 악기를 자동 인식하고 검색합니다.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              중고 악기 거래의
              <span className="text-blue-600 block">새로운 기준</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              ConnecTone에서 안전하고 신뢰할 수 있는 중고 악기 거래를
              경험해보세요. AI 기술과 안전결제로 더욱 스마트한 거래가
              가능합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4">
                <Music className="w-5 h-5 mr-2" />
                악기 둘러보기
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                판매하기
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                1,200+
              </div>
              <div className="text-gray-600">등록된 악기</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">850+</div>
              <div className="text-gray-600">완료된 거래</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                500+
              </div>
              <div className="text-gray-600">활성 사용자</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">98%</div>
              <div className="text-gray-600">만족도</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              카테고리별 악기 둘러보기
            </h2>
            <p className="text-lg text-gray-600">
              다양한 종류의 악기를 카테고리별로 쉽게 찾아보세요
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Link key={index} href={`/products?category=${category.name}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.count}개 상품
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ConnecTone만의 특별한 기능
            </h2>
            <p className="text-lg text-gray-600">
              안전하고 편리한 거래를 위한 다양한 기능을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-8">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작해보세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            무료로 가입하고 안전한 악기 거래를 경험해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              회원가입
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
            >
              로그인
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
