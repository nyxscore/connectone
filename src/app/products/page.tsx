"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Eye,
  MapPin,
  Calendar,
} from "lucide-react";
import { Product, InstrumentCategory, ConditionGrade } from "@/lib/types";

const categories: { key: InstrumentCategory; label: string; icon: string }[] = [
  { key: "keyboard", label: "건반악기", icon: "🎹" },
  { key: "string", label: "현악기", icon: "🎸" },
  { key: "wind", label: "관악기", icon: "🎺" },
  { key: "percussion", label: "타악기", icon: "🥁" },
  { key: "electronic", label: "전자악기", icon: "🎛️" },
  { key: "special", label: "특수악기", icon: "🎻" },
  { key: "accessories", label: "주변기기", icon: "🎧" },
];

const conditions: { key: ConditionGrade; label: string; color: string }[] = [
  { key: "S", label: "S급", color: "text-purple-600" },
  { key: "A", label: "A급", color: "text-blue-600" },
  { key: "B", label: "B급", color: "text-green-600" },
  { key: "C", label: "C급", color: "text-yellow-600" },
  { key: "D", label: "D급", color: "text-red-600" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    InstrumentCategory | ""
  >("");
  const [selectedCondition, setSelectedCondition] = useState<
    ConditionGrade | ""
  >("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - 실제로는 API에서 가져올 데이터
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: "1",
        sellerId: "seller1",
        title: "Yamaha P-125 디지털 피아노",
        description:
          "거의 새것 같은 상태의 디지털 피아노입니다. 원래 포장지까지 보관하고 있습니다.",
        category: "keyboard",
        brand: "Yamaha",
        model: "P-125",
        year: 2022,
        condition: "A",
        price: 450000,
        region: "서울특별시",
        images: ["/placeholder-piano.jpg"],
        isEscrow: true,
        isShipping: true,
        status: "active",
        views: 156,
        likes: 23,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "2",
        sellerId: "seller2",
        title: "Fender Stratocaster 일렉기타",
        description:
          "클래식한 Fender Stratocaster입니다. 스크래치 거의 없고 상태 양호합니다.",
        category: "string",
        brand: "Fender",
        model: "Stratocaster",
        year: 2020,
        condition: "B",
        price: 850000,
        region: "부산광역시",
        images: ["/placeholder-guitar.jpg"],
        isEscrow: true,
        isShipping: false,
        status: "active",
        views: 234,
        likes: 45,
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-14"),
      },
      // 더 많은 mock 데이터...
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    const matchesCondition =
      !selectedCondition || product.condition === selectedCondition;
    const matchesPrice =
      (!priceRange.min || product.price >= parseInt(priceRange.min)) &&
      (!priceRange.max || product.price <= parseInt(priceRange.max));

    return matchesSearch && matchesCategory && matchesCondition && matchesPrice;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const getConditionColor = (condition: ConditionGrade) => {
    const conditionInfo = conditions.find((c) => c.key === condition);
    return conditionInfo?.color || "text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            악기 둘러보기
          </h1>
          <p className="text-gray-600">다양한 중고 악기를 찾아보세요</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="악기, 브랜드, 모델명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              필터
            </Button>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <Button
                variant={viewMode === "grid" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(
                        e.target.value as InstrumentCategory | ""
                      )
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">전체</option>
                    {categories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={selectedCondition}
                    onChange={(e) =>
                      setSelectedCondition(
                        e.target.value as ConditionGrade | ""
                      )
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">전체</option>
                    {conditions.map((condition) => (
                      <option key={condition.key} value={condition.key}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가격 범위
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="최소"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      type="number"
                    />
                    <Input
                      placeholder="최대"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      type="number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            총{" "}
            <span className="font-semibold text-gray-900">
              {filteredProducts.length}
            </span>
            개의 상품을 찾았습니다
          </p>
        </div>

        {/* Products Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <span className="text-4xl">🎵</span>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {product.brand} {product.model}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${getConditionColor(
                            product.condition
                          )}`}
                        >
                          {
                            conditions.find((c) => c.key === product.condition)
                              ?.label
                          }
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {product.region}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {product.views}
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {product.likes}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🎵</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {product.title}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {product.brand} {product.model} • {product.year}년
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span
                            className={`font-semibold ${getConditionColor(
                              product.condition
                            )}`}
                          >
                            {
                              conditions.find(
                                (c) => c.key === product.condition
                              )?.label
                            }
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {product.region}
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {product.views}
                          </span>
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {product.likes}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {formatPrice(product.price)}
                        </div>
                        <div className="flex gap-2">
                          {product.isEscrow && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              안전결제
                            </span>
                          )}
                          {product.isShipping && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              운송가능
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              다른 검색어나 필터를 시도해보세요
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedCondition("");
                setPriceRange({ min: "", max: "" });
              }}
            >
              필터 초기화
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

