import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  deleteField,
} from "firebase/firestore";
import { db } from "./firebase";
import { SellItemInput } from "../../data/schemas/product";

export interface Item extends SellItemInput {
  id: string;
  sellerUid: string;
  aiTags: string[];
  status: "active" | "reserved" | "paid_hold" | "sold" | "inactive";
  createdAt: any;
  updatedAt: any;
}

// 아이템 생성
export async function createItem(
  itemData: SellItemInput & {
    sellerUid: string;
    aiTags?: string[];
    tradeOptions?: string[];
  }
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    console.log("createItem 호출:", itemData);

    // 판매자 프로필 확인 및 생성
    try {
      const userDoc = await getDoc(doc(db, "users", itemData.sellerUid));
      if (!userDoc.exists()) {
        console.log("사용자 프로필이 없어서 생성합니다:", itemData.sellerUid);

        // 기본 사용자 프로필 생성
        await addDoc(collection(db, "users"), {
          uid: itemData.sellerUid,
          username: itemData.sellerUid,
          nickname: "사용자",
          region: "서울시 강남구",
          grade: "Bronze",
          tradesCount: 0,
          reviewsCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          safeTransactionCount: 0,
          averageRating: 0,
          disputeCount: 0,
          isPhoneVerified: false,
          isIdVerified: false,
          isBankVerified: false,
        });

        console.log("사용자 프로필 생성 완료:", itemData.sellerUid);
      } else {
        console.log("사용자 프로필이 이미 존재합니다:", itemData.sellerUid);
      }
    } catch (profileError) {
      console.error("사용자 프로필 확인/생성 실패:", profileError);
      // 프로필 오류가 있어도 상품 등록은 계속 진행
    }

    const docRef = await addDoc(collection(db, "items"), {
      ...itemData,
      aiTags: itemData.aiTags || [], // AI 태그는 나중에 추가
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("아이템 생성 성공:", docRef.id);
    return {
      success: true,
      itemId: docRef.id,
    };
  } catch (error) {
    console.error("아이템 생성 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "아이템 생성에 실패했습니다.",
    };
  }
}

// 아이템 조회
export async function getItem(
  itemId: string
): Promise<{ success: boolean; item?: Item; error?: string }> {
  try {
    const docRef = doc(db, "items", itemId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        item: { id: docSnap.id, ...docSnap.data() } as Item,
      };
    } else {
      return {
        success: false,
        error: "아이템을 찾을 수 없습니다.",
      };
    }
  } catch (error) {
    console.error("아이템 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "아이템 조회에 실패했습니다.",
    };
  }
}

// 사용자의 아이템 목록 조회
export async function getUserItems(
  sellerUid: string,
  limitCount: number = 20,
  lastDoc?: any
): Promise<{ success: boolean; items?: Item[]; error?: string }> {
  try {
    let q = query(
      collection(db, "items"),
      where("sellerUid", "==", sellerUid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const items: Item[] = [];

    querySnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as Item);
    });

    return {
      success: true,
      items,
    };
  } catch (error) {
    console.error("사용자 아이템 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "아이템 조회에 실패했습니다.",
    };
  }
}

// 거래중인 상품 조회 (판매자용)
export async function getReservedItemsBySeller(
  sellerUid: string
): Promise<{ success: boolean; items?: Item[]; error?: string }> {
  try {
    const q = query(
      collection(db, "items"),
      where("sellerId", "==", sellerUid),
      where("status", "==", "reserved")
    );

    const querySnapshot = await getDocs(q);
    const items: Item[] = [];

    querySnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as Item);
    });

    return { success: true, items };
  } catch (error) {
    console.error("거래중 상품 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "거래중 상품 조회에 실패했습니다.",
    };
  }
}

// 거래중인 상품 조회 (구매자용 - 구매한 상품 중에서)
export async function getReservedItemsForBuyer(
  buyerUid: string
): Promise<{ success: boolean; items?: Item[]; error?: string }> {
  try {
    // 구매자가 구매한 상품들 중에서 거래중인 상품 조회
    // buyerId 필드가 있는 상품들을 조회 (구매자가 구매한 상품)
    const q = query(
      collection(db, "items"),
      where("buyerId", "==", buyerUid),
      where("status", "==", "reserved")
    );

    const querySnapshot = await getDocs(q);
    const items: Item[] = [];

    querySnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as Item);
    });

    return { success: true, items };
  } catch (error) {
    console.error("구매자 거래중 상품 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "거래중 상품 조회에 실패했습니다.",
    };
  }
}

