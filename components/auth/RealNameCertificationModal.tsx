"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, CheckCircle, AlertCircle, Users } from "lucide-react";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import {
  openCertificationPopup,
  verifyCertification,
  mockCertification,
  CertificationResult,
} from "../../lib/auth/portone-certification";

interface RealNameCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (certData: CertificationResult) => void;
}

export function RealNameCertificationModal({
  isOpen,
  onClose,
  onSuccess,
}: RealNameCertificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setIsLoading(false);

      // PortOne API 키 체크
      const hasPortOneKey = !!process.env.NEXT_PUBLIC_PORTONE_IMP_CODE;
      if (!hasPortOneKey) {
        setUseMock(true);
        console.log("PortOne API 키가 없어 Mock 모드로 전환됩니다.");
      }
    }
  }, [isOpen]);

  // PortOne 스크립트 로드
  useEffect(() => {
    if (!isOpen) return;

    // 이미 로드되어 있으면 스킵
    if ((window as any).IMP) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ PortOne 스크립트 로드 완료");
    };
    script.onerror = () => {
      console.error("❌ PortOne 스크립트 로드 실패");
      setUseMock(true);
    };

    document.body.appendChild(script);

    return () => {
      // 클린업 시 스크립트 제거하지 않음 (재사용 가능하도록)
    };
  }, [isOpen]);

  const handleCertification = async () => {
    setIsLoading(true);
    setError("");

    try {
      let result: CertificationResult;

      if (useMock) {
        // Mock 모드
        console.log("🧪 Mock 본인인증 시작");
        result = await mockCertification();
      } else {
        // 실제 본인인증
        console.log("🔐 실제 본인인증 시작");
        const popupResult = await openCertificationPopup();

        if (!popupResult.success) {
          throw new Error(popupResult.error_msg || "본인인증에 실패했습니다.");
        }

        // 서버에서 검증
        result = await verifyCertification(popupResult.imp_uid!);
      }

      if (result.success) {
        // Firestore에 본인인증 정보 저장
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
              realName: result.name,
              phoneNumber: result.phone,
              phoneVerified: true,
              birthDate: result.birth,
              gender: result.gender,
              carrier: result.carrier,
              certifiedAt: new Date(result.certified_at || Date.now()),
              updatedAt: serverTimestamp(),
            });
            console.log("✅ 본인인증 정보가 Firestore에 저장되었습니다.");
          }
        } catch (error) {
          console.error("❌ Firestore 업데이트 실패:", error);
        }

        toast.success(`${result.name}님, 본인인증이 완료되었습니다!`);
        onSuccess?.(result);
        onClose();
      } else {
        throw new Error(result.error_msg || "본인인증에 실패했습니다.");
      }
    } catch (error) {
      console.error("본인인증 오류:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "본인인증 중 오류가 발생했습니다.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">본인인증</h2>
                  <p className="text-indigo-100 text-sm">
                    {useMock ? "테스트 모드" : "실명 + 통신사 인증"}
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
            <div className="space-y-6">
              {/* 안내 메시지 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {useMock ? "테스트용 본인인증" : "안전한 본인인증"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {useMock
                    ? "테스트 환경입니다. Mock 데이터로 본인인증을 테스트합니다."
                    : "통신사를 통한 실명 인증으로 안전하게 본인을 확인합니다."}
                </p>

                {useMock && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-yellow-900">
                          테스트 모드
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          실제 본인인증을 사용하려면 PortOne 가입 및 API 키
                          설정이 필요합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 인증 안내 */}
              {!useMock && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    인증 절차
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>통신사 선택 (SKT, KT, LG U+, 알뜰폰)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>이름, 생년월일, 성별, 휴대폰 번호 입력</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>SMS 인증번호 입력</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>본인인증 완료</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleCertification}
                  disabled={isLoading}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      <span>인증 중...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      <span>
                        {useMock ? "테스트 인증하기" : "본인인증 시작"}
                      </span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 h-12 border-gray-300"
                >
                  취소
                </Button>
              </div>

              {/* PortOne 안내 */}
              {useMock && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    실제 서비스 이용 시{" "}
                    <a
                      href="https://admin.portone.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      PortOne
                    </a>
                    에서 가입 후 API 키를 설정해주세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


