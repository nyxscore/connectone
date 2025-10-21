"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { uploadImages } from "@/lib/api/storage";
import { useAuth } from "@/lib/hooks/useAuth";
import { resizeToSquare } from "@/lib/utils/imageResize";
import { Upload, Brain, Camera, Video } from "lucide-react";

import CategorySelector from "@/components/category/CategorySelector";
import StepType from "@/components/product/StepType";
import ProgressBar from "@/components/product/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CameraCapture } from "@/components/ui/CameraCapture";
import { AIEmotionAnalysis } from "@/components/ui/AIEmotionAnalysis";
import { WatermarkImage } from "@/components/ui/WatermarkImage";

interface WizardFormData {
  category: string;
  categoryPath?: string[];
  categoryId?: string;
  tradeType: "sell" | "buy";
  productName: string;
  price: number;
  description: string;
  shippingTypes: string[];
  parcelPaymentType: string; // "seller" or "buyer"
  escrowEnabled: boolean;
  images: File[];
}

export default function ProductWizardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedShippingTypes, setSelectedShippingTypes] = useState<string[]>(
    []
  );
  const [parcelPaymentType, setParcelPaymentType] = useState<string>(""); // "seller" or "buyer"
  const [escrowEnabled, setEscrowEnabled] = useState<boolean>(false); // 안전거래 옵션
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI 감정 관련 상태
  const [photoTab, setPhotoTab] = useState<"upload" | "ai-emotion">("upload");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    emotionScore: number;
    conditionGrade: "A" | "B" | "C" | "D";
    suggestedPrice: number;
    confidence: number;
    detectedFeatures: string[];
    recommendations: string[];
  } | null>(null);
  const [isAiImageConfirmed, setIsAiImageConfirmed] = useState(false);
  const [aiProcessedImages, setAiProcessedImages] = useState<Set<number>>(
    new Set()
  );
  const [formData, setFormData] = useState<WizardFormData>({
    category: "",
    tradeType: "",
    productName: "",
    price: null as any,
    description: "",
    shippingTypes: [],
    parcelPaymentType: "",
    escrowEnabled: false,
    images: [],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WizardFormData>({
    defaultValues: {
      category: "",
      tradeType: "",
      productName: "",
      price: null as any,
      description: "",
      shippingTypes: [],
      parcelPaymentType: "",
      escrowEnabled: false,
      images: [],
    },
  });

  const updateFormData = (newData: Partial<WizardFormData>) => {
    console.log("updateFormData 호출됨:", newData);
    console.log("현재 formData.price:", formData.price);

    // 가격은 항상 현재 값을 보존 (명시적으로 전달된 경우에만 변경)
    const { price, ...dataWithoutPrice } = newData;
    const updatedData = {
      ...formData,
      ...dataWithoutPrice,
      // 가격은 명시적으로 전달된 경우에만 변경, 그렇지 않으면 현재 값 유지
      price: price !== undefined ? price : formData.price,
    };

    setFormData(updatedData);

    // React Hook Form에도 업데이트 (가격 제외)
    Object.entries(dataWithoutPrice).forEach(([key, value]) => {
      console.log(`setValue 호출: ${key} = ${value}`);
      setValue(key as keyof WizardFormData, value, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
    });

    console.log("updateFormData 완료 후 updatedData:", updatedData);
    console.log("보존된 가격:", updatedData.price);
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const fileArray = Array.from(files);

      // 이미지 자동 리사이징 (400x400 정사각형)
      const resizedFiles = await Promise.all(
        fileArray.map(file => resizeToSquare(file, 400, 0.8))
      );

      const imageUrls = await uploadImages(resizedFiles);

      const updatedImages = [...formData.images, ...resizedFiles];
      updateFormData({ images: updatedImages });

      toast.success(
        `${fileArray.length}개의 이미지가 자동 리사이징되어 업로드되었습니다!`
      );
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    updateFormData({ images: updatedImages });
  };

  const onSubmit = async (data: WizardFormData) => {
    try {
      console.log("상품 등록 시작 - 현재 사용자:", user);
      console.log("상품 등록 데이터:", data);
      console.log("로컬 상태 formData:", formData);
      console.log(
        "가격 비교 - data.price:",
        data.price,
        "formData.price:",
        formData.price
      );

      // 가격 검증
      if (!formData.price || formData.price <= 0) {
        alert("가격을 입력해주세요.");
        return;
      }

      // 이미지 업로드 (판매하기일 때만 필수)
      let imageUrls: string[] = [];
      if (formData.images.length > 0) {
        console.log("이미지 업로드 시작:", formData.images.length, "개 파일");
        setUploadingImages(true);
        try {
          const uploadResult = await uploadImages(formData.images);
          console.log("이미지 업로드 결과:", uploadResult);

          if (
            uploadResult.success &&
            uploadResult.urls &&
            uploadResult.urls.length > 0
          ) {
            imageUrls = [...uploadResult.urls]; // 배열 복사
            console.log("업로드된 이미지 URL들:", imageUrls);
            console.log("imageUrls 타입:", typeof imageUrls);
            console.log("imageUrls 길이:", imageUrls.length);
          } else {
            console.error("이미지 업로드 실패:", uploadResult.errors);
            toast.error(
              `이미지 업로드에 실패했습니다: ${uploadResult.errors.join(", ")}`
            );
            return;
          }
        } catch (error) {
          console.error("이미지 업로드 실패:", error);
          toast.error("이미지 업로드에 실패했습니다.");
          return;
        } finally {
          setUploadingImages(false);
        }
      } else {
        // 구매하기일 때는 이미지가 없어도 됨
        if (formData.tradeType === "sell") {
          console.log("판매하기인데 이미지가 없습니다.");
          toast.error("상품 사진을 최소 1장 이상 업로드해주세요.");
          return;
        } else {
          console.log("구매하기이므로 이미지가 없어도 됩니다.");
        }
      }

      // 실제 Firestore에 저장
      const { createItem } = await import("@/lib/api/products");

      // shippingTypes를 tradeOptions로 변환 (구매하기일 때는 빈 배열)
      const tradeOptions =
        formData.tradeType === "buy"
          ? []
          : data.shippingTypes.map(type => {
              switch (type) {
                case "direct":
                  return "직거래";
                case "parcel":
                  return "택배";
                case "shipping":
                  return "화물운송";
                case "escrow":
                  return "안전결제";
                default:
                  return type;
              }
            });

      // AI 처리된 이미지 정보 생성
      const aiProcessedImageInfo = Array.from(aiProcessedImages).map(index => ({
        imageIndex: index,
        isAiProcessed: true,
        emotionScore: aiAnalysisResult?.emotionScore || 0,
        conditionGrade: aiAnalysisResult?.conditionGrade || "A",
        confidence: aiAnalysisResult?.confidence || 0,
      }));

      const itemData = {
        title: data.productName,
        description: data.description,
        category: data.category,
        price: formData.price, // 로컬 상태의 가격 사용
        region: "서울시 강남구", // 기본값, 나중에 GPS로 설정
        condition: formData.tradeType === "buy" ? "구매" : "A", // 구매하기일 때는 "구매"로 설정
        images: imageUrls, // 업로드된 이미지 URL들
        aiProcessedImages:
          formData.tradeType === "sell" ? aiProcessedImageInfo : [], // 구매하기일 때는 빈 배열
        escrowEnabled:
          formData.tradeType === "sell" ? data.escrowEnabled : false, // 구매하기일 때는 false
        shippingTypes: formData.tradeType === "sell" ? data.shippingTypes : [], // 구매하기일 때는 빈 배열
        parcelPaymentType:
          formData.tradeType === "sell" ? data.parcelPaymentType : "", // 구매하기일 때는 빈 문자열
        sellerUid: user?.uid || "test-user", // 실제 로그인된 사용자 ID
        tradeOptions: tradeOptions,
        tradeType: formData.tradeType, // 구매/판매 구분을 위해 추가
      };

      console.log("저장할 상품 데이터:", itemData);
      console.log("imageUrls 변수:", imageUrls);
      console.log("imageUrls 타입:", typeof imageUrls);
      console.log("imageUrls 길이:", imageUrls.length);
      console.log("itemData.images:", itemData.images);
      console.log("itemData.images 타입:", typeof itemData.images);
      console.log("itemData.images 길이:", itemData.images?.length);

      const result = await createItem(itemData);

      if (result.success) {
        toast.success(
          formData.tradeType === "buy"
            ? "구매글이 성공적으로 등록되었습니다!"
            : "상품이 성공적으로 등록되었습니다!"
        );
        
        // Firestore 인덱싱 대기 후 리다이렉트
        console.log("✅ 상품 등록 완료 - 1초 후 목록으로 이동");
        setTimeout(() => {
          router.push("/list");
        }, 1000);
      } else {
        toast.error(
          result.error ||
            (formData.tradeType === "buy"
              ? "구매글 등록에 실패했습니다."
              : "상품 등록에 실패했습니다.")
        );
      }
    } catch (error) {
      console.error("상품 등록 오류:", error);
      toast.error(
        formData.tradeType === "buy"
          ? "구매글 등록 중 오류가 발생했습니다."
          : "상품 등록 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">상품 등록</h1>
          <p className="text-gray-600">단계별로 상품 정보를 입력해주세요</p>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          currentStep={
            formData.tradeType && formData.category
              ? 3
              : formData.tradeType
                ? 2
                : 1
          }
          totalSteps={3}
        />

        {/* 메인 컨텐츠 */}
        <Card className="mt-8">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* 1단계 - 거래 유형 선택 (판매/구매) */}
              {!formData.tradeType && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepType
                    value={formData.tradeType as "sell" | "buy"}
                    onChange={value => updateFormData({ tradeType: value })}
                    onBack={() => {
                      // 홈으로 돌아가기
                      router.back();
                    }}
                  />
                </motion.div>
              )}

              {/* 2단계 - 카테고리 선택 (거래 유형 선택 후 나타남) */}
              {formData.tradeType && !formData.category && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-12"
                >
                  <div className="border-t border-gray-200 pt-8">
                    <CategorySelector
                      onSelect={category => {
                        console.log(
                          "상품등록페이지: 카테고리 선택됨",
                          category
                        );
                        console.log(
                          "상품등록페이지: updateFormData 호출 전 formData:",
                          formData
                        );
                        updateFormData({
                          category: category.categoryPath
                            ? category.categoryPath.join(" > ")
                            : category.name,
                          categoryPath: category.categoryPath || [
                            category.name,
                          ],
                          categoryId: category.categoryId,
                        });
                        console.log("상품등록페이지: updateFormData 호출 후");
                      }}
                      onBack={() => {
                        // 거래 유형 선택 단계로 돌아가기
                        updateFormData({ tradeType: "" });
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* 3단계 - 상품 등록 폼 (카테고리 선택 후 나타남) */}
              {formData.tradeType && formData.category && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-12"
                >
                  <div className="border-t border-gray-200 pt-8">
                    <div className="space-y-8">
                      {/* 이전 버튼 */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            // 거래 유형 선택 단계로 돌아가기
                            updateFormData({ tradeType: "" });
                          }}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                          <span>이전</span>
                        </button>
                      </div>

                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {formData.tradeType === "buy"
                            ? "구매 정보를 입력해주세요"
                            : "상품 정보를 입력해주세요"}
                        </h2>
                        <p className="text-gray-600">
                          {formData.tradeType === "buy"
                            ? "구매하고 싶은 상품의 정보를 입력해주세요"
                            : "상품의 상세 정보를 입력해주세요"}
                        </p>
                      </div>

                      {/* 상품명 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {formData.tradeType === "buy"
                            ? "글 제목 *"
                            : "상품명 *"}
                        </label>
                        <input
                          type="text"
                          {...register("productName", {
                            required:
                              formData.tradeType === "buy"
                                ? "글 제목을 입력해주세요"
                                : "상품명을 입력해주세요",
                          })}
                          placeholder={
                            formData.tradeType === "buy"
                              ? "예: 야마하 디지털 피아노 구매합니다"
                              : "상품명을 입력해주세요"
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.productName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.productName.message}
                          </p>
                        )}
                      </div>

                      {/* 가격 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {formData.tradeType === "buy"
                            ? "희망가격 *"
                            : "판매가격 *"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={
                              formData.price && formData.price > 0
                                ? formData.price.toLocaleString()
                                : ""
                            }
                            onChange={e => {
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              const priceValue = value
                                ? parseInt(value, 10)
                                : null;

                              console.log("가격 입력 변경:", {
                                value,
                                priceValue,
                                currentPrice: formData.price,
                              });

                              // 로컬 상태만 업데이트 (React Hook Form과 완전 분리)
                              setFormData(prev => {
                                const newData = { ...prev, price: priceValue };
                                console.log("가격 상태 업데이트:", {
                                  prev: prev.price,
                                  new: priceValue,
                                });
                                return newData;
                              });

                              // React Hook Form도 동기화 (하지만 UI는 로컬 상태 사용)
                              setValue("price", priceValue, {
                                shouldValidate: false,
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                            }}
                            placeholder="예: 300,000"
                            className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            원
                          </span>
                        </div>
                        {formData.price === null || formData.price === 0 ? (
                          <p className="mt-1 text-sm text-red-600">
                            가격을 입력해주세요
                          </p>
                        ) : null}
                      </div>

                      {/* 판매 방법 - 판매하기일 때만 표시 */}
                      {formData.tradeType === "sell" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            판매 방법 * (여러 개 선택 가능)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            {[
                              { key: "direct", label: "직거래", icon: "🤝" },
                              { key: "parcel", label: "택배", icon: "📦" },
                            ].map(type => (
                              <div key={type.key} className="flex-1">
                                <label
                                  className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                                  onClick={() => {
                                    if (
                                      type.key === "parcel" &&
                                      selectedShippingTypes.includes(
                                        "parcel"
                                      ) &&
                                      parcelPaymentType
                                    ) {
                                      setParcelPaymentType("");
                                      updateFormData({ parcelPaymentType: "" });
                                    }
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-5 h-5 flex items-center justify-center">
                                      <svg
                                        className={`w-4 h-4 ${
                                          selectedShippingTypes.includes(
                                            type.key
                                          )
                                            ? "text-blue-600 block"
                                            : "text-transparent hidden"
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                    <span
                                      className={`text-base ${
                                        selectedShippingTypes.includes(type.key)
                                          ? "font-bold text-gray-900"
                                          : "font-medium text-gray-700"
                                      }`}
                                    >
                                      {type.key === "parcel" &&
                                      selectedShippingTypes.includes("parcel")
                                        ? parcelPaymentType === "seller"
                                          ? "택배 (판매자부담)"
                                          : "택배 (구매자부담)"
                                        : type.label}
                                    </span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    value={type.key}
                                    checked={selectedShippingTypes.includes(
                                      type.key
                                    )}
                                    onChange={e => {
                                      const value = e.target.value;
                                      if (e.target.checked) {
                                        const newTypes = [
                                          ...selectedShippingTypes,
                                          value,
                                        ];
                                        setSelectedShippingTypes(newTypes);
                                        setValue("shippingTypes", newTypes);
                                      } else {
                                        const newTypes =
                                          selectedShippingTypes.filter(
                                            t => t !== value
                                          );
                                        setSelectedShippingTypes(newTypes);
                                        setValue("shippingTypes", newTypes);
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 opacity-0 absolute"
                                  />
                                </label>

                                {/* 택배 부담 방식 선택 */}
                                {type.key === "parcel" &&
                                  selectedShippingTypes.includes("parcel") &&
                                  !parcelPaymentType && (
                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setParcelPaymentType("seller");
                                            updateFormData({
                                              parcelPaymentType: "seller",
                                            });
                                          }}
                                          className="flex-1 p-2 rounded-lg text-sm font-medium transition-all duration-200 bg-white text-blue-600 border border-blue-300 hover:bg-blue-100"
                                        >
                                          판매자 부담
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setParcelPaymentType("buyer");
                                            updateFormData({
                                              parcelPaymentType: "buyer",
                                            });
                                          }}
                                          className="flex-1 p-2 rounded-lg text-sm font-medium transition-all duration-200 bg-white text-blue-600 border border-blue-300 hover:bg-blue-100"
                                        >
                                          구매자 부담
                                        </button>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>

                          {/* 안전거래 옵션 - 택배 선택 시에만 표시 */}
                          {selectedShippingTypes.includes("parcel") && (
                            <div
                              className={`mt-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                                escrowEnabled
                                  ? "border-green-500 ring-4 ring-green-200"
                                  : "border-green-300 hover:border-green-400"
                              }`}
                              onClick={() => {
                                const newValue = !escrowEnabled;
                                setEscrowEnabled(newValue);
                                updateFormData({
                                  escrowEnabled: newValue,
                                });
                              }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                      escrowEnabled
                                        ? "bg-green-500 scale-110"
                                        : "bg-green-200"
                                    }`}
                                  >
                                    <span className="text-2xl">
                                      {escrowEnabled ? "✓" : "🛡️"}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg font-bold text-green-800">
                                        안전거래
                                      </span>
                                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                                        ⭐ 강력추천
                                      </span>
                                    </div>
                                    <p className="text-sm text-green-700 mt-1 font-medium">
                                      거래금액이 보호되며, 상품 수령 후에
                                      판매자에게 입금됩니다.
                                    </p>
                                  </div>
                                </div>
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={escrowEnabled}
                                    onChange={e => {
                                      e.stopPropagation();
                                      setEscrowEnabled(e.target.checked);
                                      updateFormData({
                                        escrowEnabled: e.target.checked,
                                      });
                                    }}
                                    className="w-8 h-8 text-green-600 border-2 border-gray-400 rounded-lg focus:ring-green-500 cursor-pointer"
                                  />
                                </label>
                              </div>
                              <div className="pt-3 border-t border-green-200">
                                <p className="text-xs text-gray-600">
                                  💡 안전거래 수수료(1.9%)는 구매자가
                                  부담합니다.
                                </p>
                              </div>
                            </div>
                          )}

                          {errors.shippingTypes && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.shippingTypes.message}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 사진 업로드 - 판매하기일 때만 표시 */}
                      {formData.tradeType === "sell" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            상품 사진 * (최소 1장)
                          </label>

                          {/* 탭 네비게이션 */}
                          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => {
                                console.log("상품 사진 탭 클릭");
                                setPhotoTab("upload");
                              }}
                              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                photoTab === "upload"
                                  ? "bg-white text-blue-600 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              상품 사진
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                console.log("AI 감정 탭 클릭");
                                setPhotoTab("ai-emotion");
                              }}
                              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                photoTab === "ai-emotion"
                                  ? "bg-white text-blue-600 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <Brain className="w-4 h-4 mr-2" />
                              AI 감정
                            </button>
                          </div>

                          {/* 탭 컨텐츠 */}
                          {photoTab === "upload" && (
                            <div>
                              {/* 업로드된 이미지 미리보기 */}
                              {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                  {formData.images.map((file, index) => (
                                    <div key={index} className="relative group">
                                      <WatermarkImage
                                        src={URL.createObjectURL(file)}
                                        alt={`상품 이미지 ${index + 1}`}
                                        className="w-full h-32 object-contain rounded-lg"
                                        isAiProcessed={aiProcessedImages.has(
                                          index
                                        )}
                                        showWatermark={true}
                                      />

                                      <button
                                        type="button"
                                        onClick={() => {
                                          removeImage(index);
                                          // AI 처리된 이미지에서도 제거
                                          setAiProcessedImages(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(index);
                                            return newSet;
                                          });
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 이미지 업로드 영역 */}
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                  ref={fileInputRef}
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
                                    <svg
                                      className="w-8 h-8 text-gray-400 mb-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                      />
                                    </svg>
                                  )}
                                  <span className="text-sm text-gray-600">
                                    {uploadingImages
                                      ? "업로드 중..."
                                      : "사진을 선택하거나 드래그하세요"}
                                  </span>
                                </label>
                              </div>

                              {formData.images.length === 0 && (
                                <p className="mt-1 text-sm text-red-600">
                                  최소 1장의 사진을 업로드해주세요
                                </p>
                              )}
                            </div>
                          )}

                          {photoTab === "ai-emotion" && (
                            <div className="space-y-6">
                              {(() => {
                                console.log(
                                  "AI 감정 탭 렌더링됨, capturedImage:",
                                  capturedImage
                                );
                                return null;
                              })()}
                              {/* AI 감정 촬영 영역 */}
                              {!capturedImage ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                  <div className="space-y-4">
                                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Video className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        AI 감정 분석 촬영
                                      </h3>
                                      <p className="text-gray-600 mb-4">
                                        실시간으로 상품을 촬영하여 AI가 감정을
                                        분석합니다
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => setIsCameraActive(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      >
                                        <Camera className="w-4 h-4 mr-2" />
                                        촬영 시작
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* 촬영된 이미지 미리보기 */}
                                  <div className="relative w-full h-64">
                                    <img
                                      src={capturedImage}
                                      alt="촬영된 상품"
                                      className="w-full h-64 object-cover rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCapturedImage(null);
                                        setAiAnalysisResult(null);
                                      }}
                                      className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {/* AI 분석 결과 */}
                                  <AIEmotionAnalysis
                                    imageDataUrl={capturedImage}
                                    onAnalysisComplete={result => {
                                      setAiAnalysisResult(result);
                                      setIsAiImageConfirmed(false); // 분석 완료 후 확정 대기 상태
                                    }}
                                    onConditionChange={condition => {
                                      // 상태 등급을 formData에 반영할 수 있음
                                      console.log(
                                        "AI 추천 상태 등급:",
                                        condition
                                      );
                                    }}
                                  />

                                  {/* AI 이미지 확정 버튼 */}
                                  {aiAnalysisResult && !isAiImageConfirmed && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h4 className="text-sm font-medium text-green-900 mb-1">
                                            AI 분석 완료!
                                          </h4>
                                          <p className="text-sm text-green-700">
                                            이 이미지를 상품에 추가하시겠습니까?
                                          </p>
                                        </div>
                                        <div className="flex space-x-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCapturedImage(null);
                                              setAiAnalysisResult(null);
                                              setIsAiImageConfirmed(false);
                                            }}
                                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                          >
                                            취소
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              // AI 이미지를 실제로 추가
                                              const canvas =
                                                document.createElement(
                                                  "canvas"
                                                );
                                              const ctx =
                                                canvas.getContext("2d");
                                              const img = new Image();
                                              img.onload = () => {
                                                canvas.width = img.width;
                                                canvas.height = img.height;
                                                ctx?.drawImage(img, 0, 0);
                                                canvas.toBlob(
                                                  blob => {
                                                    if (blob) {
                                                      const file = new File(
                                                        [blob],
                                                        "ai-captured-image.jpg",
                                                        { type: "image/jpeg" }
                                                      );
                                                      const updatedImages = [
                                                        ...formData.images,
                                                        file,
                                                      ];
                                                      updateFormData({
                                                        images: updatedImages,
                                                      });

                                                      // AI 처리된 이미지로 마킹
                                                      setAiProcessedImages(
                                                        prev =>
                                                          new Set([
                                                            ...prev,
                                                            updatedImages.length -
                                                              1,
                                                          ])
                                                      );

                                                      // 상태 초기화
                                                      setCapturedImage(null);
                                                      setAiAnalysisResult(null);
                                                      setIsAiImageConfirmed(
                                                        false
                                                      );

                                                      toast.success(
                                                        "AI 감정 분석된 이미지가 추가되었습니다!"
                                                      );
                                                    }
                                                  },
                                                  "image/jpeg",
                                                  0.8
                                                );
                                              };
                                              img.src = capturedImage;
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                                          >
                                            확정 추가
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 카메라 캡처 모달 */}
                              <CameraCapture
                                isActive={isCameraActive}
                                onCapture={imageDataUrl => {
                                  setCapturedImage(imageDataUrl);
                                  setIsCameraActive(false);
                                }}
                                onClose={() => setIsCameraActive(false)}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* 내용 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {formData.tradeType === "buy"
                            ? "내용 *"
                            : "판매 내용 *"}
                        </label>
                        <textarea
                          {...register("description", {
                            required:
                              formData.tradeType === "buy"
                                ? "내용을 입력해주세요"
                                : "판매 내용을 입력해주세요",
                          })}
                          placeholder={
                            formData.tradeType === "buy"
                              ? "구매하고 싶은 상품에 대한 자세한 설명을 입력해주세요"
                              : "상품에 대한 자세한 설명을 입력해주세요"
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.description.message}
                          </p>
                        )}
                      </div>

                      {/* 등록 버튼 - 하단 고정 */}
                      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
                        <div className="max-w-4xl mx-auto">
                          <Button
                            type="submit"
                            className="w-full py-4 text-lg font-semibold"
                          >
                            {formData.tradeType === "buy"
                              ? "구매글 등록 완료"
                              : "상품 등록 완료"}
                          </Button>
                        </div>
                      </div>

                      {/* 하단 여백 - 고정 버튼을 위한 공간 */}
                      <div className="h-20"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
