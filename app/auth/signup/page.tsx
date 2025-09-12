"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import toast from "react-hot-toast";

import { signUpSchema, type SignUpFormData } from "../../../lib/schemas";
import { signUp } from "../../../lib/auth";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import { KOREAN_REGIONS } from "../../../lib/utils";
import {
  validatePassword,
  getPasswordStrength,
} from "../../../lib/utils/passwordValidation";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUp({
        username: data.username,
        password: data.password,
        nickname: data.nickname,
        region: data.region,
        agreeTerms: data.agreeTerms,
      });

      toast.success("회원가입이 완료되었습니다!");
      router.push("/auth/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "회원가입 중 오류가 발생했습니다."
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
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ConnecTone에 오신 것을 환영합니다
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="아이디"
              type="text"
              autoComplete="username"
              placeholder="4-20자, 소문자, 숫자, 언더스코어(_) 사용 가능"
              error={errors.username?.message}
              helperText="소문자 또는 숫자로 시작해야 합니다"
              {...register("username")}
            />

            <div>
              <Input
                label="비밀번호"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상, 영문+숫자+특수문자 포함"
                error={errors.password?.message}
                onChange={e => setPassword(e.target.value)}
                {...register("password")}
              />
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          getPasswordStrength(password).score === 0
                            ? "bg-red-500 w-0"
                            : getPasswordStrength(password).score === 1
                              ? "bg-red-500 w-1/4"
                              : getPasswordStrength(password).score === 2
                                ? "bg-orange-500 w-2/4"
                                : getPasswordStrength(password).score === 3
                                  ? "bg-yellow-500 w-3/4"
                                  : getPasswordStrength(password).score === 4
                                    ? "bg-blue-500 w-full"
                                    : "bg-green-500 w-full"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${getPasswordStrength(password).color}`}
                    >
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="비밀번호 확인"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력해주세요"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Input
              label="닉네임"
              type="text"
              autoComplete="nickname"
              placeholder="닉네임을 입력해주세요"
              error={errors.nickname?.message}
              helperText="한글, 영문, 숫자만 사용 가능합니다"
              {...register("nickname")}
            />

            <Select
              label="지역"
              placeholder="지역을 선택해주세요"
              options={KOREAN_REGIONS}
              error={errors.region?.message}
              {...register("region")}
            />

            <Checkbox
              label="서비스 이용약관 및 개인정보처리방침에 동의합니다"
              error={errors.agreeTerms?.message}
              {...register("agreeTerms")}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              회원가입
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                로그인하기
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
