# Firebase 기반 안전결제(에스크로) 시스템

완전한 채팅 UI 기반 에스크로 시스템 with Firebase

## 📁 파일 구조

```
escrow-system/
├── firebase-schema.ts           # Firestore 데이터 구조 정의
├── firebase-state-machine.ts    # 상태 머신 로직 (14개 상태)
├── firebase-functions.ts        # Cloud Functions (백엔드 로직)
├── firestore.rules             # Security Rules (역할 기반 권한)
├── react-chat-ui.tsx           # React 채팅 UI 컴포넌트
├── firebase-config.ts          # Firebase 초기화 설정
└── FIREBASE-ESCROW-README.md   # 이 파일
```

## 🔥 Firestore 데이터 구조

### Collections

1. **`transactions`** - 거래 정보
2. **`chats`** - 채팅방 정보
3. **`chats/{chatId}/messages`** - 채팅 메시지 (서브컬렉션)
4. **`payments`** - 결제 정보
5. **`refunds`** - 환불 정보
6. **`disputes`** - 분쟁 정보
7. **`event_logs`** - 이벤트 로그
8. **`scheduled_tasks`** - 스케줄된 작업 (자동 확정 등)

### 인덱스 생성 (필수)

Firebase Console → Firestore → 인덱스에서 생성:

```
Collection: chats
Fields: transactionId (Ascending), createdAt (Descending)

Collection: event_logs
Fields: transactionId (Ascending), createdAt (Descending)

Collection: scheduled_tasks
Fields: type (Ascending), status (Ascending), scheduledAt (Ascending)
```

## 🔄 상태 머신 (14개 상태)

```
INITIATED           → PAID → IN_ESCROW → AWAITING_SHIPMENT
                                              ↓
BUYER_CONFIRMED ← DELIVERY_CONFIRMED ← DELIVERED ← IN_TRANSIT ← SHIPPED
     ↓
거래 완료 (정산)

취소 플로우:
CANCEL_REQUESTED → CANCELLED → REFUND_PENDING → REFUNDED

분쟁:
any → DISPUTE → (관리자 개입) → REFUNDED or BUYER_CONFIRMED
```

### 자동 전이

- **PAID → IN_ESCROW**: 결제 완료 후 즉시
- **DELIVERED → BUYER_CONFIRMED**: 72시간 후 자동 구매확정
- **CANCEL_REQUESTED → CANCELLED**: 24시간 판매자 미응답 시
- **CANCELLED → REFUND_PENDING**: 취소 승인 후 즉시

## 🚀 배포 가이드

### 1. Firebase 프로젝트 설정

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init

# 선택 항목:
# - Firestore
# - Functions
# - Hosting (선택사항)
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Cloud Functions 배포

```bash
# functions 폴더로 이동
cd functions

# 의존성 설치
npm install

# Firebase Functions 파일 복사
cp ../escrow-system/firebase-functions.ts ./src/index.ts
cp ../escrow-system/firebase-schema.ts ./src/
cp ../escrow-system/firebase-state-machine.ts ./src/

# 배포
firebase deploy --only functions
```

### 4. Firestore Security Rules 배포

```bash
# firestore.rules 파일 복사
cp escrow-system/firestore.rules .

# 배포
firebase deploy --only firestore:rules
```

### 5. Cloud Scheduler 설정 (자동 구매확정)

Firebase Console → Cloud Scheduler:

```
Job name: auto-confirm-purchases
Frequency: every 1 hours
Target: Pub/Sub
Topic: firebase-schedule-autoConfirmPurchases
```

## 💻 프론트엔드 통합

### 1. 의존성 설치

```bash
npm install firebase
```

### 2. 컴포넌트 사용

```tsx
import EscrowChat from "./escrow-system/react-chat-ui";

function TransactionPage() {
  return (
    <EscrowChat
      chatId="chat_123"
      transactionId="txn_456"
      currentUserId="user_789"
      userRole="buyer"
    />
  );
}
```

## 🎯 주요 Cloud Functions

### 클라이언트에서 호출 가능한 함수들

```typescript
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase-config";

// 1. 배송 등록
const registerShipment = httpsCallable(functions, "registerShipment");
await registerShipment({
  transactionId: "txn_123",
  courier: "cj",
  trackingNumber: "1234567890",
  shippingInfo: {
    recipientName: "홍길동",
    recipientPhone: "01012345678",
    address: "서울시 강남구...",
    postalCode: "12345",
  },
});

// 2. 취소 요청
const requestCancel = httpsCallable(functions, "requestCancel");
await requestCancel({
  transactionId: "txn_123",
  reason: "단순 변심",
});

// 3. 취소 승인
const approveCancel = httpsCallable(functions, "approveCancel");
await approveCancel({
  transactionId: "txn_123",
});

// 4. 구매 확정
const confirmPurchase = httpsCallable(functions, "confirmPurchase");
await confirmPurchase({
  transactionId: "txn_123",
});

// 5. 분쟁 신고
const openDispute = httpsCallable(functions, "openDispute");
await openDispute({
  transactionId: "txn_123",
  type: "quality_issue",
  reason: "상품이 설명과 다릅니다.",
});
```

