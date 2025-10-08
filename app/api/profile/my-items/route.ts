import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getFirebaseDb as getDb } from "../../../../lib/api/firebase-ultra-safe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "all"; // all, selling, buying, trading, sold

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    let items: any[] = [];

    if (type === "all" || type === "selling") {
      // 판매중인 상품 (active 상태만)
      const sellingQuery = query(
        collection(db, "items"),
        where("sellerUid", "==", userId),
        where("status", "==", "active")
      );
      const sellingSnapshot = await getDocs(sellingQuery);
      sellingSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      console.log(`판매중 상품: ${sellingSnapshot.size}개`);
    }

    if (type === "all" || type === "trading") {
      // 거래중인 상품 (판매자 관점)
      const sellerTradingQuery = query(
        collection(db, "items"),
        where("sellerUid", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const sellerTradingSnapshot = await getDocs(sellerTradingQuery);

      // 판매자 관점 거래중 상품 추가
      sellerTradingSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      console.log(`거래중 상품 (판매자): ${sellerTradingSnapshot.size}개`);
    }

    if (type === "all" || type === "buying") {
      // 구매중인 상품 (구매자 관점) - buyerUid와 buyerId 두 필드 모두 확인
      const buyingUidQuery = query(
        collection(db, "items"),
        where("buyerUid", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const buyingIdQuery = query(
        collection(db, "items"),
        where("buyerId", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const [buyingUidSnapshot, buyingIdSnapshot] = await Promise.all([
        getDocs(buyingUidQuery),
        getDocs(buyingIdQuery),
      ]);

      // buyerUid로 찾은 상품들 추가
      buyingUidSnapshot.forEach(doc => {
        if (!items.find(item => item.id === doc.id)) {
          items.push({ id: doc.id, ...doc.data() });
        }
      });

      // buyerId로 찾은 상품들 추가 (중복 제거)
      buyingIdSnapshot.forEach(doc => {
        if (!items.find(item => item.id === doc.id)) {
          items.push({ id: doc.id, ...doc.data() });
        }
      });

      console.log(
        `구매중 상품: buyerUid ${buyingUidSnapshot.size}개, buyerId ${buyingIdSnapshot.size}개`
      );
    }

    if (type === "sold") {
      // 거래완료된 상품 (판매자 관점 + 구매자 관점)
      const sellerSoldQuery = query(
        collection(db, "items"),
        where("sellerUid", "==", userId),
        where("status", "==", "sold")
      );

      const buyerSoldUidQuery = query(
        collection(db, "items"),
        where("buyerUid", "==", userId),
        where("status", "==", "sold")
      );

      const buyerSoldIdQuery = query(
        collection(db, "items"),
        where("buyerId", "==", userId),
        where("status", "==", "sold")
      );

      const [sellerSoldSnapshot, buyerSoldUidSnapshot, buyerSoldIdSnapshot] =
        await Promise.all([
          getDocs(sellerSoldQuery),
          getDocs(buyerSoldUidQuery),
          getDocs(buyerSoldIdQuery),
        ]);

      // 판매자 관점 거래완료 상품 추가
      sellerSoldSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      // 구매자 관점 거래완료 상품 추가 (buyerUid, 중복 제거)
      buyerSoldUidSnapshot.forEach(doc => {
        if (!items.find(item => item.id === doc.id)) {
          items.push({ id: doc.id, ...doc.data() });
        }
      });

      // 구매자 관점 거래완료 상품 추가 (buyerId, 중복 제거)
      buyerSoldIdSnapshot.forEach(doc => {
        if (!items.find(item => item.id === doc.id)) {
          items.push({ id: doc.id, ...doc.data() });
        }
      });

      console.log(
        `거래완료 상품: 판매자 ${sellerSoldSnapshot.size}개, 구매자 buyerUid ${buyerSoldUidSnapshot.size}개, buyerId ${buyerSoldIdSnapshot.size}개`
      );
    }

    // 중복 제거 (같은 상품이 여러 카테고리에 속할 수 있음)
    const uniqueItems = items.filter(
      (item, index, self) => index === self.findIndex(t => t.id === item.id)
    );

    // 정렬 (createdAt 기준 내림차순)
    uniqueItems.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    console.log(
      `✅ 프로필 상품 조회 완료: userId=${userId}, type=${type}, 개수=${uniqueItems.length}`
    );

    return NextResponse.json({
      success: true,
      items: uniqueItems,
    });
  } catch (error) {
    console.error("❌ 프로필 상품 조회 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "상품 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
