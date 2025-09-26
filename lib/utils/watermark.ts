export interface WatermarkOptions {
  emotion: string;
  confidence: number;
}

export async function addWatermarkToImage(
  file: File,
  options: WatermarkOptions
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        // 캔버스 크기 설정
        canvas.width = img.width;
        canvas.height = img.height;

        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 워터마크 추가
        const watermarkText = `AI`;
        const fontSize = Math.max(img.width * 0.03, 14);

        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
        ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        ctx.lineWidth = 2;

        // 텍스트 크기 측정
        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;

        // 워터마크 위치 (우하단)
        const x = img.width - textWidth - 10;
        const y = img.height - 10;

        // 배경 박스 그리기
        const padding = 6;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(
          x - padding,
          y - textHeight - padding,
          textWidth + padding * 2,
          textHeight + padding * 2
        );

        // 텍스트 그리기 (테두리 + 채우기)
        ctx.strokeText(watermarkText, x, y);
        ctx.fillStyle = "rgba(59, 130, 246, 1)";
        ctx.fillText(watermarkText, x, y);

        // 캔버스를 Blob으로 변환
        canvas.toBlob(
          blob => {
            if (blob) {
              const watermarkedFile = new File([blob], file.name, {
                type: file.type,
              });
              resolve(watermarkedFile);
            } else {
              reject(new Error("Failed to create watermarked image"));
            }
          },
          "image/jpeg",
          0.9
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // File을 Data URL로 변환
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}
