"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  MessageSquare,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../lib/hooks/useAuth";

interface Report {
  id: string;
  type: "user" | "product" | "message" | "transaction";
  reason: string;
  description: string;
  reporterId: string;
  reporterNickname: string;
  reporterEmail: string;
  reportedId: string;
  reportedNickname: string;
  reportedEmail: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  adminNotes?: string;
  resolution?: string;
  createdAt: any;
  updatedAt?: any;
  reviewedBy?: string;
  reviewedAt?: any;
}

export default function ReportsPage() {
  const { user: currentAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"resolve" | "dismiss">(
    "resolve"
  );
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[];

      setReports(reportsData);
    } catch (error) {
      console.error("신고 목록 로딩 실패:", error);
      toast.error("신고 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    newStatus: "reviewing" | "resolved" | "dismissed"
  ) => {
    if (!selectedReport || !currentAdmin) return;

    if (
      (newStatus === "resolved" || newStatus === "dismissed") &&
      !actionNotes.trim()
    ) {
      toast.error("처리 내용을 입력해주세요.");
      return;
    }

    setActionLoading(true);
    try {
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      const updateData: any = {
        status: newStatus,
        reviewedBy: currentAdmin.uid,
        reviewedByNickname: currentAdmin.nickname || "관리자",
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (actionNotes.trim()) {
        updateData.adminNotes = actionNotes.trim();
      }

      if (newStatus === "resolved" || newStatus === "dismissed") {
        updateData.resolution = actionNotes.trim();
      }

      await updateDoc(doc(db, "reports", selectedReport.id), updateData);

      const { logAdminAction } = await import("../../../lib/admin/auditLog");
      await logAdminAction({
        adminUid: currentAdmin.uid,
        adminNickname: currentAdmin.nickname || "관리자",
        action: `REPORT_${newStatus.toUpperCase()}`,
        targetType: "report",
        targetId: selectedReport.id,
        details: {
          reportType: selectedReport.type,
          reason: selectedReport.reason,
          reporterId: selectedReport.reporterId,
          reportedId: selectedReport.reportedId,
          notes: actionNotes.trim(),
        },
        status: "success",
      });

      toast.success(
        `신고를 ${newStatus === "resolved" ? "승인" : newStatus === "dismissed" ? "기각" : "검토 시작"}했습니다.`
      );

      setShowActionModal(false);
      setActionNotes("");
      setSelectedReport(null);
      loadReports();
    } catch (error) {
      console.error("신고 상태 업데이트 실패:", error);
      toast.error("신고 처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "product":
        return <Package className="w-4 h-4" />;
      case "message":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "user":
        return "사용자 신고";
      case "product":
        return "상품 신고";
      case "message":
        return "메시지 신고";
      case "transaction":
        return "거래 신고";
      default:
        return type;
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
        return "승인됨";
      case "dismissed":
        return "기각됨";
      default:
        return status;
    }
  };

  const filteredReports = reports.filter(report => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (report.reason || "").toLowerCase().includes(searchLower) ||
      (report.reporterNickname || "").toLowerCase().includes(searchLower) ||
      (report.reportedNickname || "").toLowerCase().includes(searchLower) ||
      (report.description || "").toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;

    const matchesType = typeFilter === "all" || report.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/connect-admin">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    대시보드
                  </Button>
                </Link>
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    신고 관리
                  </h1>
                  <p className="text-xs text-gray-500">
                    {filteredReports.length}건 표시 중
                  </p>
                </div>
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
                      placeholder="신고자, 피신고자, 사유, 설명으로 검색..."
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
                    <option value="all">전체 유형</option>
                    <option value="user">사용자</option>
                    <option value="product">상품</option>
                    <option value="message">메시지</option>
                    <option value="transaction">거래</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 상태</option>
                    <option value="pending">대기</option>
                    <option value="reviewing">검토중</option>
                    <option value="resolved">승인됨</option>
                    <option value="dismissed">기각됨</option>
                  </select>
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
                            {getTypeLabel(report.type)}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(report.status)}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {report.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString("ko-KR") || "N/A"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            신고자
                          </p>
                          <p className="text-sm text-gray-900">
                            {report.reporterNickname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.reporterEmail}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            피신고자
                          </p>
                          <p className="text-sm text-gray-900">
                            {report.reportedNickname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.reportedEmail}
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

                      {report.resolution && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            처리 결과
                          </p>
                          <p
                            className={`text-sm text-gray-900 p-3 rounded-lg ${report.status === "resolved" ? "bg-green-50" : "bg-gray-50"}`}
                          >
                            {report.resolution}
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
                            onClick={() => handleUpdateStatus("reviewing")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            검토 시작
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType("resolve");
                              setShowActionModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            승인
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType("dismiss");
                              setShowActionModal(true);
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            기각
                          </Button>
                        </>
                      )}
                      {report.status === "reviewing" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType("resolve");
                              setShowActionModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            승인
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType("dismiss");
                              setShowActionModal(true);
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            기각
                          </Button>
                        </>
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

        {/* 액션 모달 */}
        {showActionModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                신고 {actionType === "resolve" ? "승인" : "기각"}
              </h2>
              <p className="text-gray-600 mb-4">
                {selectedReport.reporterNickname}님의 신고를{" "}
                {actionType === "resolve" ? "승인" : "기각"}하시겠습니까?
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    처리 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    rows={4}
                    placeholder={
                      actionType === "resolve"
                        ? "승인 사유와 취한 조치를 입력하세요"
                        : "기각 사유를 입력하세요"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedReport(null);
                    setActionNotes("");
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={actionLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={() =>
                    handleUpdateStatus(
                      actionType === "resolve" ? "resolved" : "dismissed"
                    )
                  }
                  disabled={actionLoading}
                  className={`flex-1 ${actionType === "resolve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : actionType === "resolve" ? (
                    "승인"
                  ) : (
                    "기각"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
