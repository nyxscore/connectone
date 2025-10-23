"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Shield } from "lucide-react";
import { Button } from "../ui/Button";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "service" | "privacy";
}

export function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
  const isService = type === "service";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    {isService ? (
                      <FileText className="w-6 h-6 text-white" />
                    ) : (
                      <Shield className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isService ? "서비스 이용약관" : "개인정보처리방침"}
                    </h2>
                    <p className="text-blue-100 text-sm">
                      ConnecTone 서비스 이용을 위한 약관입니다
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* 약관 내용 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="prose max-w-none">
                {isService ? <ServiceTerms /> : <PrivacyTerms />}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <Button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                확인
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 서비스 이용약관
function ServiceTerms() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🎵 ConnecTone 서비스 이용약관
        </h3>
        <p className="text-blue-800 text-sm">
          본 약관은 ConnecTone 서비스(이하 "서비스")의 이용과 관련하여 회사와
          이용자 간의 권리, 의무 및 책임사항을 규정합니다.
        </p>
      </div>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제1조 (목적)
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">
          본 약관은 ConnecTone이 제공하는 음악 악기 중고거래 플랫폼 서비스의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을
          목적으로 합니다.
        </p>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제2조 (정의)
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            1. "서비스"란 ConnecTone이 제공하는 음악 악기 중고거래 플랫폼을
            의미합니다.
          </p>
          <p>
            2. "이용자"란 서비스에 접속하여 본 약관에 따라 서비스를 이용하는
            회원 및 비회원을 의미합니다.
          </p>
          <p>
            3. "회원"이란 서비스에 개인정보를 제공하여 회원등록을 한 자로서,
            서비스의 정보를 지속적으로 제공받으며 서비스를 계속적으로 이용할 수
            있는 자를 의미합니다.
          </p>
          <p>
            4. "콘텐츠"란 이용자가 서비스를 이용하면서 생성한 정보, 데이터,
            텍스트, 음성, 음향, 그림, 사진, 동영상, 링크 등 모든 정보를
            의미합니다.
          </p>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제3조 (약관의 효력 및 변경)
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이
            발생합니다.
          </p>
          <p>
            2. 회사는 필요하다고 인정되는 경우 본 약관을 변경할 수 있으며,
            변경된 약관은 서비스 내 공지사항을 통해 공지합니다.
          </p>
          <p>
            3. 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수
            있습니다.
          </p>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제4조 (서비스의 제공)
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
          <div className="ml-4 space-y-1">
            <p>• 음악 악기 중고거래 플랫폼</p>
            <p>• 상품 등록, 검색, 거래 기능</p>
            <p>• 사용자 간 채팅 및 커뮤니케이션</p>
            <p>• 안전거래 서비스</p>
            <p>• 기타 회사가 정하는 서비스</p>
          </div>
          <p>2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</p>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제5조 (회원가입 및 탈퇴)
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본
            약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
          </p>
          <p>
            2. 회사는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에
            해당하지 않는 한 회원으로 등록합니다:
          </p>
          <div className="ml-4 space-y-1">
            <p>
              • 가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는
              경우
            </p>
            <p>• 등록 내용에 허위, 기재누락, 오기가 있는 경우</p>
            <p>
              • 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고
              판단되는 경우
            </p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제6조 (이용자의 의무)
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
          <div className="ml-4 space-y-1">
            <p>• 신청 또는 변경 시 허위 내용의 등록</p>
            <p>• 타인의 정보 도용</p>
            <p>• 회사가 게시한 정보의 변경</p>
            <p>
              • 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는
              게시
            </p>
            <p>• 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</p>
            <p>• 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</p>
            <p>
              • 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는
              정보를 서비스에 공개 또는 게시하는 행위
            </p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제7조 (서비스의 중단)
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의
            두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할
            수 있습니다.
          </p>
          <p>
            2. 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로
            인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가
            고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.
          </p>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제8조 (손해배상)
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">
          회사는 무료로 제공되는 서비스와 관련하여 회원에게 어떠한 손해가
          발생하더라도 동 손해가 회사의 중대한 과실에 의한 경우를 제외하고 이에
          대하여 책임을 부담하지 아니합니다.
        </p>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          제9조 (준거법 및 관할법원)
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            1. 회사와 이용자 간에 발생한 분쟁에 관한 소송은 민사소송법상의
            관할법원에 제기합니다.
          </p>
          <p>2. 회사와 이용자 간에 제기된 소송에는 대한민국 법을 적용합니다.</p>
        </div>
      </section>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
        <p className="text-sm text-gray-600">
          <strong>시행일:</strong> 2024년 1월 1일
          <br />
          <strong>최종 수정일:</strong> 2024년 12월 1일
          <br />
          <strong>문의:</strong> support@connectone.com
        </p>
      </div>
    </div>
  );
}

