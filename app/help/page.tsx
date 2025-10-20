"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  MessageCircle,
  Shield,
  CreditCard,
  Package,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const categories = [
  { id: "all", name: "전체", icon: HelpCircle },
  { id: "account", name: "계정/회원", icon: Users },
  { id: "transaction", name: "거래/결제", icon: CreditCard },
  { id: "product", name: "상품 등록", icon: Package },
  { id: "safety", name: "안전거래", icon: Shield },
  { id: "chat", name: "채팅/소통", icon: MessageCircle },
];

const faqs: FAQItem[] = [
  {
    id: 1,
    category: "account",
    question: "회원가입은 어떻게 하나요?",
    answer:
      "상단 우측의 '로그인' 버튼을 클릭하신 후 '회원가입' 탭을 선택하세요. 이메일과 비밀번호를 입력하거나 구글, 네이버, 카카오 계정으로 간편하게 가입하실 수 있습니다.",
  },
  {
    id: 2,
    category: "account",
    question: "비밀번호를 잊어버렸어요.",
    answer:
      "로그인 페이지에서 '비밀번호 찾기'를 클릭하시면 가입하신 이메일로 비밀번호 재설정 링크가 발송됩니다. 이메일이 오지 않는다면 스팸 메일함을 확인해 주세요.",
  },
  {
    id: 3,
    category: "account",
    question: "회원등급은 어떻게 올릴 수 있나요?",
    answer:
      "ConnecTone의 회원등급은 거래 횟수와 평점에 따라 자동으로 상승합니다. Rookie → Bronze → Silver → Gold → Platinum → Diamond 순으로 올라가며, 등급이 높을수록 더 많은 혜택을 받으실 수 있습니다.",
  },
  {
    id: 4,
    category: "transaction",
    question: "안전결제 시스템은 어떻게 작동하나요?",
    answer:
      "구매자가 결제하면 금액이 ConnecTone에 일시 보관됩니다. 상품을 받은 구매자가 확인을 하면 판매자에게 대금이 지급되며, 문제 발생 시 분쟁조정을 통해 안전하게 해결할 수 있습니다.",
  },
  {
    id: 5,
    category: "transaction",
    question: "거래가 취소되면 환불은 언제 되나요?",
    answer:
      "거래 취소가 확정되면 즉시 환불 처리가 시작됩니다. 카드 결제의 경우 3-5 영업일, 계좌이체의 경우 1-2 영업일 내에 환불이 완료됩니다.",
  },
  {
    id: 6,
    category: "transaction",
    question: "판매 수수료는 얼마인가요?",
    answer:
      "ConnecTone은 거래 성사 시 판매 금액의 5%를 수수료로 받습니다. 수수료는 거래 완료 시 판매자에게 지급되는 금액에서 자동으로 차감됩니다.",
  },
  {
    id: 7,
    category: "product",
    question: "상품은 어떻게 등록하나요?",
    answer:
      "로그인 후 상단의 '판매하기' 버튼을 클릭하세요. 상품 카테고리, 사진, 제목, 설명, 가격, 상태 등을 입력하고 등록하면 됩니다. AI 이미지 분석 기능으로 상품 상태를 자동으로 평가받을 수 있습니다.",
  },
  {
    id: 8,
    category: "product",
    question: "등록한 상품을 수정하거나 삭제할 수 있나요?",
    answer:
      "네, 프로필 페이지의 '내 상품' 탭에서 언제든지 상품을 수정하거나 삭제할 수 있습니다. 단, 거래가 진행 중인 상품은 수정이 제한될 수 있습니다.",
  },
  {
    id: 9,
    category: "product",
    question: "상품 사진은 몇 장까지 올릴 수 있나요?",
    answer:
      "상품당 최대 10장의 사진을 업로드할 수 있습니다. 다양한 각도의 사진을 올리시면 구매자의 신뢰도를 높일 수 있습니다.",
  },
  {
    id: 10,
    category: "safety",
    question: "사기를 당했다면 어떻게 해야 하나요?",
    answer:
      "즉시 채팅에서 '신고하기' 버튼을 클릭하고, 고객센터로 연락주세요. 안전결제 시스템을 통한 거래라면 대금이 보호되며, 관리자가 신속하게 조사하여 적절한 조치를 취합니다.",
  },
  {
    id: 11,
    category: "safety",
    question: "직거래는 가능한가요?",
    answer:
      "직거래는 가능하지만 안전을 위해 권장하지 않습니다. 직거래 시에는 공공장소에서 만나고, 가능한 경우 안전결제 시스템을 이용하시길 권장합니다.",
  },
  {
    id: 12,
    category: "safety",
    question: "개인정보는 안전하게 보호되나요?",
    answer:
      "네, ConnecTone은 최신 암호화 기술과 보안 시스템으로 회원님의 개인정보를 안전하게 보호합니다. 자세한 내용은 개인정보처리방침을 참고해 주세요.",
  },
  {
    id: 13,
    category: "chat",
    question: "채팅으로 거래 조건을 협의할 수 있나요?",
    answer:
      "네, 실시간 채팅으로 판매자와 구매자가 직접 소통하며 가격, 배송 방법, 거래 방식 등을 협의할 수 있습니다.",
  },
  {
    id: 14,
    category: "chat",
    question: "욕설이나 비매너 행위는 어떻게 대응하나요?",
    answer:
      "채팅창 상단의 메뉴에서 '신고하기'를 선택하여 부적절한 행위를 신고할 수 있습니다. 신고된 내용은 관리자가 검토하여 이용 제재 등의 조치를 취합니다.",
  },
  {
    id: 15,
    category: "chat",
    question: "채팅 기록은 언제까지 보관되나요?",
    answer:
      "채팅 기록은 거래 완료 후 1년간 보관되며, 분쟁 발생 시 증거 자료로 활용될 수 있습니다.",
  },
];

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">고객센터</h1>
            <p className="text-xl text-blue-100">
              무엇을 도와드릴까요? 자주 묻는 질문과 답변을 확인해보세요.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="궁금한 내용을 검색해보세요..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 text-gray-900 placeholder-gray-400 shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/contact">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">문의하기</h3>
                  <p className="text-gray-600 text-sm">1:1 문의를 남겨주세요</p>
                </div>
              </div>
            </Card>
          </Link>

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
              </div>
            </div>
          </Card>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <Card className="p-12 text-center">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
              <p className="text-gray-400 text-sm mt-2">
                다른 검색어를 시도하거나 문의하기를 이용해주세요.
              </p>
            </Card>
          ) : (
            filteredFAQs.map(faq => (
              <Card key={faq.id} className="overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4 flex-1 text-left">
                    <div className="bg-blue-100 text-blue-600 font-semibold px-3 py-1 rounded-lg text-sm mt-1">
                      Q
                    </div>
                    <span className="font-medium text-gray-900 flex-1">
                      {faq.question}
                    </span>
                  </div>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <div className="flex items-start space-x-4 pt-4">
                      <div className="bg-green-100 text-green-600 font-semibold px-3 py-1 rounded-lg text-sm">
                        A
                      </div>
                      <p className="text-gray-600 flex-1">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Additional Help */}
        <Card className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              원하는 답변을 찾지 못하셨나요?
            </h2>
            <p className="text-gray-600 mb-6">
              1:1 문의를 통해 자세한 도움을 받으실 수 있습니다.
            </p>
            <Link href="/contact">
              <Button variant="primary" size="lg">
                문의하기
              </Button>
            </Link>
          </div>
        </Card>

        {/* Policy Links */}
        <div className="mt-8 flex justify-center space-x-6 text-sm">
          <Link
            href="/terms"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            이용약관
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/privacy"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </div>
  );
}
