import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  and,
} from "firebase/firestore";
import { db } from "../api/firebase";
import {
  Chat,
  Message,
  ChatWithDetails,
  CreateChatData,
  SendMessageData,
} from "../../data/chat/types";
import { getItem } from "../api/products";
import { getUserProfile } from "../auth";

// 응답률 업데이트 (비동기)
async function updateResponseRateAsync(sellerUid: string) {
  try {
    const { updateUserResponseRate } = await import("../profile/responseRate");
    await updateUserResponseRate(sellerUid);
    console.log("응답률 업데이트 완료:", sellerUid);
  } catch (error) {
    console.error("응답률 업데이트 실패:", error);
  }
}

// 채팅 생성 또는 가져오기
export async function getOrCreateChat(
  itemId: string,
  buyerUid: string,
  sellerUid: string,
  firstMessage?: string
): Promise<{ success: boolean; chatId?: string; error?: string }> {
  try {
    // 자기 자신과의 채팅 방지
    if (buyerUid === sellerUid) {
      console.warn("자기 자신과의 채팅 생성 시도:", {
        buyerUid,
        sellerUid,
        itemId,
      });
      return { success: false, error: "자기 자신과는 채팅할 수 없습니다." };
    }

    const chatId = `${buyerUid}_${sellerUid}_${itemId}`;

    // 기존 채팅 확인
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      // 기존 채팅이 있으면 첫 메시지가 있을 때만 전송
      if (firstMessage) {
        await sendMessage({
          chatId,
          senderUid: buyerUid,
          content: firstMessage,
        });
      }
      return { success: true, chatId };
    }

    // 새 채팅 생성
    const chatData: Chat = {
      id: chatId,
      itemId,
      buyerUid,
      sellerUid,
      lastMessage: firstMessage || "",
      updatedAt: serverTimestamp() as Timestamp,
    };

    console.log("새 채팅 생성:", { chatId, chatData });
    await setDoc(chatRef, chatData);
    console.log("채팅 생성 완료:", chatId);

    // 첫 메시지가 있으면 전송
    if (firstMessage) {
      await sendMessage({
        chatId,
        senderUid: buyerUid,
        content: firstMessage,
      });
    }

    return { success: true, chatId };
  } catch (error) {
    console.error("채팅 생성/가져오기 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "채팅 생성에 실패했습니다.",
    };
  }
}

