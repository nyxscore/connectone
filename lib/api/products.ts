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
import { getFirebaseDb as getDb } from "./firebase-ultra-safe";
import { SellItemInput } from "../../data/schemas/product";

export interface Item extends SellItemInput {
  id: string;
  sellerUid: string;
  aiTags: string[];
  status:
    | "active"
    | "reserved"
    | "paid_hold"
    | "sold"
    | "inactive"
    | "escrow_completed"
    | "shipping";
  tradeOptions?: string[];
  shippingInfo?: {
    courier: string;
    trackingNumber: string;
    shippedAt: any;
  };
  buyerShippingInfo?: {
    recipientName: string;
    address: string;
    phoneNumber: string;
    deliveryMemo?: string;
    submittedAt: any;
  };
  transactionCancelledAt?: any;
  buyerUid?: string;
  cancelRequest?: {
    requestedBy: string; // 요청한 사용자 UID
    requestedAt: any; // 요청 시간
    reason?: string; // 취소 사유
    status: "pending" | "approved" | "rejected"; // 요청 상태
    processedBy?: string; // 처리한 사용자 UID
    processedAt?: any; // 처리 시간
  };
  createdAt: any;
  updatedAt: any;
}

export interface ItemApplication {
  id: string;
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: any;
  processedAt?: any;
}

