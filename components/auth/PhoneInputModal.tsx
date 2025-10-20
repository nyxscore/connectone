"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { PhoneVerificationModal } from "./PhoneVerificationModal";

interface PhoneInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone?: string;
  onSuccess?: () => void;
}

export function PhoneInputModal({
  isOpen,
  onClose,
  currentPhone = "",
  onSuccess,
}: PhoneInputModalProps) {
  const [phone, setPhone] = useState(currentPhone);
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, "");

    // 010-1234-5678 형식으로 포맷팅
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError("핸드폰 번호를 입력해주세요.");
      return;
    }

    // 010-1234-5678 형식 확인
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      setError("올바른 핸드폰 번호를 입력해주세요. (010-1234-5678)");
      return;
    }

    // 핸드폰 번호 입력 완료 후 인증 모달 열기
    setShowVerification(true);
  };

  const handleVerificationSuccess = () => {
    setShowVerification(false);
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        >
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">핸드폰 인증</h2>
                  <p className="text-green-100 text-sm">
                    인증할 핸드폰 번호를 입력하세요
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

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  핸드폰 번호를 입력하세요
                </h3>
                <p className="text-gray-600 mb-6">
                  SMS 인증 코드를 받을 핸드폰 번호를 입력해주세요.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  핸드폰 번호
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="010-1234-5678"
                  className="h-12 text-base"
                  maxLength={13}
                  required
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                >
                  <span>SMS 인증 코드 발송</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12 border-gray-300"
                >
                  취소
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* 핸드폰 인증 모달 */}
      <PhoneVerificationModal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        phoneNumber={phone}
        onSuccess={handleVerificationSuccess}
      />
    </AnimatePresence>
  );
}


