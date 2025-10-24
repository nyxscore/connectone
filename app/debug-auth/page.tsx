"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [providers, setProviders] = useState<any>(null);
  const [envCheck, setEnvCheck] = useState<any>({});

  useEffect(() => {
    // NextAuth 프로바이더 정보 가져오기
    fetch("/api/auth/providers")
      .then(res => res.json())
      .then(data => setProviders(data))
      .catch(err => console.error("프로바이더 정보 가져오기 실패:", err));

    // 환경 변수 체크 (클라이언트에서는 직접 접근 불가하지만 API로 확인)
    fetch("/api/debug/env")
      .then(res => res.json())
      .then(data => setEnvCheck(data))
      .catch(err => console.error("환경 변수 체크 실패:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">NextAuth 디버그 정보</h1>
        
        {/* 세션 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">세션 정보</h2>
          <div className="space-y-2">
            <p><strong>상태:</strong> {status}</p>
            <p><strong>사용자:</strong> {session?.user?.email || "로그인되지 않음"}</p>
            <p><strong>이름:</strong> {session?.user?.name || "없음"}</p>
            <p><strong>ID:</strong> {session?.user?.id || "없음"}</p>
          </div>
          <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        {/* 프로바이더 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">프로바이더 정보</h2>
          {providers ? (
            <div>
              <p><strong>사용 가능한 프로바이더:</strong></p>
              <ul className="list-disc list-inside mt-2">
                {Object.keys(providers).map(provider => (
                  <li key={provider}>{provider}</li>
                ))}
              </ul>
              <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(providers, null, 2)}
              </pre>
            </div>
          ) : (
            <p>프로바이더 정보를 불러오는 중...</p>
          )}
        </div>

        {/* 환경 변수 체크 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">환경 변수 체크</h2>
          <div className="space-y-2">
            <p><strong>NEXTAUTH_URL:</strong> {envCheck.NEXTAUTH_URL ? "✅ 설정됨" : "❌ 없음"}</p>
            <p><strong>GOOGLE_CLIENT_ID:</strong> {envCheck.GOOGLE_CLIENT_ID ? "✅ 설정됨" : "❌ 없음"}</p>
            <p><strong>GOOGLE_CLIENT_SECRET:</strong> {envCheck.GOOGLE_CLIENT_SECRET ? "✅ 설정됨" : "❌ 없음"}</p>
            <p><strong>NAVER_CLIENT_ID:</strong> {envCheck.NAVER_CLIENT_ID ? "✅ 설정됨" : "❌ 없음"}</p>
            <p><strong>NAVER_CLIENT_SECRET:</strong> {envCheck.NAVER_CLIENT_SECRET ? "✅ 설정됨" : "❌ 없음"}</p>
          </div>
        </div>

        {/* 테스트 버튼들 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">테스트</h2>
          <div className="space-x-4">
            <a 
              href="/auth/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              로그인 페이지로 이동
            </a>
            <a 
              href="/api/auth/signin" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              NextAuth 로그인 페이지
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
