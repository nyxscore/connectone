import { NextResponse } from "next/server";

// Static export configuration
export const dynamic = "force-static";

// Mock 데이터 (실제로는 데이터베이스에서 조회)
const staticPages = [
  {
    url: "/",
    lastmod: new Date().toISOString(),
    changefreq: "daily",
    priority: "1.0",
  },
  {
    url: "/list",
    lastmod: new Date().toISOString(),
    changefreq: "daily",
    priority: "0.9",
  },
  {
    url: "/sell",
    lastmod: new Date().toISOString(),
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    url: "/auth/login",
    lastmod: new Date().toISOString(),
    changefreq: "monthly",
    priority: "0.5",
  },
  {
    url: "/auth/signup",
    lastmod: new Date().toISOString(),
    changefreq: "monthly",
    priority: "0.5",
  },
];

// Mock 상품 데이터 (실제로는 데이터베이스에서 조회)
const products = [
  {
    id: "prod1",
    title: "Fender Stratocaster 2020",
    category: "string",
    brand: "Fender",
    model: "Stratocaster",
    price: 1500000,
    region: "서울시 강남구",
    updatedAt: new Date("2024-01-10").toISOString(),
  },
  {
    id: "prod2",
    title: "Yamaha P-125 디지털 피아노",
    category: "keyboard",
    brand: "Yamaha",
    model: "P-125",
    price: 800000,
    region: "부산시 해운대구",
    updatedAt: new Date("2024-01-09").toISOString(),
  },
  {
    id: "prod3",
    title: "Pearl Export 드럼 세트",
    category: "percussion",
    brand: "Pearl",
    model: "Export",
    price: 2000000,
    region: "대구시 수성구",
    updatedAt: new Date("2024-01-08").toISOString(),
  },
];

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("\n")}
  ${products
    .map(
      product => `  <url>
    <loc>${baseUrl}/item/${product.id}</loc>
    <lastmod>${product.updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("\n")}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
