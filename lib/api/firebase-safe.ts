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

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "connectone-8b414.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "connectone-8b414",
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

// Firebase 앱 초기화 (지연 초기화)
let _app: any = null;
let _auth: any = null;
let _db: any = null;
let _storage: any = null;

export const getFirebaseApp = () => {
  if (!_app) {
    try {
      _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      console.log("✅ Firebase 앱 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase 앱 초기화 실패:", error);
      throw new Error("Firebase 초기화에 실패했습니다.");
    }
  }
  return _app;
};

export const getFirebaseAuth = () => {
  if (!_auth) {
    try {
      _auth = getAuth(getFirebaseApp());
      console.log("✅ Firebase Auth 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase Auth 초기화 실패:", error);
      throw new Error("Firebase Auth 초기화에 실패했습니다.");
    }
  }
  return _auth;
};

export const getFirebaseDb = () => {
  if (!_db) {
    try {
      _db = getFirestore(getFirebaseApp());
      console.log("✅ Firebase Firestore 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase Firestore 초기화 실패:", error);
      throw new Error("Firebase Firestore 초기화에 실패했습니다.");
    }
  }
  return _db;
};

export const getFirebaseStorage = () => {
  if (!_storage) {
    try {
      _storage = getStorage(getFirebaseApp());
      console.log("✅ Firebase Storage 초기화 성공");
    } catch (error) {
      console.error("❌ Firebase Storage 초기화 실패:", error);
      throw new Error("Firebase Storage 초기화에 실패했습니다.");
    }
  }
  return _storage;
};

// SNS 로그인 프로바이더들 (지연 초기화)
let _googleProvider: any = null;
let _kakaoProvider: any = null;
let _naverProvider: any = null;

export const getGoogleProvider = () => {
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

export const getKakaoProvider = () => {
  if (!_kakaoProvider) {
    try {
      _kakaoProvider = new OAuthProvider("oidc.kakao");
      _kakaoProvider.addScope("profile_nickname");
      _kakaoProvider.addScope("account_email");
      _kakaoProvider.addScope("profile_image");
      _kakaoProvider.setCustomParameters({
        client_id:
          process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "your_kakao_client_id",
      });
      console.log("✅ Kakao Provider 초기화 성공");
    } catch (error) {
      console.error("❌ Kakao Provider 초기화 실패:", error);
      throw new Error("Kakao Provider 초기화에 실패했습니다.");
    }
  }
  return _kakaoProvider;
};

export const getNaverProvider = () => {
  if (!_naverProvider) {
    try {
      _naverProvider = new OAuthProvider("oidc.naver");
      _naverProvider.addScope("email");
      _naverProvider.addScope("name");
      console.log("✅ Naver Provider 초기화 성공");
    } catch (error) {
      console.error("❌ Naver Provider 초기화 실패:", error);
      throw new Error("Naver Provider 초기화에 실패했습니다.");
    }
  }
  return _naverProvider;
};

// SNS 로그인 함수들
export const signInWithGoogle = () =>
  signInWithPopup(getFirebaseAuth(), getGoogleProvider());
export const signInWithKakao = () =>
  signInWithPopup(getFirebaseAuth(), getKakaoProvider());
export const signInWithNaver = () =>
  signInWithPopup(getFirebaseAuth(), getNaverProvider());

// 리다이렉트 로그인 (모바일에서 사용)
export const signInWithGoogleRedirect = () =>
  signInWithRedirect(getFirebaseAuth(), getGoogleProvider());
export const signInWithKakaoRedirect = () =>
  signInWithRedirect(getFirebaseAuth(), getKakaoProvider());
export const signInWithNaverRedirect = () =>
  signInWithRedirect(getFirebaseAuth(), getNaverProvider());

// 리다이렉트 결과 가져오기
export const getRedirectResult = firebaseGetRedirectResult;

// 호환성을 위한 직접 export (지연 초기화)
// SSR 환경에서 안전하게 작동하도록 함수 형태로 제공
export {
  getFirebaseAuth as auth,
  getFirebaseDb as db,
  getFirebaseStorage as storage,
};

// 기본 export는 앱 인스턴스를 반환하는 함수
export default getFirebaseApp;
