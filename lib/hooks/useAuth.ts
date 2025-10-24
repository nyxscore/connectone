"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { User } from "../../data/types";
import { UserProfile } from "../../data/profile/types";
import { getUserProfile } from "../profile/api";

// UserProfile을 User 타입으로 변환하는 함수
const convertUserProfileToUser = (
  profile: UserProfile,
  sessionUser: any
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
    email: sessionUser?.email || "",
    phoneNumber: profile.phoneNumber || undefined,
    nickname: profile.nickname,
    region: profile.region,
    grade: profile.grade,
    profileImage: profile.photoURL,
    tradeCount: profile.tradesCount,
    reviewCount: profile.reviewsCount,
    safeTransactionCount: 0, // UserProfile에 없으므로 기본값
    averageRating: 0, // UserProfile에 없으므로 기본값
    disputeCount: 0, // UserProfile에 없으므로 기본값
    isPhoneVerified: profile.phoneVerified || false,
    points: (profile as any).points || 0, // 포인트 필드 추가!
    createdAt: toDateSafe((profile as any).createdAt),
    updatedAt: toDateSafe((profile as any).updatedAt),
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  // 사용자 정보 업데이트 함수
  const updateUser = (updatedUserData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updatedUserData } : null));
  };

  // processUser 함수를 useEffect 밖으로 이동
  const processUser = async (sessionUser: any, isMounted: boolean) => {
    console.log("useAuth: processUser 호출", {
      sessionUser: !!sessionUser,
    });
    if (!isMounted) return;

    try {
      if (sessionUser) {
        console.log("useAuth: NextAuth 사용자 있음", {
          id: sessionUser.id,
        });
        
        // 먼저 프로필 동기화 시도
        try {
          await fetch("/api/auth/sync-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uid: sessionUser.id,
              email: sessionUser.email,
              name: sessionUser.name,
              image: sessionUser.image,
              provider: "google",
              providerId: sessionUser.id,
            }),
          });
          console.log("프로필 동기화 완료");
        } catch (error) {
          console.error("프로필 동기화 실패:", error);
        }

        try {
          const userData = await getUserProfile(sessionUser.id);

          if (!isMounted) return;

          if (userData && userData.success && userData.data) {
            const user = convertUserProfileToUser(userData.data, sessionUser);
            setUser(user);
          } else {
            // Firestore에서 사용자 정보를 가져오지 못한 경우, NextAuth 사용자 정보로 임시 사용자 생성
            const tempUser: User = {
              id: sessionUser.id,
              uid: sessionUser.id,
              email: sessionUser.email || "",
              phoneNumber: undefined,
              nickname:
                sessionUser.name ||
                sessionUser.email?.split("@")[0] ||
                "사용자",
              region: "지역 정보 없음",
              grade: "C",
              tradeCount: 0,
              reviewCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              profileImage: sessionUser.image || undefined,
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

          // 에러가 발생해도 NextAuth 사용자 정보로 임시 사용자 생성
          const tempUser: User = {
            id: sessionUser.id,
            uid: sessionUser.id,
            email: sessionUser.email || "",
            phoneNumber: undefined,
            nickname: sessionUser.name || "사용자",
            region: "",
            grade: "C",
            tradeCount: 0,
            reviewCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            profileImage: sessionUser.image || undefined,
            safeTransactionCount: 0,
            averageRating: 0,
            disputeCount: 0,
            isPhoneVerified: false,
          };
          setUser(tempUser);
        }
      } else {
        console.log("useAuth: NextAuth 사용자 없음");
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
    if (session?.user) {
      await processUser(session.user, true);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      console.log("로그아웃 시작");
      await signOut({ 
        redirect: false,
        callbackUrl: "/"
      });
      setUser(null);
      console.log("로그아웃 성공");
      
      // 강제 새로고침으로 세션 완전 정리
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (error) {
      console.error("로그아웃 실패:", error);
      // 로그아웃 실패해도 강제로 홈으로 이동
      setUser(null);
      window.location.href = "/";
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (status === "loading") {
          return; // NextAuth가 로딩 중이면 대기
        }

        if (session?.user) {
          await processUser(session.user, isMounted);
        } else {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("❌ NextAuth 초기화 실패:", error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [session, status]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: loading,
    updateUser,
    refreshUser,
    logout,
  };
};
