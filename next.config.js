/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 배포용 설정 (정적 내보내기 제거)

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

  // 동적 import 최적화
  experimental: {
    esmExternals: false,
    serverComponentsExternalPackages: ['firebase', '@firebase/auth', '@firebase/firestore'],
  },

  // Firebase 초기화 최적화
  transpilePackages: ["firebase"],

  // 소스맵 활성화 (디버깅용)
  productionBrowserSourceMaps: true,

  // 웹팩 설정
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