// 사용자의 채팅 목록 가져오기
export async function getUserChats(
  userId: string,
  lastDoc?: any,
  limitCount: number = 20
): Promise<{
  success: boolean;
  chats?: ChatWithDetails[];
  lastDoc?: any;
  error?: string;
}> {
  try {
    console.log("getUserChats 호출됨, userId:", userId);
    const chatsRef = collection(db, "chats");

    // buyerUid 또는 sellerUid가 userId인 채팅들을 모두 가져오기
    const buyerQuery = query(chatsRef, where("buyerUid", "==", userId));

    const sellerQuery = query(chatsRef, where("sellerUid", "==", userId));

    console.log("Firestore 쿼리 실행 중...");
    const [buyerSnapshot, sellerSnapshot] = await Promise.all([
      getDocs(buyerQuery),
      getDocs(sellerQuery),
    ]);

    console.log("Buyer 쿼리 결과:", buyerSnapshot.docs.length, "개");
    console.log("Seller 쿼리 결과:", sellerSnapshot.docs.length, "개");

    // 두 결과를 합치고 중복 제거
    const allChats = new Map();

    buyerSnapshot.docs.forEach(doc => {
      const chatData = { ...doc.data(), id: doc.id } as Chat;
      console.log("Buyer 채팅 데이터:", chatData);
      allChats.set(doc.id, chatData);
    });

    sellerSnapshot.docs.forEach(doc => {
      const chatData = { ...doc.data(), id: doc.id } as Chat;
      console.log("Seller 채팅 데이터:", chatData);
      allChats.set(doc.id, chatData);
    });

    // 시간순으로 정렬
    const sortedChats = Array.from(allChats.values()).sort((a, b) => {
      const aTime = a.updatedAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || 0;
      return bTime - aTime; // 최신순
    });

    // 페이지네이션 적용
    const startIndex = lastDoc
      ? sortedChats.findIndex(chat => chat.id === lastDoc.id) + 1
      : 0;
    const paginatedChats = sortedChats.slice(
      startIndex,
      startIndex + limitCount
    );

    const chats: ChatWithDetails[] = [];

    for (const chatData of paginatedChats) {
      // 상대방 정보 가져오기
      const otherUid =
        chatData.buyerUid === userId ? chatData.sellerUid : chatData.buyerUid;
      const otherUser = await getUserProfile(otherUid);

      // 아이템 정보 가져오기
      const itemResult = await getItem(chatData.itemId);

      // 미읽음 메시지 수 계산
      const unreadCount = await getUnreadMessageCount(chatData.id, userId);

      chats.push({
        ...chatData,
        otherUser: {
          uid: otherUid,
          nickname: otherUser?.nickname || "알 수 없음",
          profileImage: otherUser?.profileImage,
        },
        item: {
          id: itemResult.item?.id || chatData.itemId,
          title: itemResult.item?.title || "상품 정보 없음",
          price: itemResult.item?.price || 0,
          imageUrl: itemResult.item?.images?.[0],
        },
        unreadCount,
      });
    }

    console.log("최종 채팅 목록:", chats);
    return {
      success: true,
      chats,
      lastDoc: paginatedChats[paginatedChats.length - 1] || null,
    };
  } catch (error) {
    console.error("채팅 목록 가져오기 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "채팅 목록을 가져오는데 실패했습니다.",
    };
  }
}

// 메시지 전송
export async function sendMessage(
  data: SendMessageData
): Promise<{ success: boolean; error?: string }> {
  try {
    // senderUid 검증
    if (!data.senderUid) {
      console.error("sendMessage: senderUid가 없습니다:", data);
      return { success: false, error: "발신자 정보가 없습니다." };
    }

    const messagesRef = collection(db, "messages");
    const messageData: Omit<Message, "id"> = {
      chatId: data.chatId,
      senderUid: data.senderUid,
      content: data.content,
      type: data.imageUrl ? "image" : "text", // 이미지가 있으면 image 타입, 없으면 text 타입
      createdAt: serverTimestamp() as Timestamp,
      readBy: [data.senderUid], // 발신자는 자동으로 읽음 처리
    };

    // imageUrl이 있을 때만 추가
    if (data.imageUrl) {
      messageData.imageUrl = data.imageUrl;
    }

    console.log("sendMessage - 저장할 메시지 데이터:", {
      content: messageData.content,
      type: messageData.type,
      imageUrl: messageData.imageUrl,
      hasImageUrl: !!messageData.imageUrl,
    });

    await addDoc(messagesRef, messageData);

    // 채팅의 lastMessage와 updatedAt 업데이트 (채팅이 존재하지 않으면 생성)
    const chatRef = doc(db, "chats", data.chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const chatData = chatSnap.data() as Chat;
      const updates: any = {
        lastMessage: data.content,
        updatedAt: serverTimestamp(),
      };

      // 상대방의 unreadCount 증가
      if (chatData.buyerUid === data.senderUid) {
        // 발신자가 buyer인 경우, seller의 unreadCount 증가
        updates.sellerUnreadCount = (chatData.sellerUnreadCount || 0) + 1;
      } else if (chatData.sellerUid === data.senderUid) {
        // 발신자가 seller인 경우, buyer의 unreadCount 증가
        updates.buyerUnreadCount = (chatData.buyerUnreadCount || 0) + 1;

        // seller가 메시지를 보낸 경우 응답률 업데이트 (비동기)
        updateResponseRateAsync(chatData.sellerUid);
      }

      await updateDoc(chatRef, updates);
      console.log("채팅 업데이트 완료:", updates);
    } else {
      console.warn("채팅 문서가 존재하지 않음, 새로 생성:", data.chatId);

      // 채팅 ID에서 buyerUid, sellerUid, itemId 추출
      const parts = data.chatId.split("_");
      if (parts.length >= 3) {
        const buyerUid = parts[0];
        const sellerUid = parts[1];
        const itemId = parts.slice(2).join("_");

        const chatData: Chat = {
          id: data.chatId,
          itemId,
          buyerUid,
          sellerUid,
          lastMessage: data.content,
          updatedAt: serverTimestamp() as Timestamp,
          buyerUnreadCount: 0,
          sellerUnreadCount: 0,
        };

        // 상대방의 unreadCount 증가
        if (buyerUid === data.senderUid) {
          chatData.sellerUnreadCount = 1;
        } else if (sellerUid === data.senderUid) {
          chatData.buyerUnreadCount = 1;

          // seller가 첫 메시지를 보낸 경우 응답률 업데이트 (비동기)
          updateResponseRateAsync(sellerUid);
        }

        await setDoc(chatRef, chatData);
        console.log("채팅 문서 생성 완료:", data.chatId);
      } else {
        console.error("잘못된 채팅 ID 형식:", data.chatId);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("메시지 전송 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "메시지 전송에 실패했습니다.",
    };
  }
}

// 채팅방의 메시지들 가져오기
export async function getChatMessages(
  chatId: string,
  lastDoc?: any,
  limitCount: number = 50
): Promise<{
  success: boolean;
  messages?: Message[];
  lastDoc?: any;
  error?: string;
}> {
  try {
    const messagesRef = collection(db, "messages");
    let q = query(
      messagesRef,
      where("chatId", "==", chatId),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        messagesRef,
        where("chatId", "==", chatId),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];

    // 클라이언트에서 시간순으로 정렬
    messages.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return aTime - bTime;
    });

    return {
      success: true,
      messages,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
    };
  } catch (error) {
    console.error("메시지 가져오기 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "메시지를 가져오는데 실패했습니다.",
    };
  }
}

