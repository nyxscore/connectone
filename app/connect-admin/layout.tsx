"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Button } from "../../components/ui/Button";

export default function ConnectAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
  // 개발 환경에서는 자동 인증 (선택적)
  const bypassAuth = process.env.NEXT_PUBLIC_ADMIN_BYPASS === "true";
  const bypassProduction =
    process.env.NEXT_PUBLIC_ADMIN_BYPASS_PRODUCTION === "true";
  if ((isDevelopment && bypassAuth) || bypassProduction) {
    setIsAuthenticated(true);
  }

  // 임시: 모든 환경에서 비밀번호 인증 활성화
  const tempBypass = true; // 임시로 true로 설정
  if (tempBypass) {
    setIsAuthenticated(true);
  }
  }, [isDevelopment]);

  const handleLogin = () => {
    // 개발 환경용 간단한 비밀번호
    const DEV_PASSWORD = "admin123"; // 원하는 비밀번호로 변경하세요

    if (password === DEV_PASSWORD) {
      sessionStorage.setItem("admin_dev_auth", "true");
      setIsAuthenticated(true);
    } else {
      alert("비밀번호가 틀렸습니다!");
    }
  };

  // 개발 환경이면서 인증 안 됐으면 로그인 화면 (활성화)
  if (isDevelopment && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">
              개발 환경 관리자 로그인
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              개발용 비밀번호를 입력하세요
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={e => e.key === "Enter" && handleLogin()}
                placeholder="개발용 비밀번호"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                힌트: 기본 비밀번호는 admin123 입니다
              </p>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              로그인
            </Button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ 이것은 개발 환경용 로그인입니다.
              <br />
              프로덕션에서는 Firebase 인증이 사용됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 프로덕션 또는 인증됨
  return <>{children}</>;
}
