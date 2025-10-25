"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { auth } from "../api/firebase-ultra-safe";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getUserProfile } from "../profile/api";
import { User } from "../../data/types";
import { UserProfile } from "../../data/profile/types";
import { useSession } from "next-auth/react";
import { getFirebaseDb } from "../api/firebase-ultra-safe";
import { doc, getDoc } from "firebase/firestore";

// UserProfile을 User로 변환하는 함수
function convertUserProfileToUser(
  profile: UserProfile,
  firebaseUser?: FirebaseUser
): User {
  return {
    id: profile.uid,
    uid: profile.uid,
    email: profile.email || firebaseUser?.email || "",
    phoneNumber: profile.phoneNumber,
    nickname: profile.nickname || firebaseUser?.displayName || "사용자",
    region: profile.region || "지역 정보 없음",
    grade: profile.grade || "C",
    tradeCount: profile.tradesCount || 0,
    reviewCount: profile.reviewsCount || 0,
    createdAt: profile.createdAt?.toDate() || new Date(),
    updatedAt: profile.updatedAt?.toDate() || new Date(),
    profileImage: profile.photoURL || firebaseUser?.photoURL || undefined,
    safeTransactionCount: 0, // UserProfile에 없으므로 기본값
    averageRating: 0, // UserProfile에 없으므로 기본값
    disputeCount: 0, // UserProfile에 없으므로 기본값
    isPhoneVerified: profile.phoneVerified || false,
  };
}

// NextAuth 세션에서 Firebase DB 프로필을 가져오는 함수
async function getNextAuthUserProfile(session: any): Promise<User | null> {
  try {
    if (!session?.user) return null;

    const db = await getFirebaseDb();
    if (!db) return null;

    const userId =
      session.user.id ||
      `google_${session.user.email?.replace("@", "_").replace(".", "_")}`;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log("✅ NextAuth 사용자 프로필 로드 성공:", userData.nickname);

      // UserProfile 형태로 변환
      const userProfile: UserProfile = {
        uid: userData.uid,
        email: userData.email,
        nickname: userData.nickname,
        photoURL: userData.profileImage,
        phoneNumber: userData.phoneNumber,
        region: userData.region,
        grade: userData.grade,
        tradesCount: userData.tradeCount || 0,
        reviewsCount: userData.reviewCount || 0,
        phoneVerified: userData.isPhoneVerified || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      return convertUserProfileToUser(userProfile);
    }

    return null;
  } catch (error) {
    console.error("❌ NextAuth 사용자 프로필 로드 실패:", error);
    return null;
  }
}

// 전역 상태 관리
let globalUser: User | null = null;
let globalLoading = true;
const globalListeners: Set<() => void> = new Set();

// 전역 상태 변경 알림 함수
function notifyListeners() {
  globalListeners.forEach(listener => listener());
}

// Firebase 사용자 처리 함수
async function processFirebaseUser(
  firebaseUser: FirebaseUser | null
): Promise<User | null> {
  if (!firebaseUser) {
    return null;
  }

  try {
    const userData = await getUserProfile(firebaseUser.uid);
    if (userData && userData.success && userData.data) {
      return convertUserProfileToUser(userData.data, firebaseUser);
    } else {
      // Firestore에 사용자 데이터가 없는 경우 Firebase 사용자 정보로 임시 사용자 생성
      return {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        phoneNumber: undefined,
        nickname:
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "사용자",
        region: "지역 정보 없음",
        grade: "C",
        tradeCount: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: firebaseUser.photoURL || undefined,
        safeTransactionCount: 0,
        averageRating: 0,
        disputeCount: 0,
        isPhoneVerified: false,
      };
    }
  } catch (error) {
    console.error("사용자 정보 가져오기 실패:", error);
    // 에러가 발생해도 Firebase 사용자 정보로 임시 사용자 생성
    return {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      phoneNumber: undefined,
      nickname: firebaseUser.displayName || "사용자",
      region: "",
      grade: "C",
      tradeCount: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImage: firebaseUser.photoURL || undefined,
      safeTransactionCount: 0,
      averageRating: 0,
      disputeCount: 0,
      isPhoneVerified: false,
    };
  }
}

