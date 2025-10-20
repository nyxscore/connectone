const admin = require("firebase-admin");
admin.initializeApp({ projectId: "connectone-8b414" });
const db = admin.firestore();

async function testQuery() {
  console.log('\n=== 프론트엔드와 동일한 쿼리 테스트 ===\n');
  
  const statusFilter = ["active", "reserved", "escrow_completed", "shipping", "shipped", "sold"];
  
  const snapshot = await db.collection("items")
    .where("status", "in", statusFilter)
    .get();
  
  console.log('✅ 쿼리 결과:', snapshot.size, '개');
  console.log('(DB 전체:', (await db.collection("items").get()).size, '개)\n');
  
  if (snapshot.size < 26) {
    console.log('⚠️ 일부 상품이 쿼리에서 누락됨!\n');
    
    // 누락된 상품 찾기
    const allSnapshot = await db.collection("items").get();
    const queriedIds = new Set(snapshot.docs.map(d => d.id));
    
    console.log('❌ 누락된 상품:');
    allSnapshot.forEach(doc => {
      if (!queriedIds.has(doc.id)) {
        const data = doc.data();
        console.log('  -', data.title, '[' + data.status + ']');
      }
    });
  } else {
    console.log('✅ 모든 상품이 쿼리에 포함됨');
  }
  
  process.exit(0);
}

testQuery();
