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
import { Card } from "../../components/ui/Card";
import { Checkbox } from "../../components/ui/Checkbox";
import { AITagSuggestions } from "../../components/ui/AITagSuggestions";
import { ImageUploadCard } from "../../components/ui/ImageUploadCard";
import {
  INSTRUMENT_CATEGORIES,
  CONDITION_GRADES,
  SHIPPING_TYPES,
} from "../../data/constants/index";
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

const conditions: {
  value: ConditionGrade;
  label: string;
  description: string;
}[] = [
  { value: "A", label: "A급", description: "거의 새것" },
  { value: "B", label: "B급", description: "양호한 상태" },
  { value: "C", label: "C급", description: "사용감 있음" },
  { value: "D", label: "D급", description: "많은 사용감" },
];

export default function SellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SellItemInput>({
    resolver: zodResolver(sellItemSchema),
  });

  const watchedCategory = watch("category");
  const watchedCondition = watch("condition");

  const steps = [
    { number: 1, title: "카테고리 선택", icon: Music },
    { number: 2, title: "상품 정보", icon: Package },
    { number: 3, title: "상품 이미지", icon: Camera },
    { number: 4, title: "거래 정보", icon: Truck },
  ];

  const handleCategorySelect = (category: InstrumentCategory) => {
    console.log("카테고리 선택:", category);
    setValue("category", category);
    // 폼 데이터 즉시 반영을 위해 trigger
    setTimeout(() => {
      setCurrentStep(2);
    }, 100);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: SellItemInput) => {
    console.log("=== 상품 등록 시작 ===");
    console.log("사용자 정보:", user);
    console.log("폼 데이터:", data);
    console.log("이미지 URLs:", imageUrls);
    console.log("AI 태그:", aiTags);

    // 필수 필드 검증 (더 자세한 로그 추가)
    const requiredFields = [
      "category",
      "title",
      "condition",
      "price",
      "region",
      "description",
    ];

    console.log("필수 필드 검증 시작:");
    requiredFields.forEach(field => {
      const value = data[field as keyof SellItemInput];
      console.log(`${field}:`, value, typeof value);
    });

    const missingFields = requiredFields.filter(field => {
      const value = data[field as keyof SellItemInput];
      const isEmpty =
        !value || (typeof value === "string" && value.trim() === "");
      console.log(`${field} 검증:`, { value, isEmpty });
      return isEmpty;
    });

    if (missingFields.length > 0) {
      console.error("누락된 필수 필드:", missingFields);
      // toast.error(`다음 필드를 입력해주세요: ${missingFields.join(", ")}`); // 알림 제거
      return;
    }

    if (!user) {
      console.error("사용자가 로그인되지 않음");
      // toast.error("로그인이 필요합니다."); // 알림 제거
      return;
    }

    setIsSubmitting(true);
    console.log("제출 상태: 시작");

    try {
      const itemData = {
        ...data,
        images: imageUrls,
        aiTags,
        sellerUid: user.uid,
      };

      console.log("전송할 데이터:", itemData);

      const result = await createItem(itemData);
      console.log("createItem 결과:", result);

      if (result.success) {
        console.log("상품 등록 성공!");
        toast.success("상품이 등록되었습니다!");
        router.push("/list");
      } else {
        console.error("상품 등록 실패:", result.error);
        toast.error(result.error || "상품 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("상품 등록 중 예외 발생:", error);
      toast.error("상품 등록 중 오류가 발생했습니다.");
    } finally {
      console.log("제출 상태: 완료");
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">상품 등록</h1>
            <p className="text-gray-600">간단한 단계로 상품을 등록해보세요</p>
          </div>

          {/* 진행 단계 */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white"
                          : isCompleted
                            ? "bg-green-600 border-green-600 text-white"
                            : "bg-white border-gray-300 text-gray-500"
                      }`}
                    >
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-blue-600"
                            : isCompleted
                              ? "text-green-600"
                              : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-8 h-0.5 mx-4 ${
                          isCompleted ? "bg-green-600" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={e => {
              console.log("=== 폼 제출 이벤트 발생 ===");
              console.log("이벤트:", e);
              console.log("현재 단계:", currentStep);
              console.log("단계 길이:", steps.length);

              // 현재 폼 데이터 확인
              const formData = new FormData(e.currentTarget);
              console.log("FormData:", Object.fromEntries(formData.entries()));

              // react-hook-form의 현재 값들 확인
              const currentValues = watch();
              console.log("현재 폼 값들:", currentValues);

              // react-hook-form 검증 과정 추적
              console.log("폼 에러들:", errors);
              console.log(
                "폼 유효성:",
                Object.keys(errors).length === 0 ? "유효함" : "무효함"
              );

              // 검증 실패해도 onSubmit 호출하도록 수정
              handleSubmit(onSubmit, errors => {
                console.log("react-hook-form 검증 실패:", errors);
                // toast.error("입력 정보를 확인해주세요."); // 메시지 제거
              })(e);
            }}
            className="space-y-6"
          >
            {/* 1단계: 카테고리 선택 */}
            {currentStep === 1 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                    어떤 악기를 판매하시나요?
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
                    {INSTRUMENT_CATEGORIES.map(category => (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => handleCategorySelect(category.key)}
                        className={`p-8 border-2 rounded-xl text-center group transition-all duration-200 ${
                          watchedCategory === category.key
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                        }`}
                      >
                        <div className="text-6xl mb-4">{category.icon}</div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {category.label}
                        </h3>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* 2단계: 상품 정보 */}
            {currentStep === 2 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    상품 정보를 입력해주세요
                  </h2>

                  <div className="space-y-6">
                    {/* 상품명 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상품명 *
                      </label>
                      <Input
                        {...register("title")}
                        placeholder="상품명을 입력해주세요"
                        error={errors.title?.message}
                      />
                    </div>

                    {/* 상태 등급 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        상태 등급 *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {conditions.map(condition => (
                          <label
                            key={condition.value}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              watchedCondition === condition.value
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
                            <div className="text-center">
                              <div
                                className={`text-2xl font-bold mb-1 ${
                                  condition.value === "A"
                                    ? "text-blue-600"
                                    : condition.value === "B"
                                      ? "text-green-600"
                                      : condition.value === "C"
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                }`}
                              >
                                {condition.label}
                              </div>
                              <p className="text-sm text-gray-600">
                                {condition.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                      {errors.condition && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.condition.message}
                        </p>
                      )}
                    </div>

                    {/* 가격 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        판매가격 *
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          {...register("price", { valueAsNumber: true })}
                          placeholder="가격을 입력해주세요"
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

                    {/* 지역 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        거래 지역 *
                      </label>
                      <div className="relative">
                        <Input
                          {...register("region")}
                          placeholder="거래 지역을 입력하거나 GPS로 찾기"
                          error={errors.region?.message}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => {
                            // GPS 기능 구현 예정
                            console.log("GPS 위치 찾기");
                          }}
                        >
                          🗺️
                        </button>
                      </div>
                    </div>

                    {/* 상품 설명 */}
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
                  </div>
                </div>
              </Card>
            )}

            {/* 3단계: 상품 이미지 */}
            {currentStep === 3 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    상품 이미지를 업로드해주세요
                  </h2>

                  <ImageUploadCard
                    images={imageUrls}
                    onImagesChange={setImageUrls}
                    maxImages={10}
                  />

                  {/* AI 태그 제안 */}
                  {imageUrls.length > 0 && (
                    <div className="mt-6">
                      <AITagSuggestions
                        imageUrls={imageUrls}
                        onTagsChange={setAiTags}
                        onConditionChange={condition =>
                          setValue("condition", condition)
                        }
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 4단계: 거래 정보 */}
            {currentStep === 4 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    거래 방법을 선택해주세요
                  </h2>

                  <div className="space-y-6">
                    {/* 배송 방법 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        배송 방법 * (여러 개 선택 가능)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {SHIPPING_TYPES.map(type => (
                          <label
                            key={type.key}
                            className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value={type.key}
                              {...register("shippingTypes")}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
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

                    {/* 안전거래 */}
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
              </Card>
            )}

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                이전
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center"
                >
                  다음
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center"
                  onClick={e => {
                    console.log("=== 상품 등록 버튼 클릭 ===");
                    console.log("이벤트:", e);
                    console.log("isSubmitting:", isSubmitting);
                    console.log("현재 단계:", currentStep);
                    console.log("단계 길이:", steps.length);
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      등록 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      상품 등록
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
