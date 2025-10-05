import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../lib/api/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "상품 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 상품 정보 조회
    const itemRef = doc(db, "items", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const itemData = itemSnap.data();
    console.log("상품 데이터:", itemData);

    // 2. 거래 내역 조회
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("productId", "==", itemId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);

    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });

    console.log("거래 내역:", transactions);

    // 3. 채팅 내역 조회 (구매자 정보 확인용)
    const chatsQuery = query(
      collection(db, "chats"),
      where("itemId", "==", itemId)
    );
    const chatsSnapshot = await getDocs(chatsQuery);

    const chats = [];
    chatsSnapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });

    console.log("채팅 내역:", chats);

    return NextResponse.json({
      success: true,
      data: {
        item: itemData,
        transactions,
        chats,
        summary: {
          itemBuyerUid: itemData.buyerUid,
          itemBuyerId: itemData.buyerId,
          transactionCount: transactions.length,
          chatCount: chats.length,
          firstTransaction: transactions[0] || null,
          firstChat: chats[0] || null,
        },
      },
    });
  } catch (error) {
    console.error("디버깅 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "디버깅에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
