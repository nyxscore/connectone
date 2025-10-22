import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
      retry: (failureCount, error: any) => {
        // 4xx 에러는 재시도하지 않음
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // 최대 3번 재시도
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Query Keys
export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (filters: any) => ["products", "list", filters] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    search: (query: string) => ["products", "search", query] as const,
  },
  chat: {
    rooms: ["chat", "rooms"] as const,
    messages: (roomId: string) => ["chat", "messages", roomId] as const,
  },
} as const;










































