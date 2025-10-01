"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { Music, User, Lock } from "lucide-react";

import { loginSchema, type LoginFormData } from "../../../lib/schemas";
import { signIn } from "../../../lib/auth";
import { Button } from "../../../components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data);
      toast.success("로그인되었습니다!");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* 배경 포인트 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 음표 포인트 */}
        <div
          className="absolute top-20 left-10 text-2xl text-purple-400/20 animate-bounce"
          style={{ animationDelay: "0s" }}
        >
          ♪
        </div>
        <div
          className="absolute top-32 right-16 text-xl text-blue-400/20 animate-bounce"
          style={{ animationDelay: "2s" }}
        >
          ♫
        </div>
        <div
          className="absolute top-48 left-20 text-lg text-pink-400/20 animate-bounce"
          style={{ animationDelay: "4s" }}
        >
          ♪
        </div>
        <div
          className="absolute top-64 right-24 text-2xl text-indigo-400/20 animate-bounce"
          style={{ animationDelay: "6s" }}
        >
          ♫
        </div>

        {/* 부드러운 그라데이션 포인트 */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* 로고 섹션 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 shadow-lg">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ConnecTone
            </h1>
            <p className="text-gray-600">음악을 사랑하는 사람들을 위한</p>
          </div>

          {/* 로그인 카드 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인</h2>
              <p className="text-gray-600">
                ConnecTone에 다시 오신 것을 환영합니다
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                {/* 아이디 입력 */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="아이디를 입력해주세요"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    {...register("username")}
                  />
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* 비밀번호 입력 */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="비밀번호를 입력해주세요"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 비밀번호 찾기 */}
              <div className="text-right">
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-purple-600 hover:text-purple-500 transition-colors duration-300"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>

              {/* 회원가입 링크 */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  계정이 없으신가요?{" "}
                  <Link
                    href="/auth/signup"
                    className="font-semibold text-purple-600 hover:text-purple-500 transition-colors duration-300"
                  >
                    회원가입하기
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
