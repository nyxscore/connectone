import sharp from "sharp";
import multer from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

// Multer 설정 - 메모리 스토리지 사용
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다."), false);
    }
  },
});

// Sharp를 사용한 이미지 리사이징 미들웨어
export const resizeImageMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return next();
    }

    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();
    const resizedFiles: Express.Multer.File[] = [];

    for (const file of files) {
      if (!file.buffer) continue;

      // Sharp로 이미지 메타데이터 확인
      const metadata = await sharp(file.buffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new Error("이미지 메타데이터를 읽을 수 없습니다.");
      }

      // 원본 비율 계산
      const aspectRatio = width / height;

      // 800x800 내에서 비율 유지하면서 리사이징할 크기 계산
      let newWidth = 800;
      let newHeight = 800;

      if (aspectRatio > 1) {
        // 가로가 더 긴 경우 (landscape)
        newHeight = Math.round(800 / aspectRatio);
      } else if (aspectRatio < 1) {
        // 세로가 더 긴 경우 (portrait)
        newWidth = Math.round(800 * aspectRatio);
      }
      // aspectRatio === 1인 경우 (정사각형)는 800x800 그대로

      // 이미지가 이미 800x800보다 작으면 원본 유지
      if (width <= 800 && height <= 800) {
        resizedFiles.push(file);
        continue;
      }

      // Sharp로 리사이징 (비율 유지, 크롭 없음)
      const resizedBuffer = await sharp(file.buffer)
        .resize(newWidth, newHeight, {
          fit: "inside", // 비율 유지하면서 지정된 크기 내에 맞춤
          withoutEnlargement: true, // 원본보다 크게 만들지 않음
        })
        .jpeg({
          quality: 85, // JPEG 품질
          progressive: true, // 점진적 JPEG
        })
        .toBuffer();

      // 리사이징된 파일 정보 생성
      const resizedFile: Express.Multer.File = {
        ...file,
        buffer: resizedBuffer,
        size: resizedBuffer.length,
        originalname: file.originalname.replace(/\.[^/.]+$/, ".jpg"), // 확장자를 jpg로 변경
        mimetype: "image/jpeg",
      };

      resizedFiles.push(resizedFile);
    }

    // req.files를 리사이징된 파일로 교체
    if (Array.isArray(req.files)) {
      req.files = resizedFiles;
    } else {
      // 단일 파일인 경우
      req.file = resizedFiles[0];
    }

    next();
  } catch (error) {
    console.error("이미지 리사이징 오류:", error);
    res.status(500).json({
      success: false,
      error: "이미지 처리 중 오류가 발생했습니다.",
    });
  }
};

// Multer 업로드 미들웨어
export const uploadMiddleware = upload;

// 파일 업로드 + 리사이징 통합 미들웨어
export const uploadAndResizeImages = [
  uploadMiddleware.array("images", 10), // 최대 10개 파일
  resizeImageMiddleware,
];

// 단일 파일 업로드 + 리사이징
export const uploadAndResizeSingleImage = [
  uploadMiddleware.single("image"),
  resizeImageMiddleware,
];

// 사용 예시:
/*
// Express 라우터에서 사용
app.post('/upload', uploadAndResizeImages, (req, res) => {
  const files = req.files as Express.Multer.File[];
  
  res.json({
    success: true,
    message: '이미지가 성공적으로 업로드 및 리사이징되었습니다.',
    files: files.map(file => ({
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    })),
  });
});
*/

// 이미지 리사이징 유틸리티 함수들
export const imageUtils = {
  // 특정 크기로 리사이징
  resizeToSize: async (buffer: Buffer, maxWidth: number, maxHeight: number) => {
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error("이미지 메타데이터를 읽을 수 없습니다.");
    }

    const aspectRatio = width / height;
    let newWidth = maxWidth;
    let newHeight = maxHeight;

    if (aspectRatio > maxWidth / maxHeight) {
      newHeight = Math.round(maxWidth / aspectRatio);
    } else {
      newWidth = Math.round(maxHeight * aspectRatio);
    }

    return sharp(buffer)
      .resize(newWidth, newHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  },

  // 썸네일 생성
  createThumbnail: async (buffer: Buffer, size: number = 200) => {
    return sharp(buffer)
      .resize(size, size, {
        fit: "cover", // 썸네일은 크롭 허용
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  },

  // 이미지 정보 가져오기
  getImageInfo: async (buffer: Buffer) => {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      aspectRatio:
        metadata.width && metadata.height
          ? metadata.width / metadata.height
          : 1,
    };
  },
};
