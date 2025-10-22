"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  AlertTriangle,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../lib/hooks/useAuth";

interface Dispute {
  id: string;
  transactionId: string;
  reason: string;
  description: string;
  reporterId: string;
  reporterNickname: string;
  reporterEmail: string;
  reportedId: string;
  reportedNickname: string;
  reportedEmail: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  adminNotes?: string;
  resolution?: string;
  createdAt: any;
  updatedAt?: any;
  resolvedAt?: any;
  resolvedBy?: string;
}

export default function DisputesPage() {
  const { user: currentAdmin } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<
    "investigate" | "resolve" | "dismiss"
  >("investigate");
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const { db } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore"
      );

      const q = query(collection(db, "disputes"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const disputesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Dispute[];

      setDisputes(disputesData);
    } catch (error) {
      console.error("분쟁 목록 로딩 실패:", error);
      toast.error("분쟁 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDispute || !currentAdmin) return;

    if (!actionNotes.trim() && actionType !== "investigate") {
      toast.error("처리 내용을 입력해주세요.");
      return;
    }

    setActionLoading(true);
    try {
      const { db } = await import("@/lib/api/firebase-lazy");
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );

      let newStatus: Dispute["status"];
      switch (actionType) {
        case "investigate":
          newStatus = "investigating";
          break;
        case "resolve":
          newStatus = "resolved";
          break;
        case "dismiss":
          newStatus = "dismissed";
          break;
      }

      const updateData: any = {
        status: newStatus,
        reviewedBy: currentAdmin.uid,
        reviewedByNickname: currentAdmin.nickname || "관리자",
        updatedAt: serverTimestamp(),
      };

      if (actionNotes.trim()) {
        updateData.adminNotes = actionNotes.trim();
      }

      if (newStatus === "resolved" || newStatus === "dismissed") {
        updateData.resolution = actionNotes.trim();
        updateData.resolvedAt = serverTimestamp();
        updateData.resolvedBy = currentAdmin.uid;
      }

      await updateDoc(doc(db, "disputes", selectedDispute.id), updateData);

      const { logAdminAction } = await import("../../../lib/admin/auditLog");
      await logAdminAction({
        adminUid: currentAdmin.uid,
        adminNickname: currentAdmin.nickname || "관리자",
        action: `DISPUTE_${newStatus.toUpperCase()}`,
        targetType: "dispute",
        targetId: selectedDispute.id,
        details: {
          transactionId: selectedDispute.transactionId,
          reason: selectedDispute.reason,
          reporterId: selectedDispute.reporterId,
          reportedId: selectedDispute.reportedId,
          notes: actionNotes.trim(),
        },
        status: "success",
      });

      const statusLabel =
        newStatus === "investigating"
          ? "조사 시작"
          : newStatus === "resolved"
            ? "해결 완료"
            : "기각";
      toast.success(`분쟁을 ${statusLabel}했습니다.`);

      setShowActionModal(false);
      setActionNotes("");
      setSelectedDispute(null);
      loadDisputes();
    } catch (error) {
      console.error("분쟁 상태 업데이트 실패:", error);
      toast.error("분쟁 처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

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
      dispute.reporterNickname
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      dispute.reportedNickname
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      dispute.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || dispute.status === statusFilter;

    return matchesSearch && matchesStatus;
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
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    분쟁 관리
                  </h1>
                  <p className="text-xs text-gray-500">
                    {filteredDisputes.length}건 표시 중
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
                          {dispute.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString("ko-KR") || "N/A"}
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
                              {dispute.reporterNickname}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {dispute.reporterEmail}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            피신고자
                          </p>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {dispute.reportedNickname}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {dispute.reportedEmail}
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
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setActionType("investigate");
                              setShowActionModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            조사 시작
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDispute(dispute);
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
                      {dispute.status === "investigating" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setActionType("resolve");
                            setShowActionModal(true);
                          }}
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

        {/* 액션 모달 */}
        {showActionModal && selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                분쟁{" "}
                {actionType === "investigate"
                  ? "조사 시작"
                  : actionType === "resolve"
                    ? "해결"
                    : "기각"}
              </h2>
              <p className="text-gray-600 mb-4">
                거래 ID:{" "}
                <span className="font-mono">
                  {selectedDispute.transactionId}
                </span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {actionType === "investigate"
                      ? "조사 메모 (선택)"
                      : "처리 내용"}
                    {actionType !== "investigate" && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    rows={4}
                    placeholder={
                      actionType === "investigate"
                        ? "조사 메모를 입력하세요 (선택)"
                        : actionType === "resolve"
                          ? "해결 내용과 조치 사항을 입력하세요"
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
                    setSelectedDispute(null);
                    setActionNotes("");
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={actionLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={actionLoading}
                  className={`flex-1 ${
                    actionType === "investigate"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : actionType === "resolve"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : actionType === "investigate" ? (
                    "조사 시작"
                  ) : actionType === "resolve" ? (
                    "해결 완료"
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
