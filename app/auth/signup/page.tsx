"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import toast from "react-hot-toast";

import { signUpSchema, type SignUpFormData } from "../../../lib/schemas";
import { signUp, checkUsernameAvailability } from "../../../lib/auth";
import { authActions } from "../../../lib/auth/actions";
import {
  loginWithGoogle,
  loginWithKakao,
  loginWithNaver,
} from "../../../lib/auth/snsAuth";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import { TermsModal } from "../../../components/auth/TermsModal";
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
  const [snsLoading, setSnsLoading] = useState<
    "google" | "kakao" | "naver" | null
  >(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalType, setTermsModalType] = useState<"service" | "privacy">(
    "service"
  );

  // 휴대폰 인증 임시 비활성화
  // const [phoneNumber, setPhoneNumber] = useState("");
  // const [verificationCode, setVerificationCode] = useState("");
  // const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  // const [isSendingCode, setIsSendingCode] = useState(false);
  // const [isVerifyingCode, setIsVerifyingCode] = useState(false);

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

  // 휴대폰 인증 임시 비활성화
  /*
  const handleSendVerificationCode = async () => {
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

    setIsSendingCode(true);
    try {
      const result = await authActions.verifyPhone(phoneNumber);
      if (result.success) {
        toast.success("인증 코드가 발송되었습니다!");
      } else {
        toast.error(result.error || "인증 코드 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("인증 코드 발송 오류:", error);
      toast.error("인증 코드 발송 중 오류가 발생했습니다.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error("인증 코드를 입력해주세요.");
      return;
    }

    setIsVerifyingCode(true);
    try {
      const result = await authActions.confirmPhoneVerification(
        phoneNumber,
        verificationCode
      );
      if (result.success) {
        setIsPhoneVerified(true);
        toast.success("휴대폰 인증이 완료되었습니다!");
      } else {
        toast.error(result.error || "인증 코드가 올바르지 않습니다.");
      }
    } catch (error) {
      console.error("인증 코드 확인 오류:", error);
      toast.error("인증 코드 확인 중 오류가 발생했습니다.");
    } finally {
      setIsVerifyingCode(false);
    }
  };
  */

  const onSubmit = async (data: SignUpFormData) => {
    // 아이디 중복확인 체크
    if (!usernameChecked || !usernameAvailable) {
      toast.error("아이디 중복확인을 완료해주세요.");
      return;
    }
    setIsLoading(true);

    // 휴대폰 인증 임시 비활성화
    /*
    // 휴대폰 번호 필수 입력 확인
    if (!phoneNumber) {
      toast.error("휴대폰 번호를 입력해주세요.");
      return;
    }

    // 휴대폰 인증 확인 (필수)
    if (!isPhoneVerified) {
      toast.error("휴대폰 인증을 완료해주세요.");
      return;
    }
    */

    try {
      await signUp({
        username: data.username,
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        region: data.region,
        agreeTerms: data.agreeTerms,
        // phoneNumber: phoneNumber,  // 휴대폰 인증 임시 비활성화
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

      toast.success(
        `${provider === "google" ? "구글" : provider === "kakao" ? "카카오" : "네이버"}로 회원가입이 완료되었습니다!`
      );
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `${provider === "google" ? "구글" : provider === "kakao" ? "카카오" : "네이버"} 회원가입 중 오류가 발생했습니다.`
      );
    } finally {
      setSnsLoading(null);
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
                아이디 <span className="text-red-500">*</span>
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
                비밀번호 <span className="text-red-500">*</span>
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
                비밀번호 확인 <span className="text-red-500">*</span>
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
              label="이메일 *"
              type="email"
              autoComplete="email"
              placeholder="이메일을 입력해주세요"
              error={errors.email?.message}
              helperText="비밀번호 찾기 시 사용됩니다"
              {...register("email")}
            />

            <Input
              label="닉네임 *"
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

            {/* 휴대폰 인증 임시 비활성화 */}
            {/*
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  휴대폰 번호 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <Input
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
                    className="flex-1 h-12"
                    maxLength={13}
                  />
                  <Button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isSendingCode || !phoneNumber}
                    className="px-5 h-12 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium whitespace-nowrap"
                  >
                    {isSendingCode ? "발송중..." : "인증번호"}
                  </Button>
                </div>
              </div>

              {phoneNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    인증번호
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value)}
                      placeholder="6자리 인증번호"
                      className="flex-1 h-12"
                      maxLength={6}
                      disabled={isPhoneVerified}
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={
                        isVerifyingCode || !verificationCode || isPhoneVerified
                      }
                      className="px-4 h-12 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                    >
                      {isPhoneVerified
                        ? "✓ 완료"
                        : isVerifyingCode
                          ? "확인중..."
                          : "확인"}
                    </Button>
                  </div>
                  {isPhoneVerified && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ 휴대폰 인증이 완료되었습니다
                    </p>
                  )}
                </div>
              )}
            </div>
            */}

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  {...register("agreeTerms")}
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  <span
                    onClick={() => {
                      setTermsModalType("service");
                      setShowTermsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    서비스 이용약관
                  </span>
                  및
                  <span
                    onClick={() => {
                      setTermsModalType("privacy");
                      setShowTermsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer ml-1"
                  >
                    개인정보처리방침
                  </span>
                  에 동의합니다
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="text-sm text-red-600">
                  {errors.agreeTerms.message}
                </p>
              )}
            </div>
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

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">또는</span>
            </div>
          </div>

          {/* SNS 로그인 버튼들 */}
          <div className="space-y-3">
            {/* 구글 로그인 */}
            <Button
              type="button"
              onClick={() => handleSNSLogin("google")}
              disabled={snsLoading !== null}
              className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-3"
            >
              {snsLoading === "google" ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>구글로 계속하기</span>
            </Button>

            {/* 카카오 로그인 */}
            <Button
              type="button"
              onClick={() => handleSNSLogin("kakao")}
              disabled={snsLoading !== null}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3"
            >
              {snsLoading === "kakao" ? (
                <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.8 5.1 4.5 6.4L5.4 19.2c-.1.2-.1.4 0 .6.1.2.3.3.5.3.1 0 .2 0 .3-.1L9.6 17.1c.8.1 1.6.2 2.4.2 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"
                  />
                </svg>
              )}
              <span>카카오로 계속하기</span>
            </Button>

            {/* 네이버 로그인 */}
            <Button
              type="button"
              onClick={() => handleSNSLogin("naver")}
              disabled={snsLoading !== null}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3"
            >
              {snsLoading === "naver" ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"
                  />
                </svg>
              )}
              <span>네이버로 계속하기</span>
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

      {/* 약관 모달 */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        type={termsModalType}
      />

      {/* reCAPTCHA 컨테이너 */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
