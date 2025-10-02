/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화 설정
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      "firebasestorage.googleapis.com",
      "res.cloudinary.com",
      "images.unsplash.com",
    ],
  },

  // 압축 설정
  compress: true,

  // 실험적 기능
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@headlessui/react"],
  },

  // 웹팩 설정 (Turbopack과 충돌 방지를 위해 제거)

  // 헤더 설정
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // 리라이트 설정
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
      {
        source: "/robots.txt",
        destination: "/api/robots",
      },
    ];
  },

  // 환경변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 성능 최적화 (Next.js 15에서는 기본적으로 활성화됨)

  // 타입스크립트 설정 (임시 비활성화)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint 설정 (임시 비활성화)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 출력 설정 (API 라우트 사용을 위해 제거)
  // output: "export",

  // 트레일링 슬래시
  trailingSlash: false,

  // 캐시 버스터 설정
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
