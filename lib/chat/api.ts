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

// 채팅 생성 또는 가져오기
export async function getOrCreateChat(
  itemId: string,
  buyerUid: string,
  sellerUid: string,
  firstMessage: string
): Promise<{ success: boolean; chatId?: string; error?: string }> {
  try {
    const chatId = `${buyerUid}_${sellerUid}_${itemId}`;

    // 기존 채팅 확인
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      // 기존 채팅이 있으면 첫 메시지 전송
      await sendMessage({
        chatId,
        senderUid: buyerUid,
        content: firstMessage,
      });
      return { success: true, chatId };
    }

    // 새 채팅 생성
    const chatData: Omit<Chat, "id"> = {
      itemId,
      buyerUid,
      sellerUid,
      lastMessage: firstMessage,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(chatRef, chatData);

    // 첫 메시지 전송
    await sendMessage({
      chatId,
      senderUid: buyerUid,
      content: firstMessage,
    });

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
    const buyerQuery = query(
      chatsRef,
      where("buyerUid", "==", userId),
      orderBy("updatedAt", "desc")
    );

    const sellerQuery = query(
      chatsRef,
      where("sellerUid", "==", userId),
      orderBy("updatedAt", "desc")
    );

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
      const chatData = { ...doc.data(), id: doc.id };
      console.log("Buyer 채팅 데이터:", chatData);
      allChats.set(doc.id, chatData);
    });

    sellerSnapshot.docs.forEach(doc => {
      const chatData = { ...doc.data(), id: doc.id };
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
    const messagesRef = collection(db, "messages");
    const messageData: Omit<Message, "id"> = {
      chatId: data.chatId,
      senderUid: data.senderUid,
      content: data.content,
      createdAt: serverTimestamp() as Timestamp,
      readBy: [data.senderUid], // 발신자는 자동으로 읽음 처리
    };

    // imageUrl이 있을 때만 추가
    if (data.imageUrl) {
      messageData.imageUrl = data.imageUrl;
    }

    await addDoc(messagesRef, messageData);

    // 채팅의 lastMessage와 updatedAt 업데이트
    const chatRef = doc(db, "chats", data.chatId);
    await updateDoc(chatRef, {
      lastMessage: data.content,
      updatedAt: serverTimestamp(),
    });

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
    const q = query(
      messagesRef,
      where("chatId", "==", chatId),
      where("senderUid", "!=", userId)
    );

    const snapshot = await getDocs(q);
    let unreadCount = 0;

    snapshot.docs.forEach(doc => {
      const messageData = doc.data() as Message;
      if (!messageData.readBy.includes(userId)) {
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
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return { success: false, error: "채팅을 찾을 수 없습니다." };
    }

    const chatData = chatSnap.data() as Chat;

    // 권한 확인
    if (chatData.buyerUid !== userId && chatData.sellerUid !== userId) {
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
