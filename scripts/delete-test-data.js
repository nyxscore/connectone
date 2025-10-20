/**
 * 테스트 데이터 삭제 스크립트
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

async function deleteAllTestData() {
  try {
    console.log("🗑️  테스트 데이터 삭제 시작...\n");

    // 1. 테스트 상품 삭제
    console.log("📦 테스트 상품 삭제 중...");
    const itemsSnapshot = await db
      .collection("items")
      .where("sellerUid", "in", [
        "test-seller-1",
        "test-seller-2",
        "test-seller-3",
      ])
      .get();

    const itemDeletePromises = [];
    itemsSnapshot.forEach(doc => {
      itemDeletePromises.push(doc.ref.delete());
    });
    await Promise.all(itemDeletePromises);
    console.log(`  ✅ ${itemsSnapshot.size}개의 상품 삭제 완료`);

    // 2. 테스트 사용자 삭제
    console.log("\n👤 테스트 판매자 삭제 중...");
    const testUserIds = ["test-seller-1", "test-seller-2", "test-seller-3"];
    const userDeletePromises = testUserIds.map(uid =>
      db.collection("users").doc(uid).delete()
    );
    await Promise.all(userDeletePromises);
    console.log(`  ✅ ${testUserIds.length}명의 판매자 삭제 완료`);

    console.log("\n✨ 모든 테스트 데이터 삭제 완료!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  }
}

// 실행
deleteAllTestData();
