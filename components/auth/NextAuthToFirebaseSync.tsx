"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getFirebaseDb, getFirebaseAuth } from "@/lib/api/firebase-ultra-safe";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

export default function NextAuthToFirebaseSync() {
  const { data: session, status } = useSession();
  const { user: firebaseUser } = useAuth();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  useEffect(() => {
    const createGoogleUserProfile = async () => {
      // NextAuth 세션이 있고 Firebase Auth에 사용자가 없는 경우
      if (session?.user && !firebaseUser && !isCreatingProfile) {
        try {
          setIsCreatingProfile(true);
          console.log("🔄 NextAuth → Firebase DB 프로필 생성 시작");

          // Firebase Auth에 익명으로 로그인 (권한 문제 해결)
          const auth = await getFirebaseAuth();
          if (!auth) {
            console.error("❌ Firebase Auth 초기화 실패");
            return;
          }

          // 이미 로그인되어 있지 않은 경우에만 익명 로그인
          if (!auth.currentUser) {
            console.log("🔐 Firebase Auth 익명 로그인 시작");
            await signInAnonymously(auth);
            console.log("✅ Firebase Auth 익명 로그인 완료");
          }

          const db = await getFirebaseDb();
          if (!db) {
            console.error("❌ Firebase DB 초기화 실패");
            return;
          }

          // NextAuth 세션에서 사용자 정보 추출
          const userEmail = session.user.email;
          // 구글 프로필 이름을 우선 사용, 없으면 이메일에서 추출
          const userName =
            session.user.name || userEmail?.split("@")[0] || "사용자";
          const userImage = session.user.image;

          // Firebase Auth UID 사용 (권한 문제 해결)
          const userId = auth.currentUser?.uid;
          if (!userId) {
            console.error("❌ Firebase Auth UID를 가져올 수 없음");
            return;
          }

          console.log("ℹ️ NextAuth 사용자 정보:", {
            email: userEmail,
            name: userName,
            image: userImage,
            id: userId,
          });

          console.log("🔍 NextAuth 세션 전체 정보:", session);

          // Firestore에 사용자 프로필 생성/업데이트
          const userRef = doc(db, "users", userId);
          const userSnap = await getDoc(userRef);

          const userProfile = {
            uid: userId,
            email: userEmail,
            nickname: userName,
            profileImage: userImage,
            provider: "google",
            providerId: session.user.id,
            isEmailVerified: true,
            role: "user",
            status: "active",
            points: 0,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          };

          if (userSnap.exists()) {
            // 기존 사용자 - 프로필 업데이트
            await setDoc(
              userRef,
              {
                ...userSnap.data(),
                nickname: userName,
                profileImage: userImage,
                lastLoginAt: new Date(),
                updatedAt: new Date(),
              },
              { merge: true }
            );
            console.log("✅ 기존 Google 사용자 프로필 업데이트 완료");
          } else {
            // 신규 사용자 - 프로필 생성
            await setDoc(userRef, userProfile);
            console.log("✅ 신규 Google 사용자 프로필 생성 완료");
          }
        } catch (error) {
          console.error("❌ NextAuth → Firebase DB 프로필 생성 실패:", error);
        } finally {
          setIsCreatingProfile(false);
        }
      }
    };

    if (status === "authenticated") {
      createGoogleUserProfile();
    }
  }, [session, firebaseUser, status, isCreatingProfile]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}
