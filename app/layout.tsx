import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { Toast } from "../components/ui/Toast";

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
      </head>
      <body className="font-sans antialiased bg-gray-50">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <Toast />
      </body>
    </html>
  );
}
