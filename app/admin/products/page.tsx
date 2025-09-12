"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { UserGradeBadge } from "../../../components/ui/UserGradeBadge";
import { useState } from "react";
import {
  Package,
  Search,
  Filter,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Tag,
  User,
} from "lucide-react";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Mock 데이터
  const products = [
    {
      id: "p1",
      title: "Fender Stratocaster 2020",
      category: "string",
      brand: "Fender",
      model: "Stratocaster",
      price: 1500000,
      condition: "A",
      seller: {
        id: "u1",
        nickname: "김악기",
        grade: "D",
      },
      isHidden: false,
      hiddenReason: "",
      reportCount: 0,
      viewCount: 45,
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-10"),
    },
    {
      id: "p2",
      title: "Yamaha P-125 디지털 피아노",
      category: "keyboard",
      brand: "Yamaha",
      model: "P-125",
      price: 800000,
      condition: "B",
      seller: {
        id: "u2",
        nickname: "이의심",
        grade: "C",
      },
      isHidden: true,
      hiddenReason: "가짜 상품 의심",
      reportCount: 3,
      viewCount: 12,
      createdAt: new Date("2024-01-08"),
      updatedAt: new Date("2024-01-09"),
    },
    {
      id: "p3",
      title: "Pearl Export 드럼 세트",
      category: "percussion",
      brand: "Pearl",
      model: "Export",
      price: 2000000,
      condition: "A",
      seller: {
        id: "u3",
        nickname: "박구매자",
        grade: "E",
      },
      isHidden: false,
      hiddenReason: "",
      reportCount: 0,
      viewCount: 78,
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-10"),
    },
  ];

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      keyboard: "건반악기",
      string: "현악기",
      wind: "관악기",
      percussion: "타악기",
      electronic: "전자악기",
      special: "특수악기",
      accessories: "악기용품",
    };
    return categories[category] || category;
  };

  const getConditionLabel = (condition: string) => {
    const conditions: Record<string, string> = {
      A: "매우 좋음",
      B: "좋음",
      C: "보통",
      D: "나쁨",
    };
    return conditions[condition] || condition;
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      A: "text-green-600 bg-green-100",
      B: "text-blue-600 bg-blue-100",
      C: "text-yellow-600 bg-yellow-100",
      D: "text-red-600 bg-red-100",
    };
    return colors[condition] || "text-gray-600 bg-gray-100";
  };

  const getStatusColor = (isHidden: boolean) => {
    return isHidden ? "text-red-600 bg-red-100" : "text-green-600 bg-green-100";
  };

  const getStatusLabel = (isHidden: boolean) => {
    return isHidden ? "숨김" : "노출";
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seller.nickname.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "visible" && !product.isHidden) ||
      (statusFilter === "hidden" && product.isHidden);

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Package className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">매물 관리</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 검색 및 필터 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="상품명, 브랜드, 모델, 판매자로 검색..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 상태</option>
                    <option value="visible">노출</option>
                    <option value="hidden">숨김</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 카테고리</option>
                    <option value="keyboard">건반악기</option>
                    <option value="string">현악기</option>
                    <option value="wind">관악기</option>
                    <option value="percussion">타악기</option>
                    <option value="electronic">전자악기</option>
                    <option value="special">특수악기</option>
                    <option value="accessories">악기용품</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상품 목록 */}
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.isHidden)}`}
                        >
                          {getStatusLabel(product.isHidden)}
                        </span>
                        {product.reportCount > 0 && (
                          <span className="flex items-center text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            신고 {product.reportCount}건
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            카테고리
                          </p>
                          <p className="text-sm text-gray-900">
                            {getCategoryLabel(product.category)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.brand} {product.model}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            가격
                          </p>
                          <p className="text-sm text-gray-900">
                            {product.price.toLocaleString()}원
                          </p>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getConditionColor(product.condition)}`}
                          >
                            {getConditionLabel(product.condition)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            판매자
                          </p>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {product.seller.nickname}
                            </span>
                            <UserGradeBadge
                              grade={product.seller.grade}
                              size="sm"
                              showDescription={false}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            조회수
                          </p>
                          <p className="text-sm text-gray-900">
                            {product.viewCount}회
                          </p>
                          <p className="text-xs text-gray-500">
                            등록: {product.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {product.isHidden && product.hiddenReason && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900">
                            숨김 사유
                          </p>
                          <p className="text-sm text-red-700">
                            {product.hiddenReason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        상세보기
                      </Button>
                      {product.isHidden ? (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          노출
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          숨김
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Tag className="w-4 h-4 mr-2" />
                        라벨
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  상품이 없습니다
                </h3>
                <p className="text-gray-600">
                  검색 조건에 맞는 상품이 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}

