"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useState } from "react";
import {
  Tag,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Shield,
  Heart,
} from "lucide-react";

export default function LabelsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock 데이터
  const labels = [
    {
      id: "l1",
      productId: "p1",
      productTitle: "Fender Stratocaster 2020",
      type: "sentiment",
      value: "positive",
      confidence: 0.95,
      assignedBy: "ai",
      adminId: null,
      assignedAt: new Date("2024-01-10"),
      description: "긍정적인 감정 분석 결과",
    },
    {
      id: "l2",
      productId: "p2",
      productTitle: "Yamaha P-125 디지털 피아노",
      type: "warranty",
      value: "authentic",
      confidence: 0.88,
      assignedBy: "admin",
      adminId: "admin1",
      assignedAt: new Date("2024-01-09"),
      description: "정품 인증 완료",
    },
    {
      id: "l3",
      productId: "p3",
      productTitle: "Pearl Export 드럼 세트",
      type: "sentiment",
      value: "neutral",
      confidence: 0.72,
      assignedBy: "ai",
      adminId: null,
      assignedAt: new Date("2024-01-08"),
      description: "중립적인 감정 분석 결과",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sentiment":
        return <Heart className="w-4 h-4" />;
      case "warranty":
        return <Shield className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sentiment":
        return "감정 분석";
      case "warranty":
        return "보증/인증";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sentiment":
        return "text-pink-600 bg-pink-100";
      case "warranty":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getValueColor = (value: string) => {
    switch (value) {
      case "positive":
        return "text-green-600 bg-green-100";
      case "negative":
        return "text-red-600 bg-red-100";
      case "neutral":
        return "text-yellow-600 bg-yellow-100";
      case "authentic":
        return "text-blue-600 bg-blue-100";
      case "fake":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getValueLabel = (value: string) => {
    switch (value) {
      case "positive":
        return "긍정적";
      case "negative":
        return "부정적";
      case "neutral":
        return "중립적";
      case "authentic":
        return "정품";
      case "fake":
        return "가품";
      default:
        return value;
    }
  };

  const getAssignedByColor = (assignedBy: string) => {
    return assignedBy === "admin"
      ? "text-purple-600 bg-purple-100"
      : "text-green-600 bg-green-100";
  };

  const getAssignedByLabel = (assignedBy: string) => {
    return assignedBy === "admin" ? "관리자" : "AI";
  };

  const filteredLabels = labels.filter(label => {
    const matchesSearch =
      label.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      label.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      label.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || label.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Tag className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">라벨 관리</h1>
              </div>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                라벨 추가
              </Button>
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
                      placeholder="상품명, 라벨 값, 설명으로 검색..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 타입</option>
                    <option value="sentiment">감정 분석</option>
                    <option value="warranty">보증/인증</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 라벨 목록 */}
          <div className="space-y-4">
            {filteredLabels.map(label => (
              <Card key={label.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2 text-gray-600">
                          {getTypeIcon(label.type)}
                          <span className="text-sm font-medium">
                            {getTypeLabel(label.type)}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getTypeColor(label.type)}`}
                        >
                          {getTypeLabel(label.type)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getValueColor(label.value)}`}
                        >
                          {getValueLabel(label.value)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getAssignedByColor(label.assignedBy)}`}
                        >
                          {getAssignedByLabel(label.assignedBy)}
                        </span>
                        {label.confidence && (
                          <span className="text-xs text-gray-500">
                            신뢰도: {Math.round(label.confidence * 100)}%
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <p className="font-medium text-gray-900">
                          {label.productTitle}
                        </p>
                        <p className="text-sm text-gray-600">
                          {label.description}
                        </p>
                      </div>

                      <div className="flex items-center text-xs text-gray-500">
                        <span>
                          부여일: {label.assignedAt.toLocaleDateString()}
                        </span>
                        {label.adminId && (
                          <span className="ml-4">관리자: {label.adminId}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLabels.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  라벨이 없습니다
                </h3>
                <p className="text-gray-600">
                  검색 조건에 맞는 라벨이 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 라벨 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md p-6">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  라벨 추가
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 선택
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">상품을 선택하세요</option>
                    <option value="p1">Fender Stratocaster 2020</option>
                    <option value="p2">Yamaha P-125 디지털 피아노</option>
                    <option value="p3">Pearl Export 드럼 세트</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    라벨 타입
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">타입을 선택하세요</option>
                    <option value="sentiment">감정 분석</option>
                    <option value="warranty">보증/인증</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    라벨 값
                  </label>
                  <Input placeholder="라벨 값을 입력하세요" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="라벨에 대한 설명을 입력하세요"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                  >
                    추가
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}





































