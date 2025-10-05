import { useState, useEffect, useCallback, useRef } from "react";
import {
  getItemList,
  ItemListFilters,
  ItemListOptions,
} from "../lib/api/products";
import { SellItem } from "../data/types";
import { useAuth } from "../lib/hooks/useAuth";

export interface UseItemsQueryOptions {
  initialFilters?: ItemListFilters;
  limit?: number;
}

export interface UseItemsQueryReturn {
  items: SellItem[];
  loading: boolean;
  loadingMore: boolean;
  filtering: boolean;
  hasMore: boolean;
  error: string;
  filters: ItemListFilters;
  setFilters: (filters: ItemListFilters) => void;
  loadMore: () => void;
  refresh: () => void;
  clearError: () => void;
}

export function useItemsQuery(
  options: UseItemsQueryOptions = {}
): UseItemsQueryReturn {
  const { initialFilters = {}, limit = 20 } = options;
  const { user } = useAuth();

  const [items, setItems] = useState<SellItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtering, setFiltering] = useState(false); // 필터링 중 상태 추가
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<ItemListFilters>(initialFilters);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadItems = useCallback(
    async (reset = false, isFilterChange = false) => {
      try {
        if (reset) {
          if (isFilterChange) {
            setFiltering(true); // 필터 변경 시에는 filtering 상태 사용
          } else {
            setLoading(true); // 초기 로딩이나 새로고침 시에만 loading 상태 사용
          }
          setItems([]);
          setLastDoc(null);
          setHasMore(true);
          setError("");
        } else {
          setLoadingMore(true);
        }

        const queryOptions: ItemListOptions = {
          limit,
          lastDoc: reset ? undefined : lastDoc,
          filters,
          currentUserId: user?.uid, // 현재 사용자 ID 전달
        };

        const result = await getItemList(queryOptions);

        if (result.success && result.items) {
          if (reset) {
            setItems(result.items);
          } else {
            setItems(prev => [...prev, ...result.items!]);
          }
          setLastDoc(result.lastDoc);
          setHasMore(result.items.length === limit);
        } else {
          setError(result.error || "상품을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("상품 로드 실패:", err);
        setError("상품을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setFiltering(false);
      }
    },
    [filters, lastDoc, limit, user?.uid]
  );

  // 필터 변경 시 디바운싱 적용
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 200ms 후에 검색 실행 (즉각 반응)
    debounceTimeoutRef.current = setTimeout(() => {
      loadItems(true, true); // 필터 변경임을 표시
    }, 200);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filters]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadItems(false);
    }
  }, [loadItems, loadingMore, hasMore]);

  const refresh = useCallback(() => {
    loadItems(true);
  }, [loadItems]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const handleSetFilters = useCallback((newFilters: ItemListFilters) => {
    setFilters(newFilters);
  }, []);

  return {
    items,
    loading,
    loadingMore,
    filtering,
    hasMore,
    error,
    filters,
    setFilters: handleSetFilters,
    loadMore,
    refresh,
    clearError,
  };
}
