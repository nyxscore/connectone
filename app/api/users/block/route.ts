import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/api/firebase";

export async function POST(request: NextRequest) {
  try {
    const { userId, targetUserId, action } = await request.json();

    if (!userId || !targetUserId || !action) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (action !== "block" && action !== "unblock") {
      return NextResponse.json(
        { success: false, error: "잘못된 액션입니다." },
        { status: 400 }
      );
    }

    // 사용자 정보 확인
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const blockedUsers = userData.blockedUsers || [];

    if (action === "block") {
      // 이미 차단된 사용자인지 확인
      if (blockedUsers.includes(targetUserId)) {
        return NextResponse.json(
          { success: false, error: "이미 차단된 사용자입니다." },
          { status: 400 }
        );
      }

      // 차단 목록에 추가
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(targetUserId),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "사용자가 차단되었습니다.",
      });
    } else {
      // 차단 해제
      if (!blockedUsers.includes(targetUserId)) {
        return NextResponse.json(
          { success: false, error: "차단되지 않은 사용자입니다." },
          { status: 400 }
        );
      }

      // 차단 목록에서 제거
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(targetUserId),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "차단이 해제되었습니다.",
      });
    }
  } catch (error) {
    console.error("차단/차단해제 실패:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
