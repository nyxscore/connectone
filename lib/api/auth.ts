import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase-ultra-safe";
import { User } from "../../data/types";

// 회원가입
export const signUp = async (
  email: string,
  password: string,
  nickname: string,
  region: string
): Promise<User> => {
  try {
    // Firebase Auth로 계정 생성
    const auth = getFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 이메일 인증 발송
    await sendEmailVerification(user);

    // Firestore에 사용자 정보 저장
    const userData: User = {
      id: user.uid,
      email: user.email!,
      nickname,
      region,
      grade: "C",
      tradeCount: 0,
      reviewCount: 0,
      safeTransactionCount: 0,
      averageRating: 0,
      disputeCount: 0,
      isPhoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getFirebaseDb();
    await setDoc(doc(db, "users", user.uid), userData);

    // Firebase 프로필 업데이트
    await updateProfile(user, {
      displayName: nickname,
    });

    return userData;
  } catch (error) {
    throw new Error(`회원가입 실패: ${error}`);
  }
};

// 로그인
export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Firestore에서 사용자 정보 가져오기
    const db = await getFirebaseDb();
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    return userDoc.data() as User;
  } catch (error) {
    throw new Error(`로그인 실패: ${error}`);
  }
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(`로그아웃 실패: ${error}`);
  }
};

// 비밀번호 재설정
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(`비밀번호 재설정 이메일 발송 실패: ${error}`);
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return null;

    const db = await getFirebaseDb();
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) return null;

    return userDoc.data() as User;
  } catch (error) {
    console.error("사용자 정보 가져오기 실패:", error);
    return null;
  }
};
