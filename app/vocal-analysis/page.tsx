"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../../components/ui/Button";
import AnalysisCharts from "../../components/ai/AnalysisCharts";
import {
  Upload,
  Mic,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Music,
  BarChart3,
  FileAudio,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// 분석 결과 타입 정의
interface AnalysisResult {
  transcription: {
    text: string;
    language: string;
    confidence: number;
  };
  emotion: {
    label: string;
    label_ko: string;
    scores: { [key: string]: number };
    scores_ko: { [key: string]: number };
  };
  pitch: {
    average_hz: number;
    stddev_hz: number;
    pitch_stability: number;
  };
  tempo: {
    bpm: number;
    confidence: number;
  };
  key: {
    tonic: string;
    mode: string;
    confidence: number;
  };
  metadata: {
    duration_seconds: number;
    file_name: string;
  };
  cost_estimate_usd: number;
  report_ko: string;
  summary_ko: string;
}

export default function VocalAnalysisPage() {
  const { user, loading } = useAuth();

  // 분석 티어 상태
  const [selectedTier, setSelectedTier] = useState<
    "free" | "advanced" | "expert"
  >("free");

  // 상태 관리
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [copiedText, setCopiedText] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null); // 결과 섹션 참조

  // 오디오 진행 상태
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // 파일 유효성 검사 및 설정
  const validateAndSetFile = (file: File) => {
    // 파일 타입 검증
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

    // 파일 크기 검증 (30MB)
    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("파일 크기가 너무 큽니다. 최대 30MB까지 업로드 가능합니다.");
      return;
    }

    // 오디오 길이 검증 (5분)
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      if (audio.duration > 300) {
        // 5분 = 300초
        toast.error("오디오 길이가 너무 깁니다. 최대 5분까지 분석 가능합니다.");
        return;
      }
    };
    audio.src = URL.createObjectURL(file);

    const url = URL.createObjectURL(file);
    console.log("📁 파일 선택됨:", file.name);
    console.log("🔗 오디오 URL 생성:", url);

    setSelectedFile(file);
    setAudioUrl(url);
    setAnalysisResult(null); // 이전 결과 초기화
    toast.success(`${file.name} 파일이 선택되었습니다.`);
  };

  // 드래그 앤 드롭 핸들러
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      console.log("🎤 녹음 시작 시도...");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("이 브라우저는 녹음을 지원하지 않습니다.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ 마이크 접근 허용됨");

      const mediaRecorder = new MediaRecorder(stream);
      console.log("✅ MediaRecorder 생성:", mediaRecorder.mimeType);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          console.log("📦 오디오 청크 수신:", event.data.size, "bytes");
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("⏹️ 녹음 중지, 총 청크:", audioChunksRef.current.length);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        console.log("📁 Blob 생성:", audioBlob.size, "bytes");

        const audioFile = new File(
          [audioBlob],
          `recording_${Date.now()}.webm`,
          {
            type: "audio/webm",
          }
        );

        setSelectedFile(audioFile);
        setAudioUrl(URL.createObjectURL(audioBlob));
        setAnalysisResult(null);
        toast.success("녹음이 완료되었습니다!");

        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("녹음이 시작되었습니다.");
      console.log("🔴 녹음 시작됨");
    } catch (error) {
      console.error("❌ 녹음 시작 실패:", error);
      toast.error(
        error instanceof Error ? error.message : "마이크 권한을 허용해주세요."
      );
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 오디오 재생/정지
  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error("❌ audioRef가 없습니다!");
      return;
    }

    try {
      if (isPlaying) {
        console.log("⏸️ 오디오 일시정지");
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log("▶️ 오디오 재생 시도...");
        console.log("📁 오디오 URL:", audioUrl);
        console.log("🔊 오디오 요소:", audioRef.current);

        await audioRef.current.play();
        console.log("✅ 오디오 재생 시작됨");
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("❌ 오디오 재생 실패:", error);
      toast.error("오디오 재생에 실패했습니다.");
      setIsPlaying(false);
    }
  };

  // 시간 포맷팅 함수
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // 진행바 클릭 핸들러
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // AI 분석 실행
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("분석할 오디오 파일을 선택해주세요.");
      return;
    }

    // AI 심화 분석 선택 시 포인트 확인
    if (selectedTier === "advanced") {
      if (!user) {
        toast.error("로그인이 필요한 서비스입니다.");
        return;
      }

      const userPoints = user.points || 0;
      if (userPoints < 2900) {
        toast.error(
          `포인트가 부족합니다. (현재: ${userPoints}원, 필요: 2,900원)`
        );
        return;
      }
    }

    console.log("🎯 분석 시작:", selectedFile.name, "티어:", selectedTier);
    setIsAnalyzing(true);

    try {
      // AI 심화 분석의 경우 포인트 차감 (원 단위)
      if (selectedTier === "advanced" && user) {
        console.log("💸 결제 처리 시작...");
        const { usePoints } = await import("@/lib/api/points");
        await usePoints(user.uid, 2900, "AI 심화 분석");
        console.log("✅ 결제 완료!");
      }

      // AssemblyAI 분석 함수 호출
      console.log("🤖 AssemblyAI 분석 중...");
      const { analyzeAudio } = await import("../../lib/api/audio-analysis");
      const result: AnalysisResult = await analyzeAudio(
        selectedFile,
        selectedTier
      );

      console.log("✅ AI 분석 결과:", result);
      setAnalysisResult(result);

      if (selectedTier === "advanced") {
        toast.success("AI 심화 분석이 완료되었습니다!");
      } else {
        toast.success("분석이 완료되었습니다!");
      }

      // 결과 섹션으로 스크롤
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 800);
    } catch (error) {
      console.error("❌ 분석 오류:", error);

      // 에러 발생 시 환불 (심화 분석의 경우)
      if (selectedTier === "advanced" && user) {
        try {
          const { addPoints } = await import("@/lib/api/points");
          await addPoints(
            user.uid,
            2900,
            "refund",
            "AI 심화 분석 오류로 인한 환불"
          );
          toast.info("결제가 환불되었습니다.");
        } catch (refundError) {
          console.error("❌ 환불 오류:", refundError);
        }
      }

      toast.error(
        error instanceof Error ? error.message : "분석 중 오류가 발생했습니다."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 트랜스크립션 복사
  const copyTranscription = () => {
    if (analysisResult?.transcription.text) {
      navigator.clipboard.writeText(analysisResult.transcription.text);
      setCopiedText(true);
      toast.success("텍스트가 복사되었습니다!");
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // SRT 파일 다운로드
  const downloadSRT = () => {
    if (!analysisResult?.transcription.text) return;

    const srtContent = `1\n00:00:00,000 --> 00:${String(Math.floor(analysisResult.metadata.duration_seconds / 60)).padStart(2, "0")}:${String(Math.floor(analysisResult.metadata.duration_seconds % 60)).padStart(2, "0")},000\n${analysisResult.transcription.text}\n`;

    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysisResult.metadata.file_name.replace(/\.[^/.]+$/, "")}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SRT 파일이 다운로드되었습니다!");
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 로그인 필요
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600 mb-6">
            AI 음악 분석 기능을 사용하려면 로그인해주세요.
          </p>
          <Button onClick={() => (window.location.href = "/auth/login")}>
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Music className="w-10 h-10 text-blue-600" />
            AI 음악 분석
          </h1>
          {selectedTier === "free" && (
            <p className="text-lg text-gray-600 mb-8">
              음악 파일을 업로드하고 AI가 감정, 피치, 템포, 장르를
              분석해드립니다
            </p>
          )}
          {selectedTier === "advanced" && (
            <div className="mb-8">
              <p className="text-lg text-gray-600 mb-2">
                AI 심화 분석으로 더욱 자세하고 전문적인 피드백을 받아보세요
              </p>
              <div className="flex justify-center gap-6 text-sm text-gray-500">
                <span>📊 상세 점수 분석</span>
                <span>📈 시각화 차트</span>
                <span>💎 맞춤형 피드백</span>
              </div>
            </div>
          )}

          {/* 분석 티어 선택 탭 */}
          <div className="flex justify-center gap-4 max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedTier("free")}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
                selectedTier === "free"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
              }`}
            >
              <div className="text-sm mb-1">🆓</div>
              <div className="text-base">AI 무료 분석</div>
              <div className="text-xs mt-1 opacity-80">기본 분석</div>
            </button>

            <button
              onClick={() => setSelectedTier("advanced")}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
                selectedTier === "advanced"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
              }`}
            >
              <div className="text-sm mb-1">💎</div>
              <div className="text-base">AI 심화 분석</div>
              <div className="text-xs mt-1 opacity-80 flex items-center justify-center gap-2">
                <span className="line-through text-gray-400">9,900원</span>
                <span className="font-bold text-red-600">2,900원</span>
              </div>
            </button>

            <button
              onClick={() => {
                window.location.href = "/expert-analysis";
              }}
              className="flex-1 py-4 px-6 rounded-xl font-semibold transition-all bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-400"
            >
              <div className="text-sm mb-1">👨‍🏫</div>
              <div className="text-base">전문가 분석</div>
              <div className="text-xs mt-1 opacity-80">
                <span className="line-through text-gray-400 mr-1">
                  35,000원
                </span>
                <span className="font-bold text-red-600">19,000원</span>
              </div>
            </button>
          </div>
        </div>

        {/* 전체 세로 레이아웃 */}
        <div className="max-w-3xl mx-auto space-y-8">
          {/* 업로드 및 녹음 */}
          <div className="space-y-6">
            {/* 파일 업로드 영역 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileAudio className="w-5 h-5 text-blue-600" />
                오디오 파일
              </h2>

              {/* 드래그 앤 드롭 영역 */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  WAV, MP3, OGG, WEBM (최대 30MB)
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
                  className="mb-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  파일 선택
                </Button>
              </div>

              {/* 또는 구분선 */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm">또는</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* 녹음 버튼 */}
              <div className="text-center">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isRecording}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    녹음 시작
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    className="bg-gray-600 hover:bg-gray-700 animate-pulse"
                  >
                    <div className="w-4 h-4 mr-2 bg-red-500 rounded-full animate-ping absolute" />
                    <span className="relative">녹음 중지</span>
                  </Button>
                )}
              </div>

              {/* 선택된 파일 정보 */}
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <p className="text-sm font-medium text-blue-900">
                    📁 {selectedFile.name}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
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
                  <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={togglePlay}
                        variant="outline"
                        className="flex-shrink-0 w-12 h-12 rounded-full"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>

                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                        <div
                          className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
                          onClick={handleProgressClick}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
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

              {/* 분석 버튼 */}
              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5 mr-2" />
                    AI 분석 시작
                  </>
                )}
              </Button>

              {/* 분석 안내 */}
              {selectedFile && !analysisResult && (
                <div
                  className={`mt-4 p-3 border rounded-lg ${
                    selectedTier === "advanced"
                      ? "bg-purple-50 border-purple-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={`w-4 h-4 mt-0.5 ${
                        selectedTier === "advanced"
                          ? "text-purple-600"
                          : "text-green-600"
                      }`}
                    />
                    <div
                      className={`text-xs ${
                        selectedTier === "advanced"
                          ? "text-purple-800"
                          : "text-green-800"
                      }`}
                    >
                      <p className="font-medium">
                        {selectedTier === "advanced" ? (
                          <>
                            <span className="text-lg font-bold text-purple-600">
                              2,900원
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-bold text-green-600">
                              무료
                            </span>
                          </>
                        )}
                      </p>
                      <p className="mt-1 font-medium">
                        {selectedTier === "advanced"
                          ? "💎 AI 심화 분석: 종합 점수, 강점/개선점, 시각화 차트, 전문가 코멘트 제공"
                          : "🆓 AI 무료 분석: 기본 분석 결과 제공"}
                      </p>
                      <p className="mt-1 text-gray-600">
                        분석에는 약 30초-2분 소요됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* 분석 결과 (오디오 파일 아래) */}
          {analysisResult && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            ></motion.div>
          )}

          {/* 시각적 분석 차트 섹션 - 분석 결과가 있을 때만 표시 */}
          {/* AI 무료 분석 결과 */}
          {selectedTier === "free" && analysisResult?.personalized_analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 max-w-6xl mx-auto"
            >
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  AI 무료 분석 결과
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {analysisResult.personalized_analysis}
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    💎 AI 심화 분석으로 업그레이드
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    기본 분석에서 더 나아가 <strong>종합 점수</strong>,{" "}
                    <strong>강점/개선점 분석</strong>,
                    <strong>시각화 차트</strong>,{" "}
                    <strong>상세 전문가 코멘트</strong>까지! 더욱 구체적이고
                    실천 가능한 피드백을 받아보세요.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedTier("advanced");
                      setAnalysisResult(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>💎 AI 심화 분석하기</span>
                      <span className="text-sm opacity-80">(</span>
                      <span className="line-through opacity-60 text-sm">
                        9,900원
                      </span>
                      <span className="text-sm opacity-80">→</span>
                      <span className="font-black text-yellow-300">
                        2,900원
                      </span>
                      <span className="text-sm opacity-80">)</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* AI 심화 분석 결과 (차트 포함) */}
          {selectedTier === "advanced" && analysisResult && (
            <>
              {/* 심화 분석 결과 */}
              {analysisResult?.advanced_analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-12 max-w-6xl mx-auto"
                >
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-8 border-2 border-purple-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                        💎 AI 심화 분석 리포트
                      </h3>
                      <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                        PREMIUM
                      </span>
                    </div>
                    <div className="prose prose-base max-w-none">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-line text-base">
                        {analysisResult.advanced_analysis.analysis_text ||
                          analysisResult.advanced_analysis}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 차트 분석 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 max-w-6xl mx-auto"
              >
                <AnalysisCharts analysisResult={analysisResult} />
              </motion.div>
            </>
          )}

          {/* 추천 강사 섹션 - 분석 결과가 있을 때만 표시 */}
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 max-w-6xl mx-auto"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white mb-6">
                <h2 className="text-3xl font-bold mb-3">
                  🎤 분석 결과 기반 맞춤 레슨 추천
                </h2>
                <p className="text-lg text-purple-100">
                  회원님의 음악 분석 결과를 바탕으로 최적의 강사를 추천합니다
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 추천 강사 1: 음정 교정 전문 */}
                <Link
                  href="/lessons"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src="https://i.pravatar.cc/300?img=23"
                      alt="강혜진"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            강혜진
                          </h3>
                          <p className="text-sm text-gray-600">
                            음정 교정 전문
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <span className="text-yellow-500 text-lg">⭐</span>
                          <span className="text-sm font-bold text-gray-900">
                            5.0
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium mr-2">
                          추천 이유
                        </span>
                        <p className="text-sm text-gray-700 mt-2">
                          {(analysisResult.pitch?.pitch_stability || 0) < 0.8
                            ? "음정 안정성 향상이 필요합니다. 체계적인 음정 교정 프로그램으로 단기간 내 개선 가능합니다."
                            : "더 높은 수준의 음정 컨트롤을 위한 전문 트레이닝을 추천합니다."}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          #음정교정
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          #음역확장
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          #발성교정
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-sm text-gray-600">
                          65,000원/시간
                        </span>
                        <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                          자세히 보기 →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 추천 강사 2: 음악 트레이닝 */}
                <Link
                  href="/lessons"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src="https://i.pravatar.cc/300?img=12"
                      alt="김민수"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            김민수
                          </h3>
                          <p className="text-sm text-gray-600">음악 트레이닝</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <span className="text-yellow-500 text-lg">⭐</span>
                          <span className="text-sm font-bold text-gray-900">
                            4.9
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium mr-2">
                          추천 이유
                        </span>
                        <p className="text-sm text-gray-700 mt-2">
                          종합적인 음악 실력 향상을 위한 체계적인 커리큘럼을
                          제공합니다. 호흡법, 발성, 음정 등 기초부터 고급까지
                          지도합니다.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          #호흡법
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          #발성
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          #음정교정
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-sm text-gray-600">
                          50,000원/시간
                        </span>
                        <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                          자세히 보기 →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/lessons"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <span>모든 강사 보기</span>
                  <span>→</span>
                </Link>
              </div>
            </motion.div>
          )}
        </div>

        {/* 하단 안내 - 분석 결과가 없을 때만 표시 */}
        {!analysisResult && (
          <div className="mt-12 p-6 bg-white rounded-2xl shadow-lg max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              💡{" "}
              {selectedTier === "advanced"
                ? "AI 심화 분석 안내"
                : "AI 무료 분석 안내"}
            </h3>

            {selectedTier === "free" ? (
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    지원 형식
                  </h4>
                  <p className="text-gray-600">
                    WAV, MP3, OGG, WEBM 형식의 오디오 파일을 업로드할 수
                    있습니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    분석 내용
                  </h4>
                  <p className="text-gray-600">
                    AI가 감정, 피치, 템포, 조성, 장르를 자동으로 분석합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    이용 요금
                  </h4>
                  <p className="text-gray-600">
                    <span className="text-2xl font-bold text-green-600">
                      무료
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      📊 상세 점수 분석
                    </h4>
                    <p className="text-sm text-gray-700">
                      기술, 스타일, 리듬 등 각 영역별 점수와 종합 점수를
                      제공합니다.
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      ✨ 강점 및 개선점
                    </h4>
                    <p className="text-sm text-gray-700">
                      회원님의 음악적 강점과 구체적인 개선 방향을 제시합니다.
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      📈 시각화 차트
                    </h4>
                    <p className="text-sm text-gray-700">
                      피치, 템포, 감정 등을 그래프로 시각화하여 직관적으로
                      확인할 수 있습니다.
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      💬 전문가 코멘트
                    </h4>
                    <p className="text-sm text-gray-700">
                      AI가 분석한 데이터를 바탕으로 맞춤형 피드백과 연습 방법을
                      제안합니다.
                    </p>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-purple-200">
                  <p className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-2">
                    <span className="line-through text-gray-400">9,900원</span>
                    <span className="text-2xl font-bold text-purple-600">
                      2,900원
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    더욱 상세한 분석을 받아보세요
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
