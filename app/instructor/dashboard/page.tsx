"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { db } from "../../../lib/api/firebase-ultra-safe";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  MessageSquare,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Bell,
  MapPin,
  Briefcase,
  Award,
  Star,
  Edit,
  DollarSign,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import toast from "react-hot-toast";

interface ConsultationRequest {
  id: string;
  chatId: string;
  studentId: string;
  studentName: string;
  lessonTypeId: string;
  instructorName: string;
  message: string;
  timestamp: any;
  isRead: boolean;
}

interface InstructorProfile {
  name: string;
  email: string;
  specialty: string[];
  bio: string;
  location: string;
  experience: string;
  photoUrl?: string;
  tags: string[];
  certifications: string[];
  availability: string[];
  lessonTypes: any[];
  rating: number;
  reviewCount: number;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"consultations" | "profile">(
    "consultations"
  );
  const [instructorProfile, setInstructorProfile] =
    useState<InstructorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      loadConsultations();
      loadInstructorProfile();
    }
  }, [user, loading]);

  const loadInstructorProfile = async () => {
    if (!user) return;

    try {
      const instructorDoc = await getDoc(doc(db, "instructors", user.uid));

      if (instructorDoc.exists()) {
        setInstructorProfile(instructorDoc.data() as InstructorProfile);
      }
    } catch (error) {
      console.error("❌ 강사 프로필 로드 실패:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadConsultations = async () => {
    if (!user) return;

    try {
      // 1. 강사가 참여한 모든 채팅방 찾기
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
      );

      const unsubscribe = onSnapshot(q, async chatsSnapshot => {
        const allConsultations: ConsultationRequest[] = [];

        // 2. 각 채팅방의 레슨 상담 메시지 찾기
        for (const chatDoc of chatsSnapshot.docs) {
          const messagesRef = collection(db, "chats", chatDoc.id, "messages");
          const messagesQuery = query(
            messagesRef,
            where("type", "==", "lesson_consultation"),
            orderBy("timestamp", "desc")
          );

          const messagesSnapshot = await getDocs(messagesQuery);

          messagesSnapshot.forEach(msgDoc => {
            const msgData = msgDoc.data();
            allConsultations.push({
              id: msgDoc.id,
              chatId: chatDoc.id,
              studentId: msgData.studentId || "",
              studentName: msgData.studentName || "학생",
              lessonTypeId: msgData.lessonTypeId || "",
              instructorName: msgData.instructorName || "",
              message: msgData.message || "",
              timestamp: msgData.timestamp,
              isRead: msgData.isRead || false,
            });
          });
        }

        // 3. 최신순 정렬
        allConsultations.sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return b.timestamp.seconds - a.timestamp.seconds;
        });

        setConsultations(allConsultations);
        setUnreadCount(allConsultations.filter(c => !c.isRead).length);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("❌ 상담 목록 로드 실패:", error);
      toast.error("상담 목록을 불러오는데 실패했습니다.");
      setIsLoading(false);
    }
  };

  const handleOpenChat = (chatId: string) => {
    router.push(`/chat?chatId=${chatId}`);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">강사 대시보드</h1>
              <p className="text-blue-100">
                프로필을 관리하고 학생들의 레슨 상담 요청을 확인하세요
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6" />
                <div>
                  <p className="text-sm text-blue-100">새 상담 요청</p>
                  <p className="text-3xl font-bold">{unreadCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === "profile"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <User className="w-5 h-5 inline-block mr-2" />내 프로필
              </button>
              <button
                onClick={() => setActiveTab("consultations")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all relative ${
                  activeTab === "consultations"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <MessageSquare className="w-5 h-5 inline-block mr-2" />
                상담 요청
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 프로필 탭 */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {profileLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">프로필 로딩 중...</p>
              </div>
            ) : !instructorProfile ? (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  강사 프로필 관리
                </h2>
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    프로필이 등록되지 않았습니다
                  </h3>
                  <p className="text-gray-600 mb-6">
                    강사 프로필을 등록하고 학생들에게 레슨을 제공하세요
                  </p>
                  <Button
                    onClick={() => router.push("/instructor/profile/edit")}
                  >
                    프로필 등록하기
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {/* 프로필 헤더 */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-6">
                      <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                        {instructorProfile.photoUrl ? (
                          <img
                            src={instructorProfile.photoUrl}
                            alt={instructorProfile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold mb-2">
                          {instructorProfile.name}
                        </h2>
                        <div className="flex items-center space-x-4 text-blue-100 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{instructorProfile.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{instructorProfile.experience}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                            <span className="font-semibold">
                              {instructorProfile.rating.toFixed(1)}
                            </span>
                            <span className="text-sm text-blue-100">
                              ({instructorProfile.reviewCount}개 리뷰)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push("/instructor/profile/edit")}
                      variant="outline"
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      프로필 수정
                    </Button>
                  </div>
                </div>

                {/* 프로필 내용 */}
                <div className="p-8 space-y-8">
                  {/* 레슨 과목 */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      레슨 과목
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {instructorProfile.specialty.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 전문 분야 태그 */}
                  {instructorProfile.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">#</span>
                        전문 분야 태그
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {instructorProfile.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 자기소개 */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      자기소개
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {instructorProfile.bio}
                    </p>
                  </div>

                  {/* 레슨 타입 */}
                  {instructorProfile.lessonTypes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        레슨 타입
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {instructorProfile.lessonTypes.map((lesson, idx) => (
                          <div
                            key={idx}
                            className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900">
                                {lesson.name}
                              </h4>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  lesson.type === "single"
                                    ? "bg-blue-100 text-blue-700"
                                    : lesson.type === "monthly"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {lesson.type === "single"
                                  ? "1회"
                                  : lesson.type === "monthly"
                                    ? "월"
                                    : "프로"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {lesson.description}
                            </p>
                            <div className="text-sm">
                              {lesson.type === "single" && lesson.price && (
                                <p className="font-semibold text-blue-600">
                                  {lesson.price.toLocaleString()}원
                                </p>
                              )}
                              {lesson.type === "monthly" &&
                                lesson.pricePerSession && (
                                  <p className="font-semibold text-green-600">
                                    {lesson.pricePerSession.toLocaleString()}
                                    원/회~
                                  </p>
                                )}
                              {lesson.type === "pro" &&
                                lesson.priceNegotiable && (
                                  <p className="font-semibold text-purple-600">
                                    💎 가격 협의
                                  </p>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 자격증 및 경력 */}
                  {instructorProfile.certifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        자격증 및 경력
                      </h3>
                      <ul className="space-y-2">
                        {instructorProfile.certifications.map((cert, idx) => (
                          <li
                            key={idx}
                            className="flex items-start space-x-2 text-gray-700"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{cert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 가능한 요일/시간 */}
                  {instructorProfile.availability.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        가능한 요일/시간
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {instructorProfile.availability.map((time, idx) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-900 font-medium">
                                {time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 상담 요청 탭 */}
        {activeTab === "consultations" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              레슨 상담 요청 ({consultations.length})
            </h2>

            {consultations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  상담 요청이 없습니다
                </h3>
                <p className="text-gray-600">
                  학생들이 레슨을 요청하면 여기에 표시됩니다
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map(consultation => (
                  <div
                    key={consultation.id}
                    className={`border-2 rounded-xl p-5 transition-all ${
                      consultation.isRead
                        ? "border-gray-200 bg-white"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 rounded-full p-3">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg">
                              {consultation.studentName}
                            </h3>
                            {!consultation.isRead && (
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {consultation.message}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {consultation.timestamp
                                  ?.toDate()
                                  .toLocaleString("ko-KR")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => handleOpenChat(consultation.chatId)}
                        className="flex-1"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        채팅으로 응답하기
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
