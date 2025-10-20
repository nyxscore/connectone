"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { EmailVerificationModal } from "./EmailVerificationModal";

interface EmailInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string;
  onSuccess?: () => void;
}

export function EmailInputModal({
  isOpen,
  onClose,
  currentEmail = "",
  onSuccess,
}: EmailInputModalProps) {
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("이메일 주소를 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    // 이메일 입력 완료 후 인증 모달 열기
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">이메일 인증</h2>
                  <p className="text-blue-100 text-sm">
                    인증할 이메일 주소를 입력하세요
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  이메일 주소를 입력하세요
                </h3>
                <p className="text-gray-600 mb-6">
                  인증 코드를 받을 이메일 주소를 입력해주세요.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 주소
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="example@email.com"
                  className="h-12 text-base"
                  required
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span>인증 코드 발송</span>
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

      {/* 이메일 인증 모달 */}
      <EmailVerificationModal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        userEmail={email}
        onSuccess={handleVerificationSuccess}
      />
    </AnimatePresence>
  );
}


