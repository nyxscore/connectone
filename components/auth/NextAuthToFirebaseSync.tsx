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

          // Firebase Auth 없이 직접 Firestore 접근 (보안 규칙이 허용하는 경우)
          console.log("🔐 Firebase Auth 없이 직접 Firestore 접근");

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

          // NextAuth 세션 ID를 사용자 ID로 사용
          const userId =
            session.user.id ||
            `google_${userEmail?.replace("@", "_").replace(".", "_")}`;
          if (!userId) {
            console.error("❌ 사용자 ID를 생성할 수 없음");
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