// 실시간 메시지 스트림 구독
export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
): () => void {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("chatId", "==", chatId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    snapshot => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      callback(messages);
    },
    error => {
      console.error("메시지 스트림 오류:", error);
      onError?.(error);
    }
  );
}

// 메시지 읽음 처리
export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const messageRef = doc(db, "messages", messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return { success: false, error: "메시지를 찾을 수 없습니다." };
    }

    const messageData = messageSnap.data() as Message;

    if (!messageData.readBy.includes(userId)) {
      await updateDoc(messageRef, {
        readBy: [...messageData.readBy, userId],
      });
    }

    return { success: true };
  } catch (error) {
    console.error("메시지 읽음 처리 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "읽음 처리에 실패했습니다.",
    };
  }
}

// 미읽음 메시지 수 가져오기
export async function getUnreadMessageCount(
  chatId: string,
  userId: string
): Promise<number> {
  try {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, where("chatId", "==", chatId));

    const snapshot = await getDocs(q);
    let unreadCount = 0;

    snapshot.docs.forEach(doc => {
      const messageData = doc.data() as Message;
      // 발신자가 현재 사용자가 아니고, 아직 읽지 않은 메시지만 카운트
      if (
        messageData.senderUid !== userId &&
        !messageData.readBy.includes(userId)
      ) {
        unreadCount++;
      }
    });

    return unreadCount;
  } catch (error) {
    console.error("미읽음 메시지 수 계산 실패:", error);
    return 0;
  }
}

