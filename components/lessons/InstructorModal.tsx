"use client";

import { useState } from "react";
import {
  X,
  Star,
  MapPin,
  Clock,
  Music,
  Award,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { Button } from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";

interface LessonType {
  id: string;
  name: string;
  type: "single" | "monthly" | "pro";
  duration: number;
  price?: number | null;
  pricePerSession?: number;
  priceNegotiable?: boolean;
  monthlyOptions?: {
    sessions: number;
    discount: number;
    label: string;
  }[];
  description: string;
}

interface Instructor {
  id: string;
  name: string;
  photo: string;
  specialty: string;
  instruments: string[];
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  location: string;
  experience: string;
  bio: string;
  certifications: string[];
  tags: string[];
  availability?: string[];
  lessonTypes?: LessonType[];
}

interface InstructorModalProps {
  instructor: Instructor | null;
  isOpen: boolean;
  onClose: () => void;
  onBookLesson: (instructor: Instructor, lessonType: LessonType) => void;
}

export function InstructorModal({
  instructor,
  isOpen,
  onClose,
  onBookLesson,
}: InstructorModalProps) {
  const [selectedLessonType, setSelectedLessonType] = useState(0);
  const [selectedMonthlyOption, setSelectedMonthlyOption] = useState(0);

  if (!instructor) return null;

  const lessonTypes = instructor.lessonTypes || [
    {
      name: "1:1 개인 레슨",
      duration: 60,
      price: instructor.pricePerHour,
      description: "맞춤형 개인 지도",
    },
  ];

  const availability = instructor.availability || ["상담 후 결정"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* 모달 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* 헤더 */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between z-10">
                <div className="flex items-start space-x-4 flex-1">
                  <img
                    src={instructor.photo}
                    alt={instructor.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {instructor.name}
                    </h2>
                    <p className="text-gray-600 mb-2">{instructor.specialty}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1 rounded-lg">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-900">
                          {instructor.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({instructor.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{instructor.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{instructor.experience}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* 본문 */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* 왼쪽: 강사 정보 */}
                  <div className="md:col-span-2 space-y-6">
                    {/* 악기 */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        담당 악기
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {instructor.instruments.map((instrument, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            <Music className="w-4 h-4" />
                            <span>{instrument}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 소개 */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        소개
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {instructor.bio}
                      </p>
                    </div>

                    {/* 자격증 */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        <span>자격증 및 경력</span>
                      </h3>
                      <ul className="space-y-2">
                        {instructor.certifications.map((cert, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">{cert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 전문 분야 */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        전문 분야
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {instructor.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 상담 */}
                  <div className="md:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        레슨 상담
                      </h3>

                      {/* 레슨 타입 선택 */}
                      <div className="mb-6">
                        <label className="text-sm font-medium text-gray-700 mb-3 block">
                          레슨 유형
                        </label>
                        <div className="space-y-3">
                          {lessonTypes.map((lessonType, idx) => {
                            let priceDisplay = "";

                            if (lessonType.type === "single") {
                              priceDisplay = `${lessonType.price?.toLocaleString()}원`;
                            } else if (lessonType.type === "monthly") {
                              priceDisplay = `${lessonType.pricePerSession?.toLocaleString()}원/회~`;
                            } else if (lessonType.type === "pro") {
                              if (lessonType.priceNegotiable) {
                                priceDisplay = "가격 협의";
                              } else if (lessonType.price) {
                                priceDisplay = `${lessonType.price.toLocaleString()}원`;
                              }
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedLessonType(idx)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                                  selectedLessonType === idx
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <span className="font-semibold text-gray-900 text-base leading-tight">
                                    {lessonType.name}
                                  </span>
                                  <span
                                    className={`font-bold text-base flex-shrink-0 ${
                                      lessonType.priceNegotiable
                                        ? "text-purple-600"
                                        : "text-blue-600"
                                    }`}
                                  >
                                    {priceDisplay}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {lessonType.duration}분 ·{" "}
                                  {lessonType.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 월 레슨 횟수 선택 */}
                      {lessonTypes[selectedLessonType]?.type === "monthly" &&
                        lessonTypes[selectedLessonType]?.monthlyOptions && (
                          <div className="mb-6">
                            <label className="text-sm font-medium text-gray-700 mb-3 block">
                              희망 레슨 횟수
                            </label>
                            <div className="space-y-3">
                              {lessonTypes[
                                selectedLessonType
                              ].monthlyOptions!.map((option, idx) => {
                                const pricePerSession =
                                  lessonTypes[selectedLessonType]
                                    .pricePerSession || 0;
                                const discountedPrice =
                                  pricePerSession * (1 - option.discount / 100);
                                const totalPrice =
                                  discountedPrice * option.sessions;

                                return (
                                  <button
                                    key={idx}
                                    onClick={() =>
                                      setSelectedMonthlyOption(idx)
                                    }
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                                      selectedMonthlyOption === idx
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <span className="font-semibold text-gray-900 text-base leading-tight">
                                        {option.label}
                                      </span>
                                      {option.discount > 0 && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold flex-shrink-0">
                                          {option.discount}% 할인
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      {option.discount > 0 && (
                                        <span className="text-sm text-gray-400 line-through">
                                          {(
                                            pricePerSession * option.sessions
                                          ).toLocaleString()}
                                          원
                                        </span>
                                      )}
                                      <span className="text-base font-bold text-blue-600">
                                        {totalPrice.toLocaleString()}원
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        ({discountedPrice.toLocaleString()}
                                        원/회)
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* 가능한 시간 */}
                      <div className="mb-6">
                        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>가능한 시간</span>
                        </label>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <ul className="space-y-1 text-sm text-gray-700">
                            {availability.map((time, idx) => (
                              <li
                                key={idx}
                                className="flex items-center space-x-2"
                              >
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span>{time}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* 상담 버튼 */}
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          onBookLesson(
                            instructor,
                            lessonTypes[selectedLessonType]
                          );
                          onClose();
                        }}
                      >
                        레슨 상담하기
                      </Button>

                      <p className="text-xs text-gray-500 text-center mt-3">
                        강사와 채팅으로 일정을 조율해보세요
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
