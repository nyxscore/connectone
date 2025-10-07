// 긴급 복구: 동적 import로 Firebase 초기화
let firebase: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

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

// Firebase 초기화 함수
async function initializeFirebase() {
  if (typeof window === "undefined") return null;

  if (!firebase) {
    try {
      // 동적 import 사용
      const firebaseModule = await import("firebase/compat/app");
      await import("firebase/compat/auth");
      await import("firebase/compat/firestore");
      await import("firebase/compat/storage");

      firebase = firebaseModule.default;

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      // 전역 firebase 노출
      window.firebase = firebase;

      // 서비스들 초기화
      auth = firebase.auth();
      db = firebase.firestore();
      storage = firebase.storage();

      console.log("✅ Firebase 초기화 완료");
    } catch (error) {
      console.error("❌ Firebase 초기화 실패:", error);
    }
  }

  return firebase;
}

// 즉시 초기화 (클라이언트에서만)
if (typeof window !== "undefined") {
  initializeFirebase();
}

// 비동기 초기화를 기다리는 함수들
export const getAuth = async () => {
  if (typeof window === "undefined") return null;
  if (!auth) {
    await initializeFirebase();
  }
  return auth;
};

export const getDb = async () => {
  if (typeof window === "undefined") return null;
  if (!db) {
    await initializeFirebase();
  }
  return db;
};

export const getStorage = async () => {
  if (typeof window === "undefined") return null;
  if (!storage) {
    await initializeFirebase();
  }
  return storage;
};

// 호환성을 위한 직접 export (null일 수 있음)
export { auth, db, storage };

// Provider들 (지연 초기화)
export const getGoogleProvider = () => {
  if (typeof window === "undefined" || !firebase) return null;
  return new firebase.auth.GoogleAuthProvider();
};

export const getKakaoProvider = () => {
  if (typeof window === "undefined" || !firebase) return null;
  return new firebase.auth.OAuthProvider("oidc.kakao");
};

export const getNaverProvider = () => {
  if (typeof window === "undefined" || !firebase) return null;
  return new firebase.auth.OAuthProvider("oidc.naver");
};

// SNS 로그인 함수들
export const signInWithGoogle = async () => {
  if (typeof window === "undefined" || !auth) {
    return Promise.reject(new Error("Firebase not initialized"));
  }
  const provider = getGoogleProvider();
  if (!provider) {
    return Promise.reject(new Error("Google Provider not available"));
  }
  return auth.signInWithPopup(provider);
};

export const signInWithKakao = async () => {
  if (typeof window === "undefined" || !auth) {
    return Promise.reject(new Error("Firebase not initialized"));
  }
  const provider = getKakaoProvider();
  if (!provider) {
    return Promise.reject(new Error("Kakao Provider not available"));
  }
  return auth.signInWithPopup(provider);
};

export const signInWithNaver = async () => {
  if (typeof window === "undefined" || !auth) {
    return Promise.reject(new Error("Firebase not initialized"));
  }
  const provider = getNaverProvider();
  if (!provider) {
    return Promise.reject(new Error("Naver Provider not available"));
  }
  return auth.signInWithPopup(provider);
};

// 리다이렉트 로그인 함수들
export const signInWithGoogleRedirect = async () => {
  if (typeof window === "undefined" || !auth) {
    return Promise.reject(new Error("Firebase not initialized"));
  }
  const provider = getGoogleProvider();
  if (!provider) {
    return Promise.reject(new Error("Google Provider not available"));
  }
  return auth.signInWithRedirect(provider);
};

export const signInWithKakaoRedirect = async () => {
  if (typeof window === "undefined" || !auth) {
    return Promise.reject(new Error("Firebase not initialized"));
  }
  const provider = getKakaoProvider();
  if (!provider) {
    return Promise.reject(new Error("Kakao Provider not available"));
  }
  return auth.signInWithRedirect(provider);
};

export const signInWithNaverRedirect = async () => {
  if (typeof window === "undefined" || !auth) {
    return Promise.reject(new Error("Firebase not initialized"));
  }
  const provider = getNaverProvider();
  if (!provider) {
    return Promise.reject(new Error("Naver Provider not available"));
  }
  return auth.signInWithRedirect(provider);
};

// 리다이렉트 결과 가져오기
export const getRedirectResult = () => {
  if (typeof window === "undefined" || !auth) {
    return Promise.reject(new Error("Firebase not initialized"));
  }
  return auth.getRedirectResult();
};

export default firebase;
