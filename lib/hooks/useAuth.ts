"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../api/firebase";
import { User } from "../../data/types";
import { getUserProfile } from "../profile/api";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log("useAuth: 초기화 시작");

    const processUser = async (firebaseUser: FirebaseUser | null) => {
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
              setUser(userData.data);
            } else {
              // Firestore에서 사용자 정보를 가져오지 못한 경우, Firebase 사용자 정보로 임시 사용자 생성
              const tempUser: User = {
                uid: firebaseUser.uid,
                username:
                  firebaseUser.email?.replace("@connectone.local", "") ||
                  firebaseUser.uid,
                nickname:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split("@")[0] ||
                  "사용자",
                region: "서울시 강남구",
                grade: "Bronze",
                tradesCount: 0,
                reviewsCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                photoURL: firebaseUser.photoURL || undefined,
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
              uid: firebaseUser.uid,
              username:
                firebaseUser.email?.replace("@connectone.local", "") || "",
              nickname: firebaseUser.displayName || "사용자",
              region: "",
              grade: "C",
              tradesCount: 0,
              reviewsCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              photoURL: firebaseUser.photoURL || undefined,
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

    console.log("useAuth: onAuthStateChanged 구독 시작");
    const unsubscribe = onAuthStateChanged(auth, processUser);

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
  };
};
