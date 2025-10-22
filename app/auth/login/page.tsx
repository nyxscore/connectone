"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  loginSchema,
  signUpSchema,
  type LoginFormData,
  type SignUpFormData,
} from "../../../lib/schemas";
import { signIn, signUp, checkUsernameAvailability } from "../../../lib/auth";
import {
  loginWithGoogle,
  loginWithKakao,
  loginWithNaver,
} from "../../../lib/auth/snsAuth";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import { KOREAN_REGIONS } from "../../../lib/utils";
import {
  validatePassword,
  getPasswordStrength,
} from "../../../lib/utils/passwordValidation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signUpError, setSignUpError] = useState("");
  // SNS 로그인은 심사 후 사용
  const [snsLoading, setSnsLoading] = useState<
    "google" | "kakao" | "naver" | null
  >(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const password = signUpForm.watch("password", "");
  const username = signUpForm.watch("username", "");

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

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(""); // 오류 메시지 초기화
    try {
      await signIn(data);
      router.push("/");
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpSubmit = async (data: SignUpFormData) => {
    // 아이디 중복확인 체크
    if (!usernameChecked || !usernameAvailable) {
      toast.error("아이디 중복확인을 완료해주세요.");
      return;
    }
    setIsLoading(true);
    setSignUpError(""); // 오류 메시지 초기화
    try {
      await signUp({
        username: data.username,
        password: data.password,
        nickname: data.nickname,
        region: data.region,
        agreeTerms: data.agreeTerms,
      });

      toast.success("회원가입이 완료되었습니다!");
      setIsSignUp(false);
      // 폼 초기화
      signUpForm.reset();
      setUsernameChecked(false);
      setUsernameAvailable(null);
    } catch (error) {
      setSignUpError(
        error instanceof Error
          ? error.message
          : "회원가입 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // SNS 로그인 핸들러
  const handleSNSLogin = async (provider: "google" | "kakao" | "naver") => {
    setSnsLoading(provider);
    try {
      let result;
      switch (provider) {
        case "google":
          result = await loginWithGoogle();
          break;
        case "kakao":
          result = await loginWithKakao();
          break;
        case "naver":
          result = await loginWithNaver();
          break;
      }

      router.push("/");
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : `${provider === "google" ? "구글" : provider === "kakao" ? "카카오" : "네이버"} 로그인 중 오류가 발생했습니다.`
      );
    } finally {
      setSnsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 모바일 스타일 헤더 */}
      <div className="bg-gray-800 text-white px-4 py-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 p-1 hover:bg-gray-700 rounded"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-lg font-medium">
          {isSignUp ? "회원가입" : "로그인"}
        </h1>
      </div>

      {/* 로그인/회원가입 폼 */}
      <div className="px-4 py-8">
        <div className="max-w-sm mx-auto">
          {/* 로그인 폼 */}
          {!isSignUp ? (
            <form
              className="space-y-6"
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            >
              {/* 아이디 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아이디
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="아이디를 입력해주세요"
                  className="w-full px-3 py-3 border-b border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  {...loginForm.register("username")}
                />
                {loginForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-500">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력해주세요"
                  className="w-full px-3 py-3 border-b border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* 자동 로그인 체크박스 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoLogin"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="autoLogin"
                  className="ml-2 text-sm text-gray-700"
                >
                  자동 로그인
                </label>
              </div>

              {/* 로그인 오류 메시지 */}
              {loginError && (
                <div className="text-red-600 text-sm text-center py-2">
                  {loginError}
                </div>
              )}

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          ) : (
            /* 회원가입 폼 */
            <form
              className="space-y-6"
              onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
            >
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
                      className={`w-full px-3 py-3 border-b border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
                        signUpForm.formState.errors.username
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${
                        usernameChecked && usernameAvailable
                          ? "border-green-500"
                          : ""
                      } ${
                        usernameChecked && !usernameAvailable
                          ? "border-red-500"
                          : ""
                      }`}
                      {...signUpForm.register("username")}
                      onChange={e => {
                        signUpForm.register("username").onChange(e);
                        setUsernameChecked(false);
                        setUsernameAvailable(null);
                      }}
                      onKeyDown={e => {
                        if (
                          e.key === "Process" ||
                          /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(e.key)
                        ) {
                          e.preventDefault();
                          setUsernameError(
                            "아이디는 영어와 숫자만 사용할 수 있습니다."
                          );
                          setTimeout(() => setUsernameError(""), 3000);
                        }
                      }}
                      onInput={e => {
                        const target = e.target as HTMLInputElement;
                        const value = target.value.replace(/[^a-zA-Z0-9]/g, "");
                        if (target.value !== value) {
                          target.value = value;
                          signUpForm.register("username").onChange({ target });
                          setUsernameError(
                            "아이디는 영어와 숫자만 사용할 수 있습니다."
                          );
                          setTimeout(() => setUsernameError(""), 3000);
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
                    className="px-4 py-3 whitespace-nowrap"
                  >
                    {isCheckingUsername ? "확인중..." : "중복확인"}
                  </Button>
                </div>
                {signUpForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {signUpForm.formState.errors.username.message}
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
                    className={`w-full px-3 py-3 pr-10 border-b border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
                      signUpForm.formState.errors.password
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...signUpForm.register("password")}
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
                {signUpForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {signUpForm.formState.errors.password.message}
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
                    className={`w-full px-3 py-3 pr-10 border-b border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
                      signUpForm.formState.errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...signUpForm.register("confirmPassword")}
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
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {signUpForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Input
                label="닉네임"
                type="text"
                autoComplete="nickname"
                placeholder="닉네임을 입력해주세요"
                error={signUpForm.formState.errors.nickname?.message}
                helperText="한글, 영문, 숫자만 사용 가능합니다"
                {...signUpForm.register("nickname")}
              />

              <Select
                label="지역"
                placeholder="지역을 선택해주세요"
                options={KOREAN_REGIONS}
                error={signUpForm.formState.errors.region?.message}
                {...signUpForm.register("region")}
              />

              <Checkbox
                label="서비스 이용약관 및 개인정보처리방침에 동의합니다"
                error={signUpForm.formState.errors.agreeTerms?.message}
                {...signUpForm.register("agreeTerms")}
              />

              {/* 회원가입 오류 메시지 */}
              {signUpError && (
                <div className="text-red-600 text-sm text-center py-2">
                  {signUpError}
                </div>
              )}

              {/* 회원가입 버튼 */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "회원가입 중..." : "회원가입"}
              </Button>
            </form>
          )}

          {/* SNS 로그인 섹션 - CSP 문제로 임시 비활성화 */}
          {/* <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-center text-sm text-gray-500">
                SNS 로그인은 현재 점검 중입니다.
                <br />
                이메일/비밀번호로 로그인해주세요.
              </div>
            </div>
          </div> */}

          {/* 하단 링크들 */}
          <div className="mt-8 space-y-4">
            {/* 로그인/회원가입 링크 */}
            <div className="text-center">
              {isSignUp ? (
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    // 폼 초기화
                    loginForm.reset();
                  }}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  로그인하기
                </button>
              ) : (
                <Link
                  href="/auth/signup"
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  회원가입하기
                </Link>
              )}
            </div>

            {/* 기타 링크들 */}
            <div className="flex justify-center space-x-4 text-sm text-gray-600">
              <Link href="/auth/find-email" className="hover:text-blue-600">
                아이디 찾기
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/auth/reset-password" className="hover:text-blue-600">
                비밀번호 찾기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
