import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend(event) {
    // 민감한 정보 필터링
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.request?.headers) {
      const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
      sensitiveHeaders.forEach(header => {
        delete event.request.headers[header];
      });
    }
    return event;
  },
});

