import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { signIn as firebaseSignIn } from "../../../../lib/auth";

// 환경변수 체크 (개발 환경에서만) - Google OAuth는 선택사항
// if (
//   process.env.NODE_ENV === "development" &&
//   (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
// ) {
//   throw new Error("Google OAuth 환경변수가 설정되지 않았습니다!");
// }

const authOptions: NextAuthOptions = {
  providers: [
    // 자체 회원 로그인
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Firebase Auth를 통한 실제 사용자 인증
          const user = await firebaseSignIn(
            credentials.username,
            credentials.password
          );

          if (user) {
            return {
              id: user.uid,
              email: user.email,
              name: user.displayName || user.email?.split("@")[0] || "사용자",
              image: user.photoURL,
            };
          }
        } catch (error) {
          console.error("Firebase 로그인 실패:", error);
          return null;
        }

        return null;
      },
    }),
    // 구글 로그인
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 로그인 성공 - 로깅만 수행
      console.log("로그인 성공:", {
        provider: account?.provider,
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      // 프로필 저장은 클라이언트 사이드에서 처리
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
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    async signOut({ token }) {
      console.log("로그아웃 이벤트:", token?.sub);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
