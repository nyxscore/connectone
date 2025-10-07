import {
  signInWithGoogle,
  signInWithKakao,
  signInWithNaver,
  signInWithGoogleRedirect,
  signInWithKakaoRedirect,
  signInWithNaverRedirect,
  getRedirectResult as firebaseGetRedirectResult,
} from "@/lib/api/firebase-ultra-safe";
import { User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/api/firebase-ultra-safe";

// Firebase 인스턴스 가져오기
const getDb = getFirebaseDb;

export interface SNSUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: "google" | "kakao" | "naver";
  providerId: string;
}

/**
 * SNS 로그인 결과를 처리하고 사용자 프로필을 생성/업데이트합니다.
 */
export const handleSNSLogin = async (
  user: User,
  provider: "google" | "kakao" | "naver"
): Promise<SNSUserProfile> => {
  try {
    const db = await getDb();
    // 사용자 프로필 정보 추출
    const profile: SNSUserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "사용자",
      photoURL: user.photoURL || undefined,
      provider,
      providerId: user.providerData[0]?.uid || user.uid,
    };

    // Firestore에 사용자 프로필 저장/업데이트
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // 기존 사용자 - 프로필 업데이트
      await setDoc(
        userRef,
        {
          ...userSnap.data(),
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } else {
      // 신규 사용자 - 프로필 생성
      await setDoc(userRef, {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        provider: profile.provider,
        providerId: profile.providerId,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        // 기본 설정
        isEmailVerified: true, // SNS 로그인은 이메일이 이미 인증됨
        role: "user",
        status: "active",
      });
    }

    return profile;
  } catch (error) {
    console.error("SNS 로그인 처리 중 오류:", error);
    throw new Error("SNS 로그인 처리에 실패했습니다.");
  }
};

/**
 * 구글 로그인
 */
export const loginWithGoogle = async (): Promise<SNSUserProfile> => {
  try {
    const result = await signInWithGoogle();
    return await handleSNSLogin(result.user, "google");
  } catch (error) {
    console.error("구글 로그인 오류:", error);
    throw new Error("구글 로그인에 실패했습니다.");
  }
};

/**
 * 카카오 로그인
 */
export const loginWithKakao = async (): Promise<SNSUserProfile> => {
  try {
    const result = await signInWithKakao();
    return await handleSNSLogin(result.user, "kakao");
  } catch (error) {
    console.error("카카오 로그인 오류:", error);
    throw new Error("카카오 로그인에 실패했습니다.");
  }
};

/**
 * 네이버 로그인
 */
export const loginWithNaver = async (): Promise<SNSUserProfile> => {
  try {
    const result = await signInWithNaver();
    return await handleSNSLogin(result.user, "naver");
  } catch (error) {
    console.error("네이버 로그인 오류:", error);
    throw new Error("네이버 로그인에 실패했습니다.");
  }
};

/**
 * 모바일용 리다이렉트 로그인
 */
export const loginWithGoogleRedirect = () => signInWithGoogleRedirect();
export const loginWithKakaoRedirect = () => signInWithKakaoRedirect();
export const loginWithNaverRedirect = () => signInWithNaverRedirect();

/**
 * 리다이렉트 로그인 결과 처리
 */
export const handleRedirectResult =
  async (): Promise<SNSUserProfile | null> => {
    try {
      const auth = (
        await import("@/lib/api/firebase-ultra-safe")
      ).getFirebaseAuth();
      const result = await firebaseGetRedirectResult(auth);
      if (result && result.user) {
        const provider = result.providerId?.includes("google")
          ? "google"
          : result.providerId?.includes("kakao")
            ? "kakao"
            : "naver";
        return await handleSNSLogin(
          result.user,
          provider as "google" | "kakao" | "naver"
        );
      }
      return null;
    } catch (error) {
      console.error("리다이렉트 로그인 결과 처리 오류:", error);
      return null;
    }
  };
