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

// Firebase 설정 검증
const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Firebase 환경 변수가 누락되었습니다:", missingVars);
    console.error("환경 변수를 설정하거나 .env.local 파일을 확인해주세요.");
  }
};

// 개발 환경에서만 검증 실행
if (process.env.NODE_ENV === "development") {
  validateFirebaseConfig();
}

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
const initializeFirebase = () => {
  try {
    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    console.log("✅ Firebase 앱 초기화 성공");
    return app;
  } catch (error) {
    console.error("❌ Firebase 앱 초기화 실패:", error);
    throw new Error(
      "Firebase 초기화에 실패했습니다. 환경 변수를 확인해주세요."
    );
  }
};

const app = initializeFirebase();

// Firebase 서비스들
const initializeServices = (app: any) => {
  try {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    console.log("✅ Firebase 서비스 초기화 성공");
    return { auth, db, storage };
  } catch (error) {
    console.error("❌ Firebase 서비스 초기화 실패:", error);
    throw new Error("Firebase 서비스 초기화에 실패했습니다.");
  }
};

const { auth, db, storage } = initializeServices(app);

export { auth, db, storage };

// SNS 로그인 프로바이더들 초기화
const initializeProviders = () => {
  try {
    const googleProvider = new GoogleAuthProvider();
    const kakaoProvider = new OAuthProvider("oidc.kakao");
    const naverProvider = new OAuthProvider("oidc.naver");

    // 프로바이더 설정
    googleProvider.addScope("email");
    googleProvider.addScope("profile");

    // 카카오 프로바이더 설정
    kakaoProvider.addScope("profile_nickname");
    kakaoProvider.addScope("account_email");
    kakaoProvider.addScope("profile_image");
    kakaoProvider.setCustomParameters({
      client_id:
        process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "your_kakao_client_id",
    });

    naverProvider.addScope("email");
    naverProvider.addScope("name");

    return { googleProvider, kakaoProvider, naverProvider };
  } catch (error) {
    console.error("❌ SNS 프로바이더 초기화 실패:", error);
    throw new Error("SNS 프로바이더 초기화에 실패했습니다.");
  }
};

const { googleProvider, kakaoProvider, naverProvider } = initializeProviders();

export { googleProvider, kakaoProvider, naverProvider };

// SNS 로그인 함수들 초기화
const initializeSignInFunctions = () => {
  try {
    const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
    const signInWithKakao = () => signInWithPopup(auth, kakaoProvider);
    const signInWithNaver = () => signInWithPopup(auth, naverProvider);

    // 리다이렉트 로그인 (모바일에서 사용)
    const signInWithGoogleRedirect = () =>
      signInWithRedirect(auth, googleProvider);
    const signInWithKakaoRedirect = () =>
      signInWithRedirect(auth, kakaoProvider);
    const signInWithNaverRedirect = () =>
      signInWithRedirect(auth, naverProvider);

    return {
      signInWithGoogle,
      signInWithKakao,
      signInWithNaver,
      signInWithGoogleRedirect,
      signInWithKakaoRedirect,
      signInWithNaverRedirect,
    };
  } catch (error) {
    console.error("❌ SNS 로그인 함수 초기화 실패:", error);
    throw new Error("SNS 로그인 함수 초기화에 실패했습니다.");
  }
};

const {
  signInWithGoogle,
  signInWithKakao,
  signInWithNaver,
  signInWithGoogleRedirect,
  signInWithKakaoRedirect,
  signInWithNaverRedirect,
} = initializeSignInFunctions();

export {
  signInWithGoogle,
  signInWithKakao,
  signInWithNaver,
  signInWithGoogleRedirect,
  signInWithKakaoRedirect,
  signInWithNaverRedirect,
};

// 리다이렉트 결과 가져오기
export const getRedirectResult = firebaseGetRedirectResult;

export default app;