// 아이템 상태 업데이트
export async function updateItemStatus(
  itemId: string,
  status: "active" | "reserved" | "paid_hold" | "sold" | "inactive",
  buyerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("updateItemStatus 호출:", { itemId, status });

    if (!itemId) {
      throw new Error("상품 ID가 필요합니다.");
    }

    const docRef = doc(db, "items", itemId);
    console.log("문서 참조 생성:", docRef);

    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    // 구매자 ID가 제공된 경우 추가, active로 변경 시 buyerId 제거
    if (buyerId) {
      updateData.buyerId = buyerId;
    } else if (status === "active") {
      // active로 변경할 때는 buyerId 필드를 제거
      updateData.buyerId = deleteField();
    }

    await updateDoc(docRef, updateData);

    console.log("상품 상태 업데이트 성공");
    return { success: true };
  } catch (error) {
    console.error("아이템 상태 업데이트 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상태 업데이트에 실패했습니다.",
    };
  }
}

// 상품 목록 조회 (페이지네이션, 필터링, 정렬)
export interface ItemListFilters {
  keyword?: string;
  category?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
}

export interface ItemListOptions {
  limit?: number;
  lastDoc?: any;
  sortBy?: "createdAt" | "price";
  sortOrder?: "desc" | "asc";
  filters?: ItemListFilters;
}

export async function getItemList(options: ItemListOptions = {}): Promise<{
  success: boolean;
  items?: Item[];
  lastDoc?: any;
  error?: string;
}> {
  try {
    const {
      limit: limitCount = 20,
      lastDoc,
      sortBy = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = options;

    // 기본 쿼리: active, reserved, sold 상태인 아이템 조회 (거래중, 판매완료 상품도 표시)
    let q = query(
      collection(db, "items"),
      where("status", "in", ["active", "reserved", "sold"])
    );

    // 디버깅: 모든 상품의 카테고리 확인 (개발 중에만)
    if (filters.category && process.env.NODE_ENV === "development") {
      console.log("=== 카테고리 디버깅 시작 ===");
      const allItemsQuery = query(
        collection(db, "items"),
        where("status", "in", ["active", "reserved", "sold"])
      );
      const allItemsSnapshot = await getDocs(allItemsQuery);
      console.log("전체 상품 개수:", allItemsSnapshot.size);
      const allCategories = new Set();
      allItemsSnapshot.forEach(doc => {
        const data = doc.data();
        allCategories.add(data.category);
      });
      console.log(
        "데이터베이스에 있는 모든 카테고리:",
        Array.from(allCategories)
      );
      console.log("=== 카테고리 디버깅 끝 ===");
    }

    // 필터 적용 (서버 사이드) - 복합 인덱스가 필요한 필터는 제거
    if (filters.category) {
      console.log("카테고리 필터 적용:", filters.category);
      // 카테고리 필터링은 클라이언트 사이드에서 처리 (서브카테고리 지원)
      // q = query(q, where("category", "==", filters.category));
    }
    if (filters.region) {
      q = query(q, where("region", "==", filters.region));
    }
    // 가격 필터는 클라이언트 사이드에서 처리 (복합 인덱스 방지)
    // if (filters.minPrice !== undefined) {
    //   q = query(q, where("price", ">=", filters.minPrice));
    // }
    // if (filters.maxPrice !== undefined) {
    //   q = query(q, where("price", "<=", filters.maxPrice));
    // }

    // 정렬은 클라이언트 사이드에서 처리 (복합 인덱스 방지)
    // q = query(q, orderBy(sortBy, sortOrder));

    // 페이지네이션
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // 제한 적용 (키워드 검색을 위해 더 많이 가져옴)
    const fetchLimit = filters.keyword ? limitCount * 3 : limitCount;
    q = query(q, limit(fetchLimit));

    const querySnapshot = await getDocs(q);
    let items: Item[] = [];
    let newLastDoc: any = null;

    console.log("쿼리 결과 개수:", querySnapshot.size);
    querySnapshot.forEach(doc => {
      const itemData = { id: doc.id, ...doc.data() } as Item;
      items.push(itemData);
    });

    // 클라이언트 사이드 필터링 및 정렬
    // 가격 필터링
    if (filters.minPrice !== undefined) {
      items = items.filter(item => item.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      items = items.filter(item => item.price <= filters.maxPrice!);
    }

    // 거래 가능 필터링 (체크되면 active 상태만 표시)
    if (filters.available) {
      items = items.filter(item => item.status === "active");
    }

    // 카테고리 필터링 (클라이언트 사이드 - 서브카테고리 지원)
    if (filters.category) {
      console.log("클라이언트 사이드 카테고리 필터링:", filters.category);
      items = items.filter(item => {
        // 정확히 일치하거나 해당 카테고리로 시작하는 경우
        const categoryMatch =
          item.category === filters.category ||
          item.category?.startsWith(filters.category + "기 >") ||
          item.category?.startsWith(filters.category + " >");

        console.log(
          `상품 ${item.id}: category="${item.category}", filter="${filters.category}", match=${categoryMatch}`
        );
        return categoryMatch;
      });
      console.log("카테고리 필터링 후 상품 개수:", items.length);
    }

    // 키워드 필터링
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      items = items.filter(item => {
        return (
          item.brand?.toLowerCase().includes(keyword) ||
          item.model?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword) ||
          item.title?.toLowerCase().includes(keyword)
        );
      });
    }

    // 정렬 (클라이언트 사이드)
    items.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "createdAt":
          aValue = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt);
          bValue = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt);
          break;
        case "updatedAt":
          aValue = a.updatedAt?.toDate
            ? a.updatedAt.toDate()
            : new Date(a.updatedAt);
          bValue = b.updatedAt?.toDate
            ? b.updatedAt.toDate()
            : new Date(b.updatedAt);
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "title":
          aValue = a.title || "";
          bValue = b.title || "";
          break;
        default:
          aValue = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt);
          bValue = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // 마지막 문서 저장
    if (querySnapshot.docs.length > 0) {
      newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    return {
      success: true,
      items: items.slice(0, limitCount), // 정확한 개수로 제한
      lastDoc: newLastDoc,
    };
  } catch (error) {
    console.error("상품 목록 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상품 목록 조회에 실패했습니다.",
    };
  }
}

