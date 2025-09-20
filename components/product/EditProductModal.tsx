"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";
import { toast } from "react-hot-toast";
import { uploadImages } from "@/lib/api/storage";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { X, Upload, Save, RotateCcw } from "lucide-react";

interface ProductData {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  region: string;
  condition: string;
  images: string[];
  escrowEnabled: boolean;
  shippingTypes: string[];
  tradeOptions: string[];
  sellerUid: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onSuccess?: () => void;
}

export default function EditProductModal({
  isOpen,
  onClose,
  productId,
  onSuccess,
}: EditProductModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    region: "",
    condition: "A",
    escrowEnabled: false,
    shippingTypes: [] as string[],
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // 상품 데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId || !user) return;

      setLoading(true);
      try {
        const productRef = doc(db, "items", productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
          toast.error("상품을 찾을 수 없습니다.");
          onClose();
          return;
        }

        const productData = productDoc.data() as ProductData;
        productData.id = productDoc.id;

        // 본인 상품인지 확인
        if (user.uid !== productData.sellerUid) {
          toast.error("본인의 상품만 수정할 수 있습니다.");
          onClose();
          return;
        }

        setProduct(productData);
        // 거래방식 변환 (tradeOptions -> shippingTypes)
        const shippingTypes =
          productData.tradeOptions?.map(option => {
            switch (option) {
              case "직거래":
                return "direct";
              case "안전거래":
                return "escrow";
              case "택배":
                return "parcel";
              case "화물운송":
                return "shipping";
              default:
                return option;
            }
          }) ||
          productData.shippingTypes ||
          [];

        setFormData({
          title: productData.title || "",
          description: productData.description || "",
          category: productData.category || "",
          price: productData.price || 0,
          region: productData.region || "",
          condition: productData.condition || "A",
          escrowEnabled: productData.escrowEnabled || false,
          shippingTypes: shippingTypes,
        });
        setImages(productData.images || []);
      } catch (error) {
        console.error("상품 로드 실패:", error);
        toast.error("상품을 불러오는데 실패했습니다.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadProduct();
    }
  }, [productId, user, isOpen, onClose]);

  // 새 이미지 업로드
  const handleImageUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    setUploadingImages(true);

    try {
      const uploadResult = await uploadImages(fileArray);
      if (uploadResult.success && uploadResult.urls.length > 0) {
        setImages(prev => [...prev, ...uploadResult.urls]);
        toast.success(
          `${uploadResult.urls.length}개의 이미지가 업로드되었습니다.`
        );
      } else {
        toast.error("이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingImages(false);
    }
  };

  // 이미지 삭제
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);
    try {
      // 거래방식 변환 (shippingTypes -> tradeOptions)
      const tradeOptions = formData.shippingTypes.map(type => {
        switch (type) {
          case "direct":
            return "직거래";
          case "escrow":
            return "안전거래";
          case "parcel":
            return "택배";
          case "shipping":
            return "화물운송";
          default:
            return type;
        }
      });

      const productRef = doc(db, "items", productId);
      await updateDoc(productRef, {
        ...formData,
        images: images,
        tradeOptions: tradeOptions,
        updatedAt: new Date(),
      });

      toast.success("상품이 성공적으로 수정되었습니다!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("상품 수정 실패:", error);
      toast.error("상품 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">상품 수정</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 수정 폼 */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 상품명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품명 *
                </label>
                <Input
                  value={formData.title}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="상품명을 입력하세요"
                  required
                />
              </div>

              {/* 판매가격 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  판매가격 *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      formData.price ? formData.price.toLocaleString() : ""
                    }
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      if (value) {
                        // 큰 숫자도 처리할 수 있도록 parseInt 사용
                        setFormData(prev => ({
                          ...prev,
                          price: parseInt(value, 10),
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          price: 0,
                        }));
                      }
                    }}
                    placeholder="예: 300,000"
                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    원
                  </span>
                </div>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="상품에 대해 자세히 설명해주세요"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 이미지
                </label>

                {/* 기존 이미지들 */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`상품 이미지 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 새 이미지 업로드 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files) {
                        handleImageUpload(e.target.files);
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploadingImages ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <span className="text-sm text-gray-600">
                      {uploadingImages ? "업로드 중..." : "새 이미지 추가"}
                    </span>
                  </label>
                </div>
              </div>

              {/* 거래방식 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  거래방식 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "direct", label: "직거래" },
                    { key: "escrow", label: "안전거래" },
                    { key: "parcel", label: "택배" },
                    { key: "shipping", label: "화물운송" },
                  ].map(option => (
                    <div key={option.key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={option.key}
                        checked={formData.shippingTypes.includes(option.key)}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            shippingTypes: e.target.checked
                              ? [...prev.shippingTypes, option.key]
                              : prev.shippingTypes.filter(
                                  t => t !== option.key
                                ),
                          }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={option.key}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex space-x-4 pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "저장 중..." : "수정 완료"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // 폼 초기화
                    setFormData({
                      title: "",
                      description: "",
                      category: "",
                      price: 0,
                      region: "",
                      condition: "A",
                      images: [],
                      escrowEnabled: false,
                      shippingTypes: [],
                    });
                    setImages([]);
                    toast.success("폼이 초기화되었습니다.");
                  }}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>초기화</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
