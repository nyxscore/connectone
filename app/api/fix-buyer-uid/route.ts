import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../lib/api/firebase";

export async function POST(request: NextRequest) {
  try {
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "상품 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 해당 상품 조회
    const itemRef = doc(db, "items", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const itemData = itemSnap.data();
    console.log("현재 상품 데이터:", itemData);

    // 2. 거래 내역에서 구매자 찾기
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("productId", "==", itemId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);

    if (transactionsSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "거래 내역을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 가장 최근 거래 내역 사용
    const latestTransaction = transactionsSnapshot.docs[0].data();
    console.log("거래 내역:", latestTransaction);
    console.log("거래 내역 buyerId:", latestTransaction.buyerId);
    console.log("현재 상품 buyerUid:", itemData.buyerUid);

    // 3. buyerUid가 null이면 상품의 buyerId나 거래 내역의 buyerId로 업데이트
    let buyerIdToUse = null;

    // 먼저 상품의 buyerId 확인
    if (itemData.buyerId) {
      buyerIdToUse = itemData.buyerId;
      console.log("상품의 buyerId 사용:", buyerIdToUse);
    }
    // 상품에 buyerId가 없으면 거래 내역의 buyerId 확인
    else if (latestTransaction.buyerId) {
      buyerIdToUse = latestTransaction.buyerId;
      console.log("거래 내역의 buyerId 사용:", buyerIdToUse);
    }

    if (!itemData.buyerUid && buyerIdToUse) {
      await updateDoc(itemRef, {
        buyerUid: buyerIdToUse,
        updatedAt: new Date(),
      });

      console.log(`buyerUid 업데이트 완료: ${buyerIdToUse}`);

      return NextResponse.json({
        success: true,
        message: "buyerUid가 성공적으로 업데이트되었습니다.",
        data: {
          itemId,
          buyerUid: buyerIdToUse,
          status: itemData.status,
        },
      });
    } else {
      console.log("❌ buyerUid 업데이트 불가능:", {
        itemDataBuyerUid: itemData.buyerUid,
        itemDataBuyerId: itemData.buyerId,
        transactionBuyerId: latestTransaction.buyerId,
        buyerIdToUse,
      });
      return NextResponse.json({
        success: false,
        message: "buyerUid를 업데이트할 수 없습니다.",
        data: {
          itemId,
          buyerUid: itemData.buyerUid,
          itemDataBuyerId: itemData.buyerId,
          transactionBuyerId: latestTransaction.buyerId,
          status: itemData.status,
        },
      });
    }
  } catch (error) {
    console.error("buyerUid 수정 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "buyerUid 수정에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
