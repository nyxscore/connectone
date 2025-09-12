"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload, X, Plus, Music, AlertCircle } from "lucide-react";
import { InstrumentCategory, ConditionGrade } from "@/lib/types";

const categories: { key: InstrumentCategory; label: string; icon: string }[] = [
  { key: "keyboard", label: "건반악기", icon: "🎹" },
  { key: "string", label: "현악기", icon: "🎸" },
  { key: "wind", label: "관악기", icon: "🎺" },
  { key: "percussion", label: "타악기", icon: "🥁" },
  { key: "electronic", label: "전자악기", icon: "🎛️" },
  { key: "special", label: "특수악기", icon: "🎻" },
  { key: "accessories", label: "주변기기", icon: "🎧" },
];

const conditions: {
  key: ConditionGrade;
  label: string;
  description: string;
}[] = [
  { key: "S", label: "S급", description: "거의 새것과 같은 상태" },
  { key: "A", label: "A급", description: "사용감이 거의 없음" },
  { key: "B", label: "B급", description: "약간의 사용감 있음" },
  { key: "C", label: "C급", description: "눈에 띄는 사용감" },
  { key: "D", label: "D급", description: "많은 사용감이나 손상" },
];

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as InstrumentCategory | "",
    brand: "",
    model: "",
    year: "",
    condition: "" as ConditionGrade | "",
    price: "",
    region: user?.region || "",
    isEscrow: true,
    isShipping: false,
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 10); // 최대 10개
    setImages(newImages);

    // 미리보기 생성
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 유효성 검사
    if (
      !formData.title ||
      !formData.category ||
      !formData.brand ||
      !formData.model ||
      !formData.year ||
      !formData.condition ||
      !formData.price ||
      !formData.region
    ) {
      setError("필수 항목을 모두 입력해주세요.");
      setLoading(false);
      return;
    }

    if (images.length === 0) {
      setError("최소 1개 이상의 상품 사진을 업로드해주세요.");
      setLoading(false);
      return;
    }

    try {
      // 실제로는 API 호출
      console.log("상품 등록:", { ...formData, images });

      // 임시로 대시보드로 이동
      router.push("/dashboard");
    } catch (err) {
      setError("상품 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600 mb-6">
            상품을 등록하려면 먼저 로그인해주세요.
          </p>
          <Button onClick={() => router.push("/auth/login")}>로그인하기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">상품 등록</h1>
          <p className="text-gray-600">중고 악기를 판매해보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">기본 정보</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="상품명 *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: Yamaha P-125 디지털 피아노"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 설명 *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="상품의 상태, 구매 시기, 사용 기간 등을 자세히 설명해주세요"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">카테고리를 선택하세요</option>
                    {categories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태 등급 *
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">상태를 선택하세요</option>
                    {conditions.map((condition) => (
                      <option key={condition.key} value={condition.key}>
                        {condition.label} - {condition.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상품 상세 정보 */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                상품 상세 정보
              </h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="브랜드 *"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="예: Yamaha"
                  required
                />

                <Input
                  label="모델명 *"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="예: P-125"
                  required
                />

                <Input
                  label="연식 *"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="예: 2022"
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="판매가 *"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="예: 450000"
                  min="0"
                  required
                />

                <Input
                  label="거래 지역 *"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="예: 서울특별시 강남구"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* 사진 업로드 */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">상품 사진</h2>
              <p className="text-sm text-gray-600">
                최대 10장까지 업로드 가능합니다
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 이미지 미리보기 */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`상품 이미지 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 업로드 버튼 */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-sm text-gray-600 mb-4">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                      클릭하여 사진을 선택
                    </span>
                    하거나 드래그하여 업로드하세요
                  </label>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF 파일만 업로드 가능합니다
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 거래 옵션 */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">거래 옵션</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <input
                  id="isEscrow"
                  name="isEscrow"
                  type="checkbox"
                  checked={formData.isEscrow}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isEscrow" className="ml-3">
                  <span className="text-sm font-medium text-gray-900">
                    안전결제 (에스크로) 사용
                  </span>
                  <p className="text-sm text-gray-500">
                    구매자와 판매자 모두 안전한 거래를 보장합니다
                  </p>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="isShipping"
                  name="isShipping"
                  type="checkbox"
                  checked={formData.isShipping}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isShipping" className="ml-3">
                  <span className="text-sm font-medium text-gray-900">
                    운송 서비스 제공
                  </span>
                  <p className="text-sm text-gray-500">
                    대형 악기 운송 서비스를 이용할 수 있습니다
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              상품 등록하기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

