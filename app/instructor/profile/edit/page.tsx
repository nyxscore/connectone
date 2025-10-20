"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/hooks/useAuth";
import { storage, db } from "../../../../lib/api/firebase-ultra-safe";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  User,
  Camera,
  Music,
  DollarSign,
  Clock,
  Youtube,
  Link as LinkIcon,
  Award,
  Plus,
  X,
  Save,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
} from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import toast from "react-hot-toast";

interface LessonType {
  id: string;
  name: string;
  type: "single" | "monthly" | "pro";
  duration: number;
  price?: number | null;
  pricePerSession?: number;
  priceNegotiable?: boolean;
  monthlyOptions?: {
    sessions: number;
    discount: number;
    label: string;
  }[];
  description: string;
}

export default function InstructorProfileEdit() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // 기본 정보
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // 전문 분야 목록 (실제 레슨 카테고리 기반)
  const SPECIALTY_OPTIONS = {
    건반악기: ["피아노/키보드", "오르간", "아코디언"],
    현악기: [
      "바이올린",
      "비올라",
      "첼로",
      "콘트라베이스",
      "하프",
      "기타",
      "베이스기타",
      "우쿨렐레",
      "만돌린",
    ],
    관악기: [
      "플룻",
      "클라리넷",
      "오보에",
      "바순",
      "색소폰",
      "트럼펫",
      "트롬본",
      "호른",
      "튜바",
      "하모니카",
      "오카리나",
      "리코더",
      "팬플룻",
    ],
    타악기: ["드럼", "타악기", "칼림바"],
    보컬: ["보컬", "성악", "트로트", "랩", "비트박스", "성우"],
    국악: [
      "가야금",
      "거문고",
      "대금",
      "해금",
      "아쟁",
      "판소리",
      "민요",
      "정가",
      "사물놀이",
      "단소",
      "소금",
      "피리",
      "태평소",
      "생황",
    ],
    "작곡/이론": [
      "작곡/편곡",
      "미디/컴퓨터작곡",
      "시창청음/화성학",
      "작사",
      "지휘",
      "음향/레코딩",
      "디제잉",
    ],
  };

  // 포트폴리오 갤러리
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  // 영상 URL
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // 전문 분야 태그 (자유 입력, 인스타 태그 스타일)
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // 자격증
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState("");

  // 가능한 요일/시간
  const [availability, setAvailability] = useState<string[]>([]);
  const [newAvailability, setNewAvailability] = useState("");

  // 링크
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // 레슨 타입 (간소화된 체크박스 스타일)
  const [enableSingleLesson, setEnableSingleLesson] = useState(false);
  const [singleLessonPrice, setSingleLessonPrice] = useState<number>(50000);
  const [singleLessonDescription, setSingleLessonDescription] = useState("");

  const [enableMonthlyLesson, setEnableMonthlyLesson] = useState(false);
  const [monthlyLessonPrice, setMonthlyLessonPrice] = useState<number>(45000);
  const [monthlyLessonDescription, setMonthlyLessonDescription] = useState("");
  const [monthlyDiscount4, setMonthlyDiscount4] = useState<number>(0); // 주 1회 할인율
  const [monthlyDiscount8, setMonthlyDiscount8] = useState<number>(5); // 주 2회 할인율
  const [monthlyDiscount12, setMonthlyDiscount12] = useState<number>(10); // 주 3회 할인율

  const [enableProLesson, setEnableProLesson] = useState(false);
  const [proLessonPrice, setProLessonPrice] = useState<number>(100000);
  const [proLessonNegotiable, setProLessonNegotiable] = useState(false);
  const [proLessonDescription, setProLessonDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      // TODO: Firestore에서 기존 프로필 로드
      loadProfile();
    }
  }, [user, loading]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const instructorDoc = await getDoc(doc(db, "instructors", user.uid));

      if (instructorDoc.exists()) {
        const data = instructorDoc.data();

        // 기본 정보
        setName(data.name || user.displayName || "");
        setEmail(data.email || user.email || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setExperience(data.experience || "");

        // 레슨 과목
        setSpecialty(data.specialty || []);

        // 프로필 사진
        setPhotoUrl(data.photoUrl || "");

        // 포트폴리오
        setPortfolioImages(data.portfolioImages || []);
        setVideoUrls(data.videoUrls || []);

        // 전문 분야 태그
        setTags(data.tags || []);

        // 자격증
        setCertifications(data.certifications || []);

        // 가능한 요일/시간
        setAvailability(data.availability || []);

        // 레슨 타입 (기존 데이터에서 복원)
        if (data.lessonTypes && data.lessonTypes.length > 0) {
          data.lessonTypes.forEach((lesson: any) => {
            if (lesson.type === "single") {
              setEnableSingleLesson(true);
              setSingleLessonPrice(lesson.price || 50000);
              setSingleLessonDescription(lesson.description || "");
            } else if (lesson.type === "monthly") {
              setEnableMonthlyLesson(true);
              setMonthlyLessonPrice(lesson.pricePerSession || 45000);
              setMonthlyLessonDescription(lesson.description || "");
              // 할인율 복원
              if (lesson.monthlyOptions && lesson.monthlyOptions.length >= 3) {
                setMonthlyDiscount4(lesson.monthlyOptions[0]?.discount || 0);
                setMonthlyDiscount8(lesson.monthlyOptions[1]?.discount || 5);
                setMonthlyDiscount12(lesson.monthlyOptions[2]?.discount || 10);
              }
            } else if (lesson.type === "pro") {
              setEnableProLesson(true);
              setProLessonPrice(lesson.price || 100000);
              setProLessonNegotiable(lesson.priceNegotiable || false);
              setProLessonDescription(lesson.description || "");
            }
          });
        }

        toast.success("프로필 정보를 불러왔습니다!");
      } else {
        // 프로필이 없으면 기본값 설정
        setName(user.displayName || "");
        setEmail(user.email || "");
      }
    } catch (error) {
      console.error("❌ 프로필 로드 실패:", error);
      toast.error("프로필 정보를 불러오는데 실패했습니다.");
    }
  };

  // 프로필 사진 업로드
  const handleProfilePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 이미지 파일 타입 체크
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setUploadingPhoto(true);
    try {
      // 파일 이름을 timestamp로 변경하여 중복 방지
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const fileName = `profile_${timestamp}.${fileExtension}`;

      const storageRef = ref(
        storage,
        `instructors/${user.uid}/profile/${fileName}`
      );

      console.log("📤 업로드 시작:", fileName);
      await uploadBytes(storageRef, file);
      console.log("✅ 업로드 완료, URL 가져오는 중...");

      const url = await getDownloadURL(storageRef);
      console.log("✅ URL 받음:", url);

      setPhotoUrl(url);
      toast.success("프로필 사진이 업로드되었습니다!");
    } catch (error: any) {
      console.error("❌ 사진 업로드 실패:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "storage/unauthorized") {
        toast.error(
          "업로드 권한이 없습니다. Firebase Storage 규칙을 확인해주세요."
        );
      } else if (error.code === "storage/canceled") {
        toast.error("업로드가 취소되었습니다.");
      } else if (error.code === "storage/unknown") {
        toast.error("업로드 중 알 수 없는 오류가 발생했습니다.");
      } else {
        toast.error(
          `사진 업로드에 실패했습니다: ${error.message || "알 수 없는 오류"}`
        );
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 포트폴리오 이미지 업로드
  const handlePortfolioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || !user) return;

    // 최대 30장 체크
    if (portfolioImages.length + files.length > 30) {
      toast.error("포트폴리오 이미지는 최대 30장까지 업로드 가능합니다.");
      return;
    }

    setUploadingPortfolio(true);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        // 이미지 파일 타입 체크
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: 이미지 파일만 업로드 가능합니다.`);
          return null;
        }

        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}은(는) 5MB를 초과합니다.`);
          return null;
        }

        const timestamp = Date.now();
        const fileExtension = file.name.split(".").pop();
        const fileName = `portfolio_${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const storageRef = ref(
          storage,
          `instructors/${user.uid}/portfolio/${fileName}`
        );

        console.log(`📤 포트폴리오 업로드 시작: ${fileName}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        console.log(`✅ 업로드 완료: ${fileName}`);

        return url;
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);

      if (validUrls.length > 0) {
        setPortfolioImages([...portfolioImages, ...validUrls]);
        toast.success(`${validUrls.length}장의 이미지가 업로드되었습니다!`);
      }
    } catch (error: any) {
      console.error("❌ 포트폴리오 업로드 실패:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "storage/unauthorized") {
        toast.error(
          "업로드 권한이 없습니다. Firebase Storage 규칙을 확인해주세요."
        );
      } else {
        toast.error(
          `포트폴리오 업로드에 실패했습니다: ${error.message || "알 수 없는 오류"}`
        );
      }
    } finally {
      setUploadingPortfolio(false);
    }
  };

  // 포트폴리오 이미지 삭제
  const handleDeletePortfolioImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
    toast.success("이미지가 삭제되었습니다.");
  };

  // 영상 URL 추가
  const addVideoUrl = () => {
    if (!newVideoUrl.trim()) return;

    // YouTube/Vimeo URL 검증 (간단한 검증)
    if (
      !newVideoUrl.includes("youtube.com") &&
      !newVideoUrl.includes("youtu.be") &&
      !newVideoUrl.includes("vimeo.com")
    ) {
      toast.error("YouTube 또는 Vimeo 링크만 가능합니다.");
      return;
    }

    setVideoUrls([...videoUrls, newVideoUrl.trim()]);
    setNewVideoUrl("");
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  // 레슨 타입은 체크박스로 간소화 - 함수 불필요

  const handleSaveProfile = async () => {
    if (!user) return;

    // 필수 항목 검증
    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    if (specialty.length === 0) {
      toast.error("전문 분야를 최소 1개 선택해주세요.");
      return;
    }
    if (!bio.trim()) {
      toast.error("자기소개를 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const isNewInstructor = !user.isInstructor;

      // 레슨 타입을 체크박스 상태에서 생성
      const lessonTypes: LessonType[] = [];

      if (enableSingleLesson) {
        lessonTypes.push({
          id: "single",
          name: "1회 체험 레슨",
          type: "single",
          duration: 60,
          price: singleLessonPrice,
          description: singleLessonDescription || "1회 체험 레슨입니다.",
        });
      }

      if (enableMonthlyLesson) {
        lessonTypes.push({
          id: "monthly",
          name: "월 정기 레슨",
          type: "monthly",
          duration: 60,
          pricePerSession: monthlyLessonPrice,
          description: monthlyLessonDescription || "월 정기 레슨입니다.",
          monthlyOptions: [
            {
              sessions: 4,
              discount: monthlyDiscount4,
              label: "주 1회 (4회/월)",
            },
            {
              sessions: 8,
              discount: monthlyDiscount8,
              label: "주 2회 (8회/월)",
            },
            {
              sessions: 12,
              discount: monthlyDiscount12,
              label: "주 3회 (12회/월)",
            },
          ],
        });
      }

      if (enableProLesson) {
        lessonTypes.push({
          id: "pro",
          name: "프로 집중 레슨",
          type: "pro",
          duration: 60,
          price: proLessonNegotiable ? null : proLessonPrice,
          priceNegotiable: proLessonNegotiable,
          description: proLessonDescription || "프로 집중 레슨입니다.",
        });
      }

      // 1. Instructors 컬렉션에 강사 프로필 저장
      const instructorData = {
        userId: user.uid,
        name,
        email: user.email,
        specialty,
        bio,
        location,
        experience,
        photoUrl,
        portfolioImages,
        videoUrls,
        tags, // 인스타 스타일 태그 (예: ["꼼꼼한", "친근한", "경력10년"])
        certifications,
        availability,
        youtubeUrl,
        portfolioUrl,
        lessonTypes,
        rating: 0,
        reviewCount: 0,
        updatedAt: serverTimestamp(),
        ...(isNewInstructor && { createdAt: serverTimestamp() }),
      };

      await setDoc(doc(db, "instructors", user.uid), instructorData, {
        merge: true,
      });

      // 2. Users 컬렉션에 강사 상태 업데이트
      const userUpdateData: any = {
        isInstructor: true,
        updatedAt: serverTimestamp(),
      };

      if (isNewInstructor) {
        userUpdateData.instructorSince = serverTimestamp();
      }

      await setDoc(doc(db, "users", user.uid), userUpdateData, {
        merge: true,
      });

      console.log("✅ 강사 프로필 저장 완료");

      if (isNewInstructor) {
        toast.success("🎉 강사 등록이 완료되었습니다! 환영합니다!");
      } else {
        toast.success("프로필이 업데이트되었습니다!");
      }

      router.push("/instructor/dashboard");
    } catch (error) {
      console.error("❌ 프로필 저장 실패:", error);
      toast.error("프로필 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  // 태그 추가 (인스타 스타일: #으로 시작, 스페이스나 엔터로 구분)
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const currentInput = tagInput.trim();

      // 먼저 input 비우기 (중요!)
      setTagInput("");

      // 그 다음 태그 추가
      if (currentInput) {
        let tag = currentInput;

        // # 제거 (자동으로 붙일 거니까)
        if (tag.startsWith("#")) {
          tag = tag.substring(1);
        }

        if (tag && !tags.includes(tag)) {
          setTags([...tags, tag]);
          toast.success(`#${tag} 추가됨!`);
        }
      }
    }
  };

  const addTag = () => {
    const currentInput = tagInput.trim();

    if (currentInput) {
      let tag = currentInput;

      // # 제거 (자동으로 붙일 거니까)
      if (tag.startsWith("#")) {
        tag = tag.substring(1);
      }

      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
        setTagInput("");
        toast.success(`#${tag} 추가됨!`);
      }
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const addAvailability = () => {
    if (newAvailability.trim()) {
      setAvailability([...availability, newAvailability.trim()]);
      setNewAvailability("");
    }
  };

  const removeAvailability = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>돌아가기</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            강사 프로필 등록
          </h1>
          <p className="text-gray-600">
            학생들에게 보여질 프로필을 작성해주세요
          </p>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              기본 정보
            </h2>

            <div className="space-y-4">
              {/* 프로필 사진 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로필 사진 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="프로필"
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <Camera className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={profilePhotoInputRef}
                      onChange={handleProfilePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      onClick={() => profilePhotoInputRef.current?.click()}
                      variant="outline"
                      disabled={uploadingPhoto}
                      type="button"
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          업로드 중...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          사진 업로드
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">
                      JPG, PNG 파일 (최대 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="김민수"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 레슨 과목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  레슨 과목 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  {Object.entries(SPECIALTY_OPTIONS).map(
                    ([category, items]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">
                          {category}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {items.map(item => {
                            const isSelected = specialty.includes(item);
                            const canSelect =
                              specialty.length < 3 || isSelected;

                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSpecialty(
                                      specialty.filter(s => s !== item)
                                    );
                                  } else if (canSelect) {
                                    setSpecialty([...specialty, item]);
                                  } else {
                                    toast.error(
                                      "최대 3개까지 선택 가능합니다."
                                    );
                                  }
                                }}
                                disabled={!canSelect && !isSelected}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  isSelected
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : canSelect
                                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                      : "bg-gray-50 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
                {specialty.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">선택됨:</span>{" "}
                      {specialty.join(", ")} ({specialty.length}/3)
                    </p>
                  </div>
                )}
              </div>

              {/* 레슨 타입 설정 (체크박스 스타일) */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  레슨 타입 설정
                </h3>

                <div className="space-y-4">
                  {/* 1회 체험 레슨 */}
                  <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableSingleLesson}
                        onChange={e => setEnableSingleLesson(e.target.checked)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          1회 체험 레슨
                        </div>
                        {enableSingleLesson && (
                          <div className="mt-3 space-y-3 pl-1">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                비용 (원)
                              </label>
                              <input
                                type="number"
                                value={singleLessonPrice}
                                onChange={e =>
                                  setSingleLessonPrice(Number(e.target.value))
                                }
                                placeholder="50000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                설명
                              </label>
                              <textarea
                                value={singleLessonDescription}
                                onChange={e =>
                                  setSingleLessonDescription(e.target.value)
                                }
                                placeholder="1회 체험 레슨에 대한 설명을 입력하세요"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* 월 정기 레슨 */}
                  <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableMonthlyLesson}
                        onChange={e => setEnableMonthlyLesson(e.target.checked)}
                        className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          월 정기 레슨
                        </div>
                        {enableMonthlyLesson && (
                          <div className="mt-3 space-y-3 pl-1">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                회당 비용 (원)
                              </label>
                              <input
                                type="number"
                                value={monthlyLessonPrice}
                                onChange={e =>
                                  setMonthlyLessonPrice(Number(e.target.value))
                                }
                                placeholder="45000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>

                            {/* 할인율 설정 */}
                            <div className="bg-green-50 p-3 rounded-lg space-y-2">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                횟수별 할인율 (%)
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    주 1회 (4회/월)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={monthlyDiscount4}
                                    onChange={e =>
                                      setMonthlyDiscount4(
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    주 2회 (8회/월)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={monthlyDiscount8}
                                    onChange={e =>
                                      setMonthlyDiscount8(
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    주 3회 (12회/월)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={monthlyDiscount12}
                                    onChange={e =>
                                      setMonthlyDiscount12(
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                설명
                              </label>
                              <textarea
                                value={monthlyLessonDescription}
                                onChange={e =>
                                  setMonthlyLessonDescription(e.target.value)
                                }
                                placeholder="월 정기 레슨에 대한 설명을 입력하세요"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* 프로 집중 레슨 */}
                  <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableProLesson}
                        onChange={e => setEnableProLesson(e.target.checked)}
                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          프로 집중 레슨
                        </div>
                        {enableProLesson && (
                          <div className="mt-3 space-y-3 pl-1">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                비용 (원)
                              </label>
                              <input
                                type="number"
                                value={proLessonPrice}
                                onChange={e =>
                                  setProLessonPrice(Number(e.target.value))
                                }
                                placeholder="100000"
                                disabled={proLessonNegotiable}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                              />
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={proLessonNegotiable}
                                  onChange={e =>
                                    setProLessonNegotiable(e.target.checked)
                                  }
                                  className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  가격 협의 (학생과 상담 후 결정)
                                </span>
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                설명
                              </label>
                              <textarea
                                value={proLessonDescription}
                                onChange={e =>
                                  setProLessonDescription(e.target.value)
                                }
                                placeholder="프로 집중 레슨에 대한 설명을 입력하세요"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* 소개 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  자기소개 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="서울예대 실용음악과 졸업, 현직 보컬 트레이너로 10년간 300명 이상의 학생들을 지도했습니다."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 지역 & 경력 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지역 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="서울 강남구"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    경력 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder="10년"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 전문 분야 태그 (인스타 스타일) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">#</span>
              전문 분야 태그
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              태그를 입력하고 스페이스바나 엔터를 누르면 추가됩니다 (예: 꼼꼼한,
              친근한, 경력10년)
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagInput}
                  placeholder="#태그 입력 후 스페이스바 또는 엔터"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                />
                <Button
                  onClick={addTag}
                  variant="outline"
                  className="h-12 px-4 bg-purple-50 hover:bg-purple-100 border-purple-300"
                >
                  <Plus className="w-5 h-5 text-purple-600" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="font-semibold">#{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 자격증 및 경력 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              자격증 및 경력
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={e => setNewCertification(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && addCertification()}
                  placeholder="자격증 또는 경력 입력"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button onClick={addCertification} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <ul className="space-y-2">
                {certifications.map((cert, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-gray-900">{cert}</span>
                    <button
                      onClick={() => removeCertification(idx)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 가능한 요일/시간 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              가능한 요일/시간
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              학생들이 참고할 수 있도록 레슨 가능한 요일과 시간대를 입력해주세요
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newAvailability}
                  onChange={e => setNewAvailability(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && addAvailability()}
                  placeholder="예: 월요일 오후 2시~6시, 주말 오전 가능"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button onClick={addAvailability} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <ul className="space-y-2">
                {availability.map((time, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900 font-medium">{time}</span>
                    </div>
                    <button
                      onClick={() => removeAvailability(idx)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 링크 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-600" />
              링크
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Youtube className="w-4 h-4 inline-block mr-1 text-red-600" />
                  유튜브 채널
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  포트폴리오 링크
                </label>
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://portfolio.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 포트폴리오 갤러리 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              포트폴리오 갤러리 ({portfolioImages.length}/30)
            </h2>

            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  ref={portfolioInputRef}
                  onChange={handlePortfolioUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  onClick={() => portfolioInputRef.current?.click()}
                  variant="outline"
                  disabled={uploadingPortfolio || portfolioImages.length >= 30}
                  type="button"
                >
                  {uploadingPortfolio ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      이미지 추가 (최대 30장)
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  레슨 장면, 공연 사진, 수강생 후기 등을 업로드하세요 (각 5MB
                  이하)
                </p>
              </div>

              {/* 이미지 그리드 */}
              {portfolioImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolioImages.map((imageUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={imageUrl}
                        alt={`포트폴리오 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleDeletePortfolioImage(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 영상 URL */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              레슨 영상 ({videoUrls.length})
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={e => setNewVideoUrl(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && addVideoUrl()}
                  placeholder="YouTube 또는 Vimeo 링크 입력"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button onClick={addVideoUrl} variant="outline" type="button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                레슨 장면, 연주 영상 등을 YouTube 또는 Vimeo 링크로 추가하세요
              </p>

              {videoUrls.length > 0 && (
                <ul className="space-y-2">
                  {videoUrls.map((url, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 flex-1 overflow-hidden">
                        <Video className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {url}
                        </a>
                      </div>
                      <button
                        onClick={() => removeVideoUrl(idx)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* 저장 버튼 */}
          <div className="flex justify-end space-x-4">
            <Button onClick={() => router.back()} variant="outline" size="lg">
              취소
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={
                isSaving ||
                !name ||
                !specialty ||
                !bio ||
                !location ||
                !experience
              }
              size="lg"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  프로필 저장
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
