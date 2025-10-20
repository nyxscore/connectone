// Firestore에 Mock 강사 데이터 추가하는 스크립트
// 사용법: node scripts/seed-instructors.js

const admin = require("firebase-admin");
const serviceAccount = require("../connectone-8b414-firebase-adminsdk-qjyuo-cfd4f1cfea.json");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const MOCK_INSTRUCTORS = [
  {
    name: "김민수",
    photo: "https://i.pravatar.cc/300?img=12",
    specialty: "보컬 트레이닝",
    instruments: ["보컬", "피아노"],
    pricePerHour: 50000,
    rating: 4.9,
    reviewCount: 127,
    location: "서울 강남구",
    experience: "10년",
    bio: "서울예대 실용음악과 졸업, 현직 보컬 트레이너로 10년간 300명 이상의 학생들을 지도했습니다. 음정 교정, 호흡법, 발성 등 기초부터 고급 테크닉까지 체계적으로 가르칩니다.",
    certifications: ["실용음악학 학사", "보컬 트레이너 자격증"],
    tags: ["음정교정", "호흡법", "발성"],
    availability: [
      "월요일 오후",
      "화요일 오전/오후",
      "수요일 오후",
      "목요일 오전",
    ],
    lessonTypes: [
      {
        name: "1:1 개인 레슨",
        duration: 60,
        price: 50000,
        description: "맞춤형 개인 지도",
      },
      {
        name: "그룹 레슨 (2-4명)",
        duration: 90,
        price: 35000,
        description: "1인당 가격",
      },
      {
        name: "온라인 레슨",
        duration: 50,
        price: 40000,
        description: "Zoom 화상 레슨",
      },
    ],
    isActive: true,
  },
  {
    name: "이지은",
    photo: "https://i.pravatar.cc/300?img=5",
    specialty: "재즈 보컬",
    instruments: ["보컬", "색소폰"],
    pricePerHour: 60000,
    rating: 4.8,
    reviewCount: 89,
    location: "서울 마포구",
    experience: "8년",
    bio: "버클리 음대 졸업, 재즈 보컬 및 즉흥 연주 전문가입니다. 재즈 스탠다드부터 현대 재즈까지 폭넓게 지도합니다.",
    certifications: ["버클리 음대 학사", "재즈 보컬 전문가"],
    tags: ["재즈", "즉흥연주", "스캣"],
    availability: [
      "월요일 오전",
      "수요일 오후",
      "금요일 오전/오후",
      "토요일 오전",
    ],
    lessonTypes: [
      {
        name: "1:1 개인 레슨",
        duration: 60,
        price: 60000,
        description: "재즈 보컬 전문 레슨",
      },
      {
        name: "앙상블 레슨",
        duration: 120,
        price: 45000,
        description: "밴드 합주 포함",
      },
    ],
    isActive: true,
  },
  {
    name: "박준혁",
    photo: "https://i.pravatar.cc/300?img=33",
    specialty: "기타 레슨",
    instruments: ["기타", "베이스"],
    pricePerHour: 45000,
    rating: 4.7,
    reviewCount: 156,
    location: "서울 홍대",
    experience: "12년",
    bio: "현직 세션 기타리스트, 록/블루스/재즈 등 다양한 장르 지도 가능합니다.",
    certifications: ["실용음악학 학사", "세션 경력 12년"],
    tags: ["록", "블루스", "핑거스타일"],
    availability: [
      "화요일 오후",
      "수요일 오전",
      "금요일 오후",
      "토요일 오전/오후",
    ],
    lessonTypes: [
      {
        name: "1:1 개인 레슨",
        duration: 60,
        price: 45000,
        description: "기초부터 고급까지",
      },
    ],
    isActive: true,
  },
  {
    name: "최서연",
    photo: "https://i.pravatar.cc/300?img=9",
    specialty: "피아노 레슨",
    instruments: ["피아노", "작곡"],
    pricePerHour: 55000,
    rating: 5.0,
    reviewCount: 203,
    location: "서울 강남구",
    experience: "15년",
    bio: "한국예술종합학교 졸업, 클래식 및 실용음악 피아노 전문가입니다.",
    certifications: ["한국예술종합학교 학사", "피아노 연주자 자격증"],
    tags: ["클래식", "재즈피아노", "작곡"],
    availability: ["월요일 오전", "수요일 오전/오후", "목요일 오후"],
    lessonTypes: [
      {
        name: "1:1 개인 레슨",
        duration: 60,
        price: 55000,
        description: "클래식/재즈 피아노",
      },
    ],
    isActive: true,
  },
  {
    name: "정우성",
    photo: "https://i.pravatar.cc/300?img=60",
    specialty: "드럼 레슨",
    instruments: ["드럼", "퍼커션"],
    pricePerHour: 48000,
    rating: 4.9,
    reviewCount: 112,
    location: "서울 신촌",
    experience: "9년",
    bio: "현직 드러머, 록/펑크/재즈 드럼 전문가입니다.",
    certifications: ["실용음악학 학사", "드럼 세션 경력 9년"],
    tags: ["록드럼", "재즈드럼", "리듬훈련"],
    availability: ["화요일 오전/오후", "목요일 오후", "토요일 오전"],
    lessonTypes: [
      {
        name: "1:1 개인 레슨",
        duration: 60,
        price: 48000,
        description: "록/재즈 드럼",
      },
    ],
    isActive: true,
  },
  {
    name: "강혜진",
    photo: "https://i.pravatar.cc/300?img=23",
    specialty: "음정 교정 전문",
    instruments: ["보컬"],
    pricePerHour: 65000,
    rating: 5.0,
    reviewCount: 178,
    location: "서울 강남구",
    experience: "13년",
    bio: "음정 불안정, 음역대 확장 전문 트레이너입니다. 1:1 맞춤 교정 프로그램 운영 중. 체계적인 진단과 개인별 맞춤 커리큘럼으로 단기간 내 눈에 띄는 향상을 경험할 수 있습니다.",
    certifications: ["실용음악학 석사", "음성치료사 자격증"],
    tags: ["음정교정", "음역확장", "발성교정"],
    availability: [
      "화요일 오후",
      "목요일 오전/오후",
      "금요일 오후",
      "토요일 오전",
    ],
    lessonTypes: [
      {
        name: "음정 교정 집중 레슨",
        duration: 60,
        price: 65000,
        description: "1:1 맞춤 교정 프로그램",
      },
      {
        name: "음역 확장 레슨",
        duration: 50,
        price: 60000,
        description: "고음/저음 확장 전문",
      },
    ],
    isActive: true,
  },
];

async function seedInstructors() {
  console.log("🎵 강사 데이터 Seeding 시작...");

  try {
    const instructorsRef = db.collection("instructors");

    for (const instructor of MOCK_INSTRUCTORS) {
      const docRef = await instructorsRef.add({
        ...instructor,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ ${instructor.name} 추가됨 (ID: ${docRef.id})`);
    }

    console.log("🎉 모든 강사 데이터가 추가되었습니다!");
  } catch (error) {
    console.error("❌ 에러 발생:", error);
  } finally {
    process.exit(0);
  }
}

seedInstructors();


