"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../api/firebase";
import { User } from "../types";
import { getUserProfile } from "../auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const processUser = async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;

      console.log(
        "Firebase Auth 상태 변경:",
        firebaseUser ? "로그인됨" : "로그아웃됨"
      );

      if (firebaseUser) {
        console.log("Firebase 사용자 정보:", {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });

        try {
          console.log("사용자 프로필 가져오기 시도:", firebaseUser.uid);
          const userData = await getUserProfile(firebaseUser.uid);
          console.log("사용자 프로필 가져오기 성공:", userData);

          if (!isMounted) return;

          // Firestore에서 사용자 정보를 가져오지 못한 경우, Firebase 사용자 정보로 임시 사용자 생성
          if (userData) {
            console.log("Firestore 사용자 정보 사용:", userData);
            setUser(userData);
          } else {
            console.log(
              "Firestore 사용자 정보 없음, Firebase 사용자 정보로 임시 사용자 생성"
            );
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
            };
            console.log("임시 사용자 생성:", tempUser);
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
          };
          console.log("에러 발생 시 임시 사용자 생성:", tempUser);
          setUser(tempUser);
        }
      } else {
        console.log("Firebase 사용자 없음, 로그아웃 상태");
        setUser(null);
      }
      setLoading(false);
    };

    // 즉시 현재 사용자 상태 확인
    const currentUser = auth.currentUser;
    console.log("즉시 확인된 현재 사용자:", currentUser);

    if (currentUser) {
      processUser(currentUser);
    }

    const unsubscribe = onAuthStateChanged(auth, processUser);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const result = {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: loading,
  };

  console.log("useAuth 반환값:", result);

  return result;
};
