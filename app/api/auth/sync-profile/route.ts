import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "../../../lib/api/firebase-ultra-safe";

export async function POST(request: NextRequest) {
  try {
    const { uid, email, name, image, provider, providerId } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const db = await getFirebaseDb();
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    const userData = {
      uid,
      email,
      displayName: name || email.split("@")[0] || "사용자",
      photoURL: image || undefined,
      provider: provider || "google",
      providerId: providerId || uid,
      isEmailVerified: true,
      role: "user",
      status: "active",
      updatedAt: new Date(),
    };

    if (userSnap.exists()) {
      // 기존 사용자 - 프로필 업데이트
      await setDoc(userRef, {
        ...userData,
        lastLoginAt: new Date(),
      }, { merge: true });
      console.log("기존 사용자 프로필 업데이트 완료:", uid);
    } else {
      // 신규 사용자 - 프로필 생성
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
      console.log("신규 사용자 프로필 생성 완료:", uid);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("프로필 동기화 실패:", error);
    return NextResponse.json(
      { success: false, error: "프로필 동기화에 실패했습니다." },
      { status: 500 }
    );
  }
}
