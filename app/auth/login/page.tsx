"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import toast from "react-hot-toast";

import { loginSchema, type LoginFormData } from "../../../lib/schemas";
import { signIn } from "../../../lib/auth";
import { Input } from "../../../components/ui/Input";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ConnecTone에 다시 오신 것을 환영합니다
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="아이디"
              type="text"
              autoComplete="username"
              placeholder="아이디를 입력해주세요"
              error={errors.username?.message}
              {...register("username")}
            />

            <Input
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력해주세요"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/auth/reset-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              로그인
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                회원가입하기
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
