import { NextRequest, NextResponse } from "next/server";
import { updateAllUsersResponseRate } from "@/lib/profile/responseRate";

export async function POST(request: NextRequest) {
  try {
    console.log("전체 사용자 응답률 업데이트 API 호출");

    const result = await updateAllUsersResponseRate();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${result.updatedCount}명의 응답률이 업데이트되었습니다.`,
        updatedCount: result.updatedCount,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "응답률 업데이트에 실패했습니다.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("응답률 업데이트 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
