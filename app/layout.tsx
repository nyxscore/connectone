import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { Toast } from "../components/ui/Toast";
import { ChatNotificationProvider } from "../components/notifications/ChatNotificationProvider";

export const metadata: Metadata = {
  title: "ConnecTone - 중고 악기 거래 플랫폼",
  description:
    "안전하고 신뢰할 수 있는 중고 악기 거래의 새로운 기준, ConnecTone",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
      </head>
      <body className="font-sans antialiased bg-gray-50">
        <ChatNotificationProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toast />
        </ChatNotificationProvider>
      </body>
    </html>
  );
}
