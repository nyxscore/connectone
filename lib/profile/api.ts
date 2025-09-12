import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../api/firebase";
import {
  UserProfile,
  ProfileUpdateData,
  TradeItem,
} from "../../data/profile/types";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 사용자 프로필 조회
export async function getUserProfile(
  uid: string
): Promise<ApiResponse<UserProfile>> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));

    if (!userDoc.exists()) {
      return { success: false, error: "사용자를 찾을 수 없습니다." };
    }

    const userData = userDoc.data();
    return {
      success: true,
      data: {
        uid: userDoc.id,
        ...userData,
      } as UserProfile,
    };
  } catch (error) {
    console.error("사용자 프로필 조회 실패:", error);
    return {
      success: false,
      error: "사용자 프로필을 불러오는데 실패했습니다.",
    };
  }
}

// 사용자 프로필 업데이트
export async function updateUserProfile(
  uid: string,
  updateData: ProfileUpdateData
): Promise<ApiResponse<void>> {
  try {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("사용자 프로필 업데이트 실패:", error);
    return { success: false, error: "프로필 업데이트에 실패했습니다." };
  }
}

// 아바타 이미지 업로드
export async function uploadAvatar(
  uid: string,
  file: File
): Promise<ApiResponse<string>> {
  try {
    // 이미지 압축 및 WebP 변환
    const compressedFile = await compressImage(file);

    // Firebase Storage에 업로드
    const timestamp = Date.now();
    const fileName = `${timestamp}.webp`;
    const storageRef = ref(storage, `avatars/${uid}/${fileName}`);

    const snapshot = await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, data: downloadURL };
  } catch (error) {
    console.error("아바타 업로드 실패:", error);
    return { success: false, error: "아바타 업로드에 실패했습니다." };
  }
}

// 이미지 압축 및 WebP 변환
async function compressImage(file: File): Promise<File> {
  return new Promise(resolve => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // 최대 크기 300x300으로 리사이즈
      const maxSize = 300;
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        0.8
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// 최근 거래 내역 조회
export async function getRecentTrades(
  uid: string,
  limitCount: number = 5
): Promise<ApiResponse<TradeItem[]>> {
  try {
    // transactions 컬렉션에서 해당 사용자가 참여한 거래 조회
    const transactionsRef = collection(db, "transactions");
    const q = query(
      transactionsRef,
      where("buyerUid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const trades: TradeItem[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // 상품 정보 조회
      const itemDoc = await getDoc(doc(db, "items", data.itemId));
      if (!itemDoc.exists()) continue;

      const itemData = itemDoc.data();

      // 거래 상대방 정보 조회
      const partnerUid = data.buyerUid === uid ? data.sellerUid : data.buyerUid;
      const partnerDoc = await getDoc(doc(db, "users", partnerUid));
      const partnerData = partnerDoc.data();

      trades.push({
        id: doc.id,
        itemId: data.itemId,
        brand: itemData.brand,
        model: itemData.model,
        price: itemData.price,
        thumbnail: itemData.images?.[0],
        state: data.state,
        createdAt: data.createdAt,
        partnerUid,
        partnerNickname: partnerData?.nickname || "알 수 없음",
      });
    }

    return { success: true, data: trades };
  } catch (error) {
    console.error("거래 내역 조회 실패:", error);
    return { success: false, error: "거래 내역을 불러오는데 실패했습니다." };
  }
}

// 사용자 등급 정보 가져오기
export function getGradeInfo(grade: string) {
  const gradeInfo = {
    C: {
      label: "Chord",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      description: "신규 회원",
    },
    D: {
      label: "Duo",
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      description: "거래 시작",
    },
    E: {
      label: "Ensemble",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      description: "활발한 거래",
    },
    F: {
      label: "Forte",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "신뢰할 수 있는 판매자",
    },
    G: {
      label: "Grand",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "전문 판매자",
    },
    A: {
      label: "Allegro",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "우수 판매자",
    },
    B: {
      label: "Bravura",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "최고 등급",
    },
  };

  return gradeInfo[grade as keyof typeof gradeInfo] || gradeInfo.C;
}