// 아이템 삭제
export async function deleteItem(
  itemId: string,
  sellerUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("deleteItem 호출:", { itemId, sellerUid });

    // 먼저 아이템이 존재하는지 확인
    const itemRef = doc(db, "items", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      return {
        success: false,
        error: "상품을 찾을 수 없습니다.",
      };
    }

    const itemData = itemSnap.data() as Item;

    // 판매자 권한 확인
    if (itemData.sellerUid !== sellerUid) {
      return {
        success: false,
        error: "상품을 삭제할 권한이 없습니다.",
      };
    }

    // 아이템 삭제
    await deleteDoc(itemRef);

    console.log("아이템 삭제 성공:", itemId);
    return {
      success: true,
    };
  } catch (error) {
    console.error("아이템 삭제 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "상품 삭제에 실패했습니다.",
    };
  }
}

// 아이템 수정
export async function updateItem(
  itemId: string,
  sellerUid: string,
  updateData: Partial<SellItemInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("updateItem 호출:", { itemId, sellerUid, updateData });

    // 먼저 아이템이 존재하는지 확인
    const itemRef = doc(db, "items", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      return {
        success: false,
        error: "상품을 찾을 수 없습니다.",
      };
    }

    const itemData = itemSnap.data() as Item;

    // 판매자 권한 확인
    if (itemData.sellerUid !== sellerUid) {
      return {
        success: false,
        error: "상품을 수정할 권한이 없습니다.",
      };
    }

    // 아이템 수정
    await updateDoc(itemRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    console.log("아이템 수정 성공:", itemId);
    return {
      success: true,
    };
  } catch (error) {
    console.error("아이템 수정 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "상품 수정에 실패했습니다.",
    };
  }
}
