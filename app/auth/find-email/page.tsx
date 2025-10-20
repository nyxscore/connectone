"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  Search,
  Mail,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function FindEmailPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foundEmails, setFoundEmails] = useState<string[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const router = useRouter();

  const handleFindEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      toast.error("휴대폰 번호를 입력해주세요.");
      return;
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phoneNumber.replace(/-/g, ""))) {
      toast.error("올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)");
      return;
    }

    setIsLoading(true);
    try {
      // 실제로는 서버에서 휴대폰 번호로 등록된 이메일을 찾아야 하지만,
      // 현재는 Firebase Admin SDK가 없으므로 임시로 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 임시 결과 (실제로는 서버에서 조회)
      const mockEmails = ["user123@gmail.com", "musiclover@naver.com"];

      setFoundEmails(mockEmails);
      setIsSearched(true);

      if (mockEmails.length > 0) {
        toast.success(`${mockEmails.length}개의 계정을 찾았습니다.`);
      } else {
        toast.error("해당 휴대폰 번호로 가입된 계정을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("이메일 찾기 오류:", error);
      toast.error("이메일 찾기에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSearched) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              계정을 찾았습니다
            </h1>

            <p className="text-gray-600 mb-6">
              <strong>{phoneNumber}</strong>로 가입된 계정입니다:
            </p>

            <div className="space-y-3 mb-6">
              {foundEmails.map((email, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {email}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setPhoneNumber("");
                  setFoundEmails([]);
                  setIsSearched(false);
                }}
                variant="outline"
                className="w-full"
              >
                다른 번호로 검색
              </Button>

              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                로그인하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <Search className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">아이디 찾기</h1>

          <p className="text-gray-600">
            가입 시 등록한 휴대폰 번호를 입력해주세요.
            <br />
            해당 번호로 가입된 계정을 찾아드립니다.
          </p>
        </div>

        <form onSubmit={handleFindEmail} className="space-y-6">
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              휴대폰 번호
            </label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={e => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                const formatted = value.replace(
                  /(\d{3})(\d{3,4})(\d{4})/,
                  "$1-$2-$3"
                );
                setPhoneNumber(formatted);
              }}
              placeholder="010-1234-5678"
              required
              className="h-12"
              maxLength={13}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                검색 중...
              </>
            ) : (
              "아이디 찾기"
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

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">참고사항:</p>
              <ul className="space-y-1 text-green-700">
                <li>• 가입 시 등록한 휴대폰 번호를 정확히 입력해주세요</li>
                <li>• 휴대폰 번호로 가입된 모든 계정을 보여드립니다</li>
                <li>• 계정을 찾을 수 없는 경우 회원가입을 진행해주세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


