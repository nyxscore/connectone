"use client";

import { useState, useEffect } from "react";
import { Star, MapPin, Clock, Music, Search, Filter } from "lucide-react";
import { InstructorModal } from "../../components/lessons/InstructorModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { db } from "../../lib/api/firebase-ultra-safe";
import { collection, getDocs, query, where } from "firebase/firestore";

// Mock 강사 데이터
const MOCK_INSTRUCTORS = [
  {
    id: "1",
    name: "김민수",
    photo: "https://i.pravatar.cc/300?img=12",
    specialty: "보컬 트레이닝",
    instruments: ["보컬", "피아노"],
    pricePerHour: 50000,
    rating: 4.9,
    reviewCount: 127,
    location: "서울 강남구",
    experience: "10년",
    bio: "서울예대 실용음악과 졸업, 현직 보컬 트레이너로 10년간 300명 이상의 학생들을 지도했습니다.",
    certifications: ["실용음악학 학사", "보컬 트레이너 자격증"],
    tags: ["음정교정", "호흡법", "발성"],
    availability: [
      "월요일 오후",
      "화요일 오전/오후",
      "수요일 오후",
      "목요일 오전",
    ],
    lessonTypes: [
      {
        id: "trial",
        name: "1회 체험 레슨",
        type: "single",
        duration: 60,
        price: 50000,
        description: "첫 레슨을 부담 없이 시작해보세요. 1:1 맞춤 진단 포함.",
      },
      {
        id: "monthly",
        name: "월 정기 레슨",
        type: "monthly",
        duration: 60,
        pricePerSession: 45000,
        monthlyOptions: [
          { sessions: 4, discount: 0, label: "주 1회 (4회/월)" },
          { sessions: 8, discount: 5, label: "주 2회 (8회/월)" },
          { sessions: 12, discount: 10, label: "주 3회 (12회/월)" },
        ],
        description: "정기 레슨으로 꾸준히 실력을 향상시켜보세요.",
      },
      {
        id: "pro",
        name: "프로 집중 레슨",
        type: "pro",
        duration: 90,
        price: null,
        priceNegotiable: true,
        description:
          "입시, 오디션, 전문가 육성을 위한 1:1 맞춤 커리큘럼. 가격은 상담 후 결정됩니다.",
      },
    ],
    reviews: [
      {
        userName: "김**",
        rating: 5,
        comment:
          "호흡법부터 차근차근 알려주셔서 기초를 탄탄히 다질 수 있었습니다.",
        createdAt: "2025-02-28",
      },
    ],
  },
  {
    id: "2",
    name: "이지은",
    photo: "https://i.pravatar.cc/300?img=5",
    specialty: "재즈 보컬",
    instruments: ["보컬", "색소폰"],
    pricePerHour: 60000,
    rating: 4.8,
    reviewCount: 89,
    location: "서울 마포구",
    experience: "8년",
    bio: "버클리 음대 졸업, 재즈 보컬 및 즉흥 연주 전문가입니다.",
    certifications: ["버클리 음대 학사", "재즈 보컬 전문가"],
    tags: ["재즈", "즉흥연주", "스캣"],
    availability: ["월요일 오후", "수요일 오전", "금요일 오후"],
    lessonTypes: [
      {
        id: "trial",
        name: "1회 체험 레슨",
        type: "single",
        duration: 60,
        price: 60000,
        description: "재즈 보컬의 기초를 경험해보세요.",
      },
      {
        id: "monthly",
        name: "월 정기 레슨",
        type: "monthly",
        duration: 60,
        pricePerSession: 55000,
        monthlyOptions: [
          { sessions: 4, discount: 0, label: "주 1회 (4회/월)" },
          { sessions: 8, discount: 5, label: "주 2회 (8회/월)" },
        ],
        description: "재즈 보컬 정기 레슨으로 즉흥 연주 능력을 키워보세요.",
      },
      {
        id: "pro",
        name: "프로 집중 레슨",
        type: "pro",
        duration: 90,
        price: null,
        priceNegotiable: true,
        description: "재즈 전문가 양성 과정. 가격은 상담 후 결정됩니다.",
      },
    ],
    reviews: [],
  },
  {
    id: "3",
    name: "박준혁",
    photo: "https://i.pravatar.cc/300?img=33",
    specialty: "기타 레슨",
    instruments: ["기타", "베이스"],
    pricePerHour: 45000,
    rating: 4.7,
    reviewCount: 156,
    location: "서울 홍대",
    experience: "12년",
    bio: "현직 세션 기타리스트, 록/블루스/재즈 등 다양한 장르 지도 가능합니다.",
    certifications: ["실용음악학 학사", "세션 경력 12년"],
    tags: ["록", "블루스", "핑거스타일"],
    availability: ["화요일 오후", "목요일 오후", "토요일 오전/오후"],
    lessonTypes: [
      {
        id: "trial",
        name: "1회 체험 레슨",
        type: "single",
        duration: 60,
        price: 45000,
        description: "기타의 기초부터 차근차근 배워보세요.",
      },
      {
        id: "monthly",
        name: "월 정기 레슨",
        type: "monthly",
        duration: 60,
        pricePerSession: 40000,
        monthlyOptions: [
          { sessions: 4, discount: 0, label: "주 1회 (4회/월)" },
          { sessions: 8, discount: 8, label: "주 2회 (8회/월)" },
          { sessions: 12, discount: 12, label: "주 3회 (12회/월)" },
        ],
        description: "정기 레슨으로 다양한 장르를 마스터하세요.",
      },
    ],
    reviews: [],
  },
  {
    id: "4",
    name: "최서연",
    photo: "https://i.pravatar.cc/300?img=9",
    specialty: "피아노 레슨",
    instruments: ["피아노", "작곡"],
    pricePerHour: 55000,
    rating: 5.0,
    reviewCount: 203,
    location: "서울 강남구",
    experience: "15년",
    bio: "한국예술종합학교 졸업, 클래식 및 실용음악 피아노 전문가입니다.",
    certifications: ["한국예술종합학교 학사", "피아노 연주자 자격증"],
    tags: ["클래식", "재즈피아노", "작곡"],
    availability: ["월요일 오전", "수요일 오전", "금요일 오전"],
    lessonTypes: [
      {
        id: "trial",
        name: "1회 체험 레슨",
        type: "single",
        duration: 60,
        price: 55000,
        description: "클래식 또는 실용음악 피아노를 경험해보세요.",
      },
      {
        id: "monthly",
        name: "월 정기 레슨",
        type: "monthly",
        duration: 60,
        pricePerSession: 50000,
        monthlyOptions: [
          { sessions: 4, discount: 0, label: "주 1회 (4회/월)" },
          { sessions: 8, discount: 5, label: "주 2회 (8회/월)" },
        ],
        description: "정기 레슨으로 피아노 실력을 향상시켜보세요.",
      },
      {
        id: "pro",
        name: "프로 집중 레슨",
        type: "pro",
        duration: 90,
        price: null,
        priceNegotiable: true,
        description:
          "입시, 콩쿠르 준비를 위한 전문 레슨. 가격은 상담 후 결정됩니다.",
      },
    ],
    reviews: [],
  },
  {
    id: "5",
    name: "정우성",
    photo: "https://i.pravatar.cc/300?img=60",
    specialty: "드럼 레슨",
    instruments: ["드럼", "퍼커션"],
    pricePerHour: 48000,
    rating: 4.9,
    reviewCount: 112,
    location: "서울 신촌",
    experience: "9년",
    bio: "현직 드러머, 록/펑크/재즈 드럼 전문가입니다.",
    certifications: ["실용음악학 학사", "드럼 세션 경력 9년"],
    tags: ["록드럼", "재즈드럼", "리듬훈련"],
    availability: ["화요일 오후", "목요일 오후", "토요일 오전"],
    lessonTypes: [
      {
        id: "trial",
        name: "1회 체험 레슨",
        type: "single",
        duration: 60,
        price: 48000,
        description: "드럼의 기초 리듬과 비트를 배워보세요.",
      },
      {
        id: "monthly",
        name: "월 정기 레슨",
        type: "monthly",
        duration: 60,
        pricePerSession: 43000,
        monthlyOptions: [
          { sessions: 4, discount: 0, label: "주 1회 (4회/월)" },
          { sessions: 8, discount: 7, label: "주 2회 (8회/월)" },
        ],
        description: "정기 레슨으로 다양한 드럼 테크닉을 마스터하세요.",
      },
    ],
    reviews: [],
  },
  {
    id: "6",
    name: "강혜진",
    photo: "https://i.pravatar.cc/300?img=23",
    specialty: "음정 교정 전문",
    instruments: ["보컬"],
    pricePerHour: 65000,
    rating: 5.0,
    reviewCount: 178,
    location: "서울 강남구",
    experience: "13년",
    bio: "음정 불안정, 음역대 확장 전문 트레이너입니다. 1:1 맞춤 교정 프로그램 운영 중.",
    certifications: ["실용음악학 석사", "음성치료사 자격증"],
    tags: ["음정교정", "음역확장", "발성교정"],
    availability: [
      "월요일 오후",
      "화요일 오전/오후",
      "수요일 오후",
      "목요일 오전",
    ],
    lessonTypes: [
      {
        id: "trial",
        name: "1회 체험 레슨",
        type: "single",
        duration: 60,
        price: 65000,
        description: "음정 진단 및 맞춤 교정 플랜을 제공합니다.",
      },
      {
        id: "monthly",
        name: "월 정기 레슨",
        type: "monthly",
        duration: 60,
        pricePerSession: 60000,
        monthlyOptions: [
          { sessions: 4, discount: 0, label: "주 1회 (4회/월)" },
          { sessions: 8, discount: 5, label: "주 2회 (8회/월)" },
          { sessions: 12, discount: 10, label: "주 3회 (12회/월)" },
        ],
        description: "정기 레슨으로 체계적인 음정 교정을 진행합니다.",
      },
      {
        id: "pro",
        name: "프로 집중 레슨",
        type: "pro",
        duration: 90,
        price: null,
        priceNegotiable: true,
        description:
          "입시, 오디션 대비 집중 음정 교정. 가격은 상담 후 결정됩니다.",
      },
    ],
    reviews: [
      {
        userName: "박**",
        rating: 5,
        comment: "음정이 정말 많이 좋아졌어요! 강혜진 선생님 최고!",
        createdAt: "2025-03-05",
      },
    ],
  },
];

