import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(req: NextRequest) {
  try {
    const { itemId, userId } = await req.json();

    if (!itemId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const itemRef = doc(db, "items", itemId);

    await updateDoc(itemRef, {
      status: "active", // '판매중'으로 되돌리기
      buyerId: null, // 구매자 정보 제거
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel transaction" },
      { status: 500 }
    );
  }
}
