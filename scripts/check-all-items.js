/**
 * 모든 상품 확인 스크립트
 */

const admin = require("firebase-admin");

// Firebase Admin 초기화
try {
  admin.initializeApp({
    projectId: "connectone-8b414",
  });
  console.log("✅ Firebase Admin 초기화 성공\n");
} catch (error) {
  console.error("❌ Firebase Admin 초기화 실패:", error.message);
  process.exit(1);
}

const db = admin.firestore();

async function checkAllItems() {
  try {
    console.log("📦 전체 상품 조회 중...\n");

    const itemsSnapshot = await db.collection("items").get();

    console.log(`총 ${itemsSnapshot.size}개의 상품이 있습니다.\n`);

    if (itemsSnapshot.size > 0) {
      console.log("상품 목록:");
      itemsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - [${doc.id}] ${data.title}`);
        console.log(`    판매자: ${data.sellerUid}`);
        console.log(`    상태: ${data.status}`);
        console.log(`    가격: ${data.price}원`);
        console.log("");
      });
    } else {
      console.log("⚠️  등록된 상품이 없습니다.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  }
}

// 실행
checkAllItems();