export default function LessonsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<string>("전체");
  const [priceRange, setPriceRange] = useState<string>("전체");
  const [sortBy, setSortBy] = useState<string>("추천순");
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore에서 강사 목록 불러오기
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const instructorsRef = collection(db, "instructors");
        const snapshot = await getDocs(instructorsRef);

        const instructorsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Firestore specialty는 배열이므로 첫 번째 항목을 specialty로
          specialty: Array.isArray(doc.data().specialty)
            ? doc.data().specialty.join(", ")
            : doc.data().specialty,
          // instruments는 specialty 배열 그대로 사용
          instruments: doc.data().specialty || [],
          // pricePerHour는 lessonTypes에서 계산
          pricePerHour:
            doc.data().lessonTypes && doc.data().lessonTypes.length > 0
              ? doc.data().lessonTypes[0].price ||
                doc.data().lessonTypes[0].pricePerSession ||
                0
              : 0,
          photo: doc.data().photoUrl || "",
          reviews: [], // 리뷰는 추후 구현
        }));

        // Mock 데이터와 실제 데이터 합치기
        setInstructors([...instructorsList, ...MOCK_INSTRUCTORS]);
      } catch (error) {
        console.error("❌ 강사 목록 로드 실패:", error);
        toast.error("강사 목록을 불러오는데 실패했습니다.");
        // 실패 시 Mock 데이터만 표시
        setInstructors(MOCK_INSTRUCTORS);
      } finally {
        setIsLoading(false);
      }
    };

    loadInstructors();
  }, []);

  // 필터링된 강사 목록
  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch =
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesInstrument =
      selectedInstrument === "전체" ||
      instructor.instruments.includes(selectedInstrument);

    const matchesPrice =
      priceRange === "전체" ||
      (priceRange === "~40000" && instructor.pricePerHour <= 40000) ||
      (priceRange === "40000~50000" &&
        instructor.pricePerHour > 40000 &&
        instructor.pricePerHour <= 50000) ||
      (priceRange === "50000~60000" &&
        instructor.pricePerHour > 50000 &&
        instructor.pricePerHour <= 60000) ||
      (priceRange === "60000~" && instructor.pricePerHour > 60000);

    return matchesSearch && matchesInstrument && matchesPrice;
  });

  // 정렬
  const sortedInstructors = [...filteredInstructors].sort((a, b) => {
    if (sortBy === "추천순") {
      return b.rating * b.reviewCount - a.rating * a.reviewCount;
    } else if (sortBy === "평점순") {
      return b.rating - a.rating;
    } else if (sortBy === "리뷰순") {
      return b.reviewCount - a.reviewCount;
    } else if (sortBy === "낮은가격순") {
      return a.pricePerHour - b.pricePerHour;
    } else if (sortBy === "높은가격순") {
      return b.pricePerHour - a.pricePerHour;
    }
    return 0;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">강사 목록 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-4">개인 레슨</h1>
          <p className="text-lg text-blue-100">
            전문 강사와 함께 음악 실력을 향상시켜보세요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="강사 이름, 전문 분야, 태그 검색..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 악기 필터 */}
            <div>
              <select
                value={selectedInstrument}
                onChange={e => setSelectedInstrument(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="전체">모든 악기</option>
                <option value="보컬">보컬</option>
                <option value="피아노">피아노</option>
                <option value="기타">기타</option>
                <option value="드럼">드럼</option>
                <option value="베이스">베이스</option>
                <option value="색소폰">색소폰</option>
              </select>
            </div>

            {/* 가격 필터 */}
            <div>
              <select
                value={priceRange}
                onChange={e => setPriceRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="전체">모든 가격</option>
                <option value="~40000">~40,000원</option>
                <option value="40000~50000">40,000~50,000원</option>
                <option value="50000~60000">50,000~60,000원</option>
                <option value="60000~">60,000원~</option>
              </select>
            </div>
          </div>

          {/* 정렬 */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총{" "}
              <span className="font-semibold">{sortedInstructors.length}</span>
              명의 강사
            </p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="추천순">추천순</option>
              <option value="평점순">평점순</option>
              <option value="리뷰순">리뷰순</option>
              <option value="낮은가격순">낮은 가격순</option>
              <option value="높은가격순">높은 가격순</option>
            </select>
          </div>
        </div>

        {/* 강사 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedInstructors.map(instructor => (
            <button
              key={instructor.id}
              onClick={() => {
                setSelectedInstructor(instructor);
                setIsModalOpen(true);
              }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group text-left w-full"
            >
              {/* 프로필 사진 */}
              <div className="relative h-48 overflow-hidden bg-gray-200">
                <img
                  src={instructor.photo}
                  alt={instructor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 shadow-md">
                  {instructor.lessonTypes.find(
                    (lt: any) => lt.type === "monthly"
                  )
                    ? `${instructor.lessonTypes
                        .find((lt: any) => lt.type === "monthly")
                        .pricePerSession.toLocaleString()}원/회~`
                    : instructor.lessonTypes.find(
                          (lt: any) => lt.priceNegotiable
                        )
                      ? "가격 협의"
                      : `${instructor.pricePerHour.toLocaleString()}원/시간`}
                </div>
              </div>

              {/* 정보 */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {instructor.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {instructor.specialty}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold text-gray-900">
                      {instructor.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-500 space-x-3 mb-3">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{instructor.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{instructor.experience}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  {instructor.instruments.slice(0, 3).map((instrument, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      <Music className="w-3 h-3" />
                      <span>{instrument}</span>
                    </span>
                  ))}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {instructor.bio}
                </p>

                <div className="flex flex-wrap gap-1">
                  {instructor.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    리뷰 {instructor.reviewCount}개
                  </span>
                  <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 결과 없음 */}
        {sortedInstructors.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600">다른 검색어나 필터를 시도해보세요</p>
          </div>
        )}

        {/* 강사 상세 모달 */}
        <InstructorModal
          instructor={selectedInstructor}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onBookLesson={(instructor, lessonType) => {
            toast.success(`${instructor.name} 강사님과 상담을 시작합니다!`);
            // 채팅방으로 이동하면서 레슨 상담 정보 전달
            router.push(
              `/lessons/consult?instructor=${instructor.id}&lessonType=${lessonType.id}`
            );
          }}
        />
      </div>
    </div>
  );
}
