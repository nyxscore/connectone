/**
 * 가상 상품 데이터 생성 스크립트 v2
 * 이미지와 완전한 사용자 정보 포함
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

// 가상 판매자 정보 (더 상세하게)
const sellers = [
  {
    uid: "test-seller-1",
    email: "music_mania@example.com",
    username: "음악매니아",
    nickname: "음악매니아",
    phoneNumber: "010-1234-5678",
    region: "서울시 강남구",
    grade: "B",
    tradesCount: 15,
    reviewsCount: 12,
    safeTransactionCount: 15,
    averageRating: 4.8,
    disputeCount: 0,
    isPhoneVerified: true,
    isIdVerified: true,
    isBankVerified: true,
    points: 5000,
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=musicmania",
  },
  {
    uid: "test-seller-2",
    email: "guitar_king@example.com",
    username: "기타왕",
    nickname: "기타왕",
    phoneNumber: "010-2345-6789",
    region: "서울시 송파구",
    grade: "C",
    tradesCount: 8,
    reviewsCount: 7,
    safeTransactionCount: 8,
    averageRating: 4.5,
    disputeCount: 0,
    isPhoneVerified: true,
    isIdVerified: false,
    isBankVerified: true,
    points: 3000,
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=guitarking",
  },
  {
    uid: "test-seller-3",
    email: "piano_teacher@example.com",
    username: "피아노선생님",
    nickname: "피아노선생님",
    phoneNumber: "010-3456-7890",
    region: "서울시 마포구",
    grade: "A",
    tradesCount: 32,
    reviewsCount: 28,
    safeTransactionCount: 32,
    averageRating: 4.9,
    disputeCount: 0,
    isPhoneVerified: true,
    isIdVerified: true,
    isBankVerified: true,
    points: 12000,
    profileImage:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=pianoteacher",
  },
];

// 가상 상품 데이터 (이미지 포함)
const products = [
  // 피아노
  {
    title: "야마하 디지털 피아노 P-125",
    category: "건반악기 > 피아노 > 디지털 피아노",
    brand: "야마하",
    model: "P-125",
    price: 850000,
    description:
      "거의 새것! 3개월 사용했습니다. 88건반 해머 액션, 스탠드와 페달 포함. 직거래 우대합니다.",
    condition: "상",
    purchaseYear: 2023,
    region: "서울시 강남구",
    images: [
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
    ],
    status: "active",
    views: 45,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-1",
  },
  {
    title: "커즈와일 디지털 피아노 KA-90",
    category: "건반악기 > 피아노 > 디지털 피아노",
    brand: "커즈와일",
    model: "KA-90",
    price: 450000,
    description:
      "5년 정도 사용했지만 관리 잘 되어있습니다. 의자 포함 판매합니다.",
    condition: "중",
    purchaseYear: 2019,
    region: "서울시 송파구",
    images: ["https://images.unsplash.com/photo-1552422535-c45813c61732?w=800"],
    status: "active",
    views: 32,
    tradeOptions: ["직거래"],
    sellerUid: "test-seller-2",
  },
  {
    title: "영창 업라이트 피아노 U-121",
    category: "건반악기 > 피아노 > 업라이트 피아노",
    brand: "영창",
    model: "U-121",
    price: 1200000,
    description:
      "10년 된 피아노지만 정기적으로 조율 받았습니다. 이사 가면서 급매합니다. 이전비 별도.",
    condition: "중",
    purchaseYear: 2014,
    region: "서울시 마포구",
    images: [
      "https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?w=800",
    ],
    status: "active",
    views: 78,
    tradeOptions: ["직거래"],
    sellerUid: "test-seller-3",
  },

  // 기타
  {
    title: "깁슨 레스폴 스튜디오 일렉기타",
    category: "현악기 > 기타 > 일렉 기타",
    brand: "깁슨",
    model: "Les Paul Studio",
    price: 1800000,
    description:
      "2020년식 깁슨 레스폴 스튜디오입니다. 하드케이스, 스트랩 포함. 픽업 교체 한 적 없고 순정 상태입니다.",
    condition: "상",
    purchaseYear: 2020,
    region: "서울시 용산구",
    images: [
      "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800",
      "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800",
    ],
    status: "active",
    views: 156,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-1",
  },
  {
    title: "펜더 재즈베이스 멕시코산",
    category: "현악기 > 베이스 기타",
    brand: "펜더",
    model: "Jazz Bass",
    price: 950000,
    description:
      "멕펜 재즈베이스 화이트 색상. 긁힌 곳 거의 없고 프렛 마모도 적습니다. 소프트케이스 포함.",
    condition: "상",
    purchaseYear: 2021,
    region: "경기도 성남시",
    images: [
      "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=800",
    ],
    status: "active",
    views: 89,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-2",
  },
  {
    title: "마틴 어쿠스틱 기타 D-28",
    category: "현악기 > 기타 > 통기타",
    brand: "마틴",
    model: "D-28",
    price: 2500000,
    description:
      "2018년 구입한 마틴 D-28. 연주감 최고이며 음색 깔끔합니다. 하드케이스 포함.",
    condition: "상",
    purchaseYear: 2018,
    region: "서울시 서초구",
    images: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800",
      "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800",
    ],
    status: "active",
    views: 201,
    tradeOptions: ["직거래"],
    sellerUid: "test-seller-3",
  },
  {
    title: "콜트 통기타 입문용",
    category: "현악기 > 기타 > 통기타",
    brand: "콜트",
    model: "Standard",
    price: 120000,
    description:
      "입문용으로 좋은 콜트 통기타입니다. 3개월 사용 후 일렉기타로 갈아타서 판매합니다.",
    condition: "상",
    purchaseYear: 2024,
    region: "서울시 관악구",
    images: ["https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=800"],
    status: "active",
    views: 67,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-1",
  },

  // 관악기
  {
    title: "야마하 알토 색소폰 YAS-280",
    category: "관악기 > 색소폰 > 알토 색소폰",
    brand: "야마하",
    model: "YAS-280",
    price: 1300000,
    description:
      "입문용으로 최고인 야마하 280 모델. 케이스, 마우스피스, 리드 포함. 정기적으로 관리 받았습니다.",
    condition: "상",
    purchaseYear: 2022,
    region: "서울시 강동구",
    images: [
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800",
    ],
    status: "active",
    views: 112,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-2",
  },
  {
    title: "야마하 플룻 YFL-222",
    category: "관악기 > 플룻",
    brand: "야마하",
    model: "YFL-222",
    price: 550000,
    description: "중학교 때 사용했던 플룻입니다. 상태 좋고 케이스 포함입니다.",
    condition: "중",
    purchaseYear: 2018,
    region: "경기도 고양시",
    images: [
      "https://images.unsplash.com/photo-1598471896134-abb0b9f0ade4?w=800",
    ],
    status: "active",
    views: 43,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-3",
  },
  {
    title: "셀머 트럼펫 TR711",
    category: "관악기 > 트럼펫",
    brand: "셀머",
    model: "TR711",
    price: 380000,
    description:
      "학생용 트럼펫. 밸브 작동 잘 되고 음정 정확합니다. 마우스피스 2개 포함.",
    condition: "중",
    purchaseYear: 2020,
    region: "서울시 노원구",
    images: [
      "https://images.unsplash.com/photo-1520060343-f6430338-1f06?w=800",
    ],
    status: "active",
    views: 58,
    tradeOptions: ["직거래"],
    sellerUid: "test-seller-1",
  },

  // 타악기
  {
    title: "펄 드럼세트 EXX725S",
    category: "타악기 > 드럼",
    brand: "펄",
    model: "EXX725S",
    price: 1500000,
    description:
      "5피스 드럼세트. 심벌 3개 포함. 연습실에서만 사용해서 상태 좋습니다. 직거래만 가능합니다.",
    condition: "상",
    purchaseYear: 2021,
    region: "서울시 영등포구",
    images: [
      "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800",
      "https://images.unsplash.com/photo-1593004597634-f3835b04d8a7?w=800",
    ],
    status: "active",
    views: 134,
    tradeOptions: ["직거래"],
    sellerUid: "test-seller-2",
  },
  {
    title: "롤랜드 전자드럼 TD-17KVX",
    category: "타악기 > 전자 드럼",
    brand: "롤랜드",
    model: "TD-17KVX",
    price: 2200000,
    description:
      "집에서 연습용으로 구입했는데 이사 가면서 판매합니다. 메쉬헤드로 조용하고 다이나믹합니다.",
    condition: "상",
    purchaseYear: 2022,
    region: "경기도 수원시",
    images: [
      "https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=800",
    ],
    status: "active",
    views: 198,
    tradeOptions: ["직거래"],
    sellerUid: "test-seller-3",
  },
  {
    title: "카혼 (Cajon) 메이넬 브랜드",
    category: "타악기 > 카혼",
    brand: "메이넬",
    model: "Standard",
    price: 180000,
    description: "버스킹용으로 사용했습니다. 소리 좋고 튼튼합니다. 가방 포함.",
    condition: "중",
    purchaseYear: 2021,
    region: "서울시 홍대",
    images: [
      "https://images.unsplash.com/photo-1614963366795-9d622756e9d5?w=800",
    ],
    status: "active",
    views: 41,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-1",
  },

  // 앰프/이펙터
  {
    title: "마샬 기타 앰프 MG50CFX",
    category: "음향기기 > 앰프 > 기타 앰프",
    brand: "마샬",
    model: "MG50CFX",
    price: 350000,
    description:
      "50W 콤보앰프. 이펙트 내장되어 있어 편리합니다. 집 연습용으로 적당합니다.",
    condition: "상",
    purchaseYear: 2022,
    region: "서울시 구로구",
    images: [
      "https://images.unsplash.com/photo-1614963366795-9d622756e9d5?w=800",
    ],
    status: "active",
    views: 72,
    tradeOptions: ["직거래"],
    sellerUid: "test-seller-2",
  },
  {
    title: "보스 멀티 이펙터 GT-1",
    category: "음향기기 > 이펙터",
    brand: "보스",
    model: "GT-1",
    price: 220000,
    description:
      "거의 새것입니다. 박스, 설명서, 어댑터 모두 있습니다. 다양한 톤 만들기 좋습니다.",
    condition: "상",
    purchaseYear: 2023,
    region: "서울시 강서구",
    images: [
      "https://images.unsplash.com/photo-1599767742318-2b1b36e30d8e?w=800",
    ],
    status: "active",
    views: 95,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-3",
  },

  // 기타 악기
  {
    title: "야마하 바이올린 V5SC",
    category: "현악기 > 바이올린",
    brand: "야마하",
    model: "V5SC",
    price: 680000,
    description:
      "중급 연주자용 바이올린. 케이스, 활, 송진 포함. 음색이 부드럽고 좋습니다.",
    condition: "상",
    purchaseYear: 2020,
    region: "서울시 강남구",
    images: [
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800",
    ],
    status: "active",
    views: 87,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-1",
  },
  {
    title: "코르그 신디사이저 Minilogue XD",
    category: "건반악기 > 신디사이저",
    brand: "코르그",
    model: "Minilogue XD",
    price: 650000,
    description:
      "아날로그 신디사이저. 작곡/프로듀싱용으로 최고입니다. 박스 포함.",
    condition: "상",
    purchaseYear: 2021,
    region: "서울시 마포구",
    images: [
      "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800",
    ],
    status: "active",
    views: 143,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-2",
  },
  {
    title: "우쿨렐레 콘서트 사이즈",
    category: "현악기 > 우쿨렐레",
    brand: "Lanikai",
    model: "LU-21C",
    price: 95000,
    description: "입문용 우쿨렐레. 튜너와 케이스 포함. 3개월 사용.",
    condition: "상",
    purchaseYear: 2024,
    region: "서울시 종로구",
    images: [
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800",
    ],
    status: "active",
    views: 52,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-3",
  },
  {
    title: "롤랜드 디지털 피아노 FP-30X",
    category: "건반악기 > 피아노 > 디지털 피아노",
    brand: "롤랜드",
    model: "FP-30X",
    price: 750000,
    description:
      "블루투스 미디 지원. 가볍고 휴대성 좋습니다. 스탠드, 페달, 케이스 포함.",
    condition: "상",
    purchaseYear: 2023,
    region: "경기도 부천시",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"],
    status: "active",
    views: 124,
    tradeOptions: ["직거래", "택배"],
    sellerUid: "test-seller-1",
  },
];

async function deleteOldData() {
  console.log("🗑️  기존 테스트 데이터 삭제 중...\n");

  try {
    // 기존 테스트 상품 삭제
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
    console.log(`  ✅ ${itemsSnapshot.size}개의 기존 상품 삭제 완료`);

    // 기존 테스트 사용자 삭제
    const userDeletePromises = sellers.map(seller =>
      db.collection("users").doc(seller.uid).delete()
    );
    await Promise.all(userDeletePromises);
    console.log(`  ✅ ${sellers.length}명의 기존 판매자 삭제 완료\n`);
  } catch (error) {
    console.log("  ℹ️  삭제할 기존 데이터가 없거나 오류 발생\n");
  }
}

async function seedData() {
  try {
    console.log("🌱 가상 데이터 생성 시작...\n");

    // 0. 기존 데이터 삭제
    await deleteOldData();

    // 1. 판매자 데이터 추가
    console.log("👤 판매자 정보 추가 중...");
    for (const seller of sellers) {
      await db
        .collection("users")
        .doc(seller.uid)
        .set({
          ...seller,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      console.log(`  ✅ ${seller.nickname} (${seller.email})`);
    }

    // 2. 상품 데이터 추가
    console.log("\n🎵 상품 정보 추가 중...");
    let addedCount = 0;
    for (const product of products) {
      await db.collection("items").add({
        ...product,
        aiTags: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      addedCount++;
      console.log(
        `  ✅ [${addedCount}/${products.length}] ${product.title} (${product.images.length}장)`
      );
    }

    console.log("\n✨ 가상 데이터 생성 완료!");
    console.log(
      `📊 총 ${sellers.length}명의 판매자, ${products.length}개의 상품 추가됨`
    );
    console.log(`🖼️  모든 상품에 썸네일 이미지 포함\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  }
}

// 실행
seedData();
