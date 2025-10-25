"use client";

import { useState } from "react";
import { Button } from "../../components/ui/Button";
import {
  getFirebaseAuth,
  getGoogleProvider,
} from "../../lib/api/firebase-ultra-safe";
import toast from "react-hot-toast";

export default function DebugGoogleAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkFirebaseConfig = () => {
    try {
      const auth = getFirebaseAuth();
      const provider = getGoogleProvider();

      const config = {
        auth: auth
          ? {
              app: auth.app.name,
              domain: auth.app.options.authDomain,
              projectId: auth.app.options.projectId,
            }
          : null,
        provider: provider
          ? {
              providerId: provider.providerId,
              scopes: provider.scopes,
              customParameters: provider.customParameters,
            }
          : null,
        environment: {
          isClient: typeof window !== "undefined",
          userAgent:
            typeof window !== "undefined" ? window.navigator.userAgent : "N/A",
          currentUrl:
            typeof window !== "undefined" ? window.location.href : "N/A",
        },
      };

      setDebugInfo(config);
      console.log("🔍 Firebase 설정 정보:", config);
      toast.success("Firebase 설정 정보를 확인했습니다.");
    } catch (error) {
      console.error("❌ Firebase 설정 확인 실패:", error);
      toast.error("Firebase 설정 확인에 실패했습니다.");
    }
  };

  const testButtonClick = () => {
    console.log("🔵 버튼 클릭 테스트 - 함수가 호출됨!");
    toast.success("버튼이 정상적으로 작동합니다!");
  };

  const testGoogleLogin = async () => {
    console.log("🔵 Google 로그인 함수 시작!");
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = getGoogleProvider();

      if (!auth || !provider) {
        throw new Error(
          "Firebase Auth 또는 Google Provider가 초기화되지 않았습니다."
        );
      }

      console.log("🔵 Google 로그인 테스트 시작");
      console.log("Auth domain:", auth.app.options.authDomain);
      console.log("Provider:", provider.providerId);

      // 리디렉트 방식으로 시도 (Cross-Origin-Opener-Policy 경고 해결)
      const { signInWithRedirect, getRedirectResult } = await import(
        "firebase/auth"
      );

      // 먼저 이전 리디렉트 결과가 있는지 확인
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult) {
        console.log(
          "✅ Google 로그인 성공 (리디렉트):",
          redirectResult.user.email
        );
        toast.success("Google 로그인 성공!");

        setDebugInfo(prev => ({
          ...prev,
          loginResult: {
            user: {
              uid: redirectResult.user.uid,
              email: redirectResult.user.email,
              displayName: redirectResult.user.displayName,
              photoURL: redirectResult.user.photoURL,
            },
            providerId: redirectResult.providerId,
          },
        }));
        return;
      }

      // 리디렉트 방식으로 로그인 시작
      await signInWithRedirect(auth, provider);
      return; // 리디렉트되므로 여기서 함수 종료
    } catch (error: any) {
      console.error("❌ Google 로그인 실패:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      toast.error(`Google 로그인 실패: ${error.message}`);

      setDebugInfo(prev => ({
        ...prev,
        loginError: {
          code: error.code,
          message: error.message,
          stack: error.stack,
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Google 인증 디버깅 도구
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">버튼 테스트</h2>
            <Button
              onClick={testButtonClick}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-4"
            >
              버튼 작동 테스트
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Firebase 설정 확인</h2>
            <Button
              onClick={checkFirebaseConfig}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
            >
              Firebase 설정 확인
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Google 로그인 테스트</h2>
            <Button
              onClick={testGoogleLogin}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  테스트 중...
                </div>
              ) : (
                "Google 로그인 테스트"
              )}
            </Button>
          </div>
        </div>

        {debugInfo && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">디버깅 정보</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">
            문제 해결 가이드:
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>
              • Firebase 콘솔에서 Google 프로바이더가 활성화되어 있는지 확인
            </li>
            <li>• Authorized domains에 localhost가 추가되어 있는지 확인</li>
            <li>• 브라우저에서 팝업이 차단되지 않았는지 확인</li>
            <li>• 네트워크 연결 상태 확인</li>
            <li>• 브라우저 개발자 도구의 콘솔에서 오류 메시지 확인</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
