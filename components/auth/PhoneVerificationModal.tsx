"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Smartphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { authActions } from "../../lib/auth/actions";
import { toast } from "sonner";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onSuccess?: () => void;
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onSuccess,
}: PhoneVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [step, setStep] = useState<"send" | "verify">("send");
  const [error, setError] = useState("");
  const [mockCode, setMockCode] = useState(""); // Mock 코드 저장

  const handleSendVerification = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await authActions.verifyPhone(phoneNumber);

      if (result.success) {
        toast.success("SMS 인증 코드가 발송되었습니다!");

        // Mock 코드가 반환된 경우 저장
        if (result.code) {
          setMockCode(result.code);
        }

        setStep("verify");
      } else {
        setError(result.error || "SMS 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("SMS 인증 발송 실패:", error);
      setError("SMS 발송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("인증 코드를 입력해주세요.");
      return;
    }

    if (verificationCode.length !== 6) {
      setError("인증 코드는 6자리입니다.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authActions.confirmPhoneVerification(
        verificationCode,
        phoneNumber
      );

      if (result.success) {
        // Firestore에 사용자 프로필 업데이트
        try {
          const { getFirebaseDb } = await import(
            "../../lib/api/firebase-ultra-safe"
          );
          const { doc, updateDoc, serverTimestamp } = await import(
            "firebase/firestore"
          );
          const { useAuth } = await import("../../lib/hooks/useAuth");

          const db = await getFirebaseDb();
          const { user } = useAuth();

          if (user?.uid) {
            const userProfileRef = doc(db, "userProfiles", user.uid);
            await updateDoc(userProfileRef, {
              phoneNumber: phoneNumber,
              phoneVerified: true,
              updatedAt: serverTimestamp(),
            });
            console.log("핸드폰 인증 정보가 Firestore에 저장되었습니다.");
          }
        } catch (error) {
          console.error("Firestore 업데이트 실패:", error);
          // Firestore 업데이트 실패해도 인증은 성공으로 처리
        }

        toast.success("핸드폰 인증이 완료되었습니다!");
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || "인증에 실패했습니다.");
      }
    } catch (error) {
      console.error("핸드폰 인증 확인 실패:", error);
      setError("인증 확인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError("");

    try {
      const result = await authActions.verifyPhone(phoneNumber);

      if (result.success) {
        toast.success("SMS 인증 코드가 다시 발송되었습니다!");

        // Mock 코드가 반환된 경우 저장
        if (result.code) {
          setMockCode(result.code);
        }

        setVerificationCode("");
      } else {
        setError(result.error || "SMS 재발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("SMS 재발송 실패:", error);
      setError("SMS 재발송 중 오류가 발생했습니다.");
    } finally {
      setIsResending(false);
    }
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
                    {step === "send"
                      ? "인증 코드를 발송합니다"
                      : "인증 코드를 입력하세요"}
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

          <div className="p-6">
            {step === "send" ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Smartphone className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    핸드폰 인증이 필요합니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    <span className="font-medium text-green-600">
                      {phoneNumber}
                    </span>
                    로<br />
                    SMS 인증 코드를 발송하겠습니다.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    onClick={handleSendVerification}
                    disabled={isLoading}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        발송 중...
                      </>
                    ) : (
                      "SMS 인증 코드 발송"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 h-12 border-gray-300"
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Smartphone className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    인증 코드를 입력하세요
                  </h3>
                  <p className="text-gray-600 mb-4">
                    <span className="font-medium text-green-600">
                      {phoneNumber}
                    </span>
                    로<br />
                    발송된 6자리 인증 코드를 입력해주세요.
                  </p>
                </div>

                {/* Mock 코드 표시 (테스트용) */}
                {mockCode && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-800 text-sm font-medium">
                          테스트용 인증 코드
                        </p>
                        <p className="text-yellow-700 text-sm font-mono">
                          {mockCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      인증 코드
                    </label>
                    <Input
                      value={verificationCode}
                      onChange={e => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setVerificationCode(value);
                        setError("");
                      }}
                      placeholder="123456"
                      className="h-12 text-center text-lg font-mono tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>코드를 받지 못하셨나요?</span>
                    <button
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>재발송 중...</span>
                        </>
                      ) : (
                        <span>다시 보내기</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleVerifyCode}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        확인 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        인증 완료
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep("send")}
                    disabled={isLoading}
                    className="flex-1 h-12 border-gray-300"
                  >
                    이전
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
