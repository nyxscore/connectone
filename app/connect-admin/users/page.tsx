"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { UserGradeBadge } from "../../../components/ui/UserGradeBadge";
import { UserGrade } from "../../../data/types";
import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  UserX,
  UserCheck,
  Eye,
  AlertTriangle,
  ChevronLeft,
  Loader2,
  Mail,
  MapPin,
  Calendar,
  Activity,
  Star,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../lib/hooks/useAuth";

interface User {
  id: string;
  email: string;
  nickname: string;
  username?: string;
  region: string;
  grade: UserGrade;
  tradeCount: number;
  reviewCount: number;
  safeTransactionCount: number;
  averageRating: number;
  disputeCount: number;
  isSuspended: boolean;
  suspensionReason: string;
  suspensionStartDate?: any;
  suspensionEndDate?: any;
  lastActiveAt: any;
  createdAt: any;
  points?: number;
  responseRate?: number;
}

export default function UsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionDays, setSuspensionDays] = useState("7");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { db } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore"
      );

      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      setUsers(usersData);
    } catch (error) {
      console.error("사용자 목록 로딩 실패:", error);
      toast.error("사용자 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !currentAdmin) return;

    if (!suspensionReason.trim()) {
      toast.error("정지 사유를 입력해주세요.");
      return;
    }

    setActionLoading(true);
    try {
      const { db } = await import("@/lib/api/firebase-lazy");
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );

      const days = parseInt(suspensionDays);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      await updateDoc(doc(db, "users", selectedUser.id), {
        isSuspended: true,
        suspensionReason: suspensionReason.trim(),
        suspensionStartDate: serverTimestamp(),
        suspensionEndDate: endDate,
        suspendedBy: currentAdmin.uid,
        suspendedByNickname: currentAdmin.nickname || "관리자",
      });

      const { logAdminAction } = await import("../../../lib/admin/auditLog");
      await logAdminAction({
        adminUid: currentAdmin.uid,
        adminNickname: currentAdmin.nickname || "관리자",
        action: "SUSPEND_USER",
        targetType: "user",
        targetId: selectedUser.id,
        details: {
          reason: suspensionReason.trim(),
          days,
          targetNickname: selectedUser.nickname,
          targetEmail: selectedUser.email,
        },
        status: "success",
      });

      toast.success(`${selectedUser.nickname}님을 ${days}일간 정지했습니다.`);

      setShowSuspendModal(false);
      setSuspensionReason("");
      setSuspensionDays("7");
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("사용자 정지 실패:", error);
      toast.error("사용자 정지 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendUser = async (user: User) => {
    if (!currentAdmin) return;

    setActionLoading(true);
    try {
      const { db } = await import("@/lib/api/firebase-lazy");
      const { doc, updateDoc, deleteField } = await import(
        "firebase/firestore"
      );

      await updateDoc(doc(db, "users", user.id), {
        isSuspended: false,
        suspensionReason: deleteField(),
        suspensionStartDate: deleteField(),
        suspensionEndDate: deleteField(),
        unsuspendedBy: currentAdmin.uid,
        unsuspendedByNickname: currentAdmin.nickname || "관리자",
      });

      const { logAdminAction } = await import("../../../lib/admin/auditLog");
      await logAdminAction({
        adminUid: currentAdmin.uid,
        adminNickname: currentAdmin.nickname || "관리자",
        action: "UNSUSPEND_USER",
        targetType: "user",
        targetId: user.id,
        details: {
          targetNickname: user.nickname,
          targetEmail: user.email,
        },
        status: "success",
      });

      toast.success(`${user.nickname}님의 정지를 해제했습니다.`);
      loadUsers();
    } catch (error) {
      console.error("정지 해제 실패:", error);
      toast.error("정지 해제 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

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
      (user.username &&
        user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.region.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.isSuspended) ||
      (statusFilter === "suspended" && user.isSuspended);

    const matchesGrade = gradeFilter === "all" || user.grade === gradeFilter;

    return matchesSearch && matchesStatus && matchesGrade;
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
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    사용자 관리
                  </h1>
                  <p className="text-xs text-gray-500">
                    {filteredUsers.length}명 표시 중
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
                      placeholder="닉네임, 이메일, 아이디, 지역으로 검색..."
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
                    <option value="E">E (Ensemble)</option>
                    <option value="D">D (Duo)</option>
                    <option value="C">C (Chord)</option>
                    <option value="B">B (Bravura)</option>
                    <option value="A">A (Allegro)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 사용자 목록 */}
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <Card
                key={user.id}
                className={`${user.isSuspended ? "border-red-300 bg-red-50/30" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.nickname}
                        </h3>
                        {user.username && (
                          <span className="text-sm text-gray-500">
                            @{user.username}
                          </span>
                        )}
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
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <Mail className="w-4 h-4 mr-2" />
                            <span className="font-medium">연락처</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            {user.email}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 ml-6">
                            <MapPin className="w-3 h-3 mr-1" />
                            {user.region || "지역 정보 없음"}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            <span className="font-medium">거래 현황</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            총 {user.tradeCount || 0}회 | 안전거래{" "}
                            {user.safeTransactionCount || 0}회
                          </p>
                          <div className="flex items-center text-xs text-gray-500 ml-6">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                            평점 {user.averageRating?.toFixed(1) || "0.0"} (
                            {user.reviewCount || 0}개 후기)
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span className="font-medium">활동 정보</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            가입:{" "}
                            {user.createdAt
                              ?.toDate?.()
                              ?.toLocaleDateString("ko-KR") || "N/A"}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 ml-6">
                            <Activity className="w-3 h-3 mr-1" />
                            최근:{" "}
                            {user.lastActiveAt
                              ?.toDate?.()
                              ?.toLocaleDateString("ko-KR") || "N/A"}
                          </div>
                        </div>
                      </div>

                      {user.points !== undefined && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            보유 포인트:
                          </span>
                          <span className="ml-2 text-sm font-bold text-yellow-600">
                            {user.points.toLocaleString()}P
                          </span>
                        </div>
                      )}

                      {user.isSuspended && user.suspensionReason && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                          <p className="text-sm font-medium text-red-900 mb-1">
                            정지 사유
                          </p>
                          <p className="text-sm text-red-700">
                            {user.suspensionReason}
                          </p>
                          {user.suspensionEndDate && (
                            <p className="text-xs text-red-600 mt-1">
                              정지 종료:{" "}
                              {new Date(
                                user.suspensionEndDate.seconds * 1000
                              ).toLocaleDateString("ko-KR")}
                            </p>
                          )}
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
                          onClick={() => handleUnsuspendUser(user)}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          정지 해제
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowSuspendModal(true);
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          정지
                        </Button>
                      )}
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

        {/* 정지 모달 */}
        {showSuspendModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                사용자 정지
              </h2>
              <p className="text-gray-600 mb-4">
                <span className="font-semibold">{selectedUser.nickname}</span>
                님을 정지하시겠습니까?
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정지 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={suspensionReason}
                    onChange={e => setSuspensionReason(e.target.value)}
                    rows={3}
                    placeholder="정지 사유를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정지 기간
                  </label>
                  <select
                    value={suspensionDays}
                    onChange={e => setSuspensionDays(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="1">1일</option>
                    <option value="3">3일</option>
                    <option value="7">7일</option>
                    <option value="14">14일</option>
                    <option value="30">30일</option>
                    <option value="365">영구 정지</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSelectedUser(null);
                    setSuspensionReason("");
                    setSuspensionDays("7");
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={actionLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSuspendUser}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "정지하기"
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
