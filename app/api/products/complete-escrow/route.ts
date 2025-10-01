import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(req: NextRequest) {
  try {
    const { itemId, buyerUid } = await req.json();

    if (!itemId || !buyerUid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const itemRef = doc(db, "items", itemId);

    await updateDoc(itemRef, {
      status: "escrow_completed", // 안전결제 완료 상태
      buyerId: buyerUid,
      escrowCompletedAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing escrow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete escrow" },
      { status: 500 }
    );
  }
}
