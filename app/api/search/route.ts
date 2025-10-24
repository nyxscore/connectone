import { NextRequest, NextResponse } from "next/server";

// 임시 검색 데이터 (실제로는 데이터베이스에서 가져와야 함)
const mockProducts = [
  {
    id: "1",
    title: "Fender Stratocaster 일렉기타",
    description: "상태 좋은 펜더 스트라토캐스터입니다. 픽업 교체 완료, 케이스 포함",
    price: 850000,
    location: "서울 강남구",
    category: "기타",
    imageUrl: "/logo1.png",
    sellerName: "기타맨",
    createdAt: "2024-01-15",
    status: "판매중"
  },
  {
    id: "2",
    title: "Yamaha P-125 디지털피아노",
    description: "거의 새것 같은 야마하 디지털피아노. 스탠드, 벤치 포함",
    price: 650000,
    location: "서울 서초구",
    category: "피아노",
    imageUrl: "/logo2.png",
    sellerName: "피아니스트",
    createdAt: "2024-01-14",
    status: "판매중"
  },
  {
    id: "3",
    title: "Pearl Export 드럼세트",
    description: "5피스 드럼세트. 심벌즈, 스틱 포함. 상태 양호",
    price: 1200000,
    location: "경기 성남시",
    category: "드럼",
    imageUrl: "/logo1.png",
    sellerName: "드러머킴",
    createdAt: "2024-01-13",
    status: "판매중"
  },
  {
    id: "4",
    title: "Martin D-28 어쿠스틱기타",
    description: "마틴 D-28 클래식 어쿠스틱기타. 보관 상태 우수",
    price: 2500000,
    location: "부산 해운대구",
    category: "기타",
    imageUrl: "/logo2.png",
    sellerName: "어쿠스틱러버",
    createdAt: "2024-01-12",
    status: "판매중"
  },
  {
    id: "5",
    title: "Yamaha YAS-62 색소폰",
    description: "야마하 알토 색소폰. 케이스, 마우스피스 포함",
    price: 1800000,
    location: "대구 수성구",
    category: "관악기",
    imageUrl: "/logo1.png",
    sellerName: "색소폰맨",
    createdAt: "2024-01-11",
    status: "판매중"
  },
  {
    id: "6",
    title: "Marshall JCM800 앰프",
    description: "마샬 JCM800 헤드. 튜브 교체 완료, 상태 양호",
    price: 950000,
    location: "인천 연수구",
    category: "음향장비",
    imageUrl: "/logo2.png",
    sellerName: "앰프마스터",
    createdAt: "2024-01-10",
    status: "판매중"
  },
  {
    id: "7",
    title: "Stradivarius 바이올린 (복제품)",
    description: "스트라디바리우스 복제 바이올린. 보우, 케이스 포함",
    price: 3200000,
    location: "서울 종로구",
    category: "현악기",
    imageUrl: "/logo1.png",
    sellerName: "바이올리니스트",
    createdAt: "2024-01-09",
    status: "판매중"
  },
  {
    id: "8",
    title: "가야금 (25현)",
    description: "전통 가야금. 현 교체 완료, 상태 우수",
    price: 1500000,
    location: "전주시",
    category: "국악기",
    imageUrl: "/logo2.png",
    sellerName: "국악사랑",
    createdAt: "2024-01-08",
    status: "판매중"
  },
  {
    id: "9",
    title: "Korg Kronos 워크스테이션",
    description: "코그 크로노스 88키. 페달, 케이스 포함",
    price: 2800000,
    location: "서울 마포구",
    category: "키보드",
    imageUrl: "/logo1.png",
    sellerName: "키보드킹",
    createdAt: "2024-01-07",
    status: "판매중"
  },
  {
    id: "10",
    title: "Shure SM58 마이크",
    description: "슈어 SM58 다이나믹 마이크. 케이스 포함",
    price: 120000,
    location: "대전 유성구",
    category: "음향장비",
    imageUrl: "/logo2.png",
    sellerName: "마이크전문",
    createdAt: "2024-01-06",
    status: "판매중"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const location = searchParams.get("location") || "";
    const status = searchParams.get("status") || "all";

    // 검색 로직
    let results = mockProducts;

    // 키워드 검색
    if (query) {
      const searchTerms = query.toLowerCase().split(" ");
      results = results.filter(product => {
        const searchText = `${product.title} ${product.description} ${product.category} ${product.sellerName}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });
    }

    // 카테고리 필터
    if (category) {
      results = results.filter(product => product.category === category);
    }

    // 가격 필터
    if (minPrice) {
      const min = parseInt(minPrice);
      results = results.filter(product => product.price >= min);
    }
    if (maxPrice) {
      const max = parseInt(maxPrice);
      results = results.filter(product => product.price <= max);
    }

    // 지역 필터
    if (location) {
      results = results.filter(product => 
        product.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // 상태 필터
    if (status !== "all") {
      results = results.filter(product => product.status === status);
    }

    // 검색 결과 정렬 (최신순)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // SEO 최적화를 위한 메타데이터
    const metadata = {
      query,
      totalResults: results.length,
      searchTime: new Date().toISOString(),
      filters: {
        category,
        minPrice,
        maxPrice,
        location,
        status
      }
    };

    return NextResponse.json({
      success: true,
      results,
      metadata
    });

  } catch (error) {
    console.error("검색 API 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "검색 중 오류가 발생했습니다.",
        results: []
      },
      { status: 500 }
    );
  }
}

// 검색 통계를 위한 POST 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, results, filters } = body;

    // 검색 로그 저장 (실제로는 데이터베이스에 저장)
    console.log("검색 로그:", {
      query,
      resultsCount: results?.length || 0,
      filters,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("검색 로그 저장 오류:", error);
    return NextResponse.json(
      { success: false, error: "검색 로그 저장 실패" },
      { status: 500 }
    );
  }
}
