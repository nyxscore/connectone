"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../lib/api/firebase-ultra-safe";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast.success("비밀번호 재설정 이메일을 발송했습니다!");
    } catch (error: any) {
      console.error("비밀번호 재설정 오류:", error);

      if (error.code === "auth/user-not-found") {
        toast.error("등록되지 않은 이메일입니다.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("올바른 이메일 형식이 아닙니다.");
      } else {
        toast.error("비밀번호 재설정 이메일 발송에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              이메일을 확인해주세요
            </h1>

            <p className="text-gray-600 mb-6 leading-relaxed">
              <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
              <br />
              이메일을 확인하고 링크를 클릭하여 새 비밀번호를 설정해주세요.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setEmail("");
                  setIsSent(false);
                }}
                variant="outline"
                className="w-full"
              >
                다른 이메일로 재시도
              </Button>

              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                로그인으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            비밀번호 찾기
          </h1>

          <p className="text-gray-600">
            가입하신 이메일 주소를 입력해주세요.
            <br />
            비밀번호 재설정 링크를 발송해드립니다.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              이메일 주소
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일을 입력해주세요"
              required
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                발송 중...
              </>
            ) : (
              "비밀번호 재설정 이메일 발송"
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <button
              onClick={() => router.push("/auth/login")}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              로그인으로 돌아가기
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">참고사항:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• 이메일이 오지 않으면 스팸함을 확인해주세요</li>
                <li>• 링크는 24시간 후에 만료됩니다</li>
                <li>• 여러 번 요청하시면 최신 이메일만 유효합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
