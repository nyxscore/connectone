"use client";

import { useState, useRef } from "react";
import { Button } from "./Button";
import { X, Plus, Upload } from "lucide-react";
import { uploadImages } from "../../lib/api/storage";
import toast from "react-hot-toast";

interface ImageUploadCardProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploadCard({
  images,
  onImagesChange,
  maxImages = 10,
}: ImageUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: number]: { percentage: number };
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 최대 이미지 수 체크
    if (images.length + files.length > maxImages) {
      toast.error(`최대 ${maxImages}장까지만 업로드할 수 있습니다.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      const result = await uploadImages(files, (index, progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [index]: progress,
        }));
      });

      if (result.success) {
        const newImages = [...images, ...result.urls];
        onImagesChange(newImages);
        toast.success(`${result.urls.length}장의 이미지가 업로드되었습니다.`);
      } else {
        toast.error(`이미지 업로드 실패: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast.error("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* 이미지 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* 기존 이미지들 */}
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img
                src={url}
                alt={`상품 이미지 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {/* 삭제 버튼 */}
            <button
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
              title="이미지 삭제"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* 업로드 버튼 */}
        {images.length < maxImages && (
          <button
            onClick={handleFileSelect}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-xs text-gray-500">업로드 중...</span>
              </div>
            ) : (
              <div className="text-center">
                <Plus className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">이미지 추가</span>
              </div>
            )}
          </button>
        )}
      </div>

      {/* 업로드 진행률 */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([index, progress]) => (
            <div key={index} className="text-sm text-gray-600">
              이미지 {parseInt(index) + 1} 업로드 중:{" "}
              {Math.round(progress.percentage)}%
            </div>
          ))}
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 안내 텍스트 */}
      <div className="text-sm text-gray-500">
        {images.length === 0 ? (
          <span>상품 이미지를 업로드해주세요. (최대 {maxImages}장)</span>
        ) : (
          <span>
            {images.length}장 업로드됨 (최대 {maxImages}장)
          </span>
        )}
      </div>
    </div>
  );
}
