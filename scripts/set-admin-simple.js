#!/usr/bin/env node

/**
 * 간단한 관리자 권한 부여 스크립트 (인증 없이)
 *
 * 사용법:
 * node scripts/set-admin-simple.js <사용자UID>
 */

const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc } = require("firebase/firestore");

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs",
  authDomain: "connectone-8b414.firebaseapp.com",
  projectId: "connectone-8b414",
  storageBucket: "connectone-8b414.firebasestorage.app",
  messagingSenderId: "567550026947",
  appId: "1:567550026947:web:92120b0c926db2ece06e76",
};

async function setAdminRoleSimple(userUid) {
  try {
    console.log("🔥 Firebase 초기화 중...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log(`👤 사용자 ${userUid}에게 관리자 권한 부여 중...`);

    // Firestore에서 사용자 문서 업데이트 (인증 없이)
    const userRef = doc(db, "users", userUid);
    await updateDoc(userRef, {
      role: "admin",
      isAdmin: true,
      adminGrantedAt: new Date(),
      adminGrantedBy: "script",
    });

    console.log("✅ 관리자 권한 부여 완료!");
    console.log(`📧 사용자 UID: ${userUid}`);
    console.log(
      "🎉 이제 https://connect-tone.com/connect-admin 에서 접근 가능합니다!"
    );
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);

    if (error.code === "permission-denied") {
      console.log("💡 해결 방법:");
      console.log("1. Firestore 보안 규칙을 확인하세요");
      console.log("2. Firebase Console에서 직접 설정하세요:");
      console.log("   - users 컬렉션 → 해당 사용자 문서");
      console.log("   - role: 'admin', isAdmin: true 추가");
    }

    process.exit(1);
  }
}

// 명령행 인수 확인
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("❌ 사용법: node scripts/set-admin-simple.js <사용자UID>");
  console.log("");
  console.log("예시:");
  console.log("node scripts/set-admin-simple.js n8QRFJKXVUbhK4WenaAWoqSrpc22");
  process.exit(1);
}

const userUid = args[0];

console.log("🚀 간단한 관리자 권한 부여 스크립트 시작");
console.log(`👤 대상 사용자: ${userUid}`);
console.log("");

setAdminRoleSimple(userUid);
