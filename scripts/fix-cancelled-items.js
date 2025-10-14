// Firebase Admin SDK로 cancelled 상태 상품들을 active로 복원
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCancelledItems() {
  try {
    console.log('🔍 취소된 상품 찾는 중...');
    
    const cancelledItemsSnapshot = await db
      .collection('items')
      .where('status', '==', 'cancelled')
      .get();
    
    console.log(`📦 발견된 취소 상품: ${cancelledItemsSnapshot.size}개`);
    
    if (cancelledItemsSnapshot.size === 0) {
      console.log('✅ 취소된 상품이 없습니다!');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    cancelledItemsSnapshot.forEach(doc => {
      const itemRef = db.collection('items').doc(doc.id);
      batch.update(itemRef, {
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
      console.log(`✓ ${doc.id}: cancelled → active`);
    });
    
    await batch.commit();
    console.log(`✅ ${count}개 상품 상태 복원 완료!`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

fixCancelledItems();

