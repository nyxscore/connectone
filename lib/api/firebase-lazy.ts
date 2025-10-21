import { initializeApp, getApps, getApp as firebaseGetApp } from "firebase/app";
import {
  getAuth as firebaseGetAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult as firebaseGetRedirectResult,
  OAuthProvider,
} from "firebase/auth";
import { getFirestore as firebaseGetFirestore } from "firebase/firestore";
import { getStorage as firebaseGetStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "connectone-8b414.firebaseapp.com",
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "connectone-8b414").trim(),
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "connectone-8b414.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "567550026947",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:567550026947:web:92120b0c926db2ece06e76",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-P7KKSEF6SZ",
};

// Firebase 앱 초기화 (완전 지연 초기화)
let app: any = null;

const getApp = () => {
  if (!app) {
    try {
      app =
        getApps().length === 0
          ? initializeApp(firebaseConfig)
          : firebaseGetApp();
      console.log("✅ Firebase 앱 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase 앱 초기화 실패:", error);
      throw new Error("Firebase 초기화에 실패했습니다.");
    }
  }
  return app;
};

// Firebase 서비스들 (완전 지연 초기화)
let auth: any = null;
let db: any = null;
let storage: any = null;

export const getAuth = () => {
  if (!auth) {
    try {
      auth = firebaseGetAuth(getApp());
      console.log("✅ Firebase Auth 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase Auth 초기화 실패:", error);
      throw new Error("Firebase Auth 초기화에 실패했습니다.");
    }
  }
  return auth;
};

export const getDb = () => {
  if (!db) {
    try {
      db = firebaseGetFirestore(getApp());
      console.log("✅ Firebase Firestore 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase Firestore 초기화 실패:", error);
      throw new Error("Firebase Firestore 초기화에 실패했습니다.");
    }
  }
  return db;
};

export const getStorage = () => {
  if (!storage) {
    try {
      storage = firebaseGetStorage(getApp());
      console.log("✅ Firebase Storage 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase Storage 초기화 실패:", error);
      throw new Error("Firebase Storage 초기화에 실패했습니다.");
    }
  }
  return storage;
};

// SNS 로그인 프로바이더들 (완전 지연 초기화)
let googleProvider: any = null;
let kakaoProvider: any = null;
let naverProvider: any = null;

export const getGoogleProvider = () => {
  if (!googleProvider) {
    try {
      googleProvider = new GoogleAuthProvider();
      googleProvider.addScope("email");
      googleProvider.addScope("profile");
      console.log("✅ Google Provider 초기화 성공");
    } catch (error) {
      console.error("❌ Google Provider 초기화 실패:", error);
      throw new Error("Google Provider 초기화에 실패했습니다.");
    }
  }
  return googleProvider;
};

export const getKakaoProvider = () => {
  if (!kakaoProvider) {
    try {
      kakaoProvider = new OAuthProvider("oidc.kakao");
      kakaoProvider.addScope("profile_nickname");
      kakaoProvider.addScope("account_email");
      kakaoProvider.addScope("profile_image");
      kakaoProvider.setCustomParameters({
        client_id:
          process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "your_kakao_client_id",
      });
      console.log("✅ Kakao Provider 초기화 성공");
    } catch (error) {
      console.error("❌ Kakao Provider 초기화 실패:", error);
      throw new Error("Kakao Provider 초기화에 실패했습니다.");
    }
  }
  return kakaoProvider;
};

export const getNaverProvider = () => {
  if (!naverProvider) {
    try {
      naverProvider = new OAuthProvider("oidc.naver");
      naverProvider.addScope("email");
      naverProvider.addScope("name");
      console.log("✅ Naver Provider 초기화 성공");
    } catch (error) {
      console.error("❌ Naver Provider 초기화 실패:", error);
      throw new Error("Naver Provider 초기화에 실패했습니다.");
    }
  }
  return naverProvider;
};

// SNS 로그인 함수들
export const signInWithGoogle = () =>
  signInWithPopup(getAuth(), getGoogleProvider());
export const signInWithKakao = () =>
  signInWithPopup(getAuth(), getKakaoProvider());
export const signInWithNaver = () =>
  signInWithPopup(getAuth(), getNaverProvider());

// 리다이렉트 로그인 (모바일에서 사용)
export const signInWithGoogleRedirect = () =>
  signInWithRedirect(getAuth(), getGoogleProvider());
export const signInWithKakaoRedirect = () =>
  signInWithRedirect(getAuth(), getKakaoProvider());
export const signInWithNaverRedirect = () =>
  signInWithRedirect(getAuth(), getNaverProvider());

// 리다이렉트 결과 가져오기
export const getRedirectResult = firebaseGetRedirectResult;

export default getApp;
