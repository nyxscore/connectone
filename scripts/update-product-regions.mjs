import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDy-EXIHVfzBhKcsNq93BfmQ2SQCWRszOs",
  authDomain: "connectone-8b414.firebaseapp.com",
  projectId: "connectone-8b414",
  storageBucket: "connectone-8b414.firebasestorage.app",
  messagingSenderId: "567550026947",
  appId: "1:567550026947:web:92120b0c926db2ece06e76",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateProductRegions() {
  try {
    console.log("\n🚀 상품 지역 정보 업데이트 시작\n");

    // 1. 모든 사용자 정보 가져오기
    console.log("📋 사용자 정보 조회 중...");
    const usersSnapshot = await getDocs(collection(db, "users"));
    const usersMap = new Map();

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      usersMap.set(doc.id, userData.region || "지역 정보 없음");
    });

    console.log(`✅ ${usersMap.size}명의 사용자 정보 로드 완료\n`);

    // 2. 모든 상품 가져오기
    console.log("📦 상품 정보 조회 중...");
    const itemsSnapshot = await getDocs(collection(db, "items"));

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`📊 총 ${itemsSnapshot.size}개의 상품 발견\n`);
    console.log("=".repeat(80));

    // 3. 각 상품의 지역 정보 업데이트
    for (const itemDoc of itemsSnapshot.docs) {
      const itemData = itemDoc.data();
      const itemId = itemDoc.id;
      const sellerId = itemData.sellerUid || itemData.sellerId;

      if (!sellerId) {
        console.log(`⚠️  [SKIP] ${itemId}: 판매자 정보 없음`);
        skippedCount++;
        continue;
      }

      const userRegion = usersMap.get(sellerId);

      if (!userRegion) {
        console.log(`⚠️  [SKIP] ${itemId}: 판매자 프로필 없음 (${sellerId})`);
        skippedCount++;
        continue;
      }

      // 현재 지역 정보와 동일하면 스킵
      if (itemData.region === userRegion) {
        console.log(
          `✓  [SAME] ${itemId}: ${itemData.title?.substring(0, 30)}... (${userRegion})`
        );
        skippedCount++;
        continue;
      }

      try {
        // 지역 정보 업데이트
        await updateDoc(doc(db, "items", itemId), {
          region: userRegion,
        });

        console.log(
          `🔄 [UPDATE] ${itemId}: "${itemData.region}" → "${userRegion}"`
        );
        console.log(`    제목: ${itemData.title?.substring(0, 50)}...`);
        console.log(`    판매자: ${sellerId}`);
        console.log("");

        updatedCount++;
      } catch (error) {
        console.error(`❌ [ERROR] ${itemId}: ${error.message}`);
        errorCount++;
      }
    }

    console.log("=".repeat(80));
    console.log("\n📊 업데이트 완료!\n");
    console.log(`   ✅ 업데이트됨: ${updatedCount}개`);
    console.log(`   ⏭️  스킵됨: ${skippedCount}개`);
    console.log(`   ❌ 오류: ${errorCount}개`);
    console.log(`   📦 총 상품: ${itemsSnapshot.size}개\n`);
  } catch (error) {
    console.error("\n❌ 전체 작업 실패:", error);
    throw error;
  }
}

// 실행
console.log("\n" + "=".repeat(80));
console.log("🔧 ConnecTone - 상품 지역 정보 일괄 업데이트");
console.log("=".repeat(80));

updateProductRegions()
  .then(() => {
    console.log("✅ 모든 작업 완료!");
    process.exit(0);
  })
  .catch(error => {
    console.error("\n❌ 작업 실패:", error);
    process.exit(1);
  });
