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
} from "firebase/firestore";
import { db } from "./firebase";
import { SellItemInput } from "../../data/schemas/product";

export interface Item extends SellItemInput {
  id: string;
  sellerUid: string;
  aiTags: string[];
  status: "active" | "sold" | "inactive";
  createdAt: any;
  updatedAt: any;
}

// 아이템 생성
export async function createItem(
  sellerUid: string,
  itemData: SellItemInput
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    console.log("createItem 호출:", { sellerUid, itemData });

    const docRef = await addDoc(collection(db, "items"), {
      sellerUid,
      ...itemData,
      aiTags: [], // AI 태그는 나중에 추가
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

// 아이템 상태 업데이트
export async function updateItemStatus(
  itemId: string,
  status: "active" | "sold" | "inactive"
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, "items", itemId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });

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

    console.log("getItemList 호출:", {
      limitCount,
      sortBy,
      sortOrder,
      filters,
    });

    // 기본 쿼리: 모든 아이템 조회 (인덱스 문제를 피하기 위해)
    let q = query(collection(db, "items"));

    // 필터 적용
    if (filters.category) {
      q = query(q, where("category", "==", filters.category));
    }
    if (filters.region) {
      q = query(q, where("region", "==", filters.region));
    }
    if (filters.minPrice !== undefined) {
      q = query(q, where("price", ">=", filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
      q = query(q, where("price", "<=", filters.maxPrice));
    }

    // 정렬 적용
    q = query(q, orderBy("createdAt", "desc"));

    // 페이지네이션
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // 제한 적용
    q = query(q, limit(limitCount));

    console.log("Firestore 쿼리 실행 중...");
    const querySnapshot = await getDocs(q);
    console.log("쿼리 결과:", querySnapshot.docs.length, "개 문서");

    const items: Item[] = [];
    let newLastDoc: any = null;

    querySnapshot.forEach(doc => {
      const itemData = { id: doc.id, ...doc.data() } as Item;
      console.log("아이템 데이터:", {
        id: itemData.id,
        brand: itemData.brand,
        model: itemData.model,
        status: itemData.status,
      });

      // status 필터링 (클라이언트 사이드)
      if (itemData.status !== "active") {
        return;
      }

      // 키워드 필터링 (클라이언트 사이드)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchesKeyword =
          itemData.brand.toLowerCase().includes(keyword) ||
          itemData.model.toLowerCase().includes(keyword);

        if (matchesKeyword) {
          items.push(itemData);
        }
      } else {
        items.push(itemData);
      }
    });

    // 마지막 문서 저장
    if (querySnapshot.docs.length > 0) {
      newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    console.log("최종 아이템 수:", items.length);

    return {
      success: true,
      items,
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
