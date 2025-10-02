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

// Firebase 앱 초기화 (중복 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase 서비스들
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// SNS 로그인 프로바이더들
export const googleProvider = new GoogleAuthProvider();
export const kakaoProvider = new OAuthProvider("oidc.kakao");
export const naverProvider = new OAuthProvider("oidc.naver");

// 프로바이더 설정
googleProvider.addScope("email");
googleProvider.addScope("profile");

// 카카오 프로바이더 설정
kakaoProvider.addScope("profile_nickname");
kakaoProvider.addScope("account_email");
kakaoProvider.addScope("profile_image");
kakaoProvider.setCustomParameters({
  client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "your_kakao_client_id",
});

naverProvider.addScope("email");
naverProvider.addScope("name");

// SNS 로그인 함수들
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithKakao = () => signInWithPopup(auth, kakaoProvider);
export const signInWithNaver = () => signInWithPopup(auth, naverProvider);

// 리다이렉트 로그인 (모바일에서 사용)
export const signInWithGoogleRedirect = () =>
  signInWithRedirect(auth, googleProvider);
export const signInWithKakaoRedirect = () =>
  signInWithRedirect(auth, kakaoProvider);
export const signInWithNaverRedirect = () =>
  signInWithRedirect(auth, naverProvider);

// 리다이렉트 결과 가져오기
export const getRedirectResult = firebaseGetRedirectResult;

export default app;
