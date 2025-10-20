"use client";

import { Card } from "@/components/ui/Card";
import { FileText, Calendar } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">이용약관</h1>
          <div className="flex items-center justify-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>최종 업데이트: 2024년 1월 1일</span>
          </div>
        </div>

        <Card className="p-8 md:p-12 prose prose-blue max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제1조 (목적)
            </h2>
            <p className="text-gray-700 leading-relaxed">
              본 약관은 ConnecTone(이하 "회사")이 제공하는 악기 및 음악 관련
              상품 거래 중개 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원
              간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
              합니다.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ 중요 안내:</strong> ConnecTone은 사용자 간 거래를
                중개하는 플랫폼입니다. 회사는 거래 당사자가 아니며, 직거래 및
                택배거래에 대한 책임을 지지 않습니다. 안전결제 서비스는 정식
                오픈 후 제공될 예정입니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제2조 (용어의 정의)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  "서비스"란 회사가 제공하는 악기 및 음악 관련 상품의 거래 중개,
                  채팅, 결제 대행 등의 온라인 플랫폼 서비스를 말합니다.
                </li>
                <li>
                  "회원"이란 회사의 서비스에 접속하여 본 약관에 따라 회사와
                  이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을
                  말합니다.
                </li>
                <li>
                  "판매자"란 서비스를 통해 상품을 등록하고 판매하는 회원을
                  말합니다.
                </li>
                <li>
                  "구매자"란 서비스를 통해 상품을 구매하는 회원을 말합니다.
                </li>
                <li>
                  "안전결제"란 회사가 정식 오픈 후 제공 예정인 에스크로 방식의
                  결제 시스템으로, 거래의 안전성을 보장하기 위한 서비스를
                  말합니다. (현재 준비 중)
                </li>
                <li>
                  "직거래"란 판매자와 구매자가 직접 만나 거래하는 방식을 말하며,
                  회사는 이에 대한 중개만 제공하고 거래 결과에 대해 책임을 지지
                  않습니다.
                </li>
                <li>
                  "택배거래"란 판매자와 구매자 간 택배를 통한 거래 방식을
                  말하며, 회사는 이에 대한 중개만 제공하고 거래 결과에 대해
                  책임을 지지 않습니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제3조 (약관의 효력 및 변경)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  본 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이
                  발생합니다.
                </li>
                <li>
                  회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본
                  약관을 변경할 수 있습니다.
                </li>
                <li>
                  약관이 변경되는 경우 회사는 변경사항을 시행일자 7일 전부터
                  서비스 내 공지사항을 통해 공지합니다.
                </li>
                <li>
                  회원이 변경된 약관에 동의하지 않는 경우, 서비스 이용을
                  중단하고 탈퇴할 수 있습니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제4조 (회원가입 및 이용계약의 성립)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  이용계약은 회원이 되고자 하는 자가 본 약관의 내용에 동의한 후
                  회원가입 신청을 하고, 회사가 이를 승낙함으로써 체결됩니다.
                </li>
                <li>
                  회사는 다음 각 호에 해당하는 경우 회원가입을 승낙하지 않을 수
                  있습니다:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>타인의 명의를 도용한 경우</li>
                    <li>허위 정보를 제공한 경우</li>
                    <li>과거 회원자격을 상실한 적이 있는 경우</li>
                    <li>법령 또는 약관을 위반하여 신청한 경우</li>
                  </ul>
                </li>
                <li>
                  만 14세 미만의 아동은 회원가입을 할 수 없으며, 만 19세 미만의
                  미성년자는 법정대리인의 동의를 받아야 합니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제5조 (서비스의 제공 및 변경)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 다음과 같은 서비스를 제공합니다:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>악기 및 음악 관련 상품의 거래 중개</li>
                    <li>회원 간 실시간 채팅 서비스</li>
                    <li>안전결제 서비스</li>
                    <li>AI 이미지 분석 서비스</li>
                    <li>회원등급 및 리뷰 시스템</li>
                    <li>
                      기타 회사가 추가로 개발하거나 제휴를 통해 제공하는 서비스
                    </li>
                  </ul>
                </li>
                <li>
                  회사는 서비스의 내용을 변경할 경우 변경사항을 사전에
                  공지합니다.
                </li>
                <li>
                  회사는 천재지변, 시스템 장애 등 불가피한 사유로 서비스를 일시
                  중단할 수 있습니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제6조 (거래 및 수수료)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 거래 중개 서비스의 대가로 판매가격의 5%를 수수료로
                  징수합니다.
                </li>
                <li>
                  수수료는 거래 완료 시 판매자에게 지급되는 대금에서 자동으로
                  차감됩니다.
                </li>
                <li>회사는 사전 공지를 통해 수수료율을 변경할 수 있습니다.</li>
                <li>
                  판매자와 구매자는 회사의 시스템을 통하지 않은 직거래로 인한
                  손해에 대해 회사가 책임지지 않음을 인지합니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제7조 (안전결제 서비스)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 안전한 거래를 위해 안전결제(에스크로) 서비스를
                  제공합니다.
                </li>
                <li>
                  구매자가 결제한 금액은 거래가 완료될 때까지 회사에 예치됩니다.
                </li>
                <li>
                  구매자가 상품 수령을 확인하면 회사는 예치금을 판매자에게
                  지급합니다.
                </li>
                <li>
                  거래 분쟁 발생 시 회사는 중재자로서 양측의 의견을 청취하고
                  합리적인 해결책을 제시합니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제8조 (회원의 의무)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>회원은 다음 행위를 하여서는 안 됩니다:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>허위 정보를 등록하거나 타인의 정보를 도용하는 행위</li>
                <li>회사의 서비스 정보를 무단으로 변경하는 행위</li>
                <li>
                  회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등)를 송신 또는
                  게시하는 행위
                </li>
                <li>
                  회사 및 기타 제3자의 저작권 등 지적재산권을 침해하는 행위
                </li>
                <li>
                  회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위
                </li>
                <li>
                  외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는
                  정보를 공개 또는 게시하는 행위
                </li>
                <li>사기 또는 불법 거래를 목적으로 서비스를 이용하는 행위</li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제9조 (개인정보의 보호)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 회원의 개인정보를 보호하기 위해 최선을 다하며,
                  개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의
                  개인정보처리방침에 따릅니다.
                </li>
                <li>
                  회사는 회원의 개인정보를 본인의 동의 없이 제3자에게 제공하지
                  않습니다.
                </li>
                <li>
                  회원은 언제든지 자신의 개인정보를 조회하고 수정할 수 있습니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제10조 (회원탈퇴 및 자격 상실)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시
                  회원탈퇴를 처리합니다.
                </li>
                <li>
                  다음 각 호의 사유에 해당하는 경우 회사는 회원자격을 제한 또는
                  정지시킬 수 있습니다:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>가입 신청 시 허위 내용을 등록한 경우</li>
                    <li>
                      다른 사람의 서비스 이용을 방해하거나 정보를 도용한 경우
                    </li>
                    <li>
                      서비스를 이용하여 법령과 본 약관이 금지하는 행위를 한 경우
                    </li>
                    <li>반복적인 신고나 불만이 접수된 경우</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제11조 (면책조항)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
                  제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
                </li>
                <li>
                  회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여
                  책임을 지지 않습니다.
                </li>
                <li>
                  회사는 회원이 서비스를 통해 게재한 정보, 자료, 사실의 신뢰도,
                  정확성 등의 내용에 관해서는 책임을 지지 않습니다.
                </li>
                <li>
                  회사는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한
                  분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할
                  책임도 없습니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제12조 (분쟁 해결)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 회원이 제기하는 정당한 의견이나 불만을 반영하고 그
                  피해를 보상처리하기 위하여 고객센터를 운영합니다.
                </li>
                <li>
                  본 약관과 관련하여 회사와 회원 간에 발생한 분쟁에 대해서는
                  대한민국 법을 적용합니다.
                </li>
                <li>
                  서비스 이용으로 발생한 분쟁에 대한 소송은 회사의 본사 소재지를
                  관할하는 법원을 전속 관할 법원으로 합니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">부칙</h2>
            <div className="text-gray-700 leading-relaxed">
              <p>본 약관은 2024년 1월 1일부터 시행됩니다.</p>
            </div>
          </section>
        </Card>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-center space-x-6 text-sm">
          <Link
            href="/privacy"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            개인정보처리방침
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/help"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            고객센터
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/contact"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            문의하기
          </Link>
        </div>
      </div>
    </div>
  );
}
