import { collection, query, where, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "./firebase-ultra-safe";

export interface MyItemsParams {
  userId: string;
  type: "all" | "selling" | "buying" | "trading" | "sold" | "payment_completed";
}

export async function getMyItems({ userId, type }: MyItemsParams) {
  try {
    const db = await getFirebaseDb();
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

      // 거래중인 상품 (구매자 관점)
      const buyerTradingQuery = query(
        collection(db, "items"),
        where("buyerUid", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const buyerTradingSnapshot = await getDocs(buyerTradingQuery);

      sellerTradingSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      buyerTradingSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      console.log(`거래중 상품: 판매자 ${sellerTradingSnapshot.size}개, 구매자 ${buyerTradingSnapshot.size}개`);
    }

    if (type === "all" || type === "buying") {
      // 구매중인 상품
      const buyingQuery = query(
        collection(db, "items"),
        where("buyerUid", "==", userId),
        where("status", "in", [
          "reserved",
          "paid_hold",
          "shipping",
          "escrow_completed",
        ])
      );

      const buyingSnapshot = await getDocs(buyingQuery);

      buyingSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      console.log(`구매중 상품: ${buyingSnapshot.size}개`);
    }

    if (type === "all" || type === "sold") {
      // 거래완료된 상품 (판매자와 구매자 모두)
      const soldQuery = query(
        collection(db, "items"),
        where("status", "==", "sold")
      );

      const soldSnapshot = await getDocs(soldQuery);

      // 사용자가 판매자이거나 구매자인 상품만 필터링
      soldSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.sellerUid === userId || data.buyerUid === userId) {
          items.push({ id: doc.id, ...data });
        }
      });

      console.log(`거래완료 상품: ${items.length}개`);
    }

    if (type === "payment_completed") {
      // 결제 완료된 상품 (판매자 관점)
      const paymentCompletedQuery = query(
        collection(db, "items"),
        where("sellerUid", "==", userId),
        where("status", "==", "escrow_completed")
      );

      const paymentCompletedSnapshot = await getDocs(paymentCompletedQuery);

      paymentCompletedSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      console.log(`결제 완료 상품: ${paymentCompletedSnapshot.size}개`);
    }

    // 중복 제거 (같은 상품이 여러 카테고리에 포함될 수 있음)
    const uniqueItems = items.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );

    // 최신순으로 정렬
    uniqueItems.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    });

    return {
      success: true,
      items: uniqueItems,
    };
  } catch (error) {
    console.error("상품 조회 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      items: [],
    };
  }
}
