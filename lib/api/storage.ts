import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from "firebase/storage";
import { getFirebaseStorage } from "./firebase-safe";

// Storage 인스턴스 가져오기
const storage = getFirebaseStorage();

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// 이미지 업로드
export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "이미지 파일만 업로드 가능합니다.",
      };
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "파일 크기는 5MB를 초과할 수 없습니다.",
      };
    }

    // Firebase Storage 참조 생성
    const storageRef = ref(storage, path);

    // 업로드 실행 (진행률 추적 포함)
    const uploadTask = uploadBytesResumable(storageRef, file);

    // 진행률 콜백이 있다면 실행
    if (onProgress) {
      uploadTask.on("state_changed", snapshot => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress({
          loaded: snapshot.bytesTransferred,
          total: snapshot.totalBytes,
          percentage: progress,
        });
      });
    }

    // 업로드 실행
    const snapshot = await uploadTask;

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
    };
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.",
    };
  }
}

// 여러 이미지 업로드
export async function uploadMultipleImages(
  files: File[],
  basePath: string,
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<{ success: boolean; urls: string[]; errors: string[] }> {
  const results = await Promise.allSettled(
    files.map((file, index) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${index}_${file.name}`;
      const path = `${basePath}/${fileName}`;

      return uploadImage(file, path, progress => {
        onProgress?.(index, progress);
      });
    })
  );

  const urls: string[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.success) {
      urls.push(result.value.url!);
    } else {
      const error =
        result.status === "rejected"
          ? result.reason
          : result.value.error || "업로드 실패";
      errors.push(`이미지 ${index + 1}: ${error}`);
    }
  });

  return {
    success: urls.length > 0,
    urls,
    errors,
  };
}

// 이미지 삭제
export async function deleteImage(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const imageRef = ref(storage, url);
    await deleteObject(imageRef);
    return { success: true };
  } catch (error) {
    console.error("이미지 삭제 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "이미지 삭제에 실패했습니다.",
    };
  }
}

// 판매글 이미지 업로드 (여러 이미지)
export async function uploadImages(
  files: File[],
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<{ success: boolean; urls: string[]; errors: string[] }> {
  const basePath = `items/${Date.now()}`;
  return uploadMultipleImages(files, basePath, onProgress);
}

// 이미지 URL에서 파일명 추출
export function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split("/").pop() || "";
  } catch {
    return "";
  }
}
