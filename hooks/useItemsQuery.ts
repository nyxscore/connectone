import { useState, useEffect, useCallback, useRef } from "react";
import {
  getItemList,
  ItemListFilters,
  ItemListOptions,
} from "../lib/api/products";
import { SellItem } from "../data/types";

export interface UseItemsQueryOptions {
  initialFilters?: ItemListFilters;
  initialSortBy?: "createdAt" | "price";
  initialSortOrder?: "desc" | "asc";
  limit?: number;
}

export interface UseItemsQueryReturn {
  items: SellItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string;
  filters: ItemListFilters;
  sortBy: "createdAt" | "price";
  sortOrder: "desc" | "asc";
  setFilters: (filters: ItemListFilters) => void;
  setSortBy: (sortBy: "createdAt" | "price") => void;
  setSortOrder: (sortOrder: "desc" | "asc") => void;
  loadMore: () => void;
  refresh: () => void;
  clearError: () => void;
}

export function useItemsQuery(
  options: UseItemsQueryOptions = {}
): UseItemsQueryReturn {
  const {
    initialFilters = {},
    initialSortBy = "createdAt",
    initialSortOrder = "desc",
    limit = 20,
  } = options;

  const [items, setItems] = useState<SellItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<ItemListFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<"createdAt" | "price">(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">(initialSortOrder);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadItems = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
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
          sortBy,
          sortOrder,
          filters,
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
      }
    },
    [filters, sortBy, sortOrder, lastDoc, limit]
  );

  // 정렬이 변경될 때 즉시 로드
  useEffect(() => {
    loadItems(true);
  }, [sortBy, sortOrder]);

  // 필터 변경 시 디바운싱 적용
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 500ms 후에 검색 실행
    debounceTimeoutRef.current = setTimeout(() => {
      loadItems(true);
    }, 500);

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

  const handleSetSortBy = useCallback((newSortBy: "createdAt" | "price") => {
    setSortBy(newSortBy);
  }, []);

  const handleSetSortOrder = useCallback((newSortOrder: "desc" | "asc") => {
    setSortOrder(newSortOrder);
  }, []);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    filters,
    sortBy,
    sortOrder,
    setFilters: handleSetFilters,
    setSortBy: handleSetSortBy,
    setSortOrder: handleSetSortOrder,
    loadMore,
    refresh,
    clearError,
  };
}
