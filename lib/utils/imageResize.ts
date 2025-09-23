/**
 * 이미지를 최적 크기로 리사이징하는 유틸리티
 */

interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * 이미지를 지정된 크기로 리사이징
 */
export const resizeImage = (
  file: File,
  options: ResizeOptions = {}
): Promise<File> => {
  const {
    maxWidth = 400,
    maxHeight = 300,
    quality = 0.8,
    format = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      // 원본 이미지 비율 계산
      const originalWidth = img.width;
      const originalHeight = img.height;
      const aspectRatio = originalWidth / originalHeight;

      // 리사이징할 크기 계산 (비율 유지)
      let newWidth = maxWidth;
      let newHeight = maxHeight;

      if (aspectRatio > maxWidth / maxHeight) {
        // 가로가 더 긴 경우
        newHeight = maxWidth / aspectRatio;
      } else {
        // 세로가 더 긴 경우
        newWidth = maxHeight * aspectRatio;
      }

      // 캔버스 크기 설정
      canvas.width = newWidth;
      canvas.height = newHeight;

      // 이미지 그리기 (부드러운 리사이징)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // 캔버스를 Blob으로 변환
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }

          // 새로운 File 객체 생성
          const resizedFile = new File([blob], file.name, {
            type: format,
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 여러 이미지를 일괄 리사이징
 */
export const resizeImages = async (
  files: File[],
  options: ResizeOptions = {}
): Promise<File[]> => {
  const resizePromises = files.map(file => resizeImage(file, options));
  return Promise.all(resizePromises);
};

/**
 * 쇼핑몰 스타일 이미지 리사이징 (정사각형)
 */
export const resizeToSquare = (
  file: File,
  size: number = 400,
  quality: number = 0.8
): Promise<File> => {
  return resizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality,
    format: "image/jpeg",
  });
};

/**
 * 썸네일 생성 (작은 크기)
 */
export const createThumbnail = (
  file: File,
  size: number = 200,
  quality: number = 0.7
): Promise<File> => {
  return resizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality,
    format: "image/jpeg",
  });
};
