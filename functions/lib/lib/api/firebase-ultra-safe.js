"use strict";
// Ultra-safe Firebase initialization for deployment
// This version completely prevents any server-side initialization
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.db = exports.auth = exports.firebaseGetRedirectResult = exports.handleRedirectResult = exports.signInWithNaverRedirect = exports.signInWithKakaoRedirect = exports.signInWithGoogleRedirect = exports.signInWithNaver = exports.signInWithKakao = exports.signInWithGoogle = exports.getNaverProvider = exports.getKakaoProvider = exports.getGoogleProvider = exports.getFirebaseStorage = exports.getFirebaseDb = exports.getFirebaseAuth = exports.getFirebaseApp = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
Object.defineProperty(exports, "firebaseGetRedirectResult", { enumerable: true, get: function () { return auth_1.getRedirectResult; } });
const firestore_1 = require("firebase/firestore");
const storage_1 = require("firebase/storage");
// 환경변수 확인 및 안전장치
const getFirebaseConfig = () => {
    // 서버 사이드에서는 절대 초기화하지 않음
    if (typeof window === "undefined") {
        return null;
    }
    const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
            "AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
            "connectone-8b414.firebaseapp.com",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "connectone-8b414",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
            "connectone-8b414.firebasestorage.app",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "567550026947",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
            "1:567550026947:web:92120b0c926db2ece06e76",
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-P7KKSEF6SZ",
    };
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
let _app = null;
let _auth = null;
let _db = null;
let _storage = null;
let _googleProvider = null;
let _kakaoProvider = null;
let _naverProvider = null;
// Firebase 앱 초기화 (클라이언트 사이드에서만)
const getFirebaseApp = () => {
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
            const apps = (0, app_1.getApps)();
            if (apps.length === 0) {
                _app = (0, app_1.initializeApp)(config);
                console.log("✅ Firebase 앱 초기화 성공");
            }
            else {
                _app = (0, app_1.getApp)();
                console.log("✅ 기존 Firebase 앱 사용");
            }
        }
        catch (error) {
            console.error("❌ Firebase 앱 초기화 실패:", error);
            throw new Error("Firebase 앱 초기화에 실패했습니다.");
        }
    }
    return _app;
};
exports.getFirebaseApp = getFirebaseApp;
// Firebase Auth 초기화 (클라이언트 사이드에서만)
const getFirebaseAuth = () => {
    if (typeof window === "undefined") {
        console.log("⚠️ 서버 사이드에서 Firebase Auth 초기화 시도 - 건너뜀");
        return null;
    }
    if (!_auth) {
        try {
            const app = (0, exports.getFirebaseApp)();
            if (!app) {
                console.log("⚠️ Firebase 앱이 초기화되지 않음 - Auth 초기화 건너옴");
                return null;
            }
            _auth = (0, auth_1.getAuth)(app);
            console.log("✅ Firebase Auth 초기화 성공");
        }
        catch (error) {
            console.error("❌ Firebase Auth 초기화 실패:", error);
            throw new Error("Firebase Auth 초기화에 실패했습니다.");
        }
    }
    return _auth;
};
exports.getFirebaseAuth = getFirebaseAuth;
// Firebase Firestore 초기화 (클라이언트 사이드에서만)
const getFirebaseDb = () => {
    if (typeof window === "undefined") {
        console.log("⚠️ 서버 사이드에서 Firebase DB 초기화 시도 - 건너뜀");
        return null;
    }
    if (!_db) {
        try {
            const app = (0, exports.getFirebaseApp)();
            if (!app) {
                console.log("⚠️ Firebase 앱이 초기화되지 않음 - DB 초기화 건너옴");
                return null;
            }
            _db = (0, firestore_1.getFirestore)(app);
            console.log("✅ Firebase DB 초기화 성공");
        }
        catch (error) {
            console.error("❌ Firebase DB 초기화 실패:", error);
            throw new Error("Firebase DB 초기화에 실패했습니다.");
        }
    }
    return _db;
};
exports.getFirebaseDb = getFirebaseDb;
// Firebase Storage 초기화 (클라이언트 사이드에서만)
const getFirebaseStorage = () => {
    if (typeof window === "undefined") {
        console.log("⚠️ 서버 사이드에서 Firebase Storage 초기화 시도 - 건너뜀");
        return null;
    }
    if (!_storage) {
        try {
            const app = (0, exports.getFirebaseApp)();
            if (!app) {
                console.log("⚠️ Firebase 앱이 초기화되지 않음 - Storage 초기화 건너옴");
                return null;
            }
            _storage = (0, storage_1.getStorage)(app);
            console.log("✅ Firebase Storage 초기화 성공");
        }
        catch (error) {
            console.error("❌ Firebase Storage 초기화 실패:", error);
            throw new Error("Firebase Storage 초기화에 실패했습니다.");
        }
    }
    return _storage;
};
exports.getFirebaseStorage = getFirebaseStorage;
// Google Auth Provider (클라이언트 사이드에서만)
const getGoogleProvider = () => {
    if (typeof window === "undefined") {
        console.log("⚠️ 서버 사이드에서 Google Provider 초기화 시도 - 건너뜀");
        return null;
    }
    if (!_googleProvider) {
        try {
            _googleProvider = new auth_1.GoogleAuthProvider();
            _googleProvider.addScope("email");
            _googleProvider.addScope("profile");
            console.log("✅ Google Provider 초기화 성공");
        }
        catch (error) {
            console.error("❌ Google Provider 초기화 실패:", error);
            throw new Error("Google Provider 초기화에 실패했습니다.");
        }
    }
    return _googleProvider;
};
exports.getGoogleProvider = getGoogleProvider;
// Kakao Auth Provider (클라이언트 사이드에서만)
const getKakaoProvider = () => {
    if (typeof window === "undefined") {
        console.log("⚠️ 서버 사이드에서 Kakao Provider 초기화 시도 - 건너뜀");
        return null;
    }
    if (!_kakaoProvider) {
        try {
            _kakaoProvider = new auth_1.OAuthProvider("oidc.kakao");
            _kakaoProvider.addScope("profile");
            _kakaoProvider.addScope("account_email");
            console.log("✅ Kakao Provider 초기화 성공");
        }
        catch (error) {
            console.error("❌ Kakao Provider 초기화 실패:", error);
            throw new Error("Kakao Provider 초기화에 실패했습니다.");
        }
    }
    return _kakaoProvider;
};
exports.getKakaoProvider = getKakaoProvider;
// Naver Auth Provider (클라이언트 사이드에서만)
const getNaverProvider = () => {
    if (typeof window === "undefined") {
        console.log("⚠️ 서버 사이드에서 Naver Provider 초기화 시도 - 건너뜀");
        return null;
    }
    if (!_naverProvider) {
        try {
            _naverProvider = new auth_1.OAuthProvider("oidc.naver");
            _naverProvider.addScope("profile");
            _naverProvider.addScope("email");
            console.log("✅ Naver Provider 초기화 성공");
        }
        catch (error) {
            console.error("❌ Naver Provider 초기화 실패:", error);
            throw new Error("Naver Provider 초기화에 실패했습니다.");
        }
    }
    return _naverProvider;
};
exports.getNaverProvider = getNaverProvider;
// SNS 로그인 함수들 (클라이언트 사이드에서만)
const signInWithGoogle = async () => {
    if (typeof window === "undefined") {
        throw new Error("서버 사이드에서 실행할 수 없습니다.");
    }
    const auth = (0, exports.getFirebaseAuth)();
    const provider = (0, exports.getGoogleProvider)();
    if (!auth || !provider) {
        throw new Error("Firebase Auth 또는 Google Provider가 초기화되지 않았습니다.");
    }
    try {
        const result = await (0, auth_1.signInWithPopup)(auth, provider);
        console.log("✅ Google 로그인 성공:", result.user.email);
        return result;
    }
    catch (error) {
        console.error("❌ Google 로그인 실패:", error);
        throw error;
    }
};
exports.signInWithGoogle = signInWithGoogle;
const signInWithKakao = async () => {
    if (typeof window === "undefined") {
        throw new Error("서버 사이드에서 실행할 수 없습니다.");
    }
    const auth = (0, exports.getFirebaseAuth)();
    const provider = (0, exports.getKakaoProvider)();
    if (!auth || !provider) {
        throw new Error("Firebase Auth 또는 Kakao Provider가 초기화되지 않았습니다.");
    }
    try {
        const result = await (0, auth_1.signInWithPopup)(auth, provider);
        console.log("✅ Kakao 로그인 성공:", result.user.email);
        return result;
    }
    catch (error) {
        console.error("❌ Kakao 로그인 실패:", error);
        throw error;
    }
};
exports.signInWithKakao = signInWithKakao;
const signInWithNaver = async () => {
    if (typeof window === "undefined") {
        throw new Error("서버 사이드에서 실행할 수 없습니다.");
    }
    const auth = (0, exports.getFirebaseAuth)();
    const provider = (0, exports.getNaverProvider)();
    if (!auth || !provider) {
        throw new Error("Firebase Auth 또는 Naver Provider가 초기화되지 않았습니다.");
    }
    try {
        const result = await (0, auth_1.signInWithPopup)(auth, provider);
        console.log("✅ Naver 로그인 성공:", result.user.email);
        return result;
    }
    catch (error) {
        console.error("❌ Naver 로그인 실패:", error);
        throw error;
    }
};
exports.signInWithNaver = signInWithNaver;
// Redirect 방식 로그인 함수들
const signInWithGoogleRedirect = async () => {
    if (typeof window === "undefined") {
        throw new Error("서버 사이드에서 실행할 수 없습니다.");
    }
    const auth = (0, exports.getFirebaseAuth)();
    const provider = (0, exports.getGoogleProvider)();
    if (!auth || !provider) {
        throw new Error("Firebase Auth 또는 Google Provider가 초기화되지 않았습니다.");
    }
    try {
        console.log("🔄 Google 리다이렉트 로그인 시작...");
        await (0, auth_1.signInWithRedirect)(auth, provider);
    }
    catch (error) {
        console.error("❌ Google 리다이렉트 로그인 실패:", error);
        throw error;
    }
};
exports.signInWithGoogleRedirect = signInWithGoogleRedirect;
const signInWithKakaoRedirect = async () => {
    if (typeof window === "undefined") {
        throw new Error("서버 사이드에서 실행할 수 없습니다.");
    }
    const auth = (0, exports.getFirebaseAuth)();
    const provider = (0, exports.getKakaoProvider)();
    if (!auth || !provider) {
        throw new Error("Firebase Auth 또는 Kakao Provider가 초기화되지 않았습니다.");
    }
    try {
        console.log("🔄 Kakao 리다이렉트 로그인 시작...");
        await (0, auth_1.signInWithRedirect)(auth, provider);
    }
    catch (error) {
        console.error("❌ Kakao 리다이렉트 로그인 실패:", error);
        throw error;
    }
};
exports.signInWithKakaoRedirect = signInWithKakaoRedirect;
const signInWithNaverRedirect = async () => {
    if (typeof window === "undefined") {
        throw new Error("서버 사이드에서 실행할 수 없습니다.");
    }
    const auth = (0, exports.getFirebaseAuth)();
    const provider = (0, exports.getNaverProvider)();
    if (!auth || !provider) {
        throw new Error("Firebase Auth 또는 Naver Provider가 초기화되지 않았습니다.");
    }
    try {
        console.log("🔄 Naver 리다이렉트 로그인 시작...");
        await (0, auth_1.signInWithRedirect)(auth, provider);
    }
    catch (error) {
        console.error("❌ Naver 리다이렉트 로그인 실패:", error);
        throw error;
    }
};
exports.signInWithNaverRedirect = signInWithNaverRedirect;
const handleRedirectResult = async () => {
    if (typeof window === "undefined") {
        return null;
    }
    const auth = (0, exports.getFirebaseAuth)();
    if (!auth) {
        console.log("⚠️ Firebase Auth가 초기화되지 않음 - 리다이렉트 결과 처리 건너옴");
        return null;
    }
    try {
        const result = await (0, auth_1.getRedirectResult)(auth);
        if (result) {
            console.log("✅ 리다이렉트 로그인 성공:", result.user.email);
        }
        return result;
    }
    catch (error) {
        console.error("❌ 리다이렉트 로그인 실패:", error);
        throw error;
    }
};
exports.handleRedirectResult = handleRedirectResult;
// 직접 사용할 수 있도록 인스턴스 export
exports.auth = (0, exports.getFirebaseAuth)();
exports.db = (0, exports.getFirebaseDb)();
exports.storage = (0, exports.getFirebaseStorage)();
//# sourceMappingURL=firebase-ultra-safe.js.map