const admin = require("firebase-admin");

admin.initializeApp({ projectId: "connectone-8b414" });
const db = admin.firestore();

async function checkItems() {
  const snapshot = await db.collection("items").get();
  
  console.log("\n📊 전체 상품 개수:", snapshot.size);
  
  const statusCount = {};
  snapshot.forEach(doc => {
    const status = doc.data().status;
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  console.log("\n📋 상태별 개수:");
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}개`);
  });
  
  process.exit(0);
}

checkItems();
