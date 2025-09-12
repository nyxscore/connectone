"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import { ProtectedRoute } from "../../lib/auth/ProtectedRoute";
import {
  sellItemSchema,
  SellItemInput,
  InstrumentCategory,
  ConditionGrade,
  ShippingType,
} from "../../data/schemas/product";
import { createItem } from "../../lib/api/products";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Card } from "../../components/ui/Card";
import { Checkbox } from "../../components/ui/Checkbox";
import { AITagSuggestions } from "../../components/ui/AITagSuggestions";
import { ImageUploadCard } from "../../components/ui/ImageUploadCard";
import toast from "react-hot-toast";
import {
  Music,
  Camera,
  Tag,
  MapPin,
  Truck,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  DollarSign,
  Calendar,
  Package,
} from "lucide-react";

const categories: InstrumentCategory[] = [
  "건반",
  "현악",
  "관악",
  "타악",
  "전자",
  "특수",
  "주변기기",
];

const conditions: {
  value: ConditionGrade;
  label: string;
  description: string;
}[] = [
  { value: "A", label: "A급 - 최상", description: "거의 새것과 같은 상태" },
  { value: "B", label: "B급 - 양호", description: "약간의 사용감 있음" },
  { value: "C", label: "C급 - 보통", description: "사용감 있지만 정상 작동" },
  { value: "D", label: "D급 - 하", description: "수리가 필요하거나 마모 심함" },
];

const shippingTypes: { value: ShippingType; label: string; icon: any }[] = [
  { value: "meetup", label: "직거래", icon: MapPin },
  { value: "cargo", label: "화물", icon: Truck },
  { value: "courier", label: "택배", icon: Package },
];

const steps = [
  { id: 1, title: "기본 정보", description: "악기 종류와 기본 정보" },
  { id: 2, title: "상품 사진", description: "상품 이미지 업로드" },
  { id: 3, title: "상세 정보", description: "가격, 상태, 설명" },
  { id: 4, title: "거래 설정", description: "배송 및 안전 설정" },
];

function SellPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<SellItemInput>({
    resolver: zodResolver(sellItemSchema),
    defaultValues: {
      escrowEnabled: true,
      shippingType: "meetup",
    },
  });

  const watchedValues = watch();

  const handleImagesChange = (images: string[]) => {
    setImageUrls(images);
    setValue("images", images);
  };

  const handleAIConditionChange = (condition: string) => {
    setValue("condition", condition);
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1:
        return ["category", "brand", "model", "year"];
      case 2:
        return ["images"];
      case 3:
        return ["condition", "price", "description"];
      case 4:
        return ["region", "shippingType"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: SellItemInput) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (imageUrls.length === 0) {
      toast.error("최소 1장의 이미지를 업로드해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createItem(user.uid, {
        ...data,
        images: imageUrls,
        aiTags: aiTags,
      });

      if (result.success && result.itemId) {
        toast.success("상품이 성공적으로 등록되었습니다!");
        router.push(`/item/${result.itemId}`);
      } else {
        toast.error(result.error || "상품 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("상품 등록 오류:", error);
      toast.error("상품 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                어떤 악기를 판매하시나요?
              </h2>
              <p className="text-gray-600 mt-2">기본 정보를 입력해주세요</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <Select
                  {...register("category")}
                  className="w-full"
                  options={[
                    { value: "", label: "카테고리를 선택하세요" },
                    ...categories.map(category => ({
                      value: category,
                      label: category,
                    })),
                  ]}
                  placeholder="카테고리를 선택하세요"
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  브랜드 *
                </label>
                <Input
                  {...register("brand")}
                  placeholder="예: Yamaha, Fender, Gibson"
                  className="w-full"
                />
                {errors.brand && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.brand.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  모델명 *
                </label>
                <Input
                  {...register("model")}
                  placeholder="예: Stratocaster, P-125, C-40"
                  className="w-full"
                />
                {errors.model && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.model.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연식 *
                </label>
                <Input
                  {...register("year", { valueAsNumber: true })}
                  type="number"
                  placeholder="예: 2020"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.year.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                상품 사진을 올려주세요
              </h2>
              <p className="text-gray-600 mt-2">
                좋은 사진일수록 더 빨리 팔려요!
              </p>
            </div>

            <ImageUploadCard
              images={imageUrls}
              onImagesChange={handleImagesChange}
              maxImages={10}
            />
            {errors.images && (
              <p className="mt-1 text-sm text-red-600">
                {errors.images.message}
              </p>
            )}

            {imageUrls.length >= 1 && (
              <AITagSuggestions
                imageUrls={imageUrls}
                onTagsChange={setAiTags}
                onConditionChange={handleAIConditionChange}
                className="mt-6"
              />
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                상품 상태와 가격을 알려주세요
              </h2>
              <p className="text-gray-600 mt-2">
                정확한 정보로 신뢰도를 높이세요
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  상품 상태 *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conditions.map(condition => (
                    <label
                      key={condition.value}
                      className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        watchedValues.condition === condition.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={condition.value}
                        {...register("condition")}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {condition.label}
                          </span>
                          <Star className="w-5 h-5 text-yellow-400" />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {condition.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.condition && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.condition.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  판매 가격 *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    {...register("price", { valueAsNumber: true })}
                    type="number"
                    placeholder="예: 500000"
                    min="0"
                    className="w-full pl-10 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    원
                  </span>
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 설명 *
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder="상품의 상태, 사용 기간, 특징 등을 자세히 설명해주세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                거래 설정을 완료하세요
              </h2>
              <p className="text-gray-600 mt-2">
                안전하고 편리한 거래를 위한 마지막 단계
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  거래 지역 *
                </label>
                <Input
                  {...register("region")}
                  placeholder="예: 서울시 강남구, 경기도 성남시"
                  className="w-full"
                />
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.region.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  배송 방법 *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shippingTypes.map(shipping => {
                    const Icon = shipping.icon;
                    return (
                      <label
                        key={shipping.value}
                        className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          watchedValues.shippingType === shipping.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          value={shipping.value}
                          {...register("shippingType")}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <Icon className="w-6 h-6 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {shipping.label}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.shippingType && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.shippingType.message}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox {...register("escrowEnabled")} id="escrowEnabled" />
                  <label
                    htmlFor="escrowEnabled"
                    className="text-sm text-gray-700"
                  >
                    <span className="font-medium">에스크로 서비스 사용</span>
                    <span className="block text-xs text-gray-500 mt-1">
                      안전한 거래를 위한 중간 보관 서비스 (추천)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">상품 등록</h1>
          <p className="text-lg text-gray-600">
            간단한 단계로 중고 악기를 판매해보세요
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>이전</span>
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-2"
                >
                  <span>다음</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || imageUrls.length < 1}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>등록 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>상품 등록하기</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* 도움말 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            등록하신 상품은 검토 후 공개됩니다.
            <span className="text-blue-600 font-medium">
              {" "}
              도움이 필요하시면 고객센터로 연락주세요.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SellPage() {
  return (
    <ProtectedRoute>
      <SellPageContent />
    </ProtectedRoute>
  );
}
