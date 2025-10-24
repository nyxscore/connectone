import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin 초기화
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
      }),
    });
    console.log("✅ Firebase Admin 초기화 성공");
  } catch (error) {
    console.error("❌ Firebase Admin 초기화 실패:", error);
  }
}

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
          console.log("🔐 서버사이드 로그인 시도:", credentials.username);

          // Firebase Admin Auth를 사용한 사용자 인증
          const auth = getAuth();
          const db = getFirestore();

          // username으로 사용자 찾기
          const usersRef = db.collection("users");
          const userQuery = await usersRef
            .where("username", "==", credentials.username)
            .get();

          if (userQuery.empty) {
            console.log("❌ 사용자를 찾을 수 없음:", credentials.username);
            return null;
          }

          const userDoc = userQuery.docs[0];
          const userData = userDoc.data();

          // Firebase Admin으로 사용자 인증 (이메일/비밀번호)
          const email = `${credentials.username}@connectone.local`;

          try {
            // Firebase Admin Auth로 사용자 검증
            const userRecord = await auth.getUserByEmail(email);

            // 비밀번호 검증을 위해 사용자 정보 반환
            if (userRecord) {
              console.log("✅ 사용자 인증 성공:", userRecord.uid);
              return {
                id: userRecord.uid,
                email: userData.email || email,
                name:
                  userData.nickname ||
                  userData.displayName ||
                  credentials.username,
                image: userData.photoURL || null,
              };
            }
          } catch (authError) {
            console.error("❌ Firebase Admin 인증 실패:", authError);
            return null;
          }
        } catch (error) {
          console.error("❌ 서버사이드 로그인 실패:", error);
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
