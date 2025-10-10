import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

// Firebase Admin 초기화
if (!getApps().length) {
  initializeApp();
}

// Firestore 인스턴스
export const db = getFirestore();
