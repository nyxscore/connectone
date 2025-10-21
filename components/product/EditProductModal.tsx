"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb as getDb } from "@/lib/api/firebase-ultra-safe";
import { toast } from "react-hot-toast";
import { uploadImages } from "@/lib/api/storage";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { X, Upload, Save, RotateCcw, Brain, Camera, Video } from "lucide-react";
import CategorySelector from "../category/CategorySelector";
import { CameraCapture } from "../ui/CameraCapture";
import { AIEmotionAnalysisModal } from "../ui/AIEmotionAnalysisModal";
import { WatermarkImage } from "../ui/WatermarkImage";
import { addWatermarkToImage } from "@/lib/utils/watermark";

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
    categoryPath: [] as string[],
    categoryId: "",
    price: 0,
    condition: "A",
    escrowEnabled: false,
    shippingTypes: [] as string[],
    parcelPaymentType: "seller" as "seller" | "buyer",
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // AI 감정 관련 상태
  const [photoTab, setPhotoTab] = useState<"upload" | "ai-emotion">("upload");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    emotion: string;
    confidence: number;
    description: string;
  } | null>(null);

  // 악기 검색 관련 상태
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 악기 데이터베이스
  const instrumentDatabase = {
    건반: [
      "피아노",
      "전자피아노",
      "디지털피아노",
      "어쿠스틱피아노",
      "그랜드피아노",
      "업라이트피아노",
      "신시사이저",
      "워크스테이션",
      "MIDI키보드",
      "오르간",
      "하모니움",
      "아코디언",
      "멜로디언",
      "바이올린",
      "첼로",
      "비올라",
      "콘트라베이스",
      "하프",
    ],
    현악: [
      "기타",
      "어쿠스틱기타",
      "일렉기타",
      "클래식기타",
      "베이스기타",
      "일렉베이스",
      "우쿨렐레",
      "만돌린",
      "바이올린",
      "첼로",
      "비올라",
      "콘트라베이스",
      "하프",
      "시타르",
      "바라",
      "고토",
      "가야금",
      "거문고",
      "아쟁",
      "해금",
    ],
    관악: [
      "플루트",
      "클라리넷",
      "오보에",
      "바순",
      "색소폰",
      "트럼펫",
      "트롬본",
      "호른",
      "튜바",
      "코넷",
      "플루겔호른",
      "피콜로",
      "알토플루트",
      "바스플루트",
      "소프라노색소폰",
      "알토색소폰",
      "테너색소폰",
      "바리톤색소폰",
      "하모니카",
      "리코더",
    ],
    타악: [
      "드럼",
      "드럼세트",
      "스네어드럼",
      "베이스드럼",
      "탐탐",
      "심벌즈",
      "하이햇",
      "라이드심벌",
      "크래시심벌",
      "스플래시심벌",
      "차이나심벌",
      "탐버린",
      "마라카스",
      "캐스터네츠",
      "트라이앵글",
      "실로폰",
      "마림바",
      "비브라폰",
      "글로켄슈필",
      "팀파니",
      "콩가",
      "봉고",
      "카우벨",
      "우드블록",
      "템플블록",
    ],
    국악: [
      "가야금",
      "거문고",
      "해금",
      "아쟁",
      "대금",
      "소금",
      "피리",
      "단소",
      "장구",
      "북",
      "꽹과리",
      "징",
      "태평소",
      "나발",
      "생황",
      "단소",
      "적",
      "편종",
      "편경",
    ],
    음향: [
      "마이크",
      "콘덴서마이크",
      "다이나믹마이크",
      "무선마이크",
      "헤드셋마이크",
      "믹서",
      "앰프",
      "스피커",
      "모니터스피커",
      "서브우퍼",
      "이퀄라이저",
      "컴프레서",
      "리버브",
      "딜레이",
      "이펙터",
      "오디오인터페이스",
      "믹싱데스크",
      "PA시스템",
      "모니터링시스템",
      "녹음장비",
      "마스터링장비",
    ],
    특수: [
      "테레민",
      "온드마르텐",
      "해먼드오르간",
      "멜로트론",
      "챔버린",
      "비브라폰",
      "마림바",
      "실로폰",
      "글로켄슈필",
      "팀파니",
      "하프",
      "첼레스타",
      "오르간",
    ],
    용품: [
      "케이스",
      "가방",
      "스트랩",
      "픽",
      "줄",
      "스탠드",
      "마이크스탠드",
      "악보대",
      "메트로놈",
      "튜너",
      "이펙터",
      "케이블",
      "어댑터",
      "보호필름",
      "청소용품",
      "교체부품",
      "악세사리",
      "악보",
      "교본",
      "연습용품",
    ],
  };

  // 검색어에 따른 악기 추천
  const getInstrumentSuggestions = (searchTerm: string, category: string) => {
    if (!searchTerm || !category) return [];

    const instruments =
      instrumentDatabase[category as keyof typeof instrumentDatabase] || [];
    return instruments.filter(instrument =>
      instrument.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 상품 데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId || !user) return;

      setLoading(true);
      try {
        const db = await getDb();
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

        // 거래가 시작된 후에는 상품 수정 불가 (거래 진행하기 이후)
        if (
          productData.status === "reserved" ||
          productData.status === "escrow_completed"
        ) {
          toast.error("거래가 시작된 상품은 수정할 수 없습니다.");
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

        // 기존 카테고리 정보 복원
        const existingCategory = productData.category || "";
        const existingCategoryPath = (productData as any).categoryPath || [];
        const existingCategoryId = (productData as any).categoryId || "";

        setFormData({
          title: productData.title || "",
          description: productData.description || "",
          category: existingCategory,
          categoryPath: existingCategoryPath,
          categoryId: existingCategoryId,
          price: productData.price || 0,
          condition: productData.condition || "A",
          escrowEnabled: productData.escrowEnabled || false,
          shippingTypes: shippingTypes,
          parcelPaymentType: (productData as any).parcelPaymentType || "seller",
        });
        setImages(productData.images || []);

        // 기존 악기명을 검색어로 설정
        if (existingCategoryPath.length > 1) {
          setInstrumentSearch(existingCategoryPath[1]);
        }
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

  // AI 감정 촬영 처리
  const handleAICapture = async (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    setIsCameraActive(false);

    console.log("🎭 AI 감정 분석 시작");
    
    try {
      // AI 감정 분석 API 호출
      const response = await fetch("/api/ai/emotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      console.log("📡 API 응답 상태:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ AI 감정 분석 성공:", result);
        setAiAnalysisResult(result);
        
        if (result.isMock) {
          toast.success("AI 감정 분석 완료 (데모 모드)");
        } else {
          toast.success("AI 감정 분석 완료");
        }
      } else {
        const errorData = await response.json();
        console.error("❌ AI 감정 분석 실패:", errorData);
        toast.error(`AI 감정 분석 실패: ${errorData.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("❌ AI 감정 분석 오류:", error);
      toast.error("AI 감정 분석 중 오류가 발생했습니다. 네트워크를 확인해주세요.");
    }
  };

  // AI 감정 이미지 추가
  const handleAddAIEmotionImage = async () => {
    if (!capturedImage || !aiAnalysisResult) return;

    try {
      setUploadingImages(true);

      // 이미지를 Blob으로 변환
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], "ai-emotion-image.jpg", {
        type: "image/jpeg",
      });

      // 워터마크 추가
      const watermarkedImage = await addWatermarkToImage(file, {
        emotion: aiAnalysisResult.emotion,
        confidence: aiAnalysisResult.confidence,
      });

      // 이미지 업로드
      const uploadResult = await uploadImages([watermarkedImage]);

      if (uploadResult.success && uploadResult.urls.length > 0) {
        setImages(prev => [...prev, ...uploadResult.urls]);
        toast.success("AI 감정 이미지가 추가되었습니다!");

        // 상태 초기화
        setCapturedImage(null);
        setAiAnalysisResult(null);
        setPhotoTab("upload");
      } else {
        toast.error("이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("AI 감정 이미지 처리 실패:", error);
      toast.error("AI 감정 이미지 처리에 실패했습니다.");
    } finally {
      setUploadingImages(false);
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);
    try {
      const db = await getDb();
      // 가격 변경 감지
      const priceChanged = product.price !== formData.price;
      const oldPrice = product.price;
      const newPrice = formData.price;

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
        parcelPaymentType: formData.parcelPaymentType,
        categoryPath: formData.categoryPath,
        categoryId: formData.categoryId,
        updatedAt: new Date(),
      });

      // 상품 정보가 변경된 경우 채팅에 시스템 메시지 전송 (거래 시작 전에만)
      const titleChanged = product.title !== formData.title;
      const descriptionChanged = product.description !== formData.description;
      const categoryChanged = product.category !== formData.category;

      if (
        priceChanged ||
        titleChanged ||
        descriptionChanged ||
        categoryChanged
      ) {
        try {
          const { getOrCreateChat, sendMessage } = await import(
            "@/lib/chat/api"
          );

          // 상품과 관련된 채팅방 찾기
          const chatResult = await getOrCreateChat(
            productId,
            product.buyerUid || "unknown", // 구매자가 없으면 unknown
            product.sellerUid,
            "📝 상품 정보가 변경되었습니다."
          );

          if (chatResult.success && chatResult.chatId) {
            let changeMessage = "📝 판매자가 상품 정보를 변경했습니다:\n";

            if (priceChanged) {
              changeMessage += `• 가격: ${oldPrice.toLocaleString()}원 → ${newPrice.toLocaleString()}원\n`;
            }
            if (titleChanged) {
              changeMessage += `• 제목: ${product.title} → ${formData.title}\n`;
            }
            if (descriptionChanged) {
              changeMessage += `• 설명이 변경되었습니다\n`;
            }
            if (categoryChanged) {
              changeMessage += `• 카테고리가 변경되었습니다\n`;
            }

            const messageResult = await sendMessage({
              chatId: chatResult.chatId,
              senderUid: "system",
              content: changeMessage,
            });

            if (messageResult.success) {
              console.log("상품 변경 시스템 메시지 전송 완료");
            } else {
              console.error(
                "상품 변경 시스템 메시지 전송 실패:",
                messageResult.error
              );
            }
          }
        } catch (error) {
          console.error("상품 변경 알림 전송 실패:", error);
          // 시스템 메시지 전송 실패해도 상품 수정은 성공으로 처리
        }
      }

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
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 기본 정보 섹션 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 상품명 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상품명 *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="상품명을 입력하세요"
                      required
                    />
                  </div>

                  {/* 카테고리 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리 *
                    </label>
                    <div className="space-y-3">
                      {/* 카테고리 선택 버튼 */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { key: "건반", label: "건반악기", icon: "🎹" },
                          { key: "현악", label: "현악기", icon: "🎸" },
                          { key: "관악", label: "관악기", icon: "🎺" },
                          { key: "타악", label: "타악기", icon: "🥁" },
                          { key: "국악", label: "국악기", icon: "🎵" },
                          { key: "음향", label: "음향기기", icon: "🎧" },
                          { key: "특수", label: "특수악기", icon: "🎻" },
                          { key: "용품", label: "기타용품", icon: "🎼" },
                        ].map(category => (
                          <button
                            key={category.key}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                category: category.key,
                                categoryPath: [category.label],
                                categoryId: category.key,
                              }));
                            }}
                            className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                              formData.category === category.key
                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span className="mr-2">{category.icon}</span>
                            {category.label}
                          </button>
                        ))}
                      </div>

                      {/* 선택된 카테고리에서 검색 */}
                      {formData.category && (
                        <div className="border border-gray-300 rounded-lg p-4">
                          <div className="mb-3">
                            <span className="text-sm text-gray-600">
                              선택된 카테고리:{" "}
                            </span>
                            <span className="font-medium text-blue-600">
                              {
                                [
                                  {
                                    key: "건반",
                                    label: "건반악기",
                                    icon: "🎹",
                                  },
                                  { key: "현악", label: "현악기", icon: "🎸" },
                                  { key: "관악", label: "관악기", icon: "🎺" },
                                  { key: "타악", label: "타악기", icon: "🥁" },
                                  { key: "국악", label: "국악기", icon: "🎵" },
                                  {
                                    key: "음향",
                                    label: "음향기기",
                                    icon: "🎧",
                                  },
                                  {
                                    key: "특수",
                                    label: "특수악기",
                                    icon: "🎻",
                                  },
                                  {
                                    key: "용품",
                                    label: "기타용품",
                                    icon: "🎼",
                                  },
                                ].find(c => c.key === formData.category)?.label
                              }
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="구체적인 악기명을 입력하세요 (예: 피아노, 기타, 드럼)"
                              value={instrumentSearch}
                              onChange={e => {
                                const searchTerm = e.target.value;
                                setInstrumentSearch(searchTerm);
                                setShowSuggestions(searchTerm.length > 0);

                                setFormData(prev => ({
                                  ...prev,
                                  categoryPath: [
                                    prev.categoryPath?.[0] || "",
                                    searchTerm,
                                  ],
                                  categoryId: `${prev.category}_${searchTerm.toLowerCase().replace(/\s+/g, "_")}`,
                                }));
                              }}
                              onFocus={() =>
                                setShowSuggestions(instrumentSearch.length > 0)
                              }
                              onBlur={() =>
                                setTimeout(() => setShowSuggestions(false), 200)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />

                            {/* 자동완성 드롭다운 */}
                            {showSuggestions && instrumentSearch && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {getInstrumentSuggestions(
                                  instrumentSearch,
                                  formData.category
                                ).map((instrument, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setInstrumentSearch(instrument);
                                      setShowSuggestions(false);
                                      setFormData(prev => ({
                                        ...prev,
                                        categoryPath: [
                                          prev.categoryPath?.[0] || "",
                                          instrument,
                                        ],
                                        categoryId: `${prev.category}_${instrument.toLowerCase().replace(/\s+/g, "_")}`,
                                      }));
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  >
                                    {instrument}
                                  </button>
                                ))}
                                {getInstrumentSuggestions(
                                  instrumentSearch,
                                  formData.category
                                ).length === 0 && (
                                  <div className="px-3 py-2 text-gray-500 text-sm">
                                    검색 결과가 없습니다
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {formData.categoryPath?.[1] && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                              <span className="text-green-700 font-medium">
                                현재 악기:{" "}
                              </span>
                              <span className="text-green-600">
                                {formData.categoryPath[1]}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 가격 정보 섹션 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  가격 정보
                </h3>
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
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      원
                    </span>
                  </div>
                </div>
              </div>

              {/* 상품 이미지 섹션 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  상품 이미지
                </h3>

                {/* 현재 이미지 */}
                {images.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      현재 이미지
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((imageUrl, index) => {
                        // AI 감정 촬영본인지 확인 (URL에 ai-emotion이 포함되어 있거나 특정 패턴이 있는 경우)
                        const isAIEmotionImage =
                          imageUrl.includes("ai-emotion") ||
                          (product &&
                            (product as any).aiProcessedImages?.includes(
                              imageUrl
                            ));

                        return (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`상품 이미지 ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            {isAIEmotionImage && (
                              <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                <Brain className="w-3 h-3 mr-1" />
                                AI감정
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 이미지 추가 탭 */}
                <div className="mb-4">
                  <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setPhotoTab("upload")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        photoTab === "upload"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      파일 업로드
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoTab("ai-emotion")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        photoTab === "ai-emotion"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Brain className="w-4 h-4 inline mr-2" />
                      AI 감정 촬영
                    </button>
                  </div>
                </div>

                {/* 파일 업로드 탭 */}
                {photoTab === "upload" && (
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
                )}

                {/* AI 감정 촬영 탭 */}
                {photoTab === "ai-emotion" && (
                  <div className="space-y-4">
                    {!isCameraActive && !capturedImage && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setIsCameraActive(true)}
                          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          AI 감정 촬영 시작
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                          AI가 감정을 분석하여 워터마크를 추가합니다
                        </p>
                      </div>
                    )}

                    {isCameraActive && (
                      <CameraCapture
                        onCapture={handleAICapture}
                        onClose={() => setIsCameraActive(false)}
                        isActive={isCameraActive}
                      />
                    )}

                    {capturedImage && aiAnalysisResult && (
                      <AIEmotionAnalysisModal
                        imageUrl={capturedImage}
                        analysisResult={aiAnalysisResult}
                        onAddImage={handleAddAIEmotionImage}
                        onRetake={() => {
                          setCapturedImage(null);
                          setAiAnalysisResult(null);
                          setIsCameraActive(true);
                        }}
                        isUploading={uploadingImages}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* 배송 방법 섹션 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  배송 방법 * (여러 개 선택 가능)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "direct", label: "직거래" },
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

                {/* 택배 부담 방식 선택 */}
                {formData.shippingTypes.includes("parcel") && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      택배 배송비 부담 방식
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="parcelPaymentType"
                          value="seller"
                          checked={formData.parcelPaymentType === "seller"}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              parcelPaymentType: e.target.value as
                                | "seller"
                                | "buyer",
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          판매자 부담
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="parcelPaymentType"
                          value="buyer"
                          checked={formData.parcelPaymentType === "buyer"}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              parcelPaymentType: e.target.value as
                                | "seller"
                                | "buyer",
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          구매자 부담
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 안전거래 옵션 */}
                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="escrow"
                      checked={formData.escrowEnabled}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          escrowEnabled: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="escrow"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      안전거래(에스크로) 사용
                    </label>
                  </div>
                </div>
              </div>

              {/* 상품 설명 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  상품 설명
                </h3>
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

              {/* 버튼들 */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-6"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="px-6 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "저장 중..." : "상품 수정"}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
