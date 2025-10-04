// Google Analytics 4
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// GA4 이벤트 타입
export interface GA4Event {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// PostHog 이벤트 타입
export interface PostHogEvent {
  event: string;
  properties?: Record<string, any>;
}

class AnalyticsService {
  private isGA4Enabled: boolean;
  private isPostHogEnabled: boolean;
  private measurementId: string;
  private postHogKey: string;

  constructor() {
    this.isGA4Enabled = !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    this.isPostHogEnabled = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
    this.measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
    this.postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
  }

  // GA4 초기화
  initGA4() {
    if (!this.isGA4Enabled || typeof window === "undefined") return;

    // Google Analytics 스크립트 로드
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // gtag 초기화
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  // PostHog 초기화
  async initPostHog() {
    if (!this.isPostHogEnabled || typeof window === "undefined") return;

    try {
      const { default: posthog } = await import("posthog-js");

      posthog.init(this.postHogKey, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // 수동으로 페이지뷰 추적
        capture_pageleave: true,
      });

      // PostHog를 window 객체에 저장
      (window as any).posthog = posthog;
    } catch (error) {
      console.error("PostHog 초기화 실패:", error);
    }
  }

  // 페이지뷰 추적
  trackPageView(url: string, title?: string) {
    if (this.isGA4Enabled && typeof window !== "undefined") {
      window.gtag("config", this.measurementId, {
        page_path: url,
        page_title: title || document.title,
      });
    }

    if (this.isPostHogEnabled && typeof window !== "undefined") {
      const posthog = (window as any).posthog;
      if (posthog) {
        posthog.capture("$pageview", {
          $current_url: url,
          $title: title || document.title,
        });
      }
    }
  }

  // GA4 이벤트 추적
  trackGA4Event(event: GA4Event) {
    if (!this.isGA4Enabled || typeof window === "undefined") return;

    window.gtag("event", event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters,
    });
  }

  // PostHog 이벤트 추적
  trackPostHogEvent(event: PostHogEvent) {
    if (!this.isPostHogEnabled || typeof window === "undefined") return;

    const posthog = (window as any).posthog;
    if (posthog) {
      posthog.capture(event.event, event.properties);
    }
  }

  // 통합 이벤트 추적 (GA4 + PostHog)
  trackEvent(event: GA4Event & PostHogEvent) {
    this.trackGA4Event(event);
    this.trackPostHogEvent(event);
  }

  // 사용자 식별
  identifyUser(userId: string, properties?: Record<string, any>) {
    if (this.isPostHogEnabled && typeof window !== "undefined") {
      const posthog = (window as any).posthog;
      if (posthog) {
        posthog.identify(userId, properties);
      }
    }

    if (this.isGA4Enabled && typeof window !== "undefined") {
      window.gtag("config", this.measurementId, {
        user_id: userId,
        custom_map: properties,
      });
    }
  }

  // 사용자 속성 설정
  setUserProperties(properties: Record<string, any>) {
    if (this.isPostHogEnabled && typeof window !== "undefined") {
      const posthog = (window as any).posthog;
      if (posthog) {
        posthog.people.set(properties);
      }
    }
  }

  // 전환 추적
  trackConversion(conversionId: string, value?: number, currency?: string) {
    if (this.isGA4Enabled && typeof window !== "undefined") {
      window.gtag("event", "conversion", {
        send_to: conversionId,
        value: value,
        currency: currency || "KRW",
      });
    }
  }

  // 커스텀 이벤트들
  trackProductView(
    productId: string,
    productName: string,
    category: string,
    price: number
  ) {
    this.trackEvent({
      action: "view_item",
      category: "ecommerce",
      event: "product_viewed",
      label: productName,
      value: price,
      properties: {
        product_id: productId,
        product_name: productName,
        category: category,
        price: price,
      },
    });
  }

  trackProductSearch(searchTerm: string, resultsCount: number) {
    this.trackEvent({
      action: "search",
      category: "ecommerce",
      event: "product_search",
      label: searchTerm,
      value: resultsCount,
      properties: {
        search_term: searchTerm,
        results_count: resultsCount,
      },
    });
  }

  trackAddToCart(productId: string, productName: string, price: number) {
    this.trackEvent({
      action: "add_to_cart",
      category: "ecommerce",
      event: "product_added_to_cart",
      label: productName,
      value: price,
      properties: {
        product_id: productId,
        product_name: productName,
        price: price,
      },
    });
  }

  trackPurchase(transactionId: string, value: number, items: any[]) {
    this.trackEvent({
      action: "purchase",
      category: "ecommerce",
      event: "purchase_completed",
      label: transactionId,
      value: value,
      properties: {
        transaction_id: transactionId,
        value: value,
        items: items,
      },
    });
  }

  trackChatMessage(senderId: string, receiverId: string, productId: string) {
    this.trackEvent({
      action: "send_message",
      category: "engagement",
      event: "chat_message_sent",
      properties: {
        sender_id: senderId,
        receiver_id: receiverId,
        product_id: productId,
      },
    });
  }

  trackUserRegistration(method: string) {
    this.trackEvent({
      action: "sign_up",
      category: "user",
      event: "user_registered",
      properties: {
        method: method,
      },
    });
  }

  trackUserLogin(method: string) {
    this.trackEvent({
      action: "login",
      category: "user",
      event: "user_logged_in",
      properties: {
        method: method,
      },
    });
  }

  trackError(error: string, context?: Record<string, any>) {
    this.trackEvent({
      action: "error",
      category: "error",
      event: "error_occurred",
      properties: {
        error_message: error,
        ...context,
      },
    });
  }
}

// 싱글톤 인스턴스
export const analytics = new AnalyticsService();


















