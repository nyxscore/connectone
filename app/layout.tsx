import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { Toast } from "../components/ui/Toast";
import NextAuthProvider from "../components/providers/NextAuthProvider";
import { Analytics } from '@vercel/analytics/react';
import VisitorTracker from '../components/analytics/VisitorTracker';
import { Footer } from '../components/ui/Footer';
// import { ChatNotificationProvider } from "../components/notifications/ChatNotificationProvider"; // Disabled chat notifications

export const metadata: Metadata = {
  title: "ConnecTone - 모든 악기 중고거래 플랫폼 | 기타, 피아노, 드럼, 국악기",
  description:
    "기타, 피아노, 드럼, 관악기, 현악기, 음향장비, 국악기 등 모든 악기와 음악용품을 안전하게 거래하세요. AI 감정시스템과 안전거래로 믿을 수 있는 중고 악기 거래 플랫폼",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "ConnecTone - 모든 악기 중고거래 플랫폼 | 기타, 피아노, 드럼, 국악기",
    description: "기타, 피아노, 드럼, 관악기, 현악기, 음향장비, 국악기 등 모든 악기와 음악용품을 안전하게 거래하세요. AI 감정시스템과 안전거래로 믿을 수 있는 중고 악기 거래 플랫폼",
    url: "https://connect-tone.com",
    siteName: "ConnecTone",
    images: [
      {
        url: "https://connect-tone.com/logo1.png",
        width: 1200,
        height: 630,
        alt: "ConnecTone - 중고 악기 거래 플랫폼",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConnecTone - 모든 악기 중고거래 플랫폼 | 기타, 피아노, 드럼, 국악기",
    description: "기타, 피아노, 드럼, 관악기, 현악기, 음향장비, 국악기 등 모든 악기와 음악용품을 안전하게 거래하세요. AI 감정시스템과 안전거래로 믿을 수 있는 중고 악기 거래 플랫폼",
    images: ["https://connect-tone.com/logo1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          async
          defer
        ></script>
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js"
          integrity="sha384-l+xbElFSnPZ2rOaPrU//2FF5B4LB8FiX5q4fXYTlfcG4PGpMkE1vcL7kNXI6Cci0"
          crossOrigin="anonymous"
          async
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
                window.Kakao.init('${process.env.NEXT_PUBLIC_KAKAO_JS_KEY || ""}');
              }
            `,
          }}
        />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-BQCN3WYQK6"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-BQCN3WYQK6');
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-gray-50">
        <NextAuthProvider>
          {/* <ChatNotificationProvider> */}
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toast />
          {/* </ChatNotificationProvider> */}
          <VisitorTracker />
        </NextAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
