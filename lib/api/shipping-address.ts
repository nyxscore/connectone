import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";
import { ShippingAddress } from "../schemas";

// 배송지 추가
export const addShippingAddress = async (
  userId: string,
  address: ShippingAddress
): Promise<{ success: boolean; error?: string }> => {
  try {
    const addressRef = doc(collection(db, "shippingAddresses"));

    // 기본 배송지로 설정하는 경우, 기존 기본 배송지들을 해제
    if (address.isDefault) {
      await unsetDefaultAddresses(userId);
    }

    await setDoc(addressRef, {
      ...address,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("배송지 추가 실패:", error);
    return { success: false, error: "배송지 추가에 실패했습니다." };
  }
};

// 사용자의 모든 배송지 가져오기
export const getShippingAddresses = async (
  userId: string
): Promise<{
  success: boolean;
  addresses?: ShippingAddress[];
  error?: string;
}> => {
  try {
    const q = query(
      collection(db, "shippingAddresses"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const addresses: ShippingAddress[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      addresses.push({
        ...data,
        id: doc.id,
      } as ShippingAddress & { id: string });
    });

    // 기본 배송지를 먼저 정렬
    addresses.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    return { success: true, addresses };
  } catch (error) {
    console.error("배송지 목록 가져오기 실패:", error);
    return { success: false, error: "배송지 목록을 가져오는데 실패했습니다." };
  }
};

// 배송지 수정
export const updateShippingAddress = async (
  addressId: string,
  address: Partial<ShippingAddress>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const addressRef = doc(db, "shippingAddresses", addressId);

    // 기본 배송지로 설정하는 경우, 기존 기본 배송지들을 해제
    if (address.isDefault) {
      const addressDoc = await getDoc(addressRef);
      if (addressDoc.exists()) {
        const data = addressDoc.data();
        await unsetDefaultAddresses(data.userId);
      }
    }

    await updateDoc(addressRef, {
      ...address,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("배송지 수정 실패:", error);
    return { success: false, error: "배송지 수정에 실패했습니다." };
  }
};

// 배송지 삭제
export const deleteShippingAddress = async (
  addressId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await deleteDoc(doc(db, "shippingAddresses", addressId));
    return { success: true };
  } catch (error) {
    console.error("배송지 삭제 실패:", error);
    return { success: false, error: "배송지 삭제에 실패했습니다." };
  }
};

// 기본 배송지 설정
export const setDefaultAddress = async (
  addressId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const addressRef = doc(db, "shippingAddresses", addressId);
    const addressDoc = await getDoc(addressRef);

    if (!addressDoc.exists()) {
      return { success: false, error: "배송지를 찾을 수 없습니다." };
    }

    const data = addressDoc.data();

    // 기존 기본 배송지들을 해제
    await unsetDefaultAddresses(data.userId);

    // 선택한 배송지를 기본으로 설정
    await updateDoc(addressRef, {
      isDefault: true,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("기본 배송지 설정 실패:", error);
    return { success: false, error: "기본 배송지 설정에 실패했습니다." };
  }
};

// 기존 기본 배송지들을 해제하는 헬퍼 함수
const unsetDefaultAddresses = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, "shippingAddresses"),
    where("userId", "==", userId),
    where("isDefault", "==", true)
  );

  const querySnapshot = await getDocs(q);
  const updatePromises = querySnapshot.docs.map(doc =>
    updateDoc(doc.ref, {
      isDefault: false,
      updatedAt: new Date(),
    })
  );

  await Promise.all(updatePromises);
};
