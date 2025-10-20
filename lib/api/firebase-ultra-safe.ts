// Ultra-safe Firebase initialization for deployment
// This version completely prevents any server-side initialization

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult as firebaseGetRedirectResult,
  OAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 환경변수 확인 및 안전장치
const getFirebaseConfig = () => {
  // 서버 사이드에서는 절대 초기화하지 않음
  if (typeof window === "undefined") {
    return null;
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // 필수 환경변수 체크
  if (!config.apiKey || !config.projectId) {
    console.error("❌ Firebase 환경변수가 설정되지 않았습니다!");
    console.error("Vercel Dashboard에서 환경변수를 설정해주세요.");
    return null;
  }

  console.log("🔥 Firebase 환경변수 확인:", {
    apiKey: config.apiKey ? "✅ 설정됨" : "❌ 누락",
    authDomain: config.authDomain ? "✅ 설정됨" : "❌ 누락",
    projectId: config.projectId ? "✅ 설정됨" : "❌ 누락",
    environment: process.env.NODE_ENV || "unknown",
    isClient: true,
  });

  return config;
};

// Firebase 앱 인스턴스 (클라이언트 사이드에서만)
let _app: any = null;
let _auth: any = null;
let _db: any = null;
let _storage: any = null;
let _googleProvider: any = null;
let _kakaoProvider: any = null;
let _naverProvider: any = null;

// Firebase 앱 초기화 (클라이언트 사이드에서만)
export const getFirebaseApp = () => {
  if (typeof window === "undefined") {
    console.log("⚠️ 서버 사이드에서 Firebase 앱 초기화 시도 - 건너뜀");
    return null;
  }

  if (!_app) {
    try {
      const config = getFirebaseConfig();
      if (!config) {
        console.log("⚠️ Firebase 설정이 없음 - 앱 초기화 건너옴");
        return null;
      }

      const apps = getApps();
      if (apps.length === 0) {
        _app = initializeApp(config);
        console.log("✅ Firebase 앱 초기화 성공");
      } else {
        _app = getApp();
        console.log("✅ 기존 Firebase 앱 사용");
      }
    } catch (error) {
      console.error("❌ Firebase 앱 초기화 실패:", error);
      throw new Error("Firebase 앱 초기화에 실패했습니다.");
    }
  }
  return _app;
};

// Firebase Auth 초기화 (클라이언트 사이드에서만)
export const getFirebaseAuth = () => {
  if (typeof window === "undefined") {
    console.log("⚠️ 서버 사이드에서 Firebase Auth 초기화 시도 - 건너뜀");
    return null;
  }

  if (!_auth) {
    try {
      const app = getFirebaseApp();
      if (!app) {
        console.log("⚠️ Firebase 앱이 초기화되지 않음 - Auth 초기화 건너옴");
        return null;
      }

      _auth = getAuth(app);
      console.log("✅ Firebase Auth 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase Auth 초기화 실패:", error);
      throw new Error("Firebase Auth 초기화에 실패했습니다.");
    }
  }
  return _auth;
};

// Firebase Firestore 초기화 (클라이언트 사이드에서만)
export const getFirebaseDb = () => {
  if (typeof window === "undefined") {
    console.log("⚠️ 서버 사이드에서 Firebase DB 초기화 시도 - 건너뜀");
    return null;
  }

  if (!_db) {
    try {
      const app = getFirebaseApp();
      if (!app) {
        console.log("⚠️ Firebase 앱이 초기화되지 않음 - DB 초기화 건너옴");
        return null;
      }

      _db = getFirestore(app);
      console.log("✅ Firebase DB 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase DB 초기화 실패:", error);
      throw new Error("Firebase DB 초기화에 실패했습니다.");
    }
  }
  return _db;
};

// Firebase Storage 초기화 (클라이언트 사이드에서만)
export const getFirebaseStorage = () => {
  if (typeof window === "undefined") {
    console.log("⚠️ 서버 사이드에서 Firebase Storage 초기화 시도 - 건너뜀");
    return null;
  }

  if (!_storage) {
    try {
      const app = getFirebaseApp();
      if (!app) {
        console.log("⚠️ Firebase 앱이 초기화되지 않음 - Storage 초기화 건너옴");
        return null;
      }

      _storage = getStorage(app);
      console.log("✅ Firebase Storage 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase Storage 초기화 실패:", error);
      throw new Error("Firebase Storage 초기화에 실패했습니다.");
    }
  }
  return _storage;
};

// Google Auth Provider (클라이언트 사이드에서만)
export const getGoogleProvider = () => {
  if (typeof window === "undefined") {
    console.log("⚠️ 서버 사이드에서 Google Provider 초기화 시도 - 건너뜀");
    return null;
  }

  if (!_googleProvider) {
    try {
      _googleProvider = new GoogleAuthProvider();
      _googleProvider.addScope("email");
      _googleProvider.addScope("profile");
      console.log("✅ Google Provider 초기화 성공");
    } catch (error) {
      console.error("❌ Google Provider 초기화 실패:", error);
      throw new Error("Google Provider 초기화에 실패했습니다.");
    }
  }
  return _googleProvider;
};

// Kakao Auth Provider (클라이언트 사이드에서만)
export const getKakaoProvider = () => {
  if (typeof window === "undefined") {
    console.log("⚠️ 서버 사이드에서 Kakao Provider 초기화 시도 - 건너뜀");
    return null;
  }

  if (!_kakaoProvider) {
    try {
      _kakaoProvider = new OAuthProvider("oidc.kakao");
      _kakaoProvider.addScope("profile");
      _kakaoProvider.addScope("account_email");
      console.log("✅ Kakao Provider 초기화 성공");
    } catch (error) {
      console.error("❌ Kakao Provider 초기화 실패:", error);
      throw new Error("Kakao Provider 초기화에 실패했습니다.");
    }
  }
  return _kakaoProvider;
};

// Naver Auth Provider (클라이언트 사이드에서만)
export const getNaverProvider = () => {
  if (typeof window === "undefined") {
    console.log("⚠️ 서버 사이드에서 Naver Provider 초기화 시도 - 건너뜀");
    return null;
  }

  if (!_naverProvider) {
    try {
      _naverProvider = new OAuthProvider("oidc.naver");
      _naverProvider.addScope("profile");
      _naverProvider.addScope("email");
      console.log("✅ Naver Provider 초기화 성공");
    } catch (error) {
      console.error("❌ Naver Provider 초기화 실패:", error);
      throw new Error("Naver Provider 초기화에 실패했습니다.");
    }
  }
  return _naverProvider;
};

// SNS 로그인 함수들 (클라이언트 사이드에서만)
export const signInWithGoogle = async () => {
  if (typeof window === "undefined") {
    throw new Error("서버 사이드에서 실행할 수 없습니다.");
  }

  const auth = getFirebaseAuth();
  const provider = getGoogleProvider();

  if (!auth || !provider) {
    throw new Error(
      "Firebase Auth 또는 Google Provider가 초기화되지 않았습니다."
    );
  }

  try {
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Google 로그인 성공:", result.user.email);
    return result;
  } catch (error) {
    console.error("❌ Google 로그인 실패:", error);
    throw error;
  }
};

export const signInWithKakao = async () => {
  if (typeof window === "undefined") {
    throw new Error("서버 사이드에서 실행할 수 없습니다.");
  }

  const auth = getFirebaseAuth();
  const provider = getKakaoProvider();

  if (!auth || !provider) {
    throw new Error(
      "Firebase Auth 또는 Kakao Provider가 초기화되지 않았습니다."
    );
  }

  try {
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Kakao 로그인 성공:", result.user.email);
    return result;
  } catch (error) {
    console.error("❌ Kakao 로그인 실패:", error);
    throw error;
  }
};

export const signInWithNaver = async () => {
  if (typeof window === "undefined") {
    throw new Error("서버 사이드에서 실행할 수 없습니다.");
  }

  const auth = getFirebaseAuth();
  const provider = getNaverProvider();

  if (!auth || !provider) {
    throw new Error(
      "Firebase Auth 또는 Naver Provider가 초기화되지 않았습니다."
    );
  }

  try {
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Naver 로그인 성공:", result.user.email);
    return result;
  } catch (error) {
    console.error("❌ Naver 로그인 실패:", error);
    throw error;
  }
};

// Redirect 방식 로그인 함수들
export const signInWithGoogleRedirect = async () => {
  if (typeof window === "undefined") {
    throw new Error("서버 사이드에서 실행할 수 없습니다.");
  }

  const auth = getFirebaseAuth();
  const provider = getGoogleProvider();

  if (!auth || !provider) {
    throw new Error(
      "Firebase Auth 또는 Google Provider가 초기화되지 않았습니다."
    );
  }

  try {
    console.log("🔄 Google 리다이렉트 로그인 시작...");
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("❌ Google 리다이렉트 로그인 실패:", error);
    throw error;
  }
};

export const signInWithKakaoRedirect = async () => {
  if (typeof window === "undefined") {
    throw new Error("서버 사이드에서 실행할 수 없습니다.");
  }

  const auth = getFirebaseAuth();
  const provider = getKakaoProvider();

  if (!auth || !provider) {
    throw new Error(
      "Firebase Auth 또는 Kakao Provider가 초기화되지 않았습니다."
    );
  }

  try {
    console.log("🔄 Kakao 리다이렉트 로그인 시작...");
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("❌ Kakao 리다이렉트 로그인 실패:", error);
    throw error;
  }
};

export const signInWithNaverRedirect = async () => {
  if (typeof window === "undefined") {
    throw new Error("서버 사이드에서 실행할 수 없습니다.");
  }

  const auth = getFirebaseAuth();
  const provider = getNaverProvider();

  if (!auth || !provider) {
    throw new Error(
      "Firebase Auth 또는 Naver Provider가 초기화되지 않았습니다."
    );
  }

  try {
    console.log("🔄 Naver 리다이렉트 로그인 시작...");
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("❌ Naver 리다이렉트 로그인 실패:", error);
    throw error;
  }
};

export const handleRedirectResult = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    console.log(
      "⚠️ Firebase Auth가 초기화되지 않음 - 리다이렉트 결과 처리 건너옴"
    );
    return null;
  }

  try {
    const result = await firebaseGetRedirectResult(auth);
    if (result) {
      console.log("✅ 리다이렉트 로그인 성공:", result.user.email);
    }
    return result;
  } catch (error) {
    console.error("❌ 리다이렉트 로그인 실패:", error);
    throw error;
  }
};

// getRedirectResult를 firebaseGetRedirectResult로 export
export { firebaseGetRedirectResult };

// 직접 사용할 수 있도록 인스턴스 export
export const auth = getFirebaseAuth();
export const db = getFirebaseDb();
export const storage = getFirebaseStorage();
