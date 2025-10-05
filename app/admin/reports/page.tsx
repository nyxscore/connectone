"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  MessageSquare,
  CreditCard,
} from "lucide-react";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock 데이터
  const reports = [
    {
      id: "1",
      type: "user",
      reason: "스팸 계정",
      description: "반복적인 스팸 메시지 전송",
      reporter: {
        id: "u1",
        nickname: "김신고자",
        email: "reporter@example.com",
      },
      reported: {
        id: "u2",
        nickname: "이의심",
        email: "suspicious@example.com",
      },
      status: "pending",
      createdAt: new Date("2024-01-10"),
      adminNotes: "",
    },
    {
      id: "2",
      type: "product",
      reason: "가짜 상품",
      description: "실제와 다른 상품 사진 사용",
      reporter: { id: "u3", nickname: "박구매자", email: "buyer@example.com" },
      reported: { id: "u4", nickname: "최판매자", email: "seller@example.com" },
      status: "reviewing",
      createdAt: new Date("2024-01-09"),
      adminNotes: "상품 사진 확인 필요",
    },
    {
      id: "3",
      type: "message",
      reason: "욕설/비방",
      description: "거래 중 욕설 사용",
      reporter: { id: "u5", nickname: "정구매자", email: "buyer2@example.com" },
      reported: {
        id: "u6",
        nickname: "한판매자",
        email: "seller2@example.com",
      },
      status: "resolved",
      createdAt: new Date("2024-01-08"),
      adminNotes: "경고 조치 완료",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "product":
        return <Package className="w-4 h-4" />;
      case "message":
        return <MessageSquare className="w-4 h-4" />;
      case "transaction":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "reviewing":
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
      case "reviewing":
        return "검토중";
      case "resolved":
        return "해결됨";
      case "dismissed":
        return "기각됨";
      default:
        return status;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.nickname
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.reported.nickname.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;

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
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">신고 관리</h1>
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
                      placeholder="신고자, 피신고자, 사유로 검색..."
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
                    <option value="reviewing">검토중</option>
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

          {/* 신고 목록 */}
          <div className="space-y-4">
            {filteredReports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2 text-gray-600">
                          {getTypeIcon(report.type)}
                          <span className="text-sm font-medium">
                            {report.type === "user"
                              ? "사용자 신고"
                              : report.type === "product"
                                ? "상품 신고"
                                : report.type === "message"
                                  ? "메시지 신고"
                                  : "거래 신고"}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(report.status)}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {report.createdAt.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            신고자
                          </p>
                          <p className="text-sm text-gray-900">
                            {report.reporter.nickname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.reporter.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            피신고자
                          </p>
                          <p className="text-sm text-gray-900">
                            {report.reported.nickname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.reported.email}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          신고 사유
                        </p>
                        <p className="text-sm text-gray-900">{report.reason}</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          상세 설명
                        </p>
                        <p className="text-sm text-gray-900">
                          {report.description}
                        </p>
                      </div>

                      {report.adminNotes && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            관리자 메모
                          </p>
                          <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">
                            {report.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        상세보기
                      </Button>
                      {report.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            승인
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
                      {report.status === "reviewing" && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          검토 완료
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  신고 내역이 없습니다
                </h3>
                <p className="text-gray-600">
                  검색 조건에 맞는 신고가 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}



















