import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/api/firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    // 테스트용 사용자 데이터 먼저 생성
    const testUsers = [
      {
        uid: "brunomars",
        email: "brunomars@example.com",
        nickname: "브루노마스",
        region: "서울시 강남구",
        grade: "Gold",
        tradesCount: 15,
        averageRating: 4.9,
        isPhoneVerified: true,
        isIdVerified: true,
        isBankVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uid: "test-user",
        email: "test@example.com",
        nickname: "테스트사용자",
        region: "서울시 강남구",
        grade: "Bronze",
        tradesCount: 5,
        averageRating: 4.8,
        isPhoneVerified: true,
        isIdVerified: true,
        isBankVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uid: "test-seller-1",
        email: "seller1@example.com",
        nickname: "음악가1",
        region: "서울 강남구",
        grade: "Gold",
        tradesCount: 25,
        averageRating: 4.9,
        isPhoneVerified: true,
        isIdVerified: true,
        isBankVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uid: "test-seller-2",
        email: "seller2@example.com",
        nickname: "피아니스트",
        region: "서울 서초구",
        grade: "Silver",
        tradesCount: 15,
        averageRating: 4.7,
        isPhoneVerified: true,
        isIdVerified: true,
        isBankVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uid: "test-seller-3",
        email: "seller3@example.com",
        nickname: "기타리스트",
        region: "부산 해운대구",
        grade: "Bronze",
        tradesCount: 8,
        averageRating: 4.5,
        isPhoneVerified: true,
        isIdVerified: false,
        isBankVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 사용자 데이터 저장
    for (const user of testUsers) {
      await setDoc(doc(db, "users", user.uid), user);
    }

    console.log("테스트 사용자 데이터가 생성되었습니다.");

    // 테스트용 상품 데이터
    const testProducts = [
      {
        title: "야마하 트럼펫 Xeno",
        price: 1500000,
        category: "관악",
        region: "서울 강남구",
        tradeOptions: ["직거래", "택배", "안전거래"],
        sellerId: "test-seller-1",
        description:
          "사용감 적고 상태 A급입니다. 정기적으로 관리해왔고, 케이스와 마우스피스 포함입니다.",
        images: [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
          "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "스타인웨이 피아노 모델 M",
        price: 25000000,
        category: "건반",
        region: "서울 서초구",
        tradeOptions: ["직거래", "화물운송", "안전거래"],
        sellerId: "test-seller-2",
        description:
          "전문가용 스타인웨이 피아노입니다. 3년간 사용했으며, 정기적으로 튜닝을 받아왔습니다.",
        images: [
          "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400",
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "깁슨 레스폴 스탠다드",
        price: 2800000,
        category: "현악",
        region: "부산 해운대구",
        tradeOptions: ["직거래", "택배"],
        sellerId: "test-seller-3",
        description:
          "클래식한 깁슨 레스폴입니다. 상태 양호하고, 하드케이스 포함입니다.",
        images: [
          "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 테스트용 판매자 데이터
    const testSellers = [
      {
        id: "test-seller-1",
        displayName: "김트럼펫",
        grade: "Gold",
        phoneVerified: true,
        idVerified: true,
        bankVerified: true,
      },
      {
        id: "test-seller-2",
        displayName: "이피아노",
        grade: "Silver",
        phoneVerified: true,
        idVerified: true,
        bankVerified: false,
      },
      {
        id: "test-seller-3",
        displayName: "박기타",
        grade: "Bronze",
        phoneVerified: true,
        idVerified: false,
        bankVerified: true,
      },
    ];

    // 상품 데이터 추가
    const productIds = [];
    for (const product of testProducts) {
      const docRef = await addDoc(collection(db, "products"), product);
      productIds.push(docRef.id);
    }

    // 판매자 데이터 추가
    for (const seller of testSellers) {
      await setDoc(doc(db, "users", seller.id), seller);
    }

    return NextResponse.json({
      success: true,
      message: "테스트 데이터가 성공적으로 추가되었습니다.",
      productIds,
    });
  } catch (error) {
    console.error("테스트 데이터 추가 실패:", error);
    return NextResponse.json(
      { success: false, error: "테스트 데이터 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}
