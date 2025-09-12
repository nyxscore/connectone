"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Music, Mail, CheckCircle } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 mb-6"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">ConnecTone</span>
          </Link>
        </div>

        {/* Verification Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              이메일 인증이 필요합니다
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              회원가입이 완료되었습니다. 이메일로 전송된 인증 링크를 클릭하여
              계정을 활성화해주세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">인증 이메일을 확인해주세요</p>
                  <p className="mt-1">
                    스팸 폴더도 확인해보시기 바랍니다. 이메일이 도착하지
                    않았다면 다시 전송할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button className="w-full">인증 이메일 다시 전송</Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  로그인 페이지로 돌아가기
                </Link>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                이메일을 받지 못하셨나요?
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 이메일 주소가 정확한지 확인해주세요</li>
                <li>• 스팸 폴더를 확인해주세요</li>
                <li>• 이메일 서비스 제공업체의 필터링 설정을 확인해주세요</li>
                <li>• 몇 분 후에도 이메일이 오지 않으면 다시 시도해주세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

