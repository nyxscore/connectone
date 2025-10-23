"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { INSTRUMENT_CATEGORIES } from "@/data/constants";
import {
  INSTRUMENT_SUBCATEGORIES,
  ALL_INSTRUMENTS,
} from "@/data/constants/subcategories";

interface StepCategoryProps {
  formData: {
    category: string;
    tradeType: string;
    productName: string;
  };
  updateFormData: (data: { category: string; productName?: string }) => void;
  register: any;
  errors: any;
}

export default function StepCategory({
  formData,
  updateFormData,
  register,
  errors,
}: StepCategoryProps) {
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleCategorySelect = (categoryKey: string) => {
    updateFormData({ category: categoryKey });
    setShowSubcategories(true);
    setSelectedInstrument("");
  };

  const handleBackToCategories = () => {
    setShowSubcategories(false);
    setSearchTerm("");
    setSelectedInstrument("");
    updateFormData({ category: "", productName: "" });
  };

  const handleInstrumentSelect = (instrument: {
    key: string;
    label: string;
  }) => {
    setSelectedInstrument(instrument.key);
    updateFormData({ productName: instrument.label });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setShowSuggestions(term.length > 0);
  };

  const handleSuggestionClick = (instrument: {
    key: string;
    label: string;
  }) => {
    setSearchTerm(instrument.label);
    setShowSuggestions(false);
    setSelectedInstrument(instrument.key);
    updateFormData({ productName: instrument.label });
  };

  // 현재 선택된 카테고리의 하위 악기들
  const currentSubcategories = formData.category
    ? INSTRUMENT_SUBCATEGORIES[
        formData.category as keyof typeof INSTRUMENT_SUBCATEGORIES
      ] || []
    : [];

  // 검색 결과 필터링
  const filteredInstruments = searchTerm
    ? currentSubcategories.filter(instrument =>
        instrument.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : currentSubcategories;

  // 연관검색어 (최대 5개)
  const suggestions =
    searchTerm && searchTerm.length > 0
      ? currentSubcategories
          .filter(instrument =>
            instrument.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 5)
      : [];

  // 카테고리 정보 가져오기
  const selectedCategory = INSTRUMENT_CATEGORIES.find(
    cat => cat.key === formData.category
  );

  return (
    <div className="space-y-6 pb-32">
      {!showSubcategories ? (
        // 1단계: 카테고리 선택
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              카테고리를 선택해주세요
            </h2>
            <p className="text-gray-600">어떤 종류의 악기를 등록하시나요?</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {INSTRUMENT_CATEGORIES.map((category, index) => {
              const isSelected = formData.category === category.key;

              return (
                <motion.div
                  key={category.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(category.key)}
                    className={`
                      w-full p-6 rounded-xl border-2 transition-all duration-200
                      ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                          : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md"
                      }
                    `}
                    aria-label={`${category.label} 카테고리 선택`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div
                        className={`
                          text-4xl transition-colors duration-200
                          ${isSelected ? "text-white" : "text-gray-600"}
                        `}
                      >
                        {category.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-sm">
                          {category.label}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        // 2단계: 하위 악기 선택
        <>
          {/* 뒤로가기 버튼 */}
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={handleBackToCategories}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">카테고리 선택으로 돌아가기</span>
            </button>
          </div>

          {/* 선택된 카테고리 표시 */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-4xl mr-3">{selectedCategory?.icon}</span>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory?.label} 선택
              </h2>
            </div>
            <p className="text-gray-600">정확한 악기를 선택해주세요</p>
          </div>

          {/* 검색창 */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="악기 이름을 검색하세요 (예: 바이올린, 피아노)"
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setShowSuggestions(searchTerm.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />

            {/* 연관검색어 드롭다운 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((instrument, index) => (
                  <button
                    key={instrument.key}
                    type="button"
                    onClick={() => handleSuggestionClick(instrument)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                  >
                    <span className="text-xl">{instrument.icon}</span>
                    <span className="text-gray-900 font-medium">
                      {instrument.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 악기 카드 목록 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto pb-32">
            {filteredInstruments.map((instrument, index) => {
              const isSelected = selectedInstrument === instrument.key;

              return (
                <motion.div
                  key={instrument.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    type="button"
                    onClick={() => handleInstrumentSelect(instrument)}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all duration-200
                      ${
                        isSelected
                          ? "bg-green-600 border-green-600 text-white shadow-lg"
                          : "bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:shadow-md"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`
                          text-2xl transition-colors duration-200
                          ${isSelected ? "text-white" : "text-gray-600"}
                        `}
                      >
                        {instrument.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-xs leading-tight">
                          {instrument.label}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* 선택된 악기 표시 */}
          {selectedInstrument && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-center justify-center">
                <span className="text-green-600 font-medium">
                  선택된 악기: {formData.productName}
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* 숨겨진 입력 필드 */}
      <input
        type="hidden"
        {...register("category", { required: "카테고리를 선택해주세요" })}
        value={formData.category}
      />
      <input
        type="hidden"
        {...register("productName")}
        value={formData.productName}
      />

      {/* 에러 메시지 */}
      {errors.category && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-red-600 text-sm">{errors.category.message}</p>
        </motion.div>
      )}
    </div>
  );
}
