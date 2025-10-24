import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "../../../lib/api/firebase-ultra-safe";

// 환경변수 체크 (개발 환경에서만)
if (process.env.NODE_ENV === 'development' && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
  throw new Error("Google OAuth 환경변수가 설정되지 않았습니다!");
}

const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 로그인 성공 - Firestore에 사용자 프로필 저장/업데이트
      console.log("로그인 성공:", {
        provider: account?.provider,
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      try {
        const db = await getFirebaseDb();
        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);

        const userData = {
          uid: user.id,
          email: user.email || "",
          displayName: user.name || user.email?.split("@")[0] || "사용자",
          photoURL: user.image || undefined,
          provider: account?.provider || "google",
          providerId: account?.providerAccountId || user.id,
          isEmailVerified: true,
          role: "user",
          status: "active",
          updatedAt: new Date(),
        };

        if (userSnap.exists()) {
          // 기존 사용자 - 프로필 업데이트
          await setDoc(userRef, {
            ...userData,
            lastLoginAt: new Date(),
          }, { merge: true });
          console.log("기존 사용자 프로필 업데이트 완료:", user.id);
        } else {
          // 신규 사용자 - 프로필 생성
          await setDoc(userRef, {
            ...userData,
            createdAt: new Date(),
            lastLoginAt: new Date(),
          });
          console.log("신규 사용자 프로필 생성 완료:", user.id);
        }
      } catch (error) {
        console.error("사용자 프로필 저장 실패:", error);
        // 프로필 저장 실패해도 로그인은 허용
      }

      return true;
    },
    async session({ session, token }) {
      // 세션에 사용자 ID 추가
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