// 채팅 삭제
export async function deleteChat(
  chatId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("deleteChat 호출됨:", { chatId, userId });
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    console.log("채팅 문서 존재 여부:", chatSnap.exists());
    if (!chatSnap.exists()) {
      console.log("채팅을 찾을 수 없음:", chatId);
      return { success: false, error: "채팅을 찾을 수 없습니다." };
    }

    const chatData = chatSnap.data() as Chat;
    console.log("채팅 삭제 권한 확인:", {
      chatId,
      userId,
      buyerUid: chatData.buyerUid,
      sellerUid: chatData.sellerUid,
      isBuyer: chatData.buyerUid === userId,
      isSeller: chatData.sellerUid === userId,
    });

    // 권한 확인 - buyerUid 또는 sellerUid가 현재 사용자여야 함
    // 또는 buyerUid와 sellerUid가 같은 경우 (자기 자신과의 채팅)도 허용
    const isAuthorized =
      chatData.buyerUid === userId ||
      chatData.sellerUid === userId ||
      (chatData.buyerUid === chatData.sellerUid &&
        chatData.buyerUid === userId);

    if (!isAuthorized) {
      console.error("채팅 삭제 권한 없음:", {
        userId,
        buyerUid: chatData.buyerUid,
        sellerUid: chatData.sellerUid,
        isSelfChat: chatData.buyerUid === chatData.sellerUid,
      });
      return { success: false, error: "채팅을 삭제할 권한이 없습니다." };
    }

    // 채팅 삭제
    await deleteDoc(chatRef);

    // 관련 메시지들도 삭제 (선택사항)
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, where("chatId", "==", chatId));
    const messagesSnapshot = await getDocs(q);

    const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    return { success: true };
  } catch (error) {
    console.error("채팅 삭제 실패:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "채팅 삭제에 실패했습니다.",
    };
  }
}

// 전체 읽지 않은 메시지 개수 조회 (사용자별)
export async function getTotalUnreadMessageCount(
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    console.log("읽지 않은 메시지 개수 조회:", userId);

    // 사용자가 참여한 모든 채팅 조회
    const chatsRef = collection(db, "chats");
    const buyerQuery = query(chatsRef, where("buyerUid", "==", userId));
    const sellerQuery = query(chatsRef, where("sellerUid", "==", userId));

    const [buyerSnapshot, sellerSnapshot] = await Promise.all([
      getDocs(buyerQuery),
      getDocs(sellerQuery),
    ]);

    // 모든 채팅 ID 수집
    const allChats = new Set<string>();
    buyerSnapshot.docs.forEach(doc => allChats.add(doc.id));
    sellerSnapshot.docs.forEach(doc => allChats.add(doc.id));

    if (allChats.size === 0) {
      return { success: true, count: 0 };
    }

    // 채팅 문서에서 직접 읽지 않은 메시지 개수 합산
    let totalUnreadCount = 0;

    // buyer로 참여한 채팅들의 buyerUnreadCount 합산
    buyerSnapshot.docs.forEach(doc => {
      const chatData = doc.data() as Chat;
      totalUnreadCount += chatData.buyerUnreadCount || 0;
    });

    // seller로 참여한 채팅들의 sellerUnreadCount 합산
    sellerSnapshot.docs.forEach(doc => {
      const chatData = doc.data() as Chat;
      totalUnreadCount += chatData.sellerUnreadCount || 0;
    });

    console.log("읽지 않은 메시지 개수:", totalUnreadCount);
    return { success: true, count: totalUnreadCount };
  } catch (error) {
    console.error("읽지 않은 메시지 개수 조회 실패:", error);
    return {
      success: false,
      error: "읽지 않은 메시지 개수를 조회하는데 실패했습니다.",
    };
  }
}

