"use client";

import { useState, useRef } from "react";
import { Button } from "../ui/Button";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { uploadAvatar } from "../../lib/profile/api";
import toast from "react-hot-toast";

interface AvatarUploaderProps {
  currentPhotoURL?: string;
  onUploadComplete: (photoURL: string) => void;
  disabled?: boolean;
  uid: string;
}

export function AvatarUploader({
  currentPhotoURL,
  onUploadComplete,
  disabled = false,
  uid,
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = e => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadAvatar(uid, file);

      if (result.success && result.data) {
        onUploadComplete(result.data);
        setPreview(null);
        toast.success("아바타가 업로드되었습니다.");
      } else {
        toast.error(result.error || "업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("아바타 업로드 실패:", error);
      toast.error("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayImage = preview || currentPhotoURL;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 아바타 이미지 */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {displayImage ? (
            <img
              src={displayImage}
              alt="프로필"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Camera className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* 업로드 중 오버레이 */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* 업로드 버튼들 */}
      <div className="flex space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center"
        >
          <Camera className="w-4 h-4 mr-2" />
          촬영
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          갤러리
        </Button>
      </div>

      {/* 미리보기 및 업로드/취소 버튼 */}
      {preview && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "업로드 중..." : "업로드"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={uploading}
            className="flex items-center"
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
        </div>
      )}
    </div>
  );
}
