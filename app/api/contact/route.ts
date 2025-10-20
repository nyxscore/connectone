import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/api/firebase-lazy";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, category, subject, message, userId } = body;

    // 입력 검증
    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json(
        { error: "모든 필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    // Firestore에 문의 저장
    const contactData = {
      name,
      email,
      category,
      subject,
      message,
      userId: userId || null,
      status: "pending", // pending, in_progress, resolved
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const db = getDb();
    const docRef = await addDoc(collection(db, "contacts"), contactData);

    // TODO: 관리자에게 이메일 알림 전송 (선택사항)
    // await sendEmailToAdmin(contactData);

    // TODO: 사용자에게 확인 이메일 전송 (선택사항)
    // await sendConfirmationEmail(email, name);

    return NextResponse.json(
      {
        success: true,
        message: "문의가 성공적으로 접수되었습니다.",
        contactId: docRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("문의 접수 오류:", error);
    return NextResponse.json(
      { error: "문의 접수 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 관리자용 문의 목록 조회 (선택사항)
export async function GET(request: NextRequest) {
  try {
    // TODO: 관리자 권한 확인
    // const isAdmin = await checkAdminPermission(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    // }

    return NextResponse.json(
      {
        message: "관리자 기능은 추후 구현 예정입니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("문의 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "문의 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
