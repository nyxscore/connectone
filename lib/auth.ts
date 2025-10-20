import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError as FirebaseAuthError,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./api/firebase-ultra-safe";
import { User, SignUpData, LoginData, AuthError } from "./types";

// Firebase 인스턴스 가져오기
const auth = getFirebaseAuth();
const getDb = getFirebaseDb;

// 아이디를 이메일로 변환하는 함수
const usernameToEmail = (username: string): string => {
  return `${username}@connectone.local`;
};

// username으로 uid 찾기
const findUidByUsername = async (username: string): Promise<string | null> => {
  try {
    console.log("🔍 username으로 uid 찾기 시작:", username);
    const db = await getDb();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    console.log("📊 검색 결과 개수:", querySnapshot.size);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log("✅ username으로 uid 찾음:", userDoc.id);
      return userDoc.id; // uid 반환
    }
    console.log("❌ username으로 uid를 찾을 수 없음");
    return null;
  } catch (error) {
    console.error("❌ username으로 uid 찾기 실패:", error);
    return null;
  }
};

// 에러 코드를 한국어 메시지로 변환
const getErrorMessage = (error: FirebaseAuthError): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "이미 사용 중인 아이디입니다.";
    case "auth/weak-password":
      return "비밀번호는 8자 이상이어야 하며 특수문자를 포함해야 합니다.";
    case "auth/invalid-email":
      return "유효하지 않은 아이디 형식입니다.";
    case "auth/user-not-found":
      return "등록되지 않은 아이디입니다.";
    case "auth/wrong-password":
      return "잘못된 비밀번호입니다.";
    case "auth/invalid-credential":
      return "아이디 또는 비밀번호가 올바르지 않습니다.";
    case "auth/too-many-requests":
      return "너무 많은 시도로 인해 일시적으로 차단되었습니다. 잠시 후 다시 시도해주세요.";
    default:
      return "인증 중 오류가 발생했습니다.";
  }
};

// 회원가입
export const signUp = async (data: SignUpData): Promise<User> => {
  try {
    // 아이디를 이메일로 변환 (실제 이메일은 프로필에만 저장)
    const email = usernameToEmail(data.username);

    // Firebase Auth로 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      data.password
    );

    const firebaseUser = userCredential.user;

    // Firestore에 사용자 프로필 생성
    const db = await getDb();
    const userData: Omit<User, "createdAt" | "updatedAt"> = {
      uid: firebaseUser.uid,
      username: data.username,
      email: data.email,
      nickname: data.nickname,
      region: data.region,
      grade: "C",
      tradesCount: 0,
      reviewsCount: 0,
    };

    await setDoc(doc(db, "users", firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    const authError = error as FirebaseAuthError;
    throw new Error(getErrorMessage(authError));
  }
};

// 로그인
export const signIn = async (data: LoginData): Promise<FirebaseUser> => {
  try {
    console.log("🔐 로그인 시도:", data.username);
    
    // 아이디를 이메일로 변환해서 로그인 (간단한 방식)
    const email = usernameToEmail(data.username);
    
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      data.password
    );
    
    console.log("✅ 로그인 성공!");
    return userCredential.user;
  } catch (error) {
    console.error("❌ 로그인 실패:", error);
    const authError = error as FirebaseAuthError;
    throw new Error(getErrorMessage(authError));
  }
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as FirebaseAuthError;
    throw new Error(getErrorMessage(authError));
  }
};

// 사용자 프로필 가져오기
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    console.log("getUserProfile 호출:", uid);
    const db = await getDb();
    const userDoc = await getDoc(doc(db, "users", uid));
    console.log("Firestore 문서 존재 여부:", userDoc.exists());

    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("Firestore 사용자 데이터:", data);
      const userData = {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
      console.log("변환된 사용자 데이터:", userData);
      return userData;
    }
    console.log("Firestore에 사용자 문서가 존재하지 않음");
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// 아이디 중복확인
export const checkUsernameAvailability = async (
  username: string
): Promise<boolean> => {
  try {
    // 아이디를 이메일로 변환
    const email = usernameToEmail(username);

    // Firebase Auth에서 해당 이메일이 이미 존재하는지 확인
    // createUserWithEmailAndPassword를 시도해보고, 이미 존재하면 false 반환
    try {
      // 임시로 사용자 생성을 시도 (실제로는 생성하지 않음)
      await createUserWithEmailAndPassword(auth, email, "tempPassword123!");
      // 성공하면 사용 가능 (임시 사용자 삭제)
      await auth.currentUser?.delete();
      return true;
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        return false; // 이미 사용 중
      }
      throw error; // 다른 오류는 다시 던짐
    }
  } catch (error) {
    console.error("아이디 중복확인 오류:", error);
    throw new Error("아이디 중복확인 중 오류가 발생했습니다.");
  }
};

// Firebase User를 User 타입으로 변환
export const mapFirebaseUser = (firebaseUser: FirebaseUser): User => {
  // 이메일에서 아이디 추출
  const username = firebaseUser.email?.replace("@connectone.local", "") || "";

  return {
    uid: firebaseUser.uid,
    username: username,
    nickname: firebaseUser.displayName || "",
    region: "",
    grade: "C",
    tradesCount: 0,
    reviewsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
