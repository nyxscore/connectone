"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        // 페이지 로드 시 방문자 추적
        await fetch('/api/analytics/visitor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            page: pathname,
            userId: session?.user?.id || null,
            isLoggedIn: !!session?.user,
          }),
        });
      } catch (error) {
        console.error('Failed to track visitor:', error);
      }
    };

    // 페이지 로드 후 1초 뒤에 추적 (페이지가 완전히 로드된 후)
    const timer = setTimeout(trackVisitor, 1000);

    return () => clearTimeout(timer);
  }, [pathname, session]);

  return null; // UI 렌더링 없음
}
