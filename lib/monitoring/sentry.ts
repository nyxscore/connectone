import * as Sentry from "@sentry/nextjs";

// Sentry 초기화
export function initSentry() {
  if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 성능 모니터링 샘플링 비율
      debug: false,
      beforeSend(event) {
        // 민감한 정보 필터링
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        if (event.request?.headers) {
          // 민감한 헤더 제거
          const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
          sensitiveHeaders.forEach(header => {
            delete event.request.headers[header];
          });
        }
        return event;
      },
      integrations: [
        new Sentry.BrowserTracing({
          // 페이지 로드 성능 추적
          tracingOrigins: [
            "localhost",
            /^\//,
          ],
        }),
      ],
    });
  }
}

// 사용자 컨텍스트 설정
export function setUserContext(user: {
  id: string;
  email: string;
  nickname: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.nickname,
  });
}

// 사용자 컨텍스트 제거
export function clearUserContext() {
  Sentry.setUser(null);
}

// 커스텀 에러 리포팅
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

// 커스텀 메시지 리포팅
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

// 성능 트랜잭션 시작
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

// API 에러 핸들러
export function withSentryErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
}

// 클라이언트 사이드 에러 바운더리
export function withSentryErrorBoundary<T extends React.ComponentType<any>>(
  Component: T
): T {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            문제가 발생했습니다
          </h2>
          <p className="text-gray-600 mb-4">
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    ),
  });
}






