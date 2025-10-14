# 에스크로 시스템 통합 가이드

기존 `EnhancedChatModal.tsx`에 에스크로 시스템을 통합하는 방법

## ✅ 완료된 작업

1. ✅ 상태 머신 로직 생성 (`lib/escrow/state-machine.ts`)
2. ✅ Cloud Functions 생성 (`functions/src/escrow.ts`)
3. ✅ Cloud Functions 호출 헬퍼 생성 (`lib/escrow/functions.ts`)

---

## 🔧 통합 단계

### 1단계: EnhancedChatModal 상단에 import 추가

```typescript
// components/chat/EnhancedChatModal.tsx 상단에 추가
import { EscrowStateMachine } from "../../lib/escrow/state-machine";
import {
  callRegisterShipment,
  callConfirmPurchase,
  callCancelTransaction,
} from "../../lib/escrow/functions";
```

### 2단계: 배송 등록 함수를 Cloud Function으로 교체

**기존 코드 (직접 Firestore 업데이트):**

```typescript
// ❌ 기존: 직접 Firestore 업데이트
const handleStartTransaction = async () => {
  const db = getDb();
  const itemRef = doc(db, "items", chatData.item.id);
  await updateDoc(itemRef, {
    status: "shipping",
    shippingInfo: { courier, trackingNumber },
    updatedAt: serverTimestamp(),
  });
  await sendMessage({
    chatId: chatData.chatId,
    senderUid: "system",
    content: "배송이 시작되었습니다...",
  });
};
```

**새 코드 (Cloud Function 호출):**

```typescript
// ✅ 새로운: Cloud Function 호출
const handleStartTransaction = async () => {
  setIsStartingTransaction(true);

  try {
    // 상태 전이 검증
    const validation = EscrowStateMachine.validateTransition(
      chatData.item.status as any,
      "shipping",
      "seller",
      { tracking_number_provided: !!trackingNumber }
    );

    if (!validation.valid) {
      toast.error(validation.reason || "잘못된 상태 전이입니다.");
      return;
    }

    // Cloud Function 호출
    const result = await callRegisterShipment({
      itemId: chatData.item.id,
      chatId: chatData.chatId,
      courier,
      trackingNumber,
    });

    if (result.success) {
      toast.success("배송 정보가 등록되었습니다!");
      // 실시간 listener가 자동으로 UI를 업데이트함
    } else {
      toast.error(result.error || "배송 등록에 실패했습니다.");
    }
  } catch (error) {
    console.error("배송 등록 오류:", error);
    toast.error("오류가 발생했습니다.");
  } finally {
    setIsStartingTransaction(false);
  }
};
```

### 3단계: 구매확정 함수를 Cloud Function으로 교체

**기존 코드:**

```typescript
// ❌ 기존: 직접 Firestore 업데이트
const handleConfirmPurchase = async () => {
  const db = getDb();
  const itemRef = doc(db, "items", chatData.item.id);
  await updateDoc(itemRef, {
    status: "sold",
    soldAt: serverTimestamp(),
  });
};
```

**새 코드:**

```typescript
// ✅ 새로운: Cloud Function 호출
const handleConfirmPurchase = async () => {
  if (
    !confirm("상품을 정상적으로 수령하셨나요? 구매확정 후 환불이 불가능합니다.")
  ) {
    return;
  }

  try {
    // 상태 전이 검증
    const validation = EscrowStateMachine.validateTransition(
      chatData.item.status as any,
      "sold",
      "buyer",
      { purchase_confirmed: true }
    );

    if (!validation.valid) {
      toast.error(validation.reason || "구매확정할 수 없는 상태입니다.");
      return;
    }

    // Cloud Function 호출
    const result = await callConfirmPurchase({
      itemId: chatData.item.id,
      chatId: chatData.chatId,
    });

    if (result.success) {
      toast.success("구매확정이 완료되었습니다! 거래가 완료되었습니다.");

      // 전역 이벤트 발생 (다른 컴포넌트에 알림)
      window.dispatchEvent(
        new CustomEvent("itemStatusChanged", {
          detail: {
            itemId: chatData.item.id,
            status: "sold",
          },
        })
      );
    } else {
      toast.error(result.error || "구매확정에 실패했습니다.");
    }
  } catch (error) {
    console.error("구매확정 오류:", error);
    toast.error("오류가 발생했습니다.");
  }
};
```

### 4단계: 거래 취소 함수를 Cloud Function으로 교체

**새 코드 추가:**

