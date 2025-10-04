"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useState } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function DisputesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock 데이터
  const disputes = [
    {
      id: "d1",
      transactionId: "tx_123",
      reporter: {
        id: "u1",
        nickname: "김구매자",
        email: "buyer@example.com",
      },
      reported: {
        id: "u2",
        nickname: "이판매자",
        email: "seller@example.com",
      },
      reason: "상품 불일치",
      description:
        "주문한 상품과 실제 받은 상품이 다릅니다. 색상이 완전히 다르고 상태도 더 나쁩니다.",
      status: "investigating",
      adminNotes: "상품 사진과 실제 상품 비교 필요",
      resolution: "",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
      resolvedAt: null,
      resolvedBy: null,
    },
    {
      id: "d2",
      transactionId: "tx_456",
      reporter: {
        id: "u3",
        nickname: "박구매자",
        email: "buyer2@example.com",
      },
      reported: {
        id: "u4",
        nickname: "최판매자",
        email: "seller2@example.com",
      },
      reason: "배송 지연",
      description:
        "2주 전에 결제했는데 아직도 배송이 안 됩니다. 연락도 안 됩니다.",
      status: "resolved",
      adminNotes: "판매자 연락 후 배송 완료",
      resolution: "판매자와 연락하여 배송 완료. 추가 보상 제공",
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-08"),
      resolvedAt: new Date("2024-01-08"),
      resolvedBy: "admin1",
    },
    {
      id: "d3",
      transactionId: "tx_789",
      reporter: {
        id: "u5",
        nickname: "정구매자",
        email: "buyer3@example.com",
      },
      reported: {
        id: "u6",
        nickname: "한판매자",
        email: "seller3@example.com",
      },
      reason: "환불 거부",
      description: "상품에 하자가 있어서 환불을 요청했는데 거부당했습니다.",
      status: "pending",
      adminNotes: "",
      resolution: "",
      createdAt: new Date("2024-01-09"),
      updatedAt: new Date("2024-01-09"),
      resolvedAt: null,
      resolvedBy: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "investigating":
        return "text-blue-600 bg-blue-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      case "dismissed":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "대기";
      case "investigating":
        return "조사중";
      case "resolved":
        return "해결됨";
      case "dismissed":
        return "기각됨";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "investigating":
        return <AlertTriangle className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "dismissed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch =
      dispute.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reporter.nickname
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      dispute.reported.nickname
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      dispute.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || dispute.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">분쟁 관리</h1>
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
                      placeholder="거래 ID, 신고자, 피신고자, 사유로 검색..."
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
                    <option value="pending">대기</option>
                    <option value="investigating">조사중</option>
                    <option value="resolved">해결됨</option>
                    <option value="dismissed">기각됨</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 분쟁 목록 */}
          <div className="space-y-4">
            {filteredDisputes.map(dispute => (
              <Card key={dispute.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2 text-gray-600">
                          {getStatusIcon(dispute.status)}
                          <span className="text-sm font-medium">거래 분쟁</span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(dispute.status)}`}
                        >
                          {getStatusLabel(dispute.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {dispute.createdAt.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            신고자
                          </p>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {dispute.reporter.nickname}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {dispute.reporter.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            피신고자
                          </p>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {dispute.reported.nickname}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {dispute.reported.email}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          거래 ID
                        </p>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 font-mono">
                            {dispute.transactionId}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          분쟁 사유
                        </p>
                        <p className="text-sm text-gray-900">
                          {dispute.reason}
                        </p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          상세 설명
                        </p>
                        <p className="text-sm text-gray-900">
                          {dispute.description}
                        </p>
                      </div>

                      {dispute.adminNotes && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            관리자 메모
                          </p>
                          <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">
                            {dispute.adminNotes}
                          </p>
                        </div>
                      )}

                      {dispute.resolution && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            해결 내용
                          </p>
                          <p className="text-sm text-gray-900 bg-green-50 p-3 rounded-lg">
                            {dispute.resolution}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        상세보기
                      </Button>
                      {dispute.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            조사 시작
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            기각
                          </Button>
                        </>
                      )}
                      {dispute.status === "investigating" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          해결 완료
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDisputes.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  분쟁이 없습니다
                </h3>
                <p className="text-gray-600">
                  검색 조건에 맞는 분쟁이 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}


















