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
import { calculateResponseRate } from "./responseRate";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
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
    console.log("getUserProfile 호출:", uid);
    const userDoc = await getDoc(doc(db, "users", uid));
    console.log("getUserProfile getDoc 완료:", userDoc.exists());

    if (!userDoc.exists()) {
      return { success: false, error: "사용자를 찾을 수 없습니다." };
    }

    const userData = userDoc.data();
    let profile = {
      uid: userDoc.id,
      ...userData,
      // 응답률이 없으면 기본값 0 설정
      responseRate: userData.responseRate || 0,
      // 자기소개 필드들 명시적으로 포함
      introShort: userData.introShort || "",
      introLong: userData.introLong || "",
    } as UserProfile;

    // 응답률이 없거나 오래된 경우 업데이트
    if (!userData.responseRate || !userData.lastResponseRateUpdate) {
      try {
        // calculateResponseRate는 이미 import됨
        const responseRate = await calculateResponseRate(uid);

        // 응답률 업데이트
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          responseRate,
          lastResponseRateUpdate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        profile.responseRate = responseRate;
        console.log("사용자 응답률 자동 업데이트:", { uid, responseRate });
      } catch (error) {
        console.error("응답률 계산 실패:", error);
        // 응답률 계산 실패해도 프로필은 반환
      }
    }

    return {
      success: true,
      data: profile,
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

// 아바타 이미지 삭제
export async function deleteAvatar(
  uid: string,
  photoURL?: string
): Promise<ApiResponse<void>> {
  try {
    // Firebase Storage에서 이미지 삭제
    if (photoURL) {
      try {
        // Storage URL에서 파일 경로 추출
        const urlParts = photoURL.split("/");
        let fileName = urlParts[urlParts.length - 1];
        
        // URL 파라미터 제거 (?alt=media&token=...)
        if (fileName.includes("?")) {
          fileName = fileName.split("?")[0];
        }
        
        // URL 디코딩 (avatars%2F... -> avatars/...)
        fileName = decodeURIComponent(fileName);
        
        const storageRef = ref(storage, fileName);
        await deleteObject(storageRef);
        console.log("Firebase Storage에서 아바타 삭제 완료:", fileName);
      } catch (storageError) {
        console.warn(
          "Firebase Storage에서 아바타 삭제 실패 (무시됨):",
          storageError
        );
        // Storage 삭제 실패해도 Firestore 업데이트는 진행
      }
    }

    // Firestore에서 photoURL 필드 삭제
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      photoURL: null,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("아바타 삭제 실패:", error);
    return { success: false, error: "아바타 삭제에 실패했습니다." };
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
    const q = query(transactionsRef, where("buyerUid", "==", uid));

    const snapshot = await getDocs(q);

    // 클라이언트에서 정렬 및 제한
    const sortedDocs = snapshot.docs
      .sort((a, b) => {
        const aTime = a.data().createdAt?.seconds || 0;
        const bTime = b.data().createdAt?.seconds || 0;
        return bTime - aTime; // 최신순
      })
      .slice(0, limitCount);
    const trades: TradeItem[] = [];

    for (const doc of sortedDocs) {
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

// 사용자 등급 정보 가져오기 (Chord 테마)
export function getGradeInfo(grade: string) {
  const gradeInfo = {
    C: {
      emoji: "🌱",
      label: "Chord",
      displayName: "Chord",
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "음악 여행의 시작",
    },
    D: {
      emoji: "🎵",
      label: "Duo",
      displayName: "Duo",
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      description: "함께하는 음악",
    },
    E: {
      emoji: "🎼",
      label: "Ensemble",
      displayName: "Ensemble",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      description: "화합의 멜로디",
    },
    F: {
      emoji: "🎹",
      label: "Forte",
      displayName: "Forte",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "강렬한 음악",
    },
    G: {
      emoji: "🎺",
      label: "Grand",
      displayName: "Grand",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "웅장한 연주",
    },
    A: {
      emoji: "🎸",
      label: "Allegro",
      displayName: "Allegro",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "빠르고 밝은 음악",
    },
    B: {
      emoji: "🎻",
      label: "Bravura",
      displayName: "Bravura",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "화려한 기교",
    },
  };

  return gradeInfo[grade as keyof typeof gradeInfo] || gradeInfo.C;
}
