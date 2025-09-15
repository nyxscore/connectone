"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { sellItemSchema, type SellItemInput } from "../../../../lib/schemas";
import { getItem, updateItem } from "../../../../lib/api/products";
import { uploadImages } from "../../../../lib/api/storage";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { SellItem } from "../../../../data/types";
import { AITagSuggestions } from "../../../../components/ui/AITagSuggestions";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { GradeProgressBar } from "../../../../components/ui/GradeProgressBar";
import {
  INSTRUMENT_CATEGORIES,
  CONDITION_GRADES,
  SHIPPING_TYPES,
} from "../../../../data/constants";
import { ArrowLeft, Upload, X, Loader2, AlertCircle, Save } from "lucide-react";

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const itemId = params.id as string;

  const [item, setItem] = useState<SellItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SellItemInput>({
    resolver: zodResolver(sellItemSchema),
  });

  const watchedCondition = watch("condition");

  useEffect(() => {
    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const result = await getItem(itemId);

      if (result.success && result.item) {
        const itemData = result.item;
        setItem(itemData as SellItem);

        // 폼에 기존 데이터 설정
        setValue("brand", itemData.brand);
        setValue("model", itemData.model);
        setValue("year", itemData.year);
        setValue("condition", itemData.condition);
        setValue("category", itemData.category);
        setValue("region", itemData.region);
        setValue("price", itemData.price);
        setValue("description", itemData.description);
        setValue(
          "shippingType",
          itemData.shippingType as "direct" | "pickup" | "courier"
        );
        setValue("escrowEnabled", itemData.escrowEnabled);

        // 이미지 URL 설정
        if (itemData.images) {
          setImageUrls(itemData.images);
        }

        // AI 태그 설정
        if (itemData.aiTags) {
          setAiTags(itemData.aiTags);
        }
      } else {
        setError(result.error || "상품을 찾을 수 없습니다.");
      }
    } catch (err) {
      setError("상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SellItemInput) => {
    if (!user || !item) return;

    setIsSubmitting(true);
    try {
      let finalImageUrls = [...imageUrls];

      // 새로 선택된 파일이 있으면 업로드
      if (selectedFiles.length > 0) {
        console.log("이미지 업로드 시작:", selectedFiles.length, "개 파일");
        const uploadResult = await uploadImages(selectedFiles);

        if (uploadResult.success && uploadResult.urls) {
          finalImageUrls = [...imageUrls, ...uploadResult.urls];
          console.log("업로드 결과:", uploadResult);
        } else {
          console.error("업로드 오류:", uploadResult.errors);
          toast.error("이미지 업로드에 실패했습니다.");
          return;
        }
      }

      // 상품 수정
      const updateData = {
        ...data,
        images: finalImageUrls,
        aiTags,
      };

      const result = await updateItem(itemId, user.uid, updateData as any);

      if (result.success) {
        toast.success("상품이 수정되었습니다!");
        router.push(`/item/${itemId}`);
      } else {
        toast.error(result.error || "상품 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("상품 수정 실패:", error);
      toast.error("상품 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            상품을 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/list")}>
            상품 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 권한 확인
  if (!user || user.uid !== item.sellerUid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            권한이 없습니다
          </h2>
          <p className="text-gray-600 mb-4">
            이 상품을 수정할 권한이 없습니다.
          </p>
          <Button onClick={() => router.push(`/item/${itemId}`)}>
            상품 상세로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/item/${itemId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            상품 상세로 돌아가기
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">상품 수정</h1>
          <p className="text-gray-600 mt-2">
            {item.brand} {item.model} 상품을 수정합니다.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 기본 정보 */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                기본 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    브랜드 *
                  </label>
                  <Input
                    {...register("brand")}
                    placeholder="예: Gibson, Fender, Yamaha"
                    error={errors.brand?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    모델명 *
                  </label>
                  <Input
                    {...register("model")}
                    placeholder="예: Les Paul Standard, Stratocaster"
                    error={errors.model?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연식 *
                  </label>
                  <Input
                    type="number"
                    {...register("year", { valueAsNumber: true })}
                    placeholder="예: 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    error={errors.year?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지역 *
                  </label>
                  <Input
                    {...register("region")}
                    placeholder="예: 서울특별시, 경기도"
                    error={errors.region?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <Select
                    {...register("category")}
                    options={INSTRUMENT_CATEGORIES.map(cat => ({
                      value: cat.key,
                      label: `${cat.icon} ${cat.label}`,
                    }))}
                    error={errors.category?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태 등급 *
                  </label>
                  <Select
                    {...register("condition")}
                    options={CONDITION_GRADES.map(grade => ({
                      value: grade.key,
                      label: grade.label,
                    }))}
                    error={errors.condition?.message}
                  />
                  {watchedCondition && (
                    <div className="mt-2">
                      <GradeProgressBar
                        grade={
                          watchedCondition as
                            | "A"
                            | "B"
                            | "C"
                            | "D"
                            | "E"
                            | "F"
                            | "G"
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* 가격 정보 */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                가격 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    판매가격 (원) *
                  </label>
                  <Input
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="예: 500000"
                    min="0"
                    error={errors.price?.message}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 이미지 업로드 */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                상품 이미지
              </h2>

              {/* 기존 이미지 */}
              {imageUrls.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    현재 이미지
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`상품 이미지 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 이미지 추가 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  새 이미지 추가
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      이미지를 선택하거나 드래그하세요
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG 파일만 가능
                    </span>
                  </label>
                </div>

                {/* 선택된 파일 목록 */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      선택된 파일
                    </h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm text-gray-700">
                            {file.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* AI 태그 제안 */}
          {imageUrls.length > 0 && (
            <AITagSuggestions
              imageUrls={imageUrls}
              onTagsChange={setAiTags}
              onConditionChange={condition => setValue("condition", condition)}
            />
          )}

          {/* 상세 정보 */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                상세 정보
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 설명 *
                  </label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="상품의 상태, 사용감, 특징 등을 자세히 설명해주세요."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      배송 방법 *
                    </label>
                    <Select
                      {...register("shippingType")}
                      options={SHIPPING_TYPES.map(type => ({
                        value: type.key,
                        label: type.label,
                      }))}
                      error={errors.shippingType?.message}
                    />
                  </div>

                  <div className="flex items-center">
                    <Checkbox {...register("escrowEnabled")} id="escrow" />
                    <label
                      htmlFor="escrow"
                      className="ml-2 text-sm text-gray-700"
                    >
                      안전거래(에스크로) 사용
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/item/${itemId}`)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  수정 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  상품 수정
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
