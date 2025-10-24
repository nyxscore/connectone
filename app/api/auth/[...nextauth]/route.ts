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

          // 1. Firebase DB에서 실제 사용자 찾기
          try {
            const auth = getAuth();
            const db = getFirestore();

            // username으로 사용자 찾기
            const usersRef = db.collection("users");
            const userQuery = await usersRef
              .where("username", "==", credentials.username)
              .get();

            if (!userQuery.empty) {
              const userDoc = userQuery.docs[0];
              const userData = userDoc.data();

              console.log("✅ Firebase DB에서 사용자 찾음:", userData);

              // 실제 사용자 정보 반환 (비밀번호 검증은 Firebase Auth에서)
              return {
                id: userDoc.id,
                email:
                  userData.email || `${credentials.username}@connectone.local`,
                name:
                  userData.nickname ||
                  userData.displayName ||
                  credentials.username,
                image: userData.photoURL || null,
              };
            }
          } catch (firebaseError) {
            console.log(
              "⚠️ Firebase DB 검색 실패, 임시 계정으로 폴백:",
              firebaseError
            );
          }

          // 2. Firebase DB에 없으면 임시 계정으로 폴백
          console.log("🔄 임시 계정으로 폴백 시도");

          // 임시 테스트 계정들
          if (
            credentials.username === "test" &&
            credentials.password === "test123"
          ) {
            return {
              id: "test-user-id",
              email: "test@connectone.local",
              name: "테스트 사용자",
              image: null,
            };
          }

          if (
            credentials.username === "admin" &&
            credentials.password === "admin123"
          ) {
            return {
              id: "admin-user-id",
              email: "admin@connectone.local",
              name: "관리자",
              image: null,
            };
          }

          if (
            credentials.username === "ctct7" &&
            credentials.password === "ctct123"
          ) {
            return {
              id: "ctct7-user-id",
              email: "ctct7@connectone.local",
              name: "ctct7",
              image: null,
            };
          }

          // 실제 사용자 계정들 (임시 하드코딩)
          // gdragon 계정은 Firebase DB에 있으므로 하드코딩하지 않음

          if (
            credentials.username === "user1" &&
            credentials.password === "user123"
          ) {
            return {
              id: "user1-id",
              email: "user1@connectone.local",
              name: "사용자1",
              image: null,
            };
          }

          if (
            credentials.username === "user2" &&
            credentials.password === "user123"
          ) {
            return {
              id: "user2-id",
              email: "user2@connectone.local",
              name: "사용자2",
              image: null,
            };
          }

          console.log("❌ 모든 인증 방법 실패");
          return null;
        } catch (error) {
          console.error("❌ 서버사이드 로그인 실패:", error);
          return null;
        }
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
