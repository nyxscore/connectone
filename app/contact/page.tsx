"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  Phone,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface ContactFormData {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

const categories = [
  { value: "account", label: "계정/회원 문의" },
  { value: "transaction", label: "거래/결제 문의" },
  { value: "product", label: "상품 관련 문의" },
  { value: "report", label: "신고/제재" },
  { value: "suggestion", label: "제안/피드백" },
  { value: "other", label: "기타" },
];

export default function ContactPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ContactFormData>({
    name: user?.displayName || "",
    email: user?.email || "",
    category: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("문의 전송에 실패했습니다.");
      }

      setSubmitStatus("success");
      setFormData({
        name: user?.displayName || "",
        email: user?.email || "",
        category: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("문의 전송 오류:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">문의하기</h1>
          <p className="text-xl text-gray-600">
            궁금한 사항이나 문제가 있으신가요? 언제든지 문의해 주세요.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">이메일</h3>
                  <p className="text-gray-600 text-sm">
                    support@connectone.com
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    평균 24시간 내 답변
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">전화 상담</h3>
                  <p className="text-gray-600 text-sm mb-2">1588-0000</p>
                  <p className="text-xs text-gray-500">평일 09:00 - 18:00</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">운영 시간</h3>
                  <p className="text-gray-600 text-sm">평일 09:00 - 18:00</p>
                  <p className="text-xs text-gray-500">주말 및 공휴일 휴무</p>
                  <p className="text-xs text-gray-500 mt-1">
                    점심시간 12:00 - 13:00
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-lg mb-2 text-blue-900">
                💡 빠른 도움말
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                자주 묻는 질문에서 답변을 찾아보세요.
              </p>
              <Link href="/help">
                <Button variant="outline" size="sm" className="w-full">
                  FAQ 보기
                </Button>
              </Link>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {submitStatus === "success" ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    문의가 접수되었습니다!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    빠른 시일 내에 답변드리겠습니다.
                    <br />
                    등록하신 이메일로 확인 메일이 발송되었습니다.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setSubmitStatus("idle")}
                    >
                      새 문의 작성
                    </Button>
                    <Link href="/help">
                      <Button variant="primary">고객센터 홈</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이름 *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="홍길동"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일 *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문의 유형 *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">선택해주세요</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="문의 제목을 입력해주세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문의 내용 *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="문의하실 내용을 자세히 작성해주세요. 상세한 내용을 입력하시면 더욱 정확한 답변을 받으실 수 있습니다."
                    />
                  </div>

                  {submitStatus === "error" && (
                    <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">
                        문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-500">
                      * 표시는 필수 입력 항목입니다.
                    </p>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSubmitting}
                      className="min-w-[140px]"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          전송 중...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send className="w-4 h-4 mr-2" />
                          문의하기
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
