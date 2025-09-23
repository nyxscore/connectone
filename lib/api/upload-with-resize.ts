import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import sharp from "sharp";
import { promisify } from "util";

// Multer 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다."), false);
    }
  },
});

// Multer를 Promise로 변환
const uploadMiddleware = promisify(upload.array("images", 10));

// 이미지 리사이징 함수
const resizeImage = async (buffer: Buffer, maxSize: number = 800) => {
  const metadata = await sharp(buffer).metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    throw new Error("이미지 메타데이터를 읽을 수 없습니다.");
  }

  // 원본 비율 계산
  const aspectRatio = width / height;

  // 800x800 내에서 비율 유지하면서 리사이징할 크기 계산
  let newWidth = maxSize;
  let newHeight = maxSize;

  if (aspectRatio > 1) {
    // 가로가 더 긴 경우
    newHeight = Math.round(maxSize / aspectRatio);
  } else if (aspectRatio < 1) {
    // 세로가 더 긴 경우
    newWidth = Math.round(maxSize * aspectRatio);
  }

  // 이미지가 이미 800x800보다 작으면 원본 유지
  if (width <= maxSize && height <= maxSize) {
    return buffer;
  }

  // Sharp로 리사이징 (비율 유지, 크롭 없음)
  return sharp(buffer)
    .resize(newWidth, newHeight, {
      fit: "inside", // 비율 유지하면서 지정된 크기 내에 맞춤
      withoutEnlargement: true, // 원본보다 크게 만들지 않음
    })
    .jpeg({
      quality: 85, // JPEG 품질
      progressive: true, // 점진적 JPEG
    })
    .toBuffer();
};

// API 핸들러
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Multer로 파일 업로드 처리
    await uploadMiddleware(req, res);

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "이미지 파일이 없습니다." });
    }

    // 각 파일을 리사이징
    const resizedFiles = await Promise.all(
      files.map(async file => {
        const resizedBuffer = await resizeImage(file.buffer, 800);

        return {
          originalname: file.originalname,
          mimetype: "image/jpeg",
          size: resizedBuffer.length,
          buffer: resizedBuffer,
        };
      })
    );

    // 여기서 실제 스토리지에 저장하는 로직을 추가
    // 예: Firebase Storage, AWS S3, 로컬 파일시스템 등

    res.status(200).json({
      success: true,
      message: "이미지가 성공적으로 업로드 및 리사이징되었습니다.",
      files: resizedFiles.map(file => ({
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      })),
    });
  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    res.status(500).json({
      success: false,
      error: "이미지 처리 중 오류가 발생했습니다.",
    });
  }
}

// Next.js API 라우트 설정
export const config = {
  api: {
    bodyParser: false, // Multer가 body를 파싱하므로 비활성화
  },
};