## 🔐 보안 고려사항

### 1. Security Rules

- **읽기**: 거래 참여자 또는 관리자만
- **쓰기**: 제한적 (대부분 Cloud Functions에서만)
- **결제/환불**: Cloud Functions만 생성/수정 가능

### 2. 민감 데이터 암호화

계좌번호 등 민감 정보는 암호화 필요:

```typescript
// Cloud Functions에서
import * as crypto from "crypto";

function encryptAccountNumber(accountNumber: string): string {
  const cipher = crypto.createCipher(
    "aes-256-cbc",
    process.env.ENCRYPTION_KEY!
  );
  return cipher.update(accountNumber, "utf8", "hex") + cipher.final("hex");
}
```

### 3. PG 웹훅 검증

```typescript
// onPaymentCompleted Function에서
function verifyPGSignature(payload: any, headers: any): boolean {
  const signature = headers["x-pg-signature"];
  const computed = crypto
    .createHmac("sha256", process.env.PG_SECRET_KEY!)
    .update(JSON.stringify(payload))
    .digest("hex");
  return signature === computed;
}
```

## 📊 모니터링 및 로깅

### 1. Cloud Logging

```typescript
import * as functions from "firebase-functions";

functions.logger.info("Transaction created", {
  transactionId: "txn_123",
  amount: 50000,
});
```

### 2. Error Reporting

```typescript
try {
  // 처리 로직
} catch (error) {
  functions.logger.error("Error processing transaction", {
    error,
    transactionId,
  });
  throw new functions.https.HttpsError("internal", "Processing failed");
}
```

### 3. 대시보드 쿼리

```typescript
// 오늘 거래 개수
const todayTransactions = await db
  .collection("transactions")
  .where("createdAt", ">=", startOfDay)
  .count()
  .get();

// 진행 중인 거래
const activeTransactions = await db
  .collection("transactions")
  .where("status", "in", ["PAID", "IN_ESCROW", "SHIPPED"])
  .count()
  .get();

// 분쟁 중인 거래
const disputedTransactions = await db
  .collection("disputes")
  .where("status", "==", "open")
  .count()
  .get();
```

## 🧪 테스트

### 로컬 에뮬레이터 사용

```bash
# 에뮬레이터 시작
firebase emulators:start

# 별도 터미널에서 앱 실행
npm run dev
```

### 테스트 시나리오

1. **정상 플로우**: 결제 → 배송 → 확정
2. **취소 플로우**: 결제 → 취소 요청 → 승인 → 환불
3. **자동 확정**: 배송 완료 → 72시간 대기
4. **분쟁**: 거래 중 → 분쟁 신고 → 관리자 개입

## 📈 확장 가이드

### 1. 추가 결제 수단

```typescript
// firebase-schema.ts
export type PaymentMethod = "card" | "bank_transfer" | "virtual_account";

// firebase-functions.ts
export const initiateVirtualAccount = functions.https.onCall(
  async (data, context) => {
    // 가상계좌 발급 로직
  }
);
```

### 2. 다국어 지원

```typescript
// firebase-state-machine.ts
static getStatusDisplayName(status: TransactionStatus, locale: string): string {
  const translations = {
    ko: { INITIATED: "거래 시작", PAID: "결제 완료" },
    en: { INITIATED: "Initiated", PAID: "Paid" },
  };
  return translations[locale][status] || status;
}
```

### 3. 알림 시스템

```typescript
// firebase-functions.ts
import * as admin from "firebase-admin";

async function sendPushNotification(userId: string, message: string) {
  const user = await admin.auth().getUser(userId);
  if (user.customClaims?.fcmToken) {
    await admin.messaging().send({
      token: user.customClaims.fcmToken,
      notification: {
        title: "거래 알림",
        body: message,
      },
    });
  }
}
```

## 🆘 트러블슈팅

### 문제 1: Functions 배포 실패

```bash
# 로그 확인
firebase functions:log

# 특정 함수만 배포
firebase deploy --only functions:onPaymentCompleted
```

### 문제 2: Security Rules 오류

```bash
# Rules 테스트
firebase emulators:exec --only firestore "npm test"

# Rules 배포
firebase deploy --only firestore:rules
```

### 문제 3: 자동 확정이 작동하지 않음

- Cloud Scheduler가 활성화되어 있는지 확인
- `scheduled_tasks` 컬렉션에 작업이 생성되었는지 확인
- Functions 로그에서 `autoConfirmPurchases` 실행 여부 확인

## 📝 라이선스 및 지원

이 시스템은 교육 목적으로 제공됩니다.
프로덕션 환경에서 사용 시 추가적인 보안 검토와 테스트가 필요합니다.

---

**생성일**: 2025-01-11
**버전**: 1.0.0
**Firebase SDK**: 10.x
**React**: 18.x




















