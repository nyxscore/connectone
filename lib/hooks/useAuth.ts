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

    const processUser = async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;

      if (firebaseUser) {
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
        setUser(null);
      }
      setLoading(false);
    };

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
