#!/usr/bin/env node

/**
 * 사용자에게 관리자 권한을 부여하는 스크립트
 *
 * 사용법:
 * node scripts/set-admin-role.js <사용자UID> [사용자이메일]
 *
 * 예시:
 * node scripts/set-admin-role.js OVIjkjdJ1IMNm8ea97H2rOEo9BD2 admin@connectone.com
 */

// 환경변수 로드
require("dotenv").config({ path: ".env.local" });

const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc, setDoc } = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

// Firebase 설정 (하드코딩된 설정 사용)
const firebaseConfig = {
  apiKey: "AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs",
  authDomain: "connectone-8b414.firebaseapp.com",
  projectId: "connectone-8b414",
  storageBucket: "connectone-8b414.firebasestorage.app",
  messagingSenderId: "567550026947",
  appId: "1:567550026947:web:92120b0c926db2ece06e76",
};

async function setAdminRole(userUid, userEmail = null) {
  try {
    console.log("🔥 Firebase 초기화 중...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // 관리자 계정으로 로그인 (환경변수에서 가져오기)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@connectone.com";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("❌ ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
      console.log("💡 .env.local에 다음을 추가하세요:");
      console.log("ADMIN_EMAIL=admin@connectone.com");
      console.log("ADMIN_PASSWORD=your_admin_password");
      process.exit(1);
    }

    console.log(`🔐 관리자 계정으로 로그인 중: ${adminEmail}`);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

    console.log(`👤 사용자 ${userUid}에게 관리자 권한 부여 중...`);

    // Firestore에서 사용자 문서 업데이트
    const userRef = doc(db, "users", userUid);
    await updateDoc(userRef, {
      role: "admin",
      isAdmin: true,
      adminGrantedAt: new Date(),
      adminGrantedBy: adminEmail,
    });

    console.log("✅ 관리자 권한 부여 완료!");
    console.log(`📧 사용자 UID: ${userUid}`);
    if (userEmail) {
      console.log(`📧 사용자 이메일: ${userEmail}`);
    }
    console.log(
      "🎉 이제 https://connect-tone.com/connect-admin 에서 접근 가능합니다!"
    );
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);

    if (error.code === "auth/user-not-found") {
      console.log("💡 해결 방법:");
      console.log("1. 사용자 UID가 올바른지 확인하세요");
      console.log("2. 사용자가 먼저 회원가입했는지 확인하세요");
    } else if (error.code === "auth/wrong-password") {
      console.log("💡 해결 방법:");
      console.log("1. .env.local의 ADMIN_PASSWORD가 올바른지 확인하세요");
      console.log("2. 관리자 계정의 비밀번호를 확인하세요");
    }

    process.exit(1);
  }
}

// 명령행 인수 확인
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log(
    "❌ 사용법: node scripts/set-admin-role.js <사용자UID> [사용자이메일]"
  );
  console.log("");
  console.log("예시:");
  console.log("node scripts/set-admin-role.js OVIjkjdJ1IMNm8ea97H2rOEo9BD2");
  console.log(
    "node scripts/set-admin-role.js OVIjkjdJ1IMNm8ea97H2rOEo9BD2 admin@connectone.com"
  );
  process.exit(1);
}

const userUid = args[0];
const userEmail = args[1] || null;

console.log("🚀 관리자 권한 부여 스크립트 시작");
console.log(`👤 대상 사용자: ${userUid}`);
if (userEmail) {
  console.log(`📧 사용자 이메일: ${userEmail}`);
}
console.log("");

setAdminRole(userUid, userEmail);
