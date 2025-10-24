import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold">ConnecTone</span>
            </div>
            <p className="text-gray-400 mb-4">
              중고 악기 거래의 새로운 기준, ConnecTone에서 안전하고 신뢰할 수
              있는 거래를 경험해보세요.
            </p>
            <div className="text-gray-400 text-sm space-y-1">
              <p>🏢 (주)커넥톤 | 대표: 김커넥</p>
              <p>📍 서울특별시 강남구 테헤란로 123, 456호</p>
              <p>📧 contact@connectone.com</p>
              <p>📞 02-1234-5678</p>
              <p>사업자등록번호: 123-45-67890</p>
              <p>통신판매업신고: 2024-서울강남-1234</p>
            </div>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">YouTube</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/list"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  악기 둘러보기
                </Link>
              </li>
              <li>
                <Link
                  href="/product/new"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  판매하기
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  채팅
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객센터 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">고객센터</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm mb-1">📞 전화상담</p>
                <p className="text-white font-medium">1588-0000</p>
                <p className="text-gray-400 text-xs">평일 09:00 - 18:00</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">✉️ 이메일</p>
                <p className="text-white font-medium">support@connectone.com</p>
                <p className="text-gray-400 text-xs">24시간 접수</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">💬 카카오톡</p>
                <p className="text-white font-medium">@ConnecTone</p>
                <p className="text-gray-400 text-xs">평일 09:00 - 18:00</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/help"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    자주 묻는 질문
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    1:1 문의하기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    개인정보처리방침
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 ConnecTone. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                이용약관
              </Link>
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
