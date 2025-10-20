"use client";

import { Card } from "@/components/ui/Card";
import { Shield, Calendar } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            개인정보처리방침
          </h1>
          <div className="flex items-center justify-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>최종 업데이트: 2024년 1월 1일</span>
          </div>
        </div>

        <Card className="p-8 md:p-12 prose prose-blue max-w-none">
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              ConnecTone(이하 "회사")은 정보주체의 자유와 권리 보호를 위해
              「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게
              개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보
              보호법」 제30조에 따라 정보주체에게 개인정보 처리에 관한 절차 및
              기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수
              있도록 하기 위하여 다음과 같이 개인정보 처리방침을
              수립·공개합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제1조 (개인정보의 처리 목적)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>
                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
                개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용
                목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라
                별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4 mt-4">
                <li>
                  <strong>회원가입 및 관리</strong>
                  <p className="ml-6 mt-1">
                    회원 가입의사 확인, 회원제 서비스 제공에 따른 본인
                    식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종
                    고지·통지 목적
                  </p>
                </li>
                <li>
                  <strong>재화 또는 서비스 제공</strong>
                  <p className="ml-6 mt-1">
                    서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공, 본인인증,
                    요금결제 및 정산, 채권추심
                  </p>
                </li>
                <li>
                  <strong>마케팅 및 광고에의 활용</strong>
                  <p className="ml-6 mt-1">
                    신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성
                    정보 제공 및 참여기회 제공, 서비스의 유효성 확인, 접속빈도
                    파악, 회원의 서비스 이용에 대한 통계
                  </p>
                </li>
                <li>
                  <strong>거래 안전성 확보</strong>
                  <p className="ml-6 mt-1">
                    안전결제 서비스 제공, 거래 분쟁 조정, 불법·부정 이용 방지
                  </p>
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제2조 (개인정보의 처리 및 보유 기간)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li>
                  회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
                  개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
                  개인정보를 처리·보유합니다.
                </li>
                <li>
                  각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                    <li>
                      <strong>회원가입 및 관리:</strong> 회원 탈퇴 시까지 (단,
                      관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는
                      해당 수사·조사 종료 시까지)
                    </li>
                    <li>
                      <strong>재화 또는 서비스 제공:</strong> 재화·서비스
                      공급완료 및 요금결제·정산 완료 시까지
                    </li>
                    <li>
                      <strong>거래정보 보관:</strong> 「전자상거래 등에서의
                      소비자보호에 관한 법률」에 따라 5년
                    </li>
                    <li>
                      <strong>대금결제 및 재화 등의 공급 기록:</strong> 5년
                    </li>
                    <li>
                      <strong>소비자의 불만 또는 분쟁처리 기록:</strong> 3년
                    </li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제3조 (처리하는 개인정보의 항목)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
              <ol className="list-decimal list-inside space-y-3 ml-4 mt-4">
                <li>
                  <strong>필수항목</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>이메일 주소, 비밀번호, 이름, 닉네임</li>
                    <li>프로필 사진 (선택)</li>
                  </ul>
                </li>
                <li>
                  <strong>서비스 이용 과정에서 자동 수집되는 정보</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>IP주소, 쿠키, 서비스 이용 기록, 방문 기록</li>
                    <li>기기 정보 (OS 버전, 브라우저 정보 등)</li>
                  </ul>
                </li>
                <li>
                  <strong>결제 정보 (거래 시)</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>
                      결제 정보는 PG사를 통해 처리되며, 회사는 최소한의 정보만
                      보관합니다
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>소셜 로그인 사용 시</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>구글: 이메일, 이름, 프로필 사진</li>
                    <li>네이버: 이메일, 이름, 프로필 사진</li>
                    <li>카카오: 이메일, 이름, 프로필 사진</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제4조 (개인정보의 제3자 제공)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서
                  명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한
                  규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는
                  경우에만 개인정보를 제3자에게 제공합니다.
                </li>
                <li>
                  회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>
                      <strong>결제대행사 (PG사)</strong>
                      <p className="ml-6">제공 목적: 결제 처리</p>
                      <p className="ml-6">제공 항목: 구매자 정보, 결제 정보</p>
                      <p className="ml-6">보유 기간: 거래 종료 후 5년</p>
                    </li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제5조 (개인정보처리의 위탁)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보
                  처리업무를 위탁하고 있습니다:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>
                      <strong>클라우드 서비스 (Firebase, Vercel)</strong>
                      <p className="ml-6">
                        위탁 업무: 서버 인프라 제공, 데이터 저장
                      </p>
                    </li>
                    <li>
                      <strong>이메일 발송 서비스</strong>
                      <p className="ml-6">위탁 업무: 이메일 발송 대행</p>
                    </li>
                  </ul>
                </li>
                <li>
                  회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라
                  위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적
                  보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등
                  책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가
                  개인정보를 안전하게 처리하는지를 감독하고 있습니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제6조 (정보주체의 권리·의무 및 행사방법)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호
                  관련 권리를 행사할 수 있습니다:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>개인정보 열람 요구</li>
                    <li>오류 등이 있을 경우 정정 요구</li>
                    <li>삭제 요구</li>
                    <li>처리정지 요구</li>
                  </ul>
                </li>
                <li>
                  제1항에 따른 권리 행사는 회사에 대해 「개인정보 보호법」
                  시행규칙 별지 제8호 서식에 따라 서면, 전자우편 등을 통하여
                  하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.
                </li>
                <li>
                  정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한
                  경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를
                  이용하거나 제공하지 않습니다.
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제7조 (개인정보의 파기)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
                  불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
                </li>
                <li>
                  개인정보 파기의 절차 및 방법은 다음과 같습니다:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>
                      <strong>파기절차:</strong> 회사는 파기 사유가 발생한
                      개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을
                      받아 개인정보를 파기합니다.
                    </li>
                    <li>
                      <strong>파기방법:</strong> 전자적 파일 형태의 정보는
                      기록을 재생할 수 없는 기술적 방법을 사용합니다. 종이에
                      출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.
                    </li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제8조 (개인정보의 안전성 확보조치)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
                있습니다:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4 mt-4">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                <li>
                  기술적 조치: 개인정보처리시스템 등의 접근권한 관리,
                  접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램
                  설치
                </li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제9조 (개인정보 보호책임자)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
                처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
                같이 개인정보 보호책임자를 지정하고 있습니다:
              </p>
              <div className="bg-blue-50 p-6 rounded-lg mt-4">
                <p className="font-semibold mb-2">개인정보 보호책임자</p>
                <ul className="space-y-1 ml-4">
                  <li>• 이름: ConnecTone 개인정보보호팀</li>
                  <li>• 이메일: privacy@connectone.com</li>
                  <li>• 전화번호: 1588-0000</li>
                </ul>
              </div>
              <p className="mt-4">
                정보주체는 회사의 서비스를 이용하시면서 발생한 모든 개인정보
                보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보
                보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에
                대해 지체없이 답변 및 처리해드릴 것입니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제10조 (개인정보 열람청구)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>
                정보주체는 「개인정보 보호법」 제35조에 따른 개인정보의 열람
                청구를 아래의 부서에 할 수 있습니다. 회사는 정보주체의 개인정보
                열람청구가 신속하게 처리되도록 노력하겠습니다.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg mt-4">
                <p className="font-semibold mb-2">
                  개인정보 열람청구 접수·처리 부서
                </p>
                <ul className="space-y-1 ml-4">
                  <li>• 부서명: 고객지원팀</li>
                  <li>• 이메일: support@connectone.com</li>
                  <li>• 전화번호: 1588-0000</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제11조 (권익침해 구제방법)
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>
                정보주체는 개인정보침해로 인한 구제를 받기 위하여
                개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터
                등에 분쟁해결이나 상담 등을 신청할 수 있습니다.
              </p>
              <ul className="list-disc list-inside ml-4 mt-4 space-y-2">
                <li>
                  개인정보분쟁조정위원회: (국번없이) 1833-6972
                  (www.kopico.go.kr)
                </li>
                <li>
                  개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)
                </li>
                <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
                <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              제12조 (개인정보 처리방침 변경)
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p>
                이 개인정보 처리방침은 2024년 1월 1일부터 적용되며, 법령 및
                방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는
                변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </div>
          </section>
        </Card>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-center space-x-6 text-sm">
          <Link
            href="/terms"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            이용약관
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
