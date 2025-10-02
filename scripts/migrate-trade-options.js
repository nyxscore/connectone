// 기존 상품들의 tradeOptions 필드 업데이트 스크립트
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  // Firebase 설정 (환경변수에서 가져오거나 직접 설정)
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateTradeOptions() {
  try {
    console.log('상품 tradeOptions 마이그레이션 시작...');
    
    const itemsRef = collection(db, 'items');
    const snapshot = await getDocs(itemsRef);
    
    let updatedCount = 0;
    
    for (const itemDoc of snapshot.docs) {
      const itemData = itemDoc.data();
      
      // tradeOptions가 없거나 비어있는 경우에만 업데이트
      if (!itemData.tradeOptions || itemData.tradeOptions.length === 0) {
        const tradeOptions = [];
        
        // shippingTypes가 있는 경우 변환
        if (itemData.shippingTypes && Array.isArray(itemData.shippingTypes)) {
          itemData.shippingTypes.forEach(type => {
            switch (type) {
              case 'direct':
                tradeOptions.push('직거래');
                break;
              case 'parcel':
                tradeOptions.push('택배');
                break;
              case 'shipping':
                tradeOptions.push('화물운송');
                break;
              case 'escrow':
                tradeOptions.push('안전결제');
                break;
              default:
                tradeOptions.push(type);
            }
          });
        } else {
          // 기본값 설정
          tradeOptions.push('직거래');
        }
        
        // Firestore 업데이트
        await updateDoc(doc(db, 'items', itemDoc.id), {
          tradeOptions: tradeOptions
        });
        
        console.log(`상품 ${itemDoc.id} 업데이트:`, tradeOptions);
        updatedCount++;
      }
    }
    
    console.log(`마이그레이션 완료: ${updatedCount}개 상품 업데이트됨`);
  } catch (error) {
    console.error('마이그레이션 오류:', error);
  }
}

// 스크립트 실행
migrateTradeOptions();
