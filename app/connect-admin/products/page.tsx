"use client";

import { AdminRoute } from "../../../lib/auth/AdminRoute";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { UserGradeBadge } from "../../../components/ui/UserGradeBadge";
import { UserGrade } from "../../../data/types";
import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  Tag,
  User,
  ChevronLeft,
  Loader2,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../lib/hooks/useAuth";

interface Product {
  id: string;
  title: string;
  category: string;
  brand: string;
  model: string;
  price: number;
  condition: string;
  sellerId: string;
  sellerNickname: string;
  sellerGrade: UserGrade;
  isHidden: boolean;
  hiddenReason: string;
  hiddenBy?: string;
  reportCount: number;
  viewCount: number;
  likeCount: number;
  createdAt: any;
  updatedAt: any;
  images?: string[];
}

export default function ProductsPage() {
  const { user: currentAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHideModal, setShowHideModal] = useState(false);
  const [hideReason, setHideReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      setProducts(productsData);
    } catch (error) {
      console.error("상품 목록 로딩 실패:", error);
      toast.error("상품 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleHideProduct = async () => {
    if (!selectedProduct || !currentAdmin) return;

    if (!hideReason.trim()) {
      toast.error("숨김 사유를 입력해주세요.");
      return;
    }

    setActionLoading(true);
    try {
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      await updateDoc(doc(db, "products", selectedProduct.id), {
        isHidden: true,
        hiddenReason: hideReason.trim(),
        hiddenBy: currentAdmin.uid,
        hiddenByNickname: currentAdmin.nickname || "관리자",
        hiddenAt: serverTimestamp(),
      });

      const { logAdminAction } = await import("../../../lib/admin/auditLog");
      await logAdminAction({
        adminUid: currentAdmin.uid,
        adminNickname: currentAdmin.nickname || "관리자",
        action: "HIDE_PRODUCT",
        targetType: "product",
        targetId: selectedProduct.id,
        details: {
          reason: hideReason.trim(),
          productTitle: selectedProduct.title,
          sellerId: selectedProduct.sellerId,
          sellerNickname: selectedProduct.sellerNickname,
        },
        status: "success",
      });

      toast.success(`"${selectedProduct.title}" 상품을 숨겼습니다.`);

      setShowHideModal(false);
      setHideReason("");
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      console.error("상품 숨김 실패:", error);
      toast.error("상품 숨김 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnhideProduct = async (product: Product) => {
    if (!currentAdmin) return;

    setActionLoading(true);
    try {
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { doc, updateDoc, deleteField, serverTimestamp } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      await updateDoc(doc(db, "products", product.id), {
        isHidden: false,
        hiddenReason: deleteField(),
        unhiddenBy: currentAdmin.uid,
        unhiddenByNickname: currentAdmin.nickname || "관리자",
        unhiddenAt: serverTimestamp(),
      });

      const { logAdminAction } = await import("../../../lib/admin/auditLog");
      await logAdminAction({
        adminUid: currentAdmin.uid,
        adminNickname: currentAdmin.nickname || "관리자",
        action: "UNHIDE_PRODUCT",
        targetType: "product",
        targetId: product.id,
        details: {
          productTitle: product.title,
          sellerId: product.sellerId,
          sellerNickname: product.sellerNickname,
        },
        status: "success",
      });

      toast.success(`"${product.title}" 상품을 노출했습니다.`);
      loadProducts();
    } catch (error) {
      console.error("상품 노출 실패:", error);
      toast.error("상품 노출 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

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
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (product.title || "").toLowerCase().includes(searchLower) ||
      (product.brand || "").toLowerCase().includes(searchLower) ||
      (product.model || "").toLowerCase().includes(searchLower) ||
      (product.sellerNickname || "").toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "visible" && !product.isHidden) ||
      (statusFilter === "hidden" && product.isHidden);

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
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
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    상품 관리
                  </h1>
                  <p className="text-xs text-gray-500">
                    {filteredProducts.length}개 표시 중
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상품 목록 */}
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className={`${product.isHidden ? "border-red-300 bg-red-50/30" : ""}`}
              >
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
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getConditionColor(product.condition)}`}
                        >
                          {getConditionLabel(product.condition)}
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
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <Tag className="w-4 h-4 mr-2" />
                            <span className="font-medium">카테고리</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            {getCategoryLabel(product.category)}
                          </p>
                          <p className="text-xs text-gray-500 ml-6">
                            {product.brand} {product.model}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span className="font-medium">가격</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6 font-bold">
                            {product.price.toLocaleString()}원
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <User className="w-4 h-4 mr-2" />
                            <span className="font-medium">판매자</span>
                          </div>
                          <div className="flex items-center space-x-2 ml-6">
                            <span className="text-sm text-gray-900">
                              {product.sellerNickname}
                            </span>
                            <UserGradeBadge
                              grade={product.sellerGrade}
                              size="sm"
                              showDescription={false}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            <span className="font-medium">통계</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            조회 {product.viewCount || 0} | 좋아요{" "}
                            {product.likeCount || 0}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 ml-6">
                            <Calendar className="w-3 h-3 mr-1" />
                            {product.createdAt
                              ?.toDate?.()
                              ?.toLocaleDateString("ko-KR") || "N/A"}
                          </div>
                        </div>
                      </div>

                      {product.isHidden && product.hiddenReason && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
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
                      <Link href={`/product/${product.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          상세보기
                        </Button>
                      </Link>
                      {product.isHidden ? (
                        <Button
                          size="sm"
                          onClick={() => handleUnhideProduct(product)}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          노출
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowHideModal(true);
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          숨김
                        </Button>
                      )}
                      <Link
                        href={`/connect-admin/labels?productId=${product.id}`}
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Tag className="w-4 h-4 mr-2" />
                          라벨
                        </Button>
                      </Link>
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

        {/* 숨김 모달 */}
        {showHideModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                상품 숨김
              </h2>
              <p className="text-gray-600 mb-4">
                <span className="font-semibold">{selectedProduct.title}</span>
                을(를) 숨기시겠습니까?
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    숨김 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={hideReason}
                    onChange={e => setHideReason(e.target.value)}
                    rows={3}
                    placeholder="숨김 사유를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    예: 부적절한 내용, 가짜 상품 의심, 중복 게시물 등
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowHideModal(false);
                    setSelectedProduct(null);
                    setHideReason("");
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={actionLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleHideProduct}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "숨기기"
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
