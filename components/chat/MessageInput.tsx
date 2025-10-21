"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { sendMessage } from "../../lib/chat/api";
import { uploadImages } from "../../lib/api/storage";
import { Button } from "../ui/Button";
import { Send, Image, Loader2, X, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface MessageInputProps {
  chatId: string;
  senderUid: string;
  itemId: string;
  sellerUid: string;
  onMessageSent?: () => void;
  onPlusClick?: () => void; // + 버튼 클릭 핸들러
}

export const MessageInput = memo(function MessageInput({
  chatId,
  senderUid,
  itemId,
  sellerUid,
  onMessageSent,
  onPlusClick,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const isSendingRef = useRef(false); // state 대신 ref 사용 - 리렌더링 방지
  const isUploadingRef = useRef(false); // state 대신 ref 사용 - 리렌더링 방지
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 자연스러운 포커스
  useEffect(() => {
    // 약간의 딜레이 후 포커스 (더 자연스럽게)
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
  }, []);

  // 모바일 키보드 완전 고정 - 절대 내려가지 않음
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let isFocused = true;

    // 포커스 유지 루프 - 모바일에서 강제 포커스
    const keepFocused = () => {
      // 모달이 열려있는지 확인 (z-index 50 이상인 요소가 있으면 모달로 간주)
      const hasOpenModal = document.querySelector(
        '.fixed.z-50, [role="dialog"]'
      );

      // 모달이 열려있지 않고, 현재 포커스가 textarea가 아닐 때만 강제 포커스
      if (isFocused && !hasOpenModal && document.activeElement !== textarea) {
        textarea.focus();
      }
      requestAnimationFrame(keepFocused);
    };

    // 포커스 유지 루프 시작
    requestAnimationFrame(keepFocused);

    // blur 이벤트 완전 차단 (단, 모달이 없을 때만)
    const preventBlur = (e: FocusEvent) => {
      const hasOpenModal = document.querySelector(
        '.fixed.z-50, [role="dialog"]'
      );

      // 모달이 열려있으면 blur 허용
      if (hasOpenModal) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      textarea.focus();
    };

    textarea.addEventListener("blur", preventBlur, { capture: true });

    return () => {
      isFocused = false;
      textarea.removeEventListener("blur", preventBlur, { capture: true });
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && selectedFiles.length === 0) return;
    if (isSendingRef.current) return;

    isSendingRef.current = true;

    try {
      let imageUrls: string[] = [];

      // 이미지 업로드
      if (selectedFiles.length > 0) {
        isUploadingRef.current = true;
        const uploadResult = await uploadImages(selectedFiles);

        if (uploadResult.success && uploadResult.urls) {
          imageUrls = uploadResult.urls;
        } else {
          toast.error("이미지 업로드에 실패했습니다.");
          isSendingRef.current = false;
          isUploadingRef.current = false;
          return;
        }
        isUploadingRef.current = false;
      }

      // 메시지 전송
      console.log("📤 메시지 전송 시작:", {
        chatId,
        senderUid,
        content: message.trim(),
        imageUrl: imageUrls[0],
        hasImage: imageUrls.length > 0,
      });

      const result = await sendMessage({
        chatId,
        senderUid,
        content: message.trim() || "", // 이미지만 있을 경우 content는 빈 문자열
        imageUrl: imageUrls[0], // 첫 번째 이미지만 사용 (단일 이미지)
      });

      console.log("📤 메시지 전송 결과:", result);

      if (!result.success) {
        console.error("❌ 메시지 전송 실패:", result.error);
        toast.error(result.error || "메시지 전송에 실패했습니다.");
        isSendingRef.current = false;
        return;
      }

      console.log("✅ 메시지 전송 성공!");

      // 먼저 포커스 저장
      const textarea = textareaRef.current;
      const wasFocused = textarea && document.activeElement === textarea;

      setMessage("");
      setSelectedFiles([]);

      // 텍스트 영역 높이 초기화
      if (textarea) {
        textarea.style.height = "auto";
      }

      // 키보드 유지를 위해 포커스 즉시 복구 (메시지 업데이트 전)
      if (textarea && wasFocused) {
        textarea.focus();
      }

      // 새로고침 없이 메시지 목록만 업데이트
      onMessageSent?.();

      // 메시지 업데이트 후에도 포커스 강제 유지
      if (textarea) {
        // 동기 포커스
        textarea.focus();

        // 비동기 포커스 (여러 타이밍에 시도)
        requestAnimationFrame(() => {
          textarea.focus();
        });
        setTimeout(() => textarea.focus(), 0);
        setTimeout(() => textarea.focus(), 10);
        setTimeout(() => textarea.focus(), 50);
        setTimeout(() => textarea.focus(), 100);
        setTimeout(() => textarea.focus(), 200);
      }
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      toast.error("메시지 전송 중 오류가 발생했습니다.");
    } finally {
      isSendingRef.current = false;
      // 전송 완료 후 키보드 절대 내려가지 않도록 강제 포커스
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        requestAnimationFrame(() => textarea.focus());
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
    }

    setSelectedFiles(prev => [...prev, ...imageFiles].slice(0, 5)); // 최대 5개
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-t bg-white p-4 pb-safe">
      {/* 선택된 파일 미리보기 */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`미리보기 ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        {/* + 버튼 (모바일 & 데스크톱) */}
        {onPlusClick ? (
          <button
            type="button"
            onClick={onPlusClick}
            className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </button>
        ) : (
          /* 이미지 버튼 (onPlusClick이 없을 때만) */
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFileDialog}
            className="flex-shrink-0 h-10 w-10 p-0 flex items-center justify-center"
          >
            <Image className="w-5 h-5" />
          </Button>
        )}

        {/* 메시지 입력 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
        </div>

        {/* 전송 버튼 - disabled 제거로 리렌더링 방지 */}
        <Button
          type="submit"
          size="sm"
          className="flex-shrink-0 h-10 w-10 p-0 flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
});
