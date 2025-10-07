import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { getFirebaseDb as getDb } from "../api/firebase-safe";
import { Message, Chat } from "../../data/types/chat";

/**
 * 사용자의 응답률을 계산합니다.
 * 응답률 = (답장한 메시지 수 / 받은 메시지 수) * 100
 */
export async function calculateResponseRate(userId: string): Promise<number> {
  const db = await getDb();
  try {
    console.log("응답률 계산 시작:", userId);

    // 1. 사용자가 seller로 참여한 모든 채팅 가져오기
    const chatsRef = collection(db, "chats");
    const sellerQuery = query(chatsRef, where("sellerUid", "==", userId));
    const sellerChatsSnapshot = await getDocs(sellerQuery);

    if (sellerChatsSnapshot.empty) {
      console.log("판매자로 참여한 채팅이 없음:", userId);
      return 0; // 채팅이 없으면 응답률 0%
    }

    let totalReceivedMessages = 0;
    let totalRepliedMessages = 0;

    // 2. 각 채팅의 메시지들을 분석
    for (const chatDoc of sellerChatsSnapshot.docs) {
      const chatData = chatDoc.data() as Chat;
      const chatId = chatDoc.id;

      // 해당 채팅의 모든 메시지 가져오기
      const messagesRef = collection(db, "messages");
      const messagesQuery = query(
        messagesRef,
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc")
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      if (messagesSnapshot.empty) {
        continue;
      }

      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      // 메시지 분석: buyer가 보낸 메시지와 seller가 답장한 메시지 카운트
      let hasReceivedMessage = false;
      let hasRepliedMessage = false;

      for (const message of messages) {
        if (message.senderUid === chatData.buyerUid) {
          // buyer가 보낸 메시지 (받은 메시지)
          hasReceivedMessage = true;
        } else if (message.senderUid === userId && hasReceivedMessage) {
          // seller가 답장한 메시지 (답장한 메시지)
          hasRepliedMessage = true;
          break; // 한 번이라도 답장하면 해당 채팅은 응답 완료
        }
      }

      if (hasReceivedMessage) {
        totalReceivedMessages++;
        if (hasRepliedMessage) {
          totalRepliedMessages++;
        }
      }
    }

    // 3. 응답률 계산
    const responseRate =
      totalReceivedMessages > 0
        ? Math.round((totalRepliedMessages / totalReceivedMessages) * 100)
        : 0;

    console.log("응답률 계산 결과:", {
      userId,
      totalReceivedMessages,
      totalRepliedMessages,
      responseRate: `${responseRate}%`,
    });

    return responseRate;
  } catch (error) {
    console.error("응답률 계산 실패:", error);
    return 0; // 오류 시 0% 반환
  }
}

/**
 * 사용자의 응답률을 업데이트합니다.
 */
export async function updateUserResponseRate(userId: string): Promise<{
  success: boolean;
  responseRate?: number;
  error?: string;
}> {
  try {
    const responseRate = await calculateResponseRate(userId);

    // Firestore에서 사용자 프로필 업데이트
    const { doc, setDoc, getDoc } = await import("firebase/firestore");
    const userProfileRef = doc(db, "profiles", userId);

    // 문서가 존재하는지 확인
    const userProfileSnap = await getDoc(userProfileRef);

    if (userProfileSnap.exists()) {
      // 문서가 존재하면 업데이트
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(userProfileRef, {
        responseRate,
        updatedAt: new Date(),
      });
    } else {
      // 문서가 없으면 생성
      await setDoc(userProfileRef, {
        responseRate,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    }

    console.log("사용자 응답률 업데이트 완료:", { userId, responseRate });

    return {
      success: true,
      responseRate,
    };
  } catch (error) {
    console.error("사용자 응답률 업데이트 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "응답률 업데이트에 실패했습니다.",
    };
  }
}

/**
 * 모든 사용자의 응답률을 일괄 업데이트합니다. (관리자용)
 */
export async function updateAllUsersResponseRate(): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  try {
    console.log("전체 사용자 응답률 업데이트 시작");

    // 모든 프로필 가져오기
    const profilesRef = collection(db, "profiles");
    const profilesSnapshot = await getDocs(profilesRef);

    let updatedCount = 0;
    const updatePromises = [];

    for (const profileDoc of profilesSnapshot.docs) {
      const userId = profileDoc.id;
      const updatePromise = updateUserResponseRate(userId).then(result => {
        if (result.success) {
          updatedCount++;
        }
        return result;
      });
      updatePromises.push(updatePromise);
    }

    await Promise.all(updatePromises);

    console.log("전체 사용자 응답률 업데이트 완료:", updatedCount, "명");

    return {
      success: true,
      updatedCount,
    };
  } catch (error) {
    console.error("전체 사용자 응답률 업데이트 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "전체 응답률 업데이트에 실패했습니다.",
    };
  }
}