// 실시간 읽지 않은 메시지 개수 구독
export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void,
  onError?: (error: Error) => void
): () => void {
  console.log("읽지 않은 메시지 개수 실시간 구독 시작:", userId);

  // 사용자가 참여한 모든 채팅 구독
  const chatsRef = collection(db, "chats");
  const buyerQuery = query(chatsRef, where("buyerUid", "==", userId));
  const sellerQuery = query(chatsRef, where("sellerUid", "==", userId));

  let unsubscribers: (() => void)[] = [];
  let buyerUnreadCount = 0;
  let sellerUnreadCount = 0;

  const updateTotalUnreadCount = () => {
    const totalUnreadCount = buyerUnreadCount + sellerUnreadCount;
    console.log(
      "전체 읽지 않은 메시지 개수:",
      totalUnreadCount,
      "(buyer:",
      buyerUnreadCount,
      "seller:",
      sellerUnreadCount,
      ")"
    );
    callback(totalUnreadCount);
  };

  const unsubscribeBuyer = onSnapshot(
    buyerQuery,
    snapshot => {
      buyerUnreadCount = 0;
      snapshot.docs.forEach(doc => {
        const chatData = doc.data() as Chat;
        buyerUnreadCount += chatData.buyerUnreadCount || 0;
      });
      console.log("Buyer 읽지 않은 메시지 개수:", buyerUnreadCount);
      updateTotalUnreadCount();
    },
    error => {
      console.error("Buyer 채팅 구독 오류:", error);
      onError?.(error);
    }
  );

  const unsubscribeSeller = onSnapshot(
    sellerQuery,
    snapshot => {
      sellerUnreadCount = 0;
      snapshot.docs.forEach(doc => {
        const chatData = doc.data() as Chat;
        sellerUnreadCount += chatData.sellerUnreadCount || 0;
      });
      console.log("Seller 읽지 않은 메시지 개수:", sellerUnreadCount);
      updateTotalUnreadCount();
    },
    error => {
      console.error("Seller 채팅 구독 오류:", error);
      onError?.(error);
    }
  );

  unsubscribers.push(unsubscribeBuyer, unsubscribeSeller);

  return () => {
    console.log("읽지 않은 메시지 개수 구독 해제");
    unsubscribers.forEach(unsub => unsub());
  };
}

// 채팅 읽음 처리
export async function markChatAsRead(
  chatId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      return { success: false, error: "채팅을 찾을 수 없습니다." };
    }

    const chatData = chatDoc.data() as Chat;
    const updates: any = {};

    // 사용자가 buyer인 경우
    if (chatData.buyerUid === userId) {
      updates.buyerUnreadCount = 0;
      updates.buyerLastReadAt = serverTimestamp();
    }
    // 사용자가 seller인 경우
    else if (chatData.sellerUid === userId) {
      updates.sellerUnreadCount = 0;
      updates.sellerLastReadAt = serverTimestamp();
    } else {
      return { success: false, error: "권한이 없습니다." };
    }

    await updateDoc(chatRef, updates);
    console.log("채팅 읽음 처리 완료:", { chatId, userId });

    return { success: true };
  } catch (error) {
    console.error("채팅 읽음 처리 실패:", error);
    return { success: false, error: "채팅 읽음 처리 중 오류가 발생했습니다." };
  }
}

// 신고/차단 관련 API 함수들
export async function reportUser(
  reporterUid: string,
  reportedUid: string,
  reason: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("사용자 신고 시작:", { reporterUid, reportedUid, reason });

    const reportData = {
      reporterUid,
      reportedUid,
      reason,
      description: description || "",
      createdAt: serverTimestamp(),
      status: "pending", // pending, reviewed, resolved
    };

    const reportRef = await addDoc(collection(db, "reports"), reportData);
    console.log("신고 문서 생성 완료:", reportRef.id);

    return { success: true };
  } catch (error) {
    console.error("사용자 신고 실패:", error);
    return {
      success: false,
      error: "신고 처리 중 오류가 발생했습니다.",
    };
  }
}

