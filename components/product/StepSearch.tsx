"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StepSearchProps {
  formData: {
    category: string;
    tradeType: string;
    productName: string;
  };
  updateFormData: (data: { productName: string; productId?: string }) => void;
  register: any;
  errors: any;
}

interface SearchResult {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
}

export default function StepSearch({
  formData,
  updateFormData,
  register,
  errors,
}: StepSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 검색 함수 (클라이언트 사이드)
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Mock 데이터로 검색 결과 생성
      const mockResults = [
        {
          id: "1",
          name: "Yamaha P-125",
          category: formData.category,
          brand: "Yamaha",
          model: "P-125",
        },
        {
          id: "2",
          name: "Roland FP-30X",
          category: formData.category,
          brand: "Roland",
          model: "FP-30X",
        },
        {
          id: "3",
          name: "Kawai ES120",
          category: formData.category,
          brand: "Kawai",
          model: "ES120",
        },
        {
          id: "4",
          name: "Casio PX-S1000",
          category: formData.category,
          brand: "Casio",
          model: "PX-S1000",
        },
        {
          id: "5",
          name: "Nord Piano 5",
          category: formData.category,
          brand: "Nord",
          model: "Piano 5",
        },
      ].filter(
        item =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.brand.toLowerCase().includes(query.toLowerCase()) ||
          item.model.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
    } catch (error) {
      console.error("검색 오류:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 검색어 변경 시 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, formData.category]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.length > 0);
    setShowManualInput(false);
  };

  const handleResultSelect = (result: SearchResult) => {
    updateFormData({
      productName: result.name,
      productId: result.id,
    });
    setSearchQuery(result.name);
    setShowDropdown(false);
    setShowManualInput(false);
  };

  const handleManualInput = () => {
    setShowManualInput(true);
    setShowDropdown(false);
    setManualInput(formData.productName || "");
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      updateFormData({
        productName: manualInput.trim(),
        productId: undefined,
      });
      setSearchQuery(manualInput.trim());
      setShowManualInput(false);
    }
  };

  const clearSelection = () => {
    updateFormData({ productName: "", productId: undefined });
    setSearchQuery("");
    setShowManualInput(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          상품을 검색 후 선택하세요
        </h2>
        <p className="text-gray-600">
          원하는 악기를 검색하거나 직접 입력해주세요
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 검색 입력 */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="악기명을 입력하세요"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="상품 검색"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* 검색 결과 드롭다운 */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleResultSelect(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {result.name}
                      </div>
                      {result.brand && (
                        <div className="text-sm text-gray-500">
                          {result.brand}
                        </div>
                      )}
                    </motion.button>
                  ))
                ) : searchQuery && !isSearching ? (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    검색 결과가 없습니다
                  </div>
                ) : null}

                <div className="border-t border-gray-200">
                  <button
                    onClick={handleManualInput}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 text-blue-600 font-medium"
                  >
                    <Plus className="inline w-4 h-4 mr-2" />
                    직접 입력하기
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 직접 입력 모달 */}
        <AnimatePresence>
          {showManualInput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-lg font-semibold mb-4">상품명 직접 입력</h3>
                <input
                  type="text"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="상품명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  autoFocus
                />
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                    className="flex-1"
                  >
                    확인
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualInput(false)}
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 선택된 상품 표시 */}
        {formData.productName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900">선택된 상품</div>
                  <div className="text-blue-700">{formData.productName}</div>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-blue-500 hover:text-blue-700"
                  aria-label="선택 취소"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 숨겨진 입력 필드 */}
      <input
        type="hidden"
        {...register("productName", {
          required: "상품을 선택하거나 입력해주세요",
        })}
        value={formData.productName}
      />

      {/* 에러 메시지 */}
      {errors.productName && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-red-600 text-sm">{errors.productName.message}</p>
        </motion.div>
      )}
    </div>
  );
}