// 개인정보처리방침
function PrivacyTerms() {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          🛡️ ConnecTone 개인정보처리방침
        </h3>
        <p className="text-green-800 text-sm">
          ConnecTone은 이용자의 개인정보를 보호하기 위해 최선을 다하고 있습니다.
          본 방침은 개인정보보호법에 따라 개인정보 처리 현황을 알려드립니다.
        </p>
      </div>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          1. 개인정보의 처리목적
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>ConnecTone은 다음의 목적을 위하여 개인정보를 처리합니다:</p>
          <div className="ml-4 space-y-1">
            <p>• 회원가입 및 관리</p>
            <p>• 서비스 제공 및 거래 중개</p>
            <p>• 고객상담 및 불만처리</p>
            <p>• 서비스 개선 및 신규 서비스 개발</p>
            <p>• 마케팅 및 광고에 활용</p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          2. 개인정보의 처리 및 보유기간
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
            개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
            개인정보를 처리·보유합니다.
          </p>
          <p>2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
          <div className="ml-4 space-y-1">
            <p>• 회원가입 정보: 회원탈퇴 시까지</p>
            <p>• 거래 기록: 관련 법령에 따른 보존기간 (통상 5년)</p>
            <p>• 로그인 기록: 3개월</p>
            <p>• 상담 기록: 3년</p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          3. 처리하는 개인정보의 항목
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
          <div className="ml-4 space-y-1">
            <p>
              <strong>필수항목:</strong> 이메일, 닉네임, 지역, 비밀번호
            </p>
            <p>
              <strong>선택항목:</strong> 휴대폰번호, 프로필 사진, 자기소개
            </p>
            <p>
              <strong>자동수집항목:</strong> IP주소, 쿠키, 서비스 이용 기록,
              접속 로그
            </p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          4. 개인정보의 제3자 제공
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            1. 회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서
            명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정
            등 개인정보 보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게
            제공합니다.
          </p>
          <p>2. 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다:</p>
          <div className="ml-4 space-y-1">
            <p>• 거래 상대방: 거래 진행을 위해 최소한의 정보 제공</p>
            <p>• 배송업체: 상품 배송을 위해 배송지 정보 제공</p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          5. 개인정보처리의 위탁
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보
            처리업무를 위탁하고 있습니다:
          </p>
          <div className="ml-4 space-y-1">
            <p>• 클라우드 서비스: Firebase, Vercel</p>
            <p>• 이메일 발송: SendGrid, AWS SES, Gmail SMTP</p>
            <p>• SMS 발송: Twilio, AWS SNS, 네이버 클라우드</p>
            <p>• 결제 처리: PortOne (구 아임포트)</p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          6. 정보주체의 권리·의무 및 행사방법
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련
            권리를 행사할 수 있습니다:
          </p>
          <div className="ml-4 space-y-1">
            <p>• 개인정보 처리정지 요구</p>
            <p>• 개인정보 열람요구</p>
            <p>• 개인정보 정정·삭제요구</p>
            <p>• 개인정보 처리정지 요구</p>
          </div>
          <p>
            권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을
            통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
          </p>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          7. 개인정보의 안전성 확보조치
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
            있습니다:
          </p>
          <div className="ml-4 space-y-1">
            <p>• 관리적 조치: 내부관리계획 수립, 전담조직 운영</p>
            <p>
              • 기술적 조치: 개인정보처리시스템 등의 접근권한 관리,
              접근통제시스템 설치
            </p>
            <p>• 물리적 조치: 전산실, 자료보관실 등의 접근통제</p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          8. 개인정보 보호책임자
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
            처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
            같이 개인정보 보호책임자를 지정하고 있습니다:
          </p>
          <div className="ml-4 space-y-1">
            <p>
              <strong>개인정보 보호책임자</strong>
            </p>
            <p>성명: ConnecTone 개인정보보호팀</p>
            <p>연락처: privacy@connectone.com</p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          9. 개인정보처리방침의 변경
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">
          이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
          변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일
          전부터 공지사항을 통하여 고지할 것입니다.
        </p>
      </section>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
        <p className="text-sm text-gray-600">
          <strong>시행일:</strong> 2024년 1월 1일
          <br />
          <strong>최종 수정일:</strong> 2024년 12월 1일
          <br />
          <strong>개인정보보호책임자:</strong> privacy@connectone.com
          <br />
          <strong>고객센터:</strong> support@connectone.com
        </p>
      </div>
    </div>
  );
}