export async function blockUser(
  blockerUid: string,
  blockedUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("사용자 차단 시작:", { blockerUid, blockedUid });

    const blockData = {
      blockerUid,
      blockedUid,
      createdAt: serverTimestamp(),
    };

    console.log("차단 데이터:", blockData);
    const blockRef = await addDoc(collection(db, "blocks"), blockData);
    console.log("차단 문서 생성 완료:", blockRef.id);

    // 차단된 사용자와의 모든 채팅 삭제
    const chatsRef = collection(db, "chats");
    const buyerQuery = query(
      chatsRef,
      where("buyerUid", "==", blockerUid),
      where("sellerUid", "==", blockedUid)
    );
    const sellerQuery = query(
      chatsRef,
      where("buyerUid", "==", blockedUid),
      where("sellerUid", "==", blockerUid)
    );

    const [buyerSnapshot, sellerSnapshot] = await Promise.all([
      getDocs(buyerQuery),
      getDocs(sellerQuery),
    ]);

    const chatsToDelete = [
      ...buyerSnapshot.docs.map(doc => doc.id),
      ...sellerSnapshot.docs.map(doc => doc.id),
    ];

    // 모든 관련 채팅 삭제
    const deletePromises = chatsToDelete.map(chatId =>
      deleteChat(chatId, blockerUid)
    );
    await Promise.all(deletePromises);

    console.log(
      "차단된 사용자와의 채팅 삭제 완료:",
      chatsToDelete.length,
      "개"
    );

    return { success: true };
  } catch (error) {
    console.error("사용자 차단 실패:", error);
    return {
      success: false,
      error: "차단 처리 중 오류가 발생했습니다.",
    };
  }
}

export async function isUserBlocked(
  blockerUid: string,
  blockedUid: string
): Promise<{ success: boolean; isBlocked?: boolean; error?: string }> {
  try {
    const blocksRef = collection(db, "blocks");
    const blockQuery = query(
      blocksRef,
      where("blockerUid", "==", blockerUid),
      where("blockedUid", "==", blockedUid)
    );

    const snapshot = await getDocs(blockQuery);
    const isBlocked = !snapshot.empty;

    return { success: true, isBlocked };
  } catch (error) {
    console.error("차단 상태 확인 실패:", error);
    return {
      success: false,
      error: "차단 상태를 확인하는데 실패했습니다.",
    };
  }
}

export async function getBlockedUsers(
  blockerUid: string
): Promise<{ success: boolean; blockedUsers?: any[]; error?: string }> {
  try {
    console.log("차단된 사용자 목록 조회 시작:", blockerUid);

    const blocksRef = collection(db, "blocks");
    // orderBy를 제거하여 인덱스 없이도 작동하도록 수정
    const blockQuery = query(blocksRef, where("blockerUid", "==", blockerUid));

    console.log("Firestore 쿼리 실행 중...");
    const snapshot = await getDocs(blockQuery);
    console.log("쿼리 결과 문서 수:", snapshot.docs.length);

    const blockedUsers = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log("차단 문서 데이터:", { id: doc.id, ...data });
      return {
        id: doc.id,
        ...data,
      };
    });

    // 클라이언트에서 시간순으로 정렬
    blockedUsers.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime; // 최신순
    });

    console.log("최종 차단된 사용자 목록:", blockedUsers);
    return { success: true, blockedUsers };
  } catch (error) {
    console.error("차단된 사용자 목록 조회 실패:", error);
    return {
      success: false,
      error: "차단된 사용자 목록을 조회하는데 실패했습니다.",
    };
  }
}

export async function unblockUser(
  blockerUid: string,
  blockedUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("사용자 차단 해제 시작:", { blockerUid, blockedUid });

    const blocksRef = collection(db, "blocks");
    const blockQuery = query(
      blocksRef,
      where("blockerUid", "==", blockerUid),
      where("blockedUid", "==", blockedUid)
    );

    const snapshot = await getDocs(blockQuery);

    if (snapshot.empty) {
      return { success: false, error: "차단 기록을 찾을 수 없습니다." };
    }

    // 모든 차단 기록 삭제
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log("차단 해제 완료:", snapshot.docs.length, "개 기록 삭제");

    return { success: true };
  } catch (error) {
    console.error("사용자 차단 해제 실패:", error);
    return {
      success: false,
      error: "차단 해제 처리 중 오류가 발생했습니다.",
    };
  }
}