// 아이템 생성
export async function createItem(
  itemData: SellItemInput & {
    sellerUid: string;
    aiTags?: string[];
    tradeOptions?: string[];
  }
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  const db = await getDb();
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
          grade: "E",
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
  const db = await getDb();
  try {
    console.log("getItem 호출:", itemId);
    const docRef = doc(db, "items", itemId);
    console.log("docRef 생성 완료");
    const docSnap = await getDoc(docRef);
    console.log("getDoc 완료:", docSnap.exists());

    if (docSnap.exists()) {
      const itemData = { id: docSnap.id, ...docSnap.data() } as Item;
      console.log("아이템 데이터:", itemData);
      return {
        success: true,
        item: itemData,
      };
    } else {
      console.log("아이템이 존재하지 않음:", itemId);
      return {
        success: false,
        error: "아이템을 찾을 수 없습니다.",
      };
    }
  } catch (error) {
    console.error("아이템 조회 실패:", error);
    console.error("아이템 ID:", itemId);
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
  const db = await getDb();
  try {
    let q = query(
      collection(db, "items"),
      where("sellerUid", "==", sellerUid),
      where("status", "in", ["active", "cancelled"]), // 판매중 + 취소된 상품 (취소된 것도 판매중으로 표시)
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

    // 클라이언트 사이드에서 정렬 (createdAt 기준 내림차순)
    const sortedItems = items.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return {
      success: true,
      items: sortedItems,
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
  const db = await getDb();
  try {
    console.log("getReservedItemsBySeller 호출:", sellerUid);

    const q = query(
      collection(db, "items"),
      where("sellerUid", "==", sellerUid),
      where("status", "==", "reserved")
    );

    const querySnapshot = await getDocs(q);
    const items: Item[] = [];

    console.log("거래중 상품 쿼리 결과:", querySnapshot.docs.length, "개");

    querySnapshot.forEach(doc => {
      const data = doc.data();
      console.log("거래중 상품 데이터:", doc.id, data);
      items.push({ id: doc.id, ...data } as Item);
    });

    console.log("최종 거래중 상품 목록:", items);
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
  const db = await getDb();
  try {
    console.log("getReservedItemsForBuyer 호출:", { buyerUid });

    // 구매자가 구매한 상품들 중에서 거래중인 상품 조회
    // buyerId 또는 buyerUid 필드가 있는 상품들을 조회
    // status가 reserved, escrow_completed, shipping 중 하나인 상품
    const statuses = ["reserved", "escrow_completed", "shipping"];
    const allItems: Item[] = [];

    for (const status of statuses) {
      // buyerId로 조회
      const q1 = query(
        collection(db, "items"),
        where("buyerId", "==", buyerUid),
        where("status", "==", status)
      );
      const querySnapshot1 = await getDocs(q1);
      querySnapshot1.forEach(doc => {
        const data = doc.data();
        console.log(`구매중 상품 (buyerId, ${status}):`, doc.id, data);
        allItems.push({ id: doc.id, ...data } as Item);
      });

      // buyerUid로 조회
      const q2 = query(
        collection(db, "items"),
        where("buyerUid", "==", buyerUid),
        where("status", "==", status)
      );
      const querySnapshot2 = await getDocs(q2);
      querySnapshot2.forEach(doc => {
        const data = doc.data();
        console.log(`구매중 상품 (buyerUid, ${status}):`, doc.id, data);
        // 중복 제거 (이미 추가된 아이템은 스킵)
        if (!allItems.find(item => item.id === doc.id)) {
          allItems.push({ id: doc.id, ...data } as Item);
        }
      });
    }

    console.log("구매자 거래중 상품 최종 결과:", allItems.length, "개");
    return { success: true, items: allItems };
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
  const db = getDb();
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
      console.log("buyerId 추가:", buyerId);
    } else if (status === "active") {
      // active로 변경할 때는 buyerId 필드를 제거
      updateData.buyerId = deleteField();
      console.log("buyerId 제거");
    }

    console.log("업데이트할 데이터:", updateData);
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
  subcategory?: string; // 중간 카테고리 (예: 피아노, 기타)
  detailCategory?: string; // 세부 카테고리 (예: 디지털 피아노, 통기타)
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  status?: string;
}

export interface ItemListOptions {
  limit?: number;
  lastDoc?: any;
  sortBy?: "createdAt" | "price";
  sortOrder?: "desc" | "asc";
  filters?: ItemListFilters;
  currentUserId?: string; // 현재 로그인한 사용자 ID
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

    const db = getDb();

    // 상태 필터 처리
    let statusFilter = [
      "active",
      "reserved",
      "escrow_completed",
      "sold",
      "cancelled",
    ]; // 기본값: 모든 상태 (취소된 것도 포함)

    if (filters.status) {
      switch (filters.status) {
        case "available":
          statusFilter = ["active", "cancelled"]; // 거래가능한 상품 (취소된 것도 포함)
          break;
        case "reserved":
          statusFilter = ["reserved", "escrow_completed"]; // 거래중인 상품만 (안전결제 완료 포함)
          break;
        case "sold":
          statusFilter = ["sold"]; // 거래완료된 상품만
          break;
        case "all":
          statusFilter = [
            "active",
            "reserved",
            "escrow_completed",
            "sold",
            "cancelled",
          ]; // 전체
          break;
        default:
          statusFilter = [
            "active",
            "reserved",
            "escrow_completed",
            "sold",
            "cancelled",
          ]; // 전체
      }
    }

    // 기본 쿼리: 필터에 따라 상태별 조회
    let q = query(collection(db, "items"), where("status", "in", statusFilter));

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
      console.log(
        "상품 데이터:",
        doc.id,
        itemData.title,
        itemData.status,
        itemData.category
      );
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

    // 카테고리 필터링 (클라이언트 사이드 - 계층적 카테고리 지원)
    if (filters.category) {
      console.log("=== 카테고리 필터링 시작 ===");
      console.log("필터 조건:", {
        category: filters.category,
        subcategory: filters.subcategory,
        detailCategory: filters.detailCategory,
      });

      // 필터링 전 샘플 카테고리 확인
      console.log(
        "샘플 카테고리 데이터:",
        items.slice(0, 5).map(item => ({
          id: item.id,
          title: item.title,
          category: item.category,
        }))
      );

      // 전체 카테고리 목록 확인
      const allCategories = [...new Set(items.map(item => item.category))];
      console.log("데이터베이스의 모든 카테고리:", allCategories);

      items = items.filter(item => {
        if (!item.category) {
          console.log(`❌ ${item.title}: 카테고리 없음`);
          return false;
        }

        // 메인 카테고리 매칭 - 여러 패턴 시도
        const categoryMatch =
          item.category === filters.category ||
          item.category?.startsWith(filters.category + "기 >") ||
          item.category?.startsWith(filters.category + " >") ||
          item.category?.includes(filters.category);

        if (!categoryMatch) {
          console.log(
            `❌ ${item.title}: 메인 카테고리 불일치 (${item.category} / ${filters.category})`
          );
          return false;
        }

        // 서브카테고리가 지정된 경우 (예: "피아노")
        if (filters.subcategory) {
          const subcategoryMatch = item.category?.includes(filters.subcategory);
          if (!subcategoryMatch) {
            console.log(
              `❌ ${item.title}: 서브카테고리 불일치 (${item.category} / ${filters.subcategory})`
            );
            return false;
          }

          // 상세 카테고리가 지정된 경우 (예: "디지털 피아노")
          if (filters.detailCategory) {
            const detailMatch = item.category?.includes(filters.detailCategory);
            if (!detailMatch) {
              console.log(
                `❌ ${item.title}: 상세 카테고리 불일치 (${item.category} / ${filters.detailCategory})`
              );
              return false;
            }
            console.log(`✅ ${item.title}: 모든 조건 일치 (${item.category})`);
            return true;
          }

          console.log(
            `✅ ${item.title}: 서브카테고리까지 일치 (${item.category})`
          );
          return true;
        }

        console.log(`✅ ${item.title}: 메인 카테고리 일치 (${item.category})`);
        return true;
      });

      console.log("카테고리 필터링 후 상품 개수:", items.length);
      console.log("=== 카테고리 필터링 끝 ===");
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

    // 거래중인 상품 필터링 (구매자와 판매자에게만 보이도록)
    if (options.currentUserId) {
      console.log("사용자 ID로 필터링:", options.currentUserId);
      const beforeFilterCount = items.length;
      items = items.filter(item => {
        // 거래중인 상품인지 확인 (reserved, paid_hold, shipping, escrow_completed 상태)
        const isTradingItem =
          item.status === "reserved" ||
          item.status === "paid_hold" ||
          item.status === "shipping" ||
          item.status === "escrow_completed";

        if (isTradingItem) {
          // 거래중인 상품은 구매자나 판매자에게만 보임
          const isSeller = item.sellerUid === options.currentUserId;
          const isBuyer =
            item.buyerUid === options.currentUserId ||
            item.buyerId === options.currentUserId;

          console.log(
            `거래중 상품 ${item.title}: seller=${isSeller}, buyer=${isBuyer}, show=${isSeller || isBuyer}`
          );
          return isSeller || isBuyer;
        }

        // 거래중이 아닌 상품은 모든 사용자에게 보임
        console.log(`일반 상품 ${item.title}: 보임`);
        return true;
      });
      console.log(
        `사용자 필터링 후: ${beforeFilterCount} -> ${items.length}개`
      );
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
  const db = getDb();
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

// 구매자 배송지 정보 제출
export async function submitBuyerShippingInfo(
  itemId: string,
  buyerUid: string,
  shippingInfo: {
    recipientName: string;
    address: string;
    phoneNumber: string;
    deliveryMemo?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  const db = getDb();
  try {
    const itemRef = doc(db, "items", itemId);
    await updateDoc(itemRef, {
      buyerShippingInfo: {
        ...shippingInfo,
        submittedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("배송지 정보 제출 에러:", error);
    return { success: false, error: "배송지 정보 제출에 실패했습니다." };
  }
}

// 아이템 수정
export async function updateItem(
  itemId: string,
  sellerUid: string,
  updateData: Partial<SellItemInput>
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
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

// 상품 신청하기
export async function applyForItem(
  itemId: string,
  buyerUid: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  try {
    console.log("상품 신청 시작:", { itemId, buyerUid });

    // 상품 정보 가져오기
    const itemResult = await getItem(itemId);
    if (!itemResult.success || !itemResult.item) {
      return { success: false, error: "상품을 찾을 수 없습니다." };
    }

    const item = itemResult.item;

    // 이미 거래중이거나 거래완료된 상품인지 확인
    if (item.status !== "active") {
      return {
        success: false,
        error: "이미 거래중이거나 거래완료된 상품입니다.",
      };
    }

    // 판매자가 자신의 상품에 신청하는 것 방지
    if (item.sellerUid === buyerUid) {
      return { success: false, error: "자신의 상품에는 신청할 수 없습니다." };
    }

    // 이미 신청한 적이 있는지 확인
    const existingApplicationQuery = query(
      collection(db, "itemApplications"),
      where("itemId", "==", itemId),
      where("buyerUid", "==", buyerUid)
    );
    const existingApplicationSnapshot = await getDocs(existingApplicationQuery);

    if (!existingApplicationSnapshot.empty) {
      return { success: false, error: "이미 구매신청한 상품입니다." };
    }

    // 신청 데이터 생성
    const applicationData = {
      itemId,
      buyerUid,
      sellerUid: item.sellerUid,
      status: "pending",
      appliedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, "itemApplications"),
      applicationData
    );
    console.log("상품 신청 완료:", docRef.id);

    return { success: true };
  } catch (error) {
    console.error("상품 신청 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "구매신청에 실패했습니다.",
    };
  }
}

// 상품 신청자 목록 가져오기 (판매자용)
export async function getItemApplications(itemId: string): Promise<{
  success: boolean;
  applications?: ItemApplication[];
  error?: string;
}> {
  const db = getDb();
  try {
    console.log("구매신청자 목록 조회:", itemId);

    const applicationsQuery = query(
      collection(db, "itemApplications"),
      where("itemId", "==", itemId),
      where("status", "==", "pending"),
      orderBy("appliedAt", "asc")
    );

    const snapshot = await getDocs(applicationsQuery);
    const applications: ItemApplication[] = [];

    snapshot.forEach(doc => {
      applications.push({ id: doc.id, ...doc.data() } as ItemApplication);
    });

    console.log("구매신청자 목록:", applications.length, "명");
    return { success: true, applications };
  } catch (error) {
    console.error("구매신청자 목록 조회 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "구매신청자 목록을 불러오는데 실패했습니다.",
    };
  }
}

// 신청 승인하기
export async function approveApplication(
  applicationId: string,
  itemId: string,
  buyerUid: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  try {
    console.log("구매신청 승인 시작:", { applicationId, itemId, buyerUid });

    // 상품 상태를 reserved로 변경하고 buyerId 설정
    const itemRef = doc(db, "items", itemId);
    await updateDoc(itemRef, {
      status: "reserved",
      buyerId: buyerUid,
      updatedAt: serverTimestamp(),
    });

    // 승인된 신청 상태 업데이트
    const applicationRef = doc(db, "itemApplications", applicationId);
    await updateDoc(applicationRef, {
      status: "approved",
      processedAt: serverTimestamp(),
    });

    // 다른 모든 신청들을 거부 처리
    const otherApplicationsQuery = query(
      collection(db, "itemApplications"),
      where("itemId", "==", itemId),
      where("status", "==", "pending")
    );
    const otherApplicationsSnapshot = await getDocs(otherApplicationsQuery);

    const rejectPromises = otherApplicationsSnapshot.docs.map(doc => {
      if (doc.id !== applicationId) {
        return updateDoc(doc.ref, {
          status: "rejected",
          processedAt: serverTimestamp(),
        });
      }
    });

    await Promise.all(rejectPromises);

    console.log("구매신청 승인 완료");
    return { success: true };
  } catch (error) {
    console.error("구매신청 승인 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "승인 처리에 실패했습니다.",
    };
  }
}

// 사용자의 신청 상태 확인
export async function getUserApplicationStatus(
  itemId: string,
  buyerUid: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const db = getDb();
  try {
    const applicationQuery = query(
      collection(db, "itemApplications"),
      where("itemId", "==", itemId),
      where("buyerUid", "==", buyerUid)
    );

    const snapshot = await getDocs(applicationQuery);

    if (snapshot.empty) {
      return { success: true, status: "none" };
    }

    const application = snapshot.docs[0].data() as ItemApplication;
    return { success: true, status: application.status };
  } catch (error) {
    console.error("구매신청 상태 확인 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "구매신청 상태를 확인하는데 실패했습니다.",
    };
  }
}
