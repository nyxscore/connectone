"use client";

import { useRef, useEffect, useState } from "react";
import { Camera, Video, Square, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export const CameraCapture = ({
  onCapture,
  onClose,
  isActive,
}: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // 후면 카메라 우선
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("카메라 접근 오류:", err);
      setError("카메라에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // 비디오 크기에 맞춰 캔버스 크기 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 캔버스를 이미지 데이터 URL로 변환
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    onCapture(imageDataUrl);
  };

  const switchCamera = async () => {
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 100)); // 잠시 대기
    startCamera();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            AI 감정 분석 촬영
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 카메라 영역 */}
        <div className="relative bg-black">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 text-white">
              <Video className="w-16 h-16 mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">카메라 오류</p>
              <p className="text-sm text-gray-300 text-center">{error}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-96 object-cover"
              />

              {/* 촬영 가이드 오버레이 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded">
                  <p className="text-sm">상품을 프레임 안에 맞춰주세요</p>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-32 h-32 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">상품 영역</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 숨겨진 캔버스 (촬영용) */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-center space-x-4 p-4">
          <button
            onClick={switchCamera}
            disabled={!isStreaming}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>

          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Square className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="px-4 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>AI 감정 분석 팁:</strong> 상품을 명확하게 보이도록
              촬영하면 더 정확한 분석이 가능합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
