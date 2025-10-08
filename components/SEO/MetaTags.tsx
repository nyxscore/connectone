import Head from "next/head";

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  // 상품 관련 메타데이터
  product?: {
    name: string;
    brand: string;
    model: string;
    price: number;
    currency: string;
    condition: string;
    region: string;
    category: string;
    availability: "in_stock" | "out_of_stock";
  };
  // 기타 메타데이터
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

export function MetaTags({
  title = "ConnecTone - 중고 악기 거래 플랫폼",
  description = "안전하고 신뢰할 수 있는 중고 악기 거래 플랫폼. 피아노, 기타, 드럼, 바이올린 등 다양한 악기를 거래하세요.",
  image = "/images/og-default.jpg",
  url,
  type = "website",
  product,
  keywords = [
    "중고악기",
    "악기거래",
    "피아노",
    "기타",
    "드럼",
    "바이올린",
    "ConnecTone",
  ],
  author = "ConnecTone",
  publishedTime,
  modifiedTime,
  section,
  tags = [],
}: MetaTagsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const fullImageUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;

  // 상품이 있는 경우 상품 정보를 포함한 제목과 설명 생성
  const finalTitle = product
    ? `${product.brand} ${product.model} - ${product.price.toLocaleString()}원 | ConnecTone`
    : title;

  const finalDescription = product
    ? `${product.brand} ${product.model} ${product.name} - ${product.condition} 상태, ${product.region}에서 거래 가능. ${product.price.toLocaleString()}원에 판매 중입니다.`
    : description;

  return (
    <Head>
      {/* 기본 메타 태그 */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={keywords.join(", ")} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="ko" />
      <meta name="revisit-after" content="1 days" />

      {/* Open Graph 태그 */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="ConnecTone" />
      <meta property="og:locale" content="ko_KR" />

      {/* 상품 관련 Open Graph 태그 */}
      {product && (
        <>
          <meta property="product:brand" content={product.brand} />
          <meta
            property="product:availability"
            content={product.availability}
          />
          <meta property="product:condition" content={product.condition} />
          <meta
            property="product:price:amount"
            content={product.price.toString()}
          />
          <meta property="product:price:currency" content={product.currency} />
          <meta property="product:category" content={product.category} />
          <meta property="product:retailer" content="ConnecTone" />
        </>
      )}

      {/* 기사 관련 메타 태그 */}
      {type === "article" && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card 태그 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@connetone" />
      <meta name="twitter:creator" content="@connetone" />

      {/* 추가 메타 태그 */}
      <meta name="theme-color" content="#667eea" />
      <meta name="msapplication-TileColor" content="#667eea" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="ConnecTone" />

      {/* PWA 관련 메타 태그 */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/icons/icon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/icons/icon-16x16.png"
      />

      {/* 구조화된 데이터 (JSON-LD) */}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: `${product.brand} ${product.model}`,
              description: product.name,
              brand: {
                "@type": "Brand",
                name: product.brand,
              },
              model: product.model,
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: product.currency,
                availability: `https://schema.org/${product.availability === "in_stock" ? "InStock" : "OutOfStock"}`,
                condition: `https://schema.org/${product.condition}Condition`,
                seller: {
                  "@type": "Organization",
                  name: "ConnecTone",
                },
              },
              category: product.category,
              additionalProperty: [
                {
                  "@type": "PropertyValue",
                  name: "지역",
                  value: product.region,
                },
                {
                  "@type": "PropertyValue",
                  name: "상태",
                  value: product.condition,
                },
              ],
            }),
          }}
        />
      )}

      {/* 웹사이트 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "ConnecTone",
            description: "안전하고 신뢰할 수 있는 중고 악기 거래 플랫폼",
            url: baseUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${baseUrl}/list?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
            publisher: {
              "@type": "Organization",
              name: "ConnecTone",
              url: baseUrl,
              logo: {
                "@type": "ImageObject",
                url: `${baseUrl}/images/logo.png`,
              },
            },
          }),
        }}
      />
    </Head>
  );
}























