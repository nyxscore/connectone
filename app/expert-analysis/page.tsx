"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Upload,
  Mic,
  Play,
  Pause,
  Clock,
  CheckCircle,
  ArrowLeft,
  Music,
  Headphones,
  Award,
  Loader2,
  Star,
  MessageCircle,
  TrendingUp,
  Target,
  Sparkles,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ExpertAnalysisPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [analysisCategory, setAnalysisCategory] = useState("");
  const [instrumentCategory, setInstrumentCategory] = useState("");
  const [specificInstrument, setSpecificInstrument] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [additionalRequest, setAdditionalRequest] = useState("");

  // 분석 분야 카테고리
  const analysisCategories = [
    { value: "vocal", label: "보컬 (발성/음정/호흡)" },
    { value: "rap", label: "랩/힙합" },
    { value: "instrument", label: "악기 연주" },
    { value: "composition", label: "작곡/프로듀싱" },
    { value: "mixing", label: "믹싱/마스터링" },
    { value: "other", label: "기타 (직접 입력)" },
  ];

  // 악기 카테고리
  const instrumentCategories = [
    {
      value: "keyboard",
      label: "건반악기",
      instruments: [
        "피아노",
        "그랜드 피아노",
        "업라이트 피아노",
        "디지털 피아노",
        "전자 키보드",
        "신시사이저",
        "오르간",
      ],
    },
    {
      value: "strings",
      label: "현악기",
      instruments: [
        "기타",
        "통기타",
        "클래식 기타",
        "일렉 기타",
        "베이스 기타",
        "우쿨렐레",
        "바이올린",
        "비올라",
        "첼로",
        "콘트라베이스",
      ],
    },
    {
      value: "winds",
      label: "관악기",
      instruments: [
        "플룻",
        "클라리넷",
        "오보에",
        "잉글리시호른",
        "바순",
        "색소폰",
        "트럼펫",
        "트롬본",
        "프렌치 호른",
        "튜바",
      ],
    },
    {
      value: "percussion",
      label: "타악기",
      instruments: [
        "드럼",
        "드럼 세트",
        "전자 드럼",
        "팀파니",
        "심벌즈",
        "콩가",
        "봉고",
        "카혼",
        "젬베",
        "마림바",
        "실로폰",
      ],
    },
    {
      value: "korean",
      label: "국악기",
      instruments: [
        "가야금",
        "거문고",
        "해금",
        "아쟁",
        "대금",
        "피리",
        "태평소",
        "단소",
        "장구",
        "북",
      ],
    },
    {
      value: "electronic",
      label: "전자악기",
      instruments: [
        "MIDI 컨트롤러",
        "드럼 머신",
        "루프스테이션",
        "테레민",
        "워크스테이션",
      ],
    },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      "audio/wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/ogg",
      "audio/webm",
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(wav|mp3|ogg|webm)$/i)
    ) {
      toast.error(
        "지원되지 않는 파일 형식입니다. WAV, MP3, OGG, WEBM 파일만 업로드 가능합니다."
      );
      return;
    }

    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("파일 크기가 너무 큽니다. 최대 30MB까지 업로드 가능합니다.");
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setAudioUrl(url);
    toast.success(`${file.name} 파일이 선택되었습니다.`);
  };

  // 드래그 앤 드롭
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // 녹음
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File(
          [audioBlob],
          `recording_${Date.now()}.webm`,
          {
            type: "audio/webm",
          }
        );

        setSelectedFile(audioFile);
        setAudioUrl(URL.createObjectURL(audioBlob));
        toast.success("녹음이 완료되었습니다!");

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("녹음이 시작되었습니다.");
    } catch (error) {
      console.error("녹음 실패:", error);
      toast.error("마이크 권한을 허용해주세요.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 오디오 재생
  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("재생 실패:", error);
      toast.error("오디오 재생에 실패했습니다.");
      setIsPlaying(false);
    }
  };

  // 시간 포맷
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // 진행바 클릭
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 전문가 분석 신청
  const handleSubmitRequest = async () => {
    if (!selectedFile) {
      toast.error("분석할 오디오 파일을 선택해주세요.");
      return;
    }

    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }

    // 분석 분야 검증
    if (!analysisCategory) {
      toast.error("분석 분야를 선택해주세요.");
      return;
    }

    if (analysisCategory === "instrument") {
      if (!instrumentCategory) {
        toast.error("악기 종류를 선택해주세요.");
        return;
      }
      if (!specificInstrument) {
        toast.error("세부 악기를 선택해주세요.");
        return;
      }
    }

    if (analysisCategory === "other" && !customCategory.trim()) {
      toast.error("분석 분야를 입력해주세요.");
      return;
    }

    // 결제 안내
    toast("결제 페이지로 이동합니다.", { icon: "💳" });

    setIsSubmitting(true);

    try {
      // 파일 업로드
      console.log("📤 오디오 파일 업로드 중...");
      const { getStorage } = await import("@/lib/api/firebase-lazy");
      const { ref, uploadBytes, getDownloadURL } = await import(
        "firebase/storage"
      );

      const storage = getStorage();
      const fileName = `expert-analysis/${user.uid}/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      // Firestore에 요청 저장 (결제 대기 상태)
      console.log("💾 분석 요청 저장 중...");
      const { getDb } = await import("@/lib/api/firebase-lazy");
      const { collection, addDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );

      const db = getDb();

      // 분석 분야 최종 값
      let finalCategory = "";
      if (analysisCategory === "other") {
        finalCategory = customCategory.trim();
      } else if (analysisCategory === "instrument") {
        const categoryLabel =
          instrumentCategories.find(c => c.value === instrumentCategory)
            ?.label || "";
        finalCategory = `악기 연주 - ${categoryLabel} - ${specificInstrument}`;
      } else {
        finalCategory =
          analysisCategories.find(c => c.value === analysisCategory)?.label ||
          "";
      }

      const docRef = await addDoc(collection(db, "expert_analysis_requests"), {
        userId: user.uid,
        userNickname: user.nickname || "사용자",
        audioUrl: downloadUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        analysisCategory: finalCategory, // 분석 분야
        additionalRequest: additionalRequest.trim() || "", // 추가 요청사항
        status: "payment_pending", // payment_pending, pending, in_progress, completed
        paidAmount: 19000,
        paymentStatus: "pending", // pending, completed, failed
        requestedAt: serverTimestamp(),
        completedAt: null,
        expertId: null,
        expertName: null,
        analysisResult: null,
      });

      console.log("✅ 분석 요청 생성 완료, 결제 페이지로 이동...");

      // 결제 페이지로 이동 (요청 ID 포함)
      window.location.href = `/payment?type=expert-analysis&requestId=${docRef.id}&amount=19000`;
    } catch (error) {
      console.error("❌ 전문가 분석 신청 오류:", error);
      toast.error("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 상태 표시
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment_pending":
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
            결제대기
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            전문가 배정중
          </span>
        );
      case "in_progress":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            분석중
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            완료
          </span>
        );
      default:
        return null;
    }
  };

  // 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600 mb-6">
            전문가 분석 서비스를 이용하려면 로그인해주세요.
          </p>
          <Button onClick={() => (window.location.href = "/auth/login")}>
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-6 sm:py-12 px-4">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 뒤로가기 */}
        <Link
          href="/vocal-analysis"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium text-sm sm:text-base">AI 음악 분석으로 돌아가기</span>
        </Link>

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-bold text-xs sm:text-sm">PREMIUM SERVICE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            👨‍🏫 전문가 피드백 서비스
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-1 sm:mb-2 px-4">
            현직 전문가가 직접 작성한{" "}
            <span className="font-bold text-purple-600">PDF 문서</span>로 받는
          </p>
          <p className="text-base sm:text-xl text-gray-600 mb-4 sm:mb-6 px-4">
            체계적이고 상세한 맞춤형 피드백
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1 sm:gap-2">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>PDF 문서 제공</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>전문가 1:1 피드백</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>24-48시간 내 완성</span>
            </div>
          </div>
        </motion.div>

        {/* 가격 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-xl p-4 sm:p-8">
            <div className="text-center">
              <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                전문가 피드백 서비스
              </h2>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-lg sm:text-2xl line-through opacity-60">
                    35,000원
                  </span>
                  <span className="text-base sm:text-xl">→</span>
                  <div className="flex items-baseline">
                    <span className="text-3xl sm:text-5xl font-black">19,000</span>
                    <span className="text-lg sm:text-2xl font-bold ml-1">원</span>
                  </div>
                </div>
                <span className="px-2 sm:px-3 py-1 bg-red-500 text-white text-xs sm:text-sm font-bold rounded-full animate-pulse">
                  46% 할인
                </span>
              </div>
              <p className="text-purple-100 mb-4 sm:mb-6 text-sm sm:text-base px-2">
                전문가가 직접 작성한 체계적인 PDF 문서로 평생 보관 가능한 나만의
                피드백
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                  <div className="font-semibold mb-1 text-sm sm:text-base">맞춤형 분석</div>
                  <div className="text-purple-100 text-xs">
                    회원님의 수준과 목표에 맞춘 분석
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                  <div className="font-semibold mb-1 text-sm sm:text-base">PDF 문서 제공</div>
                  <div className="text-purple-100 text-xs">
                    체계적으로 정리된 전문가 피드백 문서
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                  <div className="font-semibold mb-1 text-sm sm:text-base">평생 보관</div>
                  <div className="text-purple-100 text-xs">
                    언제든 다시 확인 가능한 나만의 피드백
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {/* 업로드 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                오디오 업로드
              </h3>

              {/* 드래그 앤 드롭 영역 */}
              <div
                className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-colors ${
                  dragActive
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-300 hover:border-purple-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-700 font-medium mb-2">
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                  WAV, MP3, OGG, WEBM • 최대 30MB • 최대 5분
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  파일 선택
                </Button>
                <div className="text-sm text-gray-500 mb-2">또는</div>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  className={isRecording ? "animate-pulse" : ""}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {isRecording ? "녹음 중지" : "직접 녹음하기"}
                </Button>
              </div>

              {/* 선택된 파일 */}
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <Headphones className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 오디오 플레이어 */}
              {audioUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6"
                >
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onLoadedMetadata={() => {
                      if (audioRef.current) {
                        setDuration(audioRef.current.duration);
                      }
                    }}
                    onTimeUpdate={() => {
                      if (audioRef.current) {
                        setCurrentTime(audioRef.current.currentTime);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={togglePlay}
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 w-10 h-10 rounded-full p-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>

                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                        <div
                          className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
                          onClick={handleProgressClick}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                            style={{
                              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 분석 분야 선택 */}
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    🎯 어떤 분야의 피드백을 받고 싶으신가요?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={analysisCategory}
                    onChange={e => {
                      setAnalysisCategory(e.target.value);
                      if (e.target.value !== "other") {
                        setCustomCategory("");
                      }
                      if (e.target.value !== "instrument") {
                        setInstrumentCategory("");
                        setSpecificInstrument("");
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">분야를 선택해주세요</option>
                    {analysisCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>

                  {/* 악기 연주 선택 시 - 악기 카테고리 선택 */}
                  {analysisCategory === "instrument" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 space-y-3"
                    >
                      <select
                        value={instrumentCategory}
                        onChange={e => {
                          setInstrumentCategory(e.target.value);
                          setSpecificInstrument("");
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value="">악기 종류를 선택해주세요</option>
                        {instrumentCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>

                      {/* 세부 악기 선택 */}
                      {instrumentCategory && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                        >
                          <select
                            value={specificInstrument}
                            onChange={e =>
                              setSpecificInstrument(e.target.value)
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          >
                            <option value="">악기를 선택해주세요</option>
                            {instrumentCategories
                              .find(c => c.value === instrumentCategory)
                              ?.instruments.map(instrument => (
                                <option key={instrument} value={instrument}>
                                  {instrument}
                                </option>
                              ))}
                          </select>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* 기타 선택 시 직접 입력 */}
                  {analysisCategory === "other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3"
                    >
                      <input
                        type="text"
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        placeholder="분석받고 싶은 분야를 입력해주세요 (예: 재즈 보컬, EDM 프로듀싱)"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {customCategory.length}/50
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* 추가 요청사항 */}
              {selectedFile &&
                analysisCategory &&
                (analysisCategory === "vocal" ||
                  analysisCategory === "rap" ||
                  analysisCategory === "composition" ||
                  analysisCategory === "mixing" ||
                  (analysisCategory === "instrument" && specificInstrument) ||
                  (analysisCategory === "other" && customCategory.trim())) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      💬 전문가에게 특별히 듣고 싶은 부분이 있나요? (선택사항)
                    </label>
                    <textarea
                      value={additionalRequest}
                      onChange={e => setAdditionalRequest(e.target.value)}
                      placeholder="예: 고음 구간에서 불안정한 부분이 있는데, 이를 개선할 방법이 궁금합니다."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        구체적으로 작성하시면 더 맞춤형 피드백을 받을 수
                        있습니다
                      </p>
                      <p className="text-xs text-gray-400">
                        {additionalRequest.length}/500
                      </p>
                    </div>
                  </motion.div>
                )}

              {/* 신청 버튼 */}
              <Button
                onClick={handleSubmitRequest}
                disabled={
                  !selectedFile ||
                  !analysisCategory ||
                  (analysisCategory === "instrument" &&
                    (!instrumentCategory || !specificInstrument)) ||
                  (analysisCategory === "other" && !customCategory.trim()) ||
                  isSubmitting
                }
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-14 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    전문가 피드백 신청하기 (19,000원)
                  </>
                )}
              </Button>

              {requestSubmitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">
                        신청이 완료되었습니다!
                      </p>
                      <p>
                        24-48시간 내에 전문가가 직접 작성한{" "}
                        <strong>PDF 피드백 문서</strong>를 받으실 수 있습니다.
                        알림으로 결과를 안내해드립니다.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 하단 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 sm:mt-12 bg-white rounded-2xl shadow-lg p-4 sm:p-8"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            💡 전문가 피드백 안내
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                📄 PDF 문서 제공
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm">
                전문가가 직접 작성한 상세한 피드백을 <strong>PDF 문서</strong>로
                제공합니다. 체계적으로 정리된 분석 내용을 언제든 확인하세요.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                🎯 맞춤형 분석
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm">
                현직 보컬 트레이너, 음악 프로듀서 등 검증된 전문가가 회원님의
                수준과 목표에 맞춘 피드백을 제공합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">⚡ 24-48시간</h4>
              <p className="text-gray-600 text-xs sm:text-sm">
                결제 완료 후 24-48시간 내에 전문가의 상세한 피드백 문서를 받으실
                수 있습니다. 알림으로 안내해드립니다.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
