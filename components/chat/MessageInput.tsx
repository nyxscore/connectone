"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sendMessage } from "../../lib/chat/api";
import { uploadImages } from "../../lib/api/storage";
import { Button } from "../ui/Button";
import { Send, Image, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

interface MessageInputProps {
  chatId: string;
  senderUid: string;
  itemId: string;
  sellerUid: string;
  onMessageSent?: () => void;
}

export function MessageInput({
  chatId,
  senderUid,
  itemId,
  sellerUid,
  onMessageSent,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 자동 포커스
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && selectedFiles.length === 0) return;
    if (isSending) return;

    setIsSending(true);

    try {
      let imageUrls: string[] = [];

      // 이미지 업로드
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        const uploadResult = await uploadImages(selectedFiles);

        if (uploadResult.success && uploadResult.urls) {
          imageUrls = uploadResult.urls;
        } else {
          toast.error("이미지 업로드에 실패했습니다.");
          setIsSending(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      // 메시지 전송
      console.log("메시지 전송 시작:", {
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

      console.log("메시지 전송 결과:", result);

      if (!result.success) {
        toast.error(result.error || "메시지 전송에 실패했습니다.");
        setIsSending(false);
        return;
      }

      setMessage("");
      setSelectedFiles([]);

      // 텍스트 영역 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      onMessageSent?.();

      // 포커스는 약간의 딜레이 후에 확실하게
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      toast.error("메시지 전송 중 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
      // 전송 완료 후에도 포커스 유지
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
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
    <div className="border-t bg-white p-4">
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
        {/* 파일 선택 버튼 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={isSending || isUploading}
          className="flex-shrink-0 h-10 w-10 p-0 flex items-center justify-center"
        >
          <Image className="w-5 h-5" />
        </Button>

        {/* 메시지 입력 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={isSending || isUploading}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
        </div>

        {/* 전송 버튼 */}
        <Button
          type="submit"
          size="sm"
          disabled={
            (!message.trim() && selectedFiles.length === 0) ||
            isSending ||
            isUploading
          }
          className="flex-shrink-0 h-10 w-10 p-0 flex items-center justify-center"
        >
          {isSending || isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
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

      {/* 업로드 상태 표시 */}
      {isUploading && (
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>이미지 업로드 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
