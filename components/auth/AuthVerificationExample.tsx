"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Smartphone, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { EmailVerificationModal } from "./EmailVerificationModal";
import { PhoneVerificationModal } from "./PhoneVerificationModal";
import { useAuth } from "../../lib/hooks/useAuth";

export function AuthVerificationExample() {
  const { user } = useAuth();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleEmailSuccess = () => {
    setEmailVerified(true);
    setShowEmailModal(false);
  };

  const handlePhoneSuccess = () => {
    setPhoneVerified(true);
    setShowPhoneModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎵 ConnecTone 인증 시스템
        </h1>
        <p className="text-gray-600 text-lg">
          이메일과 핸드폰 인증을 통해 더 안전한 거래를 경험하세요
        </p>
      </div>

      {/* 현재 사용자 정보 */}
      {user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">
            현재 로그인된 사용자
          </h3>
          <p className="text-blue-800">이메일: {user.email || "없음"}</p>
          <p className="text-blue-800">닉네임: {user.nickname || "없음"}</p>
        </div>
      )}

      {/* 인증 상태 카드들 */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* 이메일 인증 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  이메일 인증
                </h3>
                <p className="text-gray-600 text-sm">계정 보안 강화</p>
              </div>
            </div>
            {emailVerified ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>

          <p className="text-gray-600 mb-4">
            이메일 인증을 통해 계정의 안전성을 높이고, 중요한 알림을 받아보세요.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span>계정 보안 강화</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span>중요 알림 수신</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span>거래 내역 이메일 발송</span>
            </div>
          </div>

          <Button
            onClick={() => setShowEmailModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={emailVerified}
          >
            {emailVerified ? "인증 완료" : "이메일 인증하기"}
          </Button>
        </motion.div>

        {/* 핸드폰 인증 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  핸드폰 인증
                </h3>
                <p className="text-gray-600 text-sm">SMS 알림 수신</p>
              </div>
            </div>
            {phoneVerified ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>

          <p className="text-gray-600 mb-4">
            핸드폰 인증을 통해 실시간 SMS 알림을 받고, 거래를 더욱 안전하게
            진행하세요.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span>실시간 SMS 알림</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span>거래 상태 업데이트</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span>보안 강화</span>
            </div>
          </div>

          <Button
            onClick={() => setShowPhoneModal(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={phoneVerified}
          >
            {phoneVerified ? "인증 완료" : "핸드폰 인증하기"}
          </Button>
        </motion.div>
      </div>

      {/* 서비스 지원 정보 */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          지원되는 인증 서비스
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">이메일 서비스</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• SendGrid (추천) - 월 $15부터</li>
              <li>• AWS SES - $0.10/1,000건</li>
              <li>• Gmail SMTP - 무료 (개발용)</li>
              <li>• Firebase 기본 - 무료</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">SMS 서비스</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Firebase Phone - 무료 (일일 10건)</li>
              <li>• Twilio - $0.0075/건</li>
              <li>• AWS SNS - $0.0075/건</li>
              <li>• 네이버 클라우드 - ₩20/건</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <EmailVerificationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        userEmail={user?.email || "test@example.com"}
        onSuccess={handleEmailSuccess}
      />

      <PhoneVerificationModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        phoneNumber="010-1234-5678"
        onSuccess={handlePhoneSuccess}
      />
    </div>
  );
}


