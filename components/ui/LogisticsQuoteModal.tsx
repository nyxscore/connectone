"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { Checkbox } from "./Checkbox";
import {
  LogisticsQuote,
  LogisticsQuoteRequest,
  CreateLogisticsOrderInput,
} from "../../data/types/logistics";
import {
  X,
  Truck,
  MapPin,
  Building,
  Shield,
  Clock,
  Star,
  CheckCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface LogisticsQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  onQuoteSelect: (orderData: CreateLogisticsOrderInput) => void;
  className?: string;
}

export function LogisticsQuoteModal({
  isOpen,
  onClose,
  itemId,
  buyerUid,
  sellerUid,
  onQuoteSelect,
  className = "",
}: LogisticsQuoteModalProps) {
  const [step, setStep] = useState<"form" | "quotes">("form");
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<LogisticsQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<LogisticsQuote | null>(
    null
  );

  // 폼 데이터
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    floor: 1,
    hasElevator: false,
    hasInsurance: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGetQuotes = async () => {
    if (!formData.origin.trim() || !formData.destination.trim()) {
      toast.error("출발지와 도착지를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/logistics/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success && result.quotes) {
        setQuotes(result.quotes);
        setStep("quotes");
      } else {
        toast.error(result.error || "견적을 가져올 수 없습니다.");
      }
    } catch (error) {
      console.error("견적 요청 실패:", error);
      toast.error("견적을 가져올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSelect = (quote: LogisticsQuote) => {
    setSelectedQuote(quote);
  };

  const handleConfirmOrder = () => {
    if (!selectedQuote) return;

    const orderData: CreateLogisticsOrderInput = {
      itemId,
      buyerUid,
      sellerUid,
      quoteId: selectedQuote.id,
      companyName: selectedQuote.companyName,
      companyLogo: selectedQuote.companyLogo,
      price: selectedQuote.price,
      estimatedDays: selectedQuote.estimatedDays,
      origin: formData.origin,
      destination: formData.destination,
      floor: formData.floor,
      hasElevator: formData.hasElevator,
      hasInsurance: formData.hasInsurance,
    };

    onQuoteSelect(orderData);
    onClose();
  };

  const formatPrice = (price: {
    min: number;
    max: number;
    currency: string;
  }) => {
    const min = new Intl.NumberFormat("ko-KR").format(price.min);
    const max = new Intl.NumberFormat("ko-KR").format(price.max);
    return `${min}원 - ${max}원`;
  };

  const formatDays = (days: { min: number; max: number }) => {
    if (days.min === days.max) {
      return `${days.min}일`;
    }
    return `${days.min}-${days.max}일`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {step === "form" ? "운송 견적 요청" : "운송 견적 선택"}
            </h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 폼 단계 */}
        {step === "form" && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              {/* 출발지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출발지 *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={formData.origin}
                    onChange={e => handleInputChange("origin", e.target.value)}
                    placeholder="예: 서울시 강남구"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 도착지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  도착지 *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={formData.destination}
                    onChange={e =>
                      handleInputChange("destination", e.target.value)
                    }
                    placeholder="예: 부산시 해운대구"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 층수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  층수 *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.floor}
                    onChange={e =>
                      handleInputChange("floor", parseInt(e.target.value) || 1)
                    }
                    placeholder="1"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 옵션들 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.hasElevator}
                    onChange={checked =>
                      handleInputChange("hasElevator", checked)
                    }
                    id="hasElevator"
                  />
                  <label
                    htmlFor="hasElevator"
                    className="text-sm text-gray-700"
                  >
                    엘리베이터 있음 (할인 적용)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.hasInsurance}
                    onChange={checked =>
                      handleInputChange("hasInsurance", checked)
                    }
                    id="hasInsurance"
                  />
                  <label
                    htmlFor="hasInsurance"
                    className="text-sm text-gray-700"
                  >
                    보험 포함 (추가 비용)
                  </label>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3">
              <Button onClick={onClose} variant="outline">
                취소
              </Button>
              <Button onClick={handleGetQuotes} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    견적 요청 중...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 mr-2" />
                    견적 받기
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 견적 선택 단계 */}
        {step === "quotes" && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              {quotes.map(quote => (
                <Card
                  key={quote.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedQuote?.id === quote.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => handleQuoteSelect(quote)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="text-2xl">{quote.companyLogo}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {quote.companyName}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {quote.rating}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {quote.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-green-600">
                            {formatPrice(quote.price)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {formatDays(quote.estimatedDays)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {quote.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedQuote?.id === quote.id && (
                      <CheckCircle className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* 버튼 */}
            <div className="flex justify-between">
              <Button onClick={() => setStep("form")} variant="outline">
                이전
              </Button>
              <Button onClick={handleConfirmOrder} disabled={!selectedQuote}>
                <Truck className="w-4 h-4 mr-2" />
                운송 주문하기
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