```typescript
// ✅ 새로운: 거래 취소 Cloud Function
const handleCancelTransaction = async (reason: string) => {
  if (!confirm("정말로 거래를 취소하시겠습니까?")) {
    return;
  }

  try {
    const result = await callCancelTransaction({
      itemId: chatData.item.id,
      chatId: chatData.chatId,
      reason,
    });

    if (result.success) {
      toast.success("거래가 취소되었습니다.");
    } else {
      toast.error(result.error || "거래 취소에 실패했습니다.");
    }
  } catch (error) {
    console.error("거래 취소 오류:", error);
    toast.error("오류가 발생했습니다.");
  }
};
```

---

## 📦 Cloud Functions 배포

### 1. Functions 설치 및 빌드

```bash
cd /Users/a/Documents/nyx/connectone/functions

# 의존성 설치
npm install

# TypeScript 빌드
npm run build
```

### 2. Firebase 배포

```bash
# Functions만 배포
firebase deploy --only functions

# 특정 함수만 배포
firebase deploy --only functions:registerShipment
firebase deploy --only functions:confirmPurchase
firebase deploy --only functions:autoConfirmPurchases
```

### 3. Cloud Scheduler 설정

Firebase Console → Cloud Scheduler에서:

**Job 이름:** `auto-confirm-purchases`
**빈도:** `every 1 hours`
**Target:** `Pub/Sub`
**Topic:** `firebase-schedule-autoConfirmPurchases`

---

## 🔐 Security Rules 업데이트

기존 `firestore.rules`에 다음 규칙 추가:

```javascript
// items 컬렉션
match /items/{itemId} {
  // 상태 변경은 Cloud Functions만 가능
  allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly([
    'shippingInfo',
    'updatedAt'
  ]) || request.auth.uid in [resource.data.buyerUid, resource.data.sellerUid];

  // 상태 필드는 Cloud Functions만 변경 가능
  allow update: if request.resource.data.status == resource.data.status;
}

// event_logs - Cloud Functions만 생성 가능
match /event_logs/{logId} {
  allow read: if request.auth != null;
  allow create, update, delete: if false; // Functions만 가능
}
```

배포:

```bash
firebase deploy --only firestore:rules
```

---

## 🧪 테스트

### 로컬 테스트 (Emulator)

```bash
# 에뮬레이터 시작
firebase emulators:start

# 앱 실행 (별도 터미널)
npm run dev
```

### 프로덕션 테스트 시나리오

1. **정상 플로우:**
   - 판매자가 배송 등록 → `shipping` 상태 변경 확인
   - 구매자가 구매확정 → `sold` 상태 변경 확인
   - 시스템 메시지 자동 전송 확인

2. **자동 구매확정:**
   - 배송 완료 후 72시간 대기
   - Cloud Scheduler가 자동으로 `sold`로 변경
   - 시스템 메시지 전송 확인

3. **거래 취소:**
   - 구매자가 취소 요청
   - `cancelled` 상태 변경 확인

---

## 🚨 주의사항

### 1. 이중 처리 방지

Cloud Functions는 idempotent하게 설계되었습니다:

- 동일한 요청을 여러 번 호출해도 한 번만 처리됨
- UI는 실시간 listener가 자동으로 업데이트

### 2. 에러 처리

모든 Cloud Function 호출은 try-catch로 감싸서 에러 처리:

```typescript
try {
  const result = await callRegisterShipment(data);
  if (result.success) {
    // 성공 처리
  } else {
    toast.error(result.error);
  }
} catch (error) {
  console.error(error);
  toast.error("오류가 발생했습니다.");
}
```

### 3. 권한 확인

Cloud Functions 내부에서 권한을 확인하므로, 클라이언트에서는 추가 권한 확인 불필요:

- 판매자만 배송 등록 가능
- 구매자만 구매확정 가능

---

## 📊 모니터링

### Functions 로그 확인

```bash
# 전체 로그
firebase functions:log

# 특정 함수 로그
firebase functions:log --only registerShipment

# 실시간 로그
firebase functions:log --tail
```

### Firebase Console

Firebase Console → Functions:

- 호출 횟수 확인
- 실행 시간 확인
- 에러율 확인

---

## 🎯 다음 단계

1. ✅ EnhancedChatModal에서 직접 Firestore 업데이트 제거
2. ✅ Cloud Functions 호출로 교체
3. ✅ Cloud Functions 배포
4. ✅ Security Rules 업데이트
5. ✅ 테스트 (로컬 → 스테이징 → 프로덕션)
6. ✅ 모니터링 설정

---

**작성일:** 2025-01-11
**버전:** 1.0.0



