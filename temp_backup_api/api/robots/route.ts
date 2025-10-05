import { NextResponse } from "next/server";

// Static export configuration
export const dynamic = "force-static";

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# 주요 페이지
Allow: /list
Allow: /sell
Allow: /chat
Allow: /profile
Allow: /auth/login
Allow: /auth/signup

# API 엔드포인트 제외
Disallow: /api/

# 관리자 페이지 제외
Disallow: /admin/

# 개인정보 관련 페이지 제외
Disallow: /profile/notifications
Disallow: /profile/transactions

# 정적 파일 허용
Allow: /static/
Allow: /images/
Allow: /icons/

# 사이트맵 위치
Sitemap: ${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml

# 크롤링 지연 (선택사항)
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
