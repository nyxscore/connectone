import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { getFirebaseAuth } from "@/lib/api/firebase-ultra-safe";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

// Google OAuth만 사용하는 간단한 NextAuth 설정
console.log("🔧 NextAuth 설정 확인:", {
  hasClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasSecret: !!process.env.NEXTAUTH_SECRET,
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
});

const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    ...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google 로그인만 허용
      if (account?.provider === "google") {
        console.log("🔥 Google 로그인 성공:", user.email);
        return true;
      }
      return false;
    },
    async session({ session, token }) {
      // 세션에 사용자 정보 추가
      if (token) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // JWT 토큰에 사용자 정보 저장
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
