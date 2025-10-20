import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  signInWithPhoneNumber,
  signInWithCredential,
  RecaptchaVerifier,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "../api/firebase-ultra-safe";
import { useAuthStore } from "./store";
import { User } from "../../data/types";
import { loginSchema, signupSchema } from "../../data/schemas/auth";

// Firebase 인스턴스 가져오기
const auth = getFirebaseAuth();
const getDb = getFirebaseDb;

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
      const db = await getDb();
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
        points: 5000, // 회원가입 포인트 5,000P
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const db = await getDb();
      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      // 포인트 지급 내역 기록
      try {
        const { grantSignupPoints } = await import("../api/points");
        // 이미 userData에 5000 포인트가 설정되어 있으므로, 내역만 기록
        const pointHistoryRef = collection(db, "pointHistory");
        await addDoc(pointHistoryRef, {
          userId: userCredential.user.uid,
          amount: 5000,
          type: "signup",
          description: "🎉 회원가입 축하 포인트",
          balance: 5000,
          createdAt: new Date(),
        });
        console.log("✅ 회원가입 포인트 5,000P 지급 완료");
      } catch (error) {
        console.error("포인트 지급 실패:", error);
        // 포인트 지급 실패해도 회원가입은 계속 진행
      }

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

      const db = await getDb();
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
      const db = await getDb();
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
      useAuthStore.getState().setLoading(true);

      // 1. Firebase 기본 SMS 인증 시도
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

        return {
          success: true,
          confirmationResult,
          message: "SMS 인증 코드가 발송되었습니다.",
          method: "firebase",
        };
      } catch (firebaseError) {
        console.warn("Firebase SMS 실패, 대체 서비스 시도:", firebaseError);

        // 2. 대체 SMS 서비스 시도
        return await this.sendSMSWithAlternativeService(phoneNumber);
      }
    } catch (error) {
      console.error("SMS 인증 요청 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "SMS 인증 요청에 실패했습니다.",
      };
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },

  // 대체 SMS 서비스를 통한 인증 코드 발송
  async sendSMSWithAlternativeService(phoneNumber: string) {
    try {
      // 1. Twilio SMS 시도
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        return await this.sendSMSWithTwilio(phoneNumber);
      }

      // 2. AWS SNS 시도
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        return await this.sendSMSWithAWSSNS(phoneNumber);
      }

      // 3. 네이버 클라우드 SMS 시도
      if (
        process.env.NAVER_CLOUD_ACCESS_KEY &&
        process.env.NAVER_CLOUD_SECRET_KEY
      ) {
        return await this.sendSMSWithNaverCloud(phoneNumber);
      }

      // 4. Mock SMS (테스트용)
      return await this.sendMockSMS(phoneNumber);
    } catch (error) {
      console.error("대체 SMS 서비스 실패:", error);
      return {
        success: false,
        error: "SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
      };
    }
  },

  // Twilio를 통한 SMS 발송
  async sendSMSWithTwilio(phoneNumber: string) {
    try {
      // 클라이언트 사이드에서는 Mock으로 작동
      if (typeof window !== "undefined") {
        console.log("📱 Twilio SMS 발송 (클라이언트 사이드 Mock)");
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        // Firestore에 인증 코드 저장 (만료 시간 포함)
        const db = await getDb();
        await setDoc(doc(db, "phone_verifications", phoneNumber), {
          code: verificationCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분 후 만료
          attempts: 0,
          verified: false,
          createdAt: new Date(),
        });

        return {
          success: true,
          message: "테스트용 SMS 인증 코드가 생성되었습니다.",
          method: "twilio",
          code: verificationCode, // 테스트용으로 코드 반환
        };
      }

      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      await client.messages.create({
        body: `ConnecTone 인증 코드: ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      // Firestore에 인증 코드 저장 (만료 시간 포함)
      const db = await getDb();
      await setDoc(doc(db, "phone_verifications", phoneNumber), {
        code: verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분 후 만료
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });

      console.log("✅ Twilio SMS 발송 성공");
      return {
        success: true,
        message: "SMS 인증 코드가 발송되었습니다.",
        method: "twilio",
      };
    } catch (error) {
      console.error("❌ Twilio SMS 발송 실패:", error);
      throw error;
    }
  },

  // AWS SNS를 통한 SMS 발송
  async sendSMSWithAWSSNS(phoneNumber: string) {
    try {
      // 클라이언트 사이드에서는 Mock으로 작동
      if (typeof window !== "undefined") {
        console.log("📱 AWS SNS SMS 발송 (클라이언트 사이드 Mock)");
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        // Firestore에 인증 코드 저장
        const db = await getDb();
        await setDoc(doc(db, "phone_verifications", phoneNumber), {
          code: verificationCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          verified: false,
          createdAt: new Date(),
        });

        return {
          success: true,
          message: "테스트용 SMS 인증 코드가 생성되었습니다.",
          method: "aws_sns",
          code: verificationCode,
        };
      }

      const AWS = require("aws-sdk");
      const sns = new AWS.SNS({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || "us-east-1",
      });

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      await sns
        .publish({
          Message: `ConnecTone 인증 코드: ${verificationCode}`,
          PhoneNumber: phoneNumber,
        })
        .promise();

      // Firestore에 인증 코드 저장
      const db = await getDb();
      await setDoc(doc(db, "phone_verifications", phoneNumber), {
        code: verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });

      console.log("✅ AWS SNS SMS 발송 성공");
      return {
        success: true,
        message: "SMS 인증 코드가 발송되었습니다.",
        method: "aws_sns",
      };
    } catch (error) {
      console.error("❌ AWS SNS SMS 발송 실패:", error);
      throw error;
    }
  },

  // 네이버 클라우드를 통한 SMS 발송
  async sendSMSWithNaverCloud(phoneNumber: string) {
    try {
      // 클라이언트 사이드에서는 Mock으로 작동
      if (typeof window !== "undefined") {
        console.log("📱 네이버 클라우드 SMS 발송 (클라이언트 사이드 Mock)");
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        // Firestore에 인증 코드 저장
        const db = await getDb();
        await setDoc(doc(db, "phone_verifications", phoneNumber), {
          code: verificationCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          verified: false,
          createdAt: new Date(),
        });

        return {
          success: true,
          message: "테스트용 SMS 인증 코드가 생성되었습니다.",
          method: "naver_cloud",
          code: verificationCode,
        };
      }

      const crypto = require("crypto");

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const timestamp = Date.now().toString();
      const accessKey = process.env.NAVER_CLOUD_ACCESS_KEY!;
      const secretKey = process.env.NAVER_CLOUD_SECRET_KEY!;

      // 네이버 클라우드 SMS API 호출
      const response = await fetch(
        "https://sens.apigw.ntruss.com/sms/v2/services/ncp:sms:kr:your-service-id/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-ncp-apigw-timestamp": timestamp,
            "x-ncp-iam-access-key": accessKey,
            "x-ncp-apigw-signature-v2": crypto
              .createHmac("sha256", secretKey)
              .update(
                `POST /sms/v2/services/ncp:sms:kr:your-service-id/messages\n${timestamp}\n${accessKey}`
              )
              .digest("base64"),
          },
          body: JSON.stringify({
            type: "SMS",
            from: "ConnecTone",
            content: `ConnecTone 인증 코드: ${verificationCode}`,
            messages: [{ to: phoneNumber }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`네이버 클라우드 SMS API 오류: ${response.status}`);
      }

      // Firestore에 인증 코드 저장
      const db = await getDb();
      await setDoc(doc(db, "phone_verifications", phoneNumber), {
        code: verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });

      console.log("✅ 네이버 클라우드 SMS 발송 성공");
      return {
        success: true,
        message: "SMS 인증 코드가 발송되었습니다.",
        method: "naver_cloud",
      };
    } catch (error) {
      console.error("❌ 네이버 클라우드 SMS 발송 실패:", error);
      throw error;
    }
  },

  // Mock SMS (테스트용)
  async sendMockSMS(phoneNumber: string) {
    try {
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      console.log(
        `📱 Mock SMS 발송: ${phoneNumber} - 인증 코드: ${verificationCode}`
      );

      // Firestore에 인증 코드 저장
      const db = await getDb();
      await setDoc(doc(db, "phone_verifications", phoneNumber), {
        code: verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });

      console.log("✅ Mock SMS 발송 성공");
      return {
        success: true,
        message: "테스트용 인증 코드가 생성되었습니다. 콘솔을 확인해주세요.",
        method: "mock",
        code: verificationCode, // 테스트용으로 코드 반환
      };
    } catch (error) {
      console.error("❌ Mock SMS 발송 실패:", error);
      throw error;
    }
  },

  // SMS 인증 확인
  async confirmPhoneVerification(
    verificationCode: string,
    phoneNumber?: string
  ) {
    try {
      useAuthStore.getState().setLoading(true);

      // 1. Firebase 기본 인증 확인 시도
      if (phoneNumber) {
        // 대체 서비스로 발송된 경우 Firestore에서 확인
        const db = await getDb();
        const verificationDoc = await getDoc(
          doc(db, "phone_verifications", phoneNumber)
        );

        if (verificationDoc.exists()) {
          const verificationData = verificationDoc.data();

          // 만료 시간 확인
          if (new Date() > verificationData.expiresAt.toDate()) {
            return {
              success: false,
              error: "인증 코드가 만료되었습니다. 다시 요청해주세요.",
            };
          }

          // 시도 횟수 확인 (최대 5회)
          if (verificationData.attempts >= 5) {
            return {
              success: false,
              error: "인증 시도 횟수를 초과했습니다. 다시 요청해주세요.",
            };
          }

          // 인증 코드 확인
          if (verificationData.code === verificationCode) {
            // 인증 성공 - 사용자 정보 업데이트
            const currentUser = auth.currentUser;
            if (currentUser) {
              await updateDoc(doc(db, "users", currentUser.uid), {
                isPhoneVerified: true,
                phoneNumber: phoneNumber,
                updatedAt: new Date(),
              });

              // 인증 데이터 삭제
              await deleteDoc(doc(db, "phone_verifications", phoneNumber));

              // 업데이트된 사용자 정보 가져오기
              const userDoc = await getDoc(doc(db, "users", currentUser.uid));
              const updatedUser = userDoc.data() as User;

              useAuthStore.getState().setUser(updatedUser);

              return { success: true, user: updatedUser };
            } else {
              return {
                success: false,
                error: "로그인이 필요합니다.",
              };
            }
          } else {
            // 인증 코드 오류 - 시도 횟수 증가
            await updateDoc(doc(db, "phone_verifications", phoneNumber), {
              attempts: verificationData.attempts + 1,
            });

            return {
              success: false,
              error: "인증 코드가 올바르지 않습니다.",
            };
          }
        } else {
          return {
            success: false,
            error: "인증 요청을 찾을 수 없습니다. 다시 요청해주세요.",
          };
        }
      } else {
        // Firebase 기본 인증 확인 (기존 로직)
        const currentUser = auth.currentUser;
        if (!currentUser) {
          return { success: false, error: "로그인이 필요합니다." };
        }

        // Firestore에서 사용자 정보 업데이트
        const db = await getDb();
        await updateDoc(doc(db, "users", currentUser.uid), {
          isPhoneVerified: true,
          updatedAt: new Date(),
        });

        // 업데이트된 사용자 정보 가져오기
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const updatedUser = userDoc.data() as User;

        useAuthStore.getState().setUser(updatedUser);

        return { success: true, user: updatedUser };
      }
    } catch (error) {
      console.error("SMS 인증 확인 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "SMS 인증 확인에 실패했습니다.",
      };
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },

  // 이메일 인증 코드 발송
  async sendEmailVerification(userEmail: string) {
    try {
      useAuthStore.getState().setLoading(true);

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // Firestore에 인증 코드 저장
      const db = await getDb();
      await setDoc(doc(db, "email_verifications", userEmail), {
        code: verificationCode,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분 후 만료
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });

      // 이메일 발송
      const { emailService } = await import("../email/service");
      const success = await emailService.sendEmail({
        id: `email_verification_${Date.now()}`,
        userId: userEmail,
        title: "ConnecTone - 이메일 인증을 완료해주세요",
        templateId: "email_verification",
        data: {
          nickname: "사용자", // 실제로는 사용자 닉네임
          verificationCode: verificationCode,
          verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?code=${verificationCode}&email=${encodeURIComponent(userEmail)}`,
          expiryMinutes: "30",
          supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
          privacyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
        },
        type: "email_verification",
        isRead: false,
        createdAt: new Date(),
      });

      if (success) {
        return {
          success: true,
          message: "이메일 인증 코드가 발송되었습니다.",
          method: "email",
        };
      } else {
        return {
          success: false,
          error: "이메일 발송에 실패했습니다.",
        };
      }
    } catch (error) {
      console.error("이메일 인증 코드 발송 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "이메일 인증 코드 발송에 실패했습니다.",
      };
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },

  // 이메일 인증 코드 확인
  async confirmEmailVerification(verificationCode: string, userEmail: string) {
    try {
      useAuthStore.getState().setLoading(true);

      const db = await getDb();
      const verificationDoc = await getDoc(
        doc(db, "email_verifications", userEmail)
      );

      if (verificationDoc.exists()) {
        const verificationData = verificationDoc.data();

        // 만료 시간 확인
        if (new Date() > verificationData.expiresAt.toDate()) {
          return {
            success: false,
            error: "인증 코드가 만료되었습니다. 다시 요청해주세요.",
          };
        }

        // 시도 횟수 확인 (최대 5회)
        if (verificationData.attempts >= 5) {
          return {
            success: false,
            error: "인증 시도 횟수를 초과했습니다. 다시 요청해주세요.",
          };
        }

        // 인증 코드 확인
        if (verificationData.code === verificationCode) {
          // 인증 성공 - 사용자 정보 업데이트
          const currentUser = auth.currentUser;
          if (currentUser) {
            await updateDoc(doc(db, "users", currentUser.uid), {
              isEmailVerified: true,
              updatedAt: new Date(),
            });

            // 인증 데이터 삭제
            await deleteDoc(doc(db, "email_verifications", userEmail));

            // 업데이트된 사용자 정보 가져오기
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const updatedUser = userDoc.data() as User;

            useAuthStore.getState().setUser(updatedUser);

            return { success: true, user: updatedUser };
          } else {
            return {
              success: false,
              error: "로그인이 필요합니다.",
            };
          }
        } else {
          // 인증 코드 오류 - 시도 횟수 증가
          await updateDoc(doc(db, "email_verifications", userEmail), {
            attempts: verificationData.attempts + 1,
          });

          return {
            success: false,
            error: "인증 코드가 올바르지 않습니다.",
          };
        }
      } else {
        return {
          success: false,
          error: "인증 요청을 찾을 수 없습니다. 다시 요청해주세요.",
        };
      }
    } catch (error) {
      console.error("이메일 인증 확인 실패:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "이메일 인증 확인에 실패했습니다.",
      };
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },
};
