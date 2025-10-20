"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Download,
} from "lucide-react";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import {
  showPassInstallGuide,
  PassCertificationResult,
} from "../../lib/auth/pass-certification";
import { callPassApi, loadPassSdks } from "../../lib/auth/real-pass-api";
import {
  openWebCertification,
  WebCertificationResult,
} from "../../lib/auth/web-certification";
import {
  callPortOnePass,
  mockPortOnePass,
  loadPortOneScript,
} from "../../lib/auth/portone-pass-api";

interface PassCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (certData: PassCertificationResult) => void;
}

export function PassCertificationModal({
  isOpen,
  onClose,
  onSuccess,
}: PassCertificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [usePortOne, setUsePortOne] = useState(false); // PortOne 사용 여부 (기본값: false, Mock 모드)

  useEffect(() => {
    if (isOpen) {
      setError("");
      setIsLoading(false);
      setShowInstallGuide(false);

      // Mock 모드 기본 사용 (안전한 테스트)
      console.log("🧪 Mock 모드로 본인인증을 시작합니다.");
      setUseMock(true);
      setUsePortOne(false);
    }
  }, [isOpen]);

  const handleCertification = async () => {
    setIsLoading(true);
    setError("");

    try {
      let result: PassCertificationResult;

      if (useMock) {
        // Mock 모드 (테스트용)
        console.log("🧪 Mock 본인인증 시작");
        result = await mockPortOnePass();
      } else if (usePortOne) {
        // PortOne 본인인증 (월 100건 무료)
        console.log("🔐 PortOne 본인인증 시작");
        result = await callPortOnePass();
      } else {
        // Fallback: 웹용 본인인증
        console.log("🌐 웹용 본인인증 시작");
        result = await openWebCertification("01012345678");
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
            console.log("✅ PASS 본인인증 정보가 Firestore에 저장되었습니다.");
          }
        } catch (error) {
          console.error("❌ Firestore 업데이트 실패:", error);
          // Firestore 업데이트 실패해도 인증은 성공으로 처리
        }

        toast.success(`${result.name}님, PASS 본인인증이 완료되었습니다!`);
        onSuccess?.(result);
        onClose();
      } else {
        if (result.error?.includes("PASS 앱")) {
          setShowInstallGuide(true);
        } else {
          setError(result.error || "PASS 인증에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("PASS 인증 오류:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "PASS 인증 중 오류가 발생했습니다.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const installGuide = showPassInstallGuide();

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
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    PASS 본인인증
                  </h2>
                  <p className="text-green-100 text-sm">
                    {useMock
                      ? "테스트 모드"
                      : usePortOne
                        ? "PortOne 본인인증"
                        : "웹용 본인인증"}
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {useMock
                    ? "테스트 모드"
                    : usePortOne
                      ? "PortOne 본인인증"
                      : "웹용 본인인증"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {useMock
                    ? "테스트용 Mock 인증입니다. 실제 서비스에서는 PortOne 본인인증을 사용합니다."
                    : usePortOne
                      ? "PortOne을 통한 안전한 실명 인증입니다. (월 100건 무료)"
                      : "웹용 본인인증을 통한 실명 확인입니다."}
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
                          현재 Mock 인증을 사용 중입니다. 실제 서비스에서는
                          PortOne 본인인증이 자동으로 연동됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!useMock && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-green-900">
                          무료 본인인증
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          PASS 앱을 통한 실제 통신사 인증입니다. (무료)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PASS 앱 설치 안내 */}
              {showInstallGuide && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {installGuide.title}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {installGuide.message}
                      </p>
                    </div>
                  </div>

                  {installGuide.storeUrl && (
                    <div className="space-y-2">
                      <Button
                        onClick={() =>
                          window.open(installGuide.storeUrl!, "_blank")
                        }
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PASS 앱 설치하기
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowInstallGuide(false)}
                        className="w-full h-8 text-xs border-gray-300"
                      >
                        나중에 하기
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* 인증 안내 */}
              {!useMock && !showInstallGuide && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    PASS 인증 절차
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>PASS 앱 실행</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>본인인증 메뉴 선택</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>생체인증 (지문/얼굴)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>인증 완료</span>
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
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
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
                        {useMock
                          ? "테스트 인증하기"
                          : usePortOne
                            ? "PortOne 인증하기"
                            : "인증하기"}
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

              {/* PASS 안내 */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  <strong>PortOne</strong>은 사업자 등록 없이 가입 가능한
                  본인인증 서비스입니다.
                  <br />월 100건 무료 제공, 웹/모바일 모두 지원합니다.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
