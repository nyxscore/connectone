"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { loginWithGoogle, loginWithNaver } from "../../../lib/auth/snsAuth";
import toast from "react-hot-toast";

export default function TestSocialLoginPage() {
  const [loading, setLoading] = useState<"google" | "naver" | null>(null);

  const handleGoogleLogin = async () => {
    setLoading("google");
    try {
      console.log("🔵 Google 로그인 테스트 시작");
      const result = await loginWithGoogle();
      console.log("✅ Google 로그인 성공:", result);
      toast.success("Google 로그인 성공!");
    } catch (error: any) {
      console.error("❌ Google 로그인 실패:", error);
      toast.error(`Google 로그인 실패: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleNaverLogin = async () => {
    setLoading("naver");
    try {
      console.log("🔵 Naver 로그인 테스트 시작");
      const result = await loginWithNaver();
      console.log("✅ Naver 로그인 성공:", result);
      toast.success("Naver 로그인 성공!");
    } catch (error: any) {
      console.error("❌ Naver 로그인 실패:", error);
      toast.error(`Naver 로그인 실패: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-8">
          소셜 로그인 테스트
        </h1>
        
        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading === "google"}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading === "google" ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Google 로그인 중...
              </div>
            ) : (
              "Google 로그인 테스트"
            )}
          </Button>

          <Button
            onClick={handleNaverLogin}
            disabled={loading === "naver"}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading === "naver" ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Naver 로그인 중...
              </div>
            ) : (
              "Naver 로그인 테스트"
            )}
          </Button>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">디버깅 정보:</h3>
          <p className="text-sm text-gray-600">
            브라우저 개발자 도구의 콘솔을 확인하세요.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Firebase 콘솔에서 소셜 로그인 프로바이더가 활성화되어 있는지 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}


