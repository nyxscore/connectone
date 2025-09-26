"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import toast from "react-hot-toast";

import { signUpSchema, type SignUpFormData } from "../../../lib/schemas";
import { signUp, checkUsernameAvailability } from "../../../lib/auth";
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
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch("password", "");
  const username = watch("username", "");

  const handleCheckUsername = async () => {
    if (!username || username.length < 4) {
      toast.error("아이디를 4자 이상 입력해주세요.");
      return;
    }

    setIsCheckingUsername(true);
    try {
      const isAvailable = await checkUsernameAvailability(username);
      setUsernameAvailable(isAvailable);
      setUsernameChecked(true);

      if (isAvailable) {
        toast.success("사용 가능한 아이디입니다!");
      } else {
        toast.error("이미 사용 중인 아이디입니다.");
      }
    } catch (error) {
      toast.error("아이디 중복확인 중 오류가 발생했습니다.");
      setUsernameAvailable(null);
      setUsernameChecked(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    // 아이디 중복확인 체크
    if (!usernameChecked || !usernameAvailable) {
      toast.error("아이디 중복확인을 완료해주세요.");
      return;
    }
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
            {/* 아이디 입력 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="4-20자, 영어와 숫자만 사용 가능"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    } ${
                      usernameChecked && usernameAvailable
                        ? "border-green-500"
                        : ""
                    } ${
                      usernameChecked && !usernameAvailable
                        ? "border-red-500"
                        : ""
                    }`}
                    {...register("username")}
                    onChange={e => {
                      register("username").onChange(e);
                      // 아이디가 변경되면 중복확인 상태 초기화
                      setUsernameChecked(false);
                      setUsernameAvailable(null);
                    }}
                    onKeyDown={e => {
                      // 한글 입력 방지
                      if (
                        e.key === "Process" ||
                        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(e.key)
                      ) {
                        e.preventDefault();
                        setUsernameError(
                          "아이디는 영어와 숫자만 사용할 수 있습니다."
                        );
                        setTimeout(() => setUsernameError(""), 3000); // 3초 후 자동 제거
                      }
                    }}
                    onInput={e => {
                      // 한글이 입력되면 제거
                      const target = e.target as HTMLInputElement;
                      const value = target.value.replace(/[^a-zA-Z0-9]/g, "");
                      if (target.value !== value) {
                        target.value = value;
                        register("username").onChange({ target });
                        setUsernameError(
                          "아이디는 영어와 숫자만 사용할 수 있습니다."
                        );
                        setTimeout(() => setUsernameError(""), 3000); // 3초 후 자동 제거
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckUsername}
                  loading={isCheckingUsername}
                  disabled={
                    !username || username.length < 4 || isCheckingUsername
                  }
                  className="px-4 py-2 whitespace-nowrap"
                >
                  {isCheckingUsername ? "확인중..." : "중복확인"}
                </Button>
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
              {usernameError && (
                <p className="mt-1 text-sm text-red-600">{usernameError}</p>
              )}
              {usernameChecked && usernameAvailable && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ 사용 가능한 아이디입니다
                </p>
              )}
              {usernameChecked && !usernameAvailable && (
                <p className="mt-1 text-sm text-red-600">
                  ✗ 이미 사용 중인 아이디입니다
                </p>
              )}
              {!usernameChecked && !usernameError && (
                <p className="mt-1 text-sm text-gray-500">
                  영어(대소문자)와 숫자만 사용할 수 있습니다
                </p>
              )}
            </div>

            {/* 비밀번호 입력 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="8자 이상, 영문+숫자+특수문자 포함"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
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

            {/* 비밀번호 확인 입력 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력해주세요"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

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
