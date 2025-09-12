"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { UserGradeBadge } from "../../../components/ui/UserGradeBadge";
import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  UserX,
  UserCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Mock 데이터
  const users = [
    {
      id: "u1",
      email: "user1@example.com",
      nickname: "김악기",
      region: "서울시 강남구",
      grade: "D",
      tradeCount: 15,
      reviewCount: 12,
      safeTransactionCount: 8,
      averageRating: 4.5,
      disputeCount: 0,
      isSuspended: false,
      suspensionReason: "",
      lastActiveAt: new Date("2024-01-10"),
      createdAt: new Date("2023-12-01"),
    },
    {
      id: "u2",
      email: "user2@example.com",
      nickname: "이의심",
      region: "부산시 해운대구",
      grade: "C",
      tradeCount: 3,
      reviewCount: 1,
      safeTransactionCount: 1,
      averageRating: 2.1,
      disputeCount: 2,
      isSuspended: true,
      suspensionReason: "스팸 계정 의심",
      lastActiveAt: new Date("2024-01-05"),
      createdAt: new Date("2024-01-01"),
    },
    {
      id: "u3",
      email: "user3@example.com",
      nickname: "박구매자",
      region: "대구시 수성구",
      grade: "E",
      tradeCount: 25,
      reviewCount: 20,
      safeTransactionCount: 18,
      averageRating: 4.8,
      disputeCount: 0,
      isSuspended: false,
      suspensionReason: "",
      lastActiveAt: new Date("2024-01-09"),
      createdAt: new Date("2023-11-15"),
    },
  ];

  const getStatusColor = (isSuspended: boolean) => {
    return isSuspended
      ? "text-red-600 bg-red-100"
      : "text-green-600 bg-green-100";
  };

  const getStatusLabel = (isSuspended: boolean) => {
    return isSuspended ? "정지됨" : "활성";
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.region.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.isSuspended) ||
      (statusFilter === "suspended" && user.isSuspended);

    const matchesGrade = gradeFilter === "all" || user.grade === gradeFilter;

    return matchesSearch && matchesStatus && matchesGrade;
  });

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  사용자 관리
                </h1>
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
                      placeholder="닉네임, 이메일, 지역으로 검색..."
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
                    <option value="active">활성</option>
                    <option value="suspended">정지됨</option>
                  </select>
                  <select
                    value={gradeFilter}
                    onChange={e => setGradeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 등급</option>
                    <option value="C">C (Chord)</option>
                    <option value="D">D (Duo)</option>
                    <option value="E">E (Ensemble)</option>
                    <option value="F">F (Forte)</option>
                    <option value="G">G (Grand)</option>
                    <option value="A">A (Allegro)</option>
                    <option value="B">B (Bravura)</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 사용자 목록 */}
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.nickname}
                        </h3>
                        <UserGradeBadge
                          grade={user.grade}
                          size="sm"
                          showDescription={false}
                        />
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.isSuspended)}`}
                        >
                          {getStatusLabel(user.isSuspended)}
                        </span>
                        {user.disputeCount > 0 && (
                          <span className="flex items-center text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            분쟁 {user.disputeCount}건
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            연락처
                          </p>
                          <p className="text-sm text-gray-900">{user.email}</p>
                          <p className="text-xs text-gray-500">{user.region}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            거래 현황
                          </p>
                          <p className="text-sm text-gray-900">
                            총 {user.tradeCount}회 | 안전거래{" "}
                            {user.safeTransactionCount}회
                          </p>
                          <p className="text-xs text-gray-500">
                            평점 {user.averageRating} ({user.reviewCount}개
                            후기)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            활동 정보
                          </p>
                          <p className="text-sm text-gray-900">
                            가입: {user.createdAt.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            최근 활동: {user.lastActiveAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {user.isSuspended && user.suspensionReason && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900">
                            정지 사유
                          </p>
                          <p className="text-sm text-red-700">
                            {user.suspensionReason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        상세보기
                      </Button>
                      {user.isSuspended ? (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          정지 해제
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          정지
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <EyeOff className="w-4 h-4 mr-2" />
                        숨김
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  사용자가 없습니다
                </h3>
                <p className="text-gray-600">
                  검색 조건에 맞는 사용자가 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}

