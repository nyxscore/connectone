import { NextRequest, NextResponse } from "next/server";

// 인기 검색어 및 자동완성 데이터
const searchSuggestions = {
  // 인기 검색어 (검색량 많은 키워드)
  popular: [
    "중고 기타", "중고 피아노", "중고 드럼", "일렉기타", "어쿠스틱기타",
    "디지털피아노", "음향장비", "앰프", "마이크", "키보드", "바이올린",
    "색소폰", "트럼펫", "플루트", "국악기", "가야금", "거문고", "해금",
    "전자드럼", "어쿠스틱드럼", "클래식기타", "베이스기타", "우쿨렐레",
    "하모니카", "아코디언", "오르간", "신시사이저", "워크스테이션",
    "믹서", "스피커", "이어폰", "헤드폰", "이펙터", "튜너"
  ],

  // 카테고리별 검색어
  categories: {
    "기타": ["일렉기타", "어쿠스틱기타", "클래식기타", "베이스기타", "우쿨렐레", "12현기타", "7현기타"],
    "피아노": ["디지털피아노", "어쿠스틱피아노", "전자피아노", "업라이트피아노", "그랜드피아노"],
    "드럼": ["전자드럼", "어쿠스틱드럼", "드럼세트", "심벌즈", "드럼스틱", "드럼패드"],
    "관악기": ["색소폰", "트럼펫", "플루트", "클라리넷", "오보에", "바순", "호른", "트롬본"],
    "현악기": ["바이올린", "비올라", "첼로", "콘트라베이스", "하프", "만돌린"],
    "음향장비": ["앰프", "마이크", "믹서", "스피커", "이어폰", "헤드폰", "이펙터", "튜너"],
    "국악기": ["가야금", "거문고", "해금", "아쟁", "단소", "피리", "장구", "북"],
    "키보드": ["신시사이저", "워크스테이션", "오르간", "하모니움", "아코디언"]
  },

  // 브랜드별 검색어
  brands: {
    "기타": ["Fender", "Gibson", "Martin", "Taylor", "Yamaha", "Ibanez", "Epiphone", "Squier"],
    "피아노": ["Yamaha", "Kawai", "Roland", "Casio", "Korg", "Nord", "Kurzweil"],
    "드럼": ["Pearl", "Tama", "DW", "Gretsch", "Ludwig", "Yamaha", "Roland", "Alesis"],
    "관악기": ["Yamaha", "Selmer", "Buffet", "Conn", "Bach", "King", "Jupiter"],
    "현악기": ["Stradivarius", "Guarneri", "Amati", "Yamaha", "Eastman", "Cremona"],
    "음향장비": ["Marshall", "Fender", "Vox", "Orange", "Shure", "Sennheiser", "Audio-Technica"],
    "키보드": ["Korg", "Roland", "Yamaha", "Nord", "Kurzweil", "Moog", "Sequential"]
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, popular, category, brand

    let suggestions: string[] = [];

    if (!query) {
      // 검색어가 없으면 인기 검색어 반환
      suggestions = searchSuggestions.popular.slice(0, 10);
    } else {
      const searchTerm = query.toLowerCase();

      // 모든 검색어에서 매칭되는 것 찾기
      const allSuggestions = [
        ...searchSuggestions.popular,
        ...Object.values(searchSuggestions.categories).flat(),
        ...Object.values(searchSuggestions.brands).flat()
      ];

      // 검색어와 매칭되는 제안들 필터링
      suggestions = allSuggestions
        .filter(suggestion => suggestion.toLowerCase().includes(searchTerm))
        .slice(0, 10);

      // 매칭되는 것이 없으면 인기 검색어 반환
      if (suggestions.length === 0) {
        suggestions = searchSuggestions.popular.slice(0, 5);
      }
    }

    // 중복 제거 및 정렬
    suggestions = [...new Set(suggestions)].slice(0, 10);

    return NextResponse.json({
      success: true,
      suggestions,
      query,
      type
    });

  } catch (error) {
    console.error("검색 제안 API 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "검색 제안을 가져오는 중 오류가 발생했습니다.",
        suggestions: []
      },
      { status: 500 }
    );
  }
}

// 검색어 통계를 위한 POST 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, selectedSuggestion, searchType } = body;

    // 검색어 통계 로그 (실제로는 데이터베이스에 저장)
    console.log("검색 제안 사용 로그:", {
      originalQuery: query,
      selectedSuggestion,
      searchType,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("검색 제안 로그 저장 오류:", error);
    return NextResponse.json(
      { success: false, error: "검색 제안 로그 저장 실패" },
      { status: 500 }
    );
  }
}
