/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화 설정
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "res.cloudinary.com",
      "images.unsplash.com",
    ],
  },

  // 타입스크립트 설정 (빌드 에러 완전 무시)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint 설정 (빌드 에러 완전 무시)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 압축 설정
  compress: true,

  // 트레일링 슬래시
  trailingSlash: false,
};

module.exports = nextConfig;