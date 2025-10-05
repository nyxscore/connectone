import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/api/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    console.log("이미지 데이터 수정 시작");

    // items 컬렉션에서 모든 상품 조회
    const itemsRef = collection(db, "items");
    const querySnapshot = await getDocs(itemsRef);

    let fixedCount = 0;
    const errors: string[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      try {
        const data = docSnapshot.data();

        // images 필드가 객체 형태인지 확인 (success, urls, errors 속성이 있는지)
        if (
          data.images &&
          typeof data.images === "object" &&
          data.images.urls &&
          Array.isArray(data.images.urls)
        ) {
          console.log(`상품 ${docSnapshot.id} 수정 중:`, {
            before: data.images,
            after: data.images.urls,
          });

          // images 필드를 urls 배열로 수정
          await updateDoc(doc(db, "items", docSnapshot.id), {
            images: data.images.urls,
          });

          fixedCount++;
        }
      } catch (error) {
        console.error(`상품 ${docSnapshot.id} 수정 실패:`, error);
        errors.push(
          `상품 ${docSnapshot.id}: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
        );
      }
    }

    console.log(`총 ${fixedCount}개의 상품 이미지 데이터가 수정되었습니다.`);

    return NextResponse.json({
      success: true,
      message: `${fixedCount}개의 상품 이미지 데이터가 수정되었습니다.`,
      fixedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("이미지 데이터 수정 실패:", error);
    return NextResponse.json(
      {
        success: false,
        message: "이미지 데이터 수정 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
