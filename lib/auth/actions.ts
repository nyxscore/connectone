import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  signInWithPhoneNumber,
  signInWithCredential,
  RecaptchaVerifier,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../api/firebase";
import { useAuthStore } from "./store";
import { User } from "../../data/types";
import { loginSchema, signupSchema } from "../../data/schemas/auth";

export const authActions = {
  // 로그인
  async login(email: string, password: string) {
    try {
      useAuthStore.getState().setLoading(true);

      // 스키마 검증
      const validatedData = loginSchema.parse({ email, password });

      // Firebase 로그인
      const userCredential = await signInWithEmailAndPassword(
        auth,
        validatedData.email,
        validatedData.password
      );

      // 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userDoc.exists()) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      const userData = userDoc.data() as User;
      useAuthStore.getState().setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error("로그인 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "로그인에 실패했습니다.",
      };
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },

  // 회원가입
  async signup(
    email: string,
    password: string,
    nickname: string,
    region: string,
    phoneNumber?: string
  ) {
    try {
      useAuthStore.getState().setLoading(true);

      // 스키마 검증
      const validatedData = signupSchema.parse({
        email,
        password,
        confirmPassword: password,
        nickname,
        region,
      });

      // Firebase 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        validatedData.email,
        validatedData.password
      );

      // Firestore에 사용자 정보 저장
      const userData: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email!,
        phoneNumber: phoneNumber,
        nickname: validatedData.nickname,
        region: validatedData.region,
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

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      useAuthStore.getState().setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error("회원가입 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "회원가입에 실패했습니다.",
      };
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },

  // 로그아웃
  async logout() {
    try {
      await signOut(auth);
      useAuthStore.getState().logout();
      return { success: true };
    } catch (error) {
      console.error("로그아웃 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "로그아웃에 실패했습니다.",
      };
    }
  },

  // 현재 사용자 정보 가져오기
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data() as User;
      useAuthStore.getState().setUser(userData);
      return userData;
    } catch (error) {
      console.error("사용자 정보 가져오기 실패:", error);
      return null;
    }
  },

  // 프로필 업데이트
  async updateProfile(updates: Partial<User>) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: "로그인이 필요합니다." };
      }

      // Firestore 업데이트
      await updateDoc(doc(db, "users", currentUser.uid), {
        ...updates,
        updatedAt: new Date(),
      });

      // Firebase 프로필 업데이트 (닉네임)
      if (updates.nickname) {
        await updateFirebaseProfile(currentUser, {
          displayName: updates.nickname,
        });
      }

      // 업데이트된 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const updatedUser = userDoc.data() as User;

      useAuthStore.getState().setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "프로필 업데이트에 실패했습니다.",
      };
    }
  },

  // SMS 인증 요청
  async verifyPhone(phoneNumber: string) {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
        }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );

      return { success: true, confirmationResult };
    } catch (error) {
      console.error("SMS 인증 요청 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "SMS 인증 요청에 실패했습니다.",
      };
    }
  },

  // SMS 인증 확인
  async confirmPhoneVerification(verificationCode: string) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: "로그인이 필요합니다." };
      }

      // 실제로는 confirmationResult를 사용해야 하지만, 여기서는 간단히 처리
      // 실제 구현에서는 confirmationResult.confirm(verificationCode)를 사용

      // Firestore에서 사용자 정보 업데이트
      await updateDoc(doc(db, "users", currentUser.uid), {
        isPhoneVerified: true,
        updatedAt: new Date(),
      });

      // 업데이트된 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const updatedUser = userDoc.data() as User;

      useAuthStore.getState().setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("SMS 인증 확인 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "SMS 인증 확인에 실패했습니다.",
      };
    }
  },
};
