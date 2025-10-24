"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      id: 1,
      question: "회원가입은 어떻게 하나요?",
      answer: "홈페이지 우측 상단의 '로그인' 버튼을 클릭하신 후, '회원가입' 탭에서 이메일과 비밀번호를 입력하여 가입하실 수 있습니다. 구글, 네이버 계정으로도 간편 가입이 가능합니다."
    },
    {
      id: 2,
      question: "상품을 판매하려면 어떻게 해야 하나요?",
      answer: "로그인 후 상단 메뉴의 '판매하기' 버튼을 클릭하시면 상품 등록 페이지로 이동합니다. 상품 사진, 상세 정보, 가격 등을 입력하신 후 등록하시면 됩니다."
    },
    {
      id: 3,
      question: "거래는 어떻게 진행되나요?",
      answer: "구매자가 상품에 관심을 보이면 채팅을 통해 상담을 진행합니다. 거래가 확정되면 안전거래 서비스를 통해 결제를 진행하시면 됩니다."
    },
    {
      id: 4,
      question: "안전거래 서비스는 무엇인가요?",
      answer: "ConnecTone의 안전거래 서비스는 구매자와 판매자 모두를 보호하는 중계 서비스입니다. 결제는 ConnecTone이 중계하고, 상품 수령 확인 후 판매자에게 정산됩니다."
    },
    {
      id: 5,
      question: "수수료는 얼마인가요?",
      answer: "ConnecTone은 거래 성사 시 판매가의 3%를 수수료로 받습니다. 이는 안전거래 서비스, 고객지원, 플랫폼 운영비 등에 사용됩니다."
    },
    {
      id: 6,
      question: "계정을 삭제하려면 어떻게 하나요?",
      answer: "마이페이지 > 설정 > 계정 관리에서 계정 삭제를 요청하실 수 있습니다. 진행 중인 거래가 있는 경우 거래 완료 후 삭제가 가능합니다."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">고객센터</h1>
          <p className="text-gray-600">궁금한 점이 있으시면 언제든지 문의해주세요</p>
        </div>

        {/* 연락처 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Phone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">전화상담</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-2xl font-bold text-blue-600 mb-2">1588-0000</p>
              <p className="text-gray-600 text-sm">평일 09:00 - 18:00</p>
              <p className="text-gray-500 text-xs">토요일 09:00 - 13:00</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">이메일 문의</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-green-600 mb-2">support@connectone.com</p>
              <p className="text-gray-600 text-sm">24시간 접수</p>
              <p className="text-gray-500 text-xs">평균 24시간 내 답변</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">카카오톡</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold text-purple-600 mb-2">@ConnecTone</p>
              <p className="text-gray-600 text-sm">평일 09:00 - 18:00</p>
              <p className="text-gray-500 text-xs">실시간 상담</p>
            </CardContent>
          </Card>
        </div>

        {/* 1:1 문의하기 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              1:1 문의하기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문의 유형
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>계정 관련</option>
                  <option>거래 관련</option>
                  <option>결제 관련</option>
                  <option>기술적 문제</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <Input type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문의 내용
              </label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                placeholder="문의하실 내용을 자세히 적어주세요..."
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700">
                문의하기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 자주 묻는 질문 */}
        <Card>
          <CardHeader>
            <CardTitle>자주 묻는 질문</CardTitle>
            <div className="mt-4">
              <Input
                type="text"
                placeholder="궁금한 내용을 검색해보세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg">
                  <button
                    className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  >
                    <span className="font-medium">{faq.question}</span>
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-3 text-gray-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 운영시간 안내 */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-sm">
                고객센터 운영시간: 평일 09:00 - 18:00 (토요일 09:00 - 13:00) | 일요일 및 공휴일 휴무
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}