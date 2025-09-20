"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { sellItemSchema, type SellItemInput } from "../../lib/schemas";
import { getItem, updateItem } from "../../lib/api/products";
import { uploadImages } from "../../lib/api/storage";
import { useAuth } from "../../lib/hooks/useAuth";
import { SellItem } from "../../data/types";
import { AITagSuggestions } from "../ui/AITagSuggestions";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Checkbox } from "../ui/Checkbox";
import {
  INSTRUMENT_CATEGORIES,
  CONDITION_GRADES,
  SHIPPING_TYPES,
} from "../../data/constants/index";
import { X, Upload, Loader2, AlertCircle, Save } from "lucide-react";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  onItemUpdated?: () => void;
}

export function EditItemModal({
  isOpen,
  onClose,
  itemId,
  onItemUpdated,
}: EditItemModalProps) {
  const { user } = useAuth();
  const [item, setItem] = useState<SellItem | null>(null);
  const [loading, setLoading] = useState(false);
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
    if (isOpen && itemId) {
      loadItem();
    }
  }, [isOpen, itemId]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const result = await getItem(itemId);

      if (result.success && result.item) {
        const itemData = result.item;
        setItem(itemData as SellItem);

        // 폼에 기존 데이터 설정
        setValue("title", itemData.title);
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

        // shippingTypes 설정
        if (itemData.shippingTypes && Array.isArray(itemData.shippingTypes)) {
          setValue("shippingTypes", itemData.shippingTypes);
        } else if (itemData.shippingType) {
          // 기존 단일 shippingType을 배열로 변환
          setValue("shippingTypes", [itemData.shippingType]);
        }

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

  const removeExistingImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
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
        // shippingTypes가 배열이 아닌 경우 배열로 변환
        shippingTypes: Array.isArray(data.shippingTypes)
          ? data.shippingTypes
          : data.shippingType
            ? [data.shippingType]
            : [],
      };

      const result = await updateItem(itemId, user.uid, updateData as any);

      if (result.success) {
        toast.success("상품이 수정되었습니다!");
        onItemUpdated?.();
        onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">상품 수정</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">상품을 불러오는 중...</p>
            </div>
          ) : error || !item ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                상품을 찾을 수 없습니다
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={onClose}>닫기</Button>
            </div>
          ) : !user || user.uid !== item.sellerUid ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                권한이 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                이 상품을 수정할 권한이 없습니다.
              </p>
              <Button onClick={onClose}>닫기</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 기본 정보 */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    기본 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상품명 *
                      </label>
                      <Input
                        {...register("title")}
                        placeholder="예: Gibson Les Paul Standard"
                        error={errors.title?.message}
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
                    </div>
                  </div>
                </div>
              </Card>

              {/* 가격 정보 */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    가격 정보
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      판매가격 *
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        {...register("price", { valueAsNumber: true })}
                        placeholder="예: 500000"
                        min="0"
                        step="1000"
                        className="pr-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        error={errors.price?.message}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        원
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 이미지 업로드 */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    상품 이미지
                  </h3>

                  {/* 기존 이미지 */}
                  {imageUrls.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        현재 이미지
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={url}
                                alt={`상품 이미지 ${index + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {/* 삭제 버튼 */}
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                              title="이미지 삭제"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 새 이미지 추가 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      새 이미지 추가
                    </h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          이미지를 선택하거나 드래그하세요
                        </span>
                      </label>
                    </div>

                    {/* 선택된 파일 목록 */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          새로 추가할 이미지
                        </h5>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`새 이미지 ${index + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                                title="이미지 제거"
                              >
                                <X className="w-3 h-3" />
                              </button>
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
                  onConditionChange={condition =>
                    setValue("condition", condition)
                  }
                />
              )}

              {/* 상세 정보 */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    상세 정보
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상품 설명 *
                      </label>
                      <textarea
                        {...register("description")}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="상품의 상태, 사용감, 특징 등을 자세히 설명해주세요."
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          배송 방법 * (여러 개 선택 가능)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {SHIPPING_TYPES.map(type => (
                            <label
                              key={type.key}
                              className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                value={type.key}
                                {...register("shippingTypes")}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {type.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.shippingTypes && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.shippingTypes.message}
                          </p>
                        )}
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
                <Button type="button" variant="outline" onClick={onClose}>
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
          )}
        </div>
      </div>
    </div>
  );
}
