import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

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
      // 로그인 성공 - 간단하게 처리
      console.log("로그인 성공:", {
        provider: account?.provider,
        userId: user.id,
        email: user.email,
        name: user.name,
      });
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
