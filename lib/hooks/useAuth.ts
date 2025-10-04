"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../api/firebase";
import { User } from "../../data/types";
import { UserProfile } from "../../data/profile/types";
import { getUserProfile } from "../profile/api";

// UserProfile을 User 타입으로 변환하는 함수
const convertUserProfileToUser = (
  profile: UserProfile,
  firebaseUser: FirebaseUser
): User => {
  // createdAt, updatedAt 필드가 Firestore Timestamp가 아닐 수도 있어 안전하게 변환
  const toDateSafe = (value: any): Date => {
    try {
      if (!value) return new Date();
      if (typeof value?.toDate === "function") return value.toDate();
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  };

  return {
    id: profile.uid,
    uid: profile.uid,
    email: firebaseUser.email || "",
    phoneNumber: firebaseUser.phoneNumber || undefined,
    nickname: profile.nickname,
    region: profile.region,
    grade: profile.grade,
    profileImage: profile.photoURL,
    tradeCount: profile.tradesCount,
    reviewCount: profile.reviewsCount,
    safeTransactionCount: 0, // UserProfile에 없으므로 기본값
    averageRating: 0, // UserProfile에 없으므로 기본값
    disputeCount: 0, // UserProfile에 없으므로 기본값
    isPhoneVerified: false, // UserProfile에 없으므로 기본값
    createdAt: toDateSafe((profile as any).createdAt),
    updatedAt: toDateSafe((profile as any).updatedAt),
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 업데이트 함수
  const updateUser = (updatedUserData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updatedUserData } : null));
  };

  // processUser 함수를 useEffect 밖으로 이동
  const processUser = async (firebaseUser: FirebaseUser | null, isMounted: boolean) => {
    console.log("useAuth: processUser 호출", {
      firebaseUser: !!firebaseUser,
    });
    if (!isMounted) return;

    try {
      if (firebaseUser) {
        console.log("useAuth: Firebase 사용자 있음", {
          uid: firebaseUser.uid,
        });
        try {
          const userData = await getUserProfile(firebaseUser.uid);

          if (!isMounted) return;

          if (userData && userData.success && userData.data) {
            const user = convertUserProfileToUser(
              userData.data,
              firebaseUser
            );
            setUser(user);
          } else {
            // Firestore에서 사용자 정보를 가져오지 못한 경우, Firebase 사용자 정보로 임시 사용자 생성
            const tempUser: User = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              phoneNumber: firebaseUser.phoneNumber || undefined,
              nickname:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "사용자",
              region: "서울시 강남구",
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
            setUser(tempUser);
          }
        } catch (error) {
          console.error("사용자 정보 가져오기 실패:", error);
          if (!isMounted) return;

          // 에러가 발생해도 Firebase 사용자 정보로 임시 사용자 생성
          const tempUser: User = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            phoneNumber: firebaseUser.phoneNumber || undefined,
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
          setUser(tempUser);
        }
      } else {
        console.log("useAuth: Firebase 사용자 없음");
        setUser(null);
      }
    } catch (error) {
      console.error("useAuth: 인증 상태 처리 실패:", error);
      setUser(null);
    } finally {
      if (isMounted) {
        console.log("useAuth: 로딩 완료");
        setLoading(false);
      }
    }
  };

  // 사용자 정보 새로고침 함수
  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      await processUser(firebaseUser, true);
    }
  };

  useEffect(() => {
    let isMounted = true;
    console.log("useAuth: 초기화 시작");

    console.log("useAuth: onAuthStateChanged 구독 시작");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      processUser(firebaseUser, isMounted);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: loading,
    updateUser,
    refreshUser,
  };
};