// Firebase Auth 초기화 (한 번만 실행)
let isInitialized = false;
let unsubscribe: (() => void) | null = null;

function initializeAuth() {
  if (isInitialized || !auth) {
    return;
  }

  isInitialized = true;
  console.log("🔥 useAuth: Firebase Auth 초기화");

  // 현재 Firebase 사용자 확인
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log("🔥 useAuth: 현재 Firebase 사용자 발견:", currentUser.uid);
    processFirebaseUser(currentUser).then(user => {
      globalUser = user;
      globalLoading = false;
      notifyListeners();
    });
  } else {
    globalUser = null;
    globalLoading = false;
    notifyListeners();
  }

  // Auth 상태 변경 리스너 설정
  unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
    console.log(
      "🔥 useAuth: Firebase Auth 상태 변경:",
      firebaseUser?.uid || "null"
    );

    if (firebaseUser) {
      const user = await processFirebaseUser(firebaseUser);
      globalUser = user;
    } else {
      globalUser = null;
    }

    globalLoading = false;
    notifyListeners();
  });
}

// 정리 함수
function cleanup() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  isInitialized = false;
  globalUser = null;
  globalLoading = true;
  globalListeners.clear();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUser);
  const [loading, setLoading] = useState(globalLoading);
  const listenerRef = useRef<() => void>();
  const { data: session, status: sessionStatus } = useSession();

  // 리스너 등록/해제
  useEffect(() => {
    // Auth 초기화
    initializeAuth();

    // 리스너 함수 생성
    listenerRef.current = () => {
      setUser(globalUser);
      setLoading(globalLoading);
    };

    // 리스너 등록
    globalListeners.add(listenerRef.current);

    // 초기 상태 설정
    setUser(globalUser);
    setLoading(globalLoading);

    // 정리 함수
    return () => {
      if (listenerRef.current) {
        globalListeners.delete(listenerRef.current);
      }
    };
  }, []);

  // NextAuth 세션 처리
  useEffect(() => {
    const handleNextAuthSession = async () => {
      if (sessionStatus === "loading") {
        return;
      }

      if (session?.user && !globalUser) {
        console.log("🔄 NextAuth 세션에서 사용자 프로필 로드 시도");
        console.log("🔍 NextAuth 세션 정보:", {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          id: session.user.id,
        });
        try {
          const nextAuthUser = await getNextAuthUserProfile(session);
          if (nextAuthUser) {
            globalUser = nextAuthUser;
            globalLoading = false;
            notifyListeners();
            console.log(
              "✅ NextAuth 사용자 프로필 로드 완료:",
              nextAuthUser.nickname
            );
          } else {
            console.log("⚠️ NextAuth 사용자 프로필을 찾을 수 없음");
          }
        } catch (error) {
          console.error("❌ NextAuth 사용자 프로필 로드 실패:", error);
        }
      } else if (!session?.user && !globalUser) {
        globalUser = null;
        globalLoading = false;
        notifyListeners();
      }
    };

    handleNextAuthSession();
  }, [session, sessionStatus]);

  // 사용자 정보 새로고침 함수
  const refreshUser = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userData = await getUserProfile(user.uid);
      if (userData && userData.success && userData.data && auth.currentUser) {
        const updatedUser = convertUserProfileToUser(
          userData.data,
          auth.currentUser
        );
        globalUser = updatedUser;
        notifyListeners();
      }
    } catch (error) {
      console.error("사용자 정보 새로고침 실패:", error);
    }
  }, [user?.uid]);

  // 사용자 정보 업데이트 함수
  const updateUser = useCallback((updatedUserData: Partial<User>) => {
    if (globalUser) {
      globalUser = { ...globalUser, ...updatedUserData };
      notifyListeners();
    }
  }, []);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      globalUser = null;
      globalLoading = false;
      notifyListeners();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    refreshUser,
    logout,
    updateUser,
  };
}

// 개발 환경에서만 전역 정리 함수 노출
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).__cleanupAuth = cleanup;
}
