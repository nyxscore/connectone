# 에스크로 시스템 배포 가이드

## 📦 배포 순서

### 1️⃣ Functions 설치 및 빌드

```bash
cd /Users/a/Documents/nyx/connectone/functions

# 의존성 설치
npm install

# TypeScript 빌드
npm run build
```

### 2️⃣ Security Rules 배포

```bash
cd /Users/a/Documents/nyx/connectone

# Firestore Rules 배포
firebase deploy --only firestore:rules
```

### 3️⃣ Cloud Functions 배포

```bash
cd /Users/a/Documents/nyx/connectone

# 모든 Functions 배포
firebase deploy --only functions

# 또는 특정 함수만 배포
firebase deploy --only functions:registerShipment
firebase deploy --only functions:confirmPurchase
firebase deploy --only functions:cancelTransaction
firebase deploy --only functions:autoConfirmPurchases
```

### 4️⃣ Cloud Scheduler 설정

Firebase Console → Cloud Scheduler에서 설정:

**Job 설정:**

- **이름:** `auto-confirm-purchases`
- **빈도:** `every 1 hours` (또는 `0 * * * *`)
- **Target:** Pub/Sub
- **Topic:** `firebase-schedule-autoConfirmPurchases`
- **Timezone:** Asia/Seoul

**또는 CLI로 생성:**

```bash
gcloud scheduler jobs create pubsub auto-confirm-purchases \
  --schedule="0 * * * *" \
  --topic=firebase-schedule-autoConfirmPurchases \
  --message-body='{"run":"autoConfirmPurchases"}' \
  --time-zone=Asia/Seoul
```

---

## 🧪 테스트

### 로컬 테스트 (Emulator)

```bash
# 에뮬레이터 시작
firebase emulators:start

# 별도 터미널에서 앱 실행
npm run dev
```

### Functions 테스트

```bash
# Functions 로그 확인
firebase functions:log

# 실시간 로그
firebase functions:log --tail

# 특정 함수 로그
firebase functions:log --only registerShipment
```

---

## ✅ 테스트 시나리오

### 1. 배송 등록 테스트

**조건:**

- 판매자 계정으로 로그인
- 상품 상태: `escrow_completed`

**단계:**

1. 채팅방 열기
2. 택배사 선택
3. 송장번호 입력
4. "거래 진행하기" 클릭

**예상 결과:**

- ✅ 상품 상태가 `shipping`으로 변경
- ✅ 시스템 메시지 "상품이 발송되었습니다!" 표시
- ✅ `event_logs`에 로그 생성
- ✅ 구매자에게 알림 전송

### 2. 구매확정 테스트

**조건:**

- 구매자 계정으로 로그인
- 상품 상태: `shipping` 또는 `shipped`

**단계:**

1. 채팅방 열기
2. "구매확인" 버튼 클릭
3. 확인 다이얼로그에서 "확인" 클릭

**예상 결과:**

- ✅ 상품 상태가 `sold`로 변경
- ✅ 시스템 메시지 "거래가 성공적으로 완료되었습니다!" 표시
- ✅ `event_logs`에 로그 생성
- ✅ 판매자에게 알림 전송

### 3. 자동 구매확정 테스트

**조건:**

- 상품 상태: `shipped`
- `shippedAt` 시간이 72시간 이전

**단계:**

1. Cloud Scheduler 수동 실행 또는 1시간 대기
2. 상품 상태 확인

**예상 결과:**

- ✅ 상품 상태가 `sold`로 자동 변경
- ✅ 시스템 메시지 "자동 구매확정되었습니다" 표시
- ✅ `autoConfirmScheduled` 필드가 `true`로 설정

**수동 테스트 (개발 중):**

```bash
# Firestore에서 테스트 데이터 생성
# shippedAt을 72시간 전으로 설정
{
  "status": "shipped",
  "shippedAt": Timestamp(now - 72시간),
  "autoConfirmScheduled": false
}

# Cloud Scheduler 수동 실행
gcloud scheduler jobs run auto-confirm-purchases
```

### 4. 거래 취소 테스트

**조건:**

- 구매자 또는 판매자 계정
- 상품 상태: `sold`, `cancelled`가 아닌 상태

**단계:**

1. 채팅방 열기
2. 설정 메뉴 → "거래 취소하기" 클릭
3. 취소 사유 입력
4. 확인

**예상 결과:**

- ✅ 상품 상태가 `cancelled`로 변경
- ✅ 시스템 메시지에 취소 사유 표시
- ✅ `event_logs`에 로그 생성

---

## 🔍 모니터링

### Firebase Console

**Functions:**

- https://console.firebase.google.com/project/{project-id}/functions
- 호출 횟수 확인
- 실행 시간 확인
- 에러율 확인

**Firestore:**

- `event_logs` 컬렉션 확인
- 상태 전이 로그 확인

**Cloud Scheduler:**

- https://console.cloud.google.com/cloudscheduler
- Job 실행 기록 확인
- 성공/실패 확인

### Logs Explorer

```bash
# Cloud Logging에서 확인
gcloud logging read "resource.type=cloud_function"

# 특정 함수 로그
gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=registerShipment"

# 에러만 확인
gcloud logging read "resource.type=cloud_function AND severity>=ERROR"
```

---

## 🚨 트러블슈팅

### 문제 1: Functions 배포 실패

**증상:**

```
Error: HTTP Error: 403, The caller does not have permission
```

**해결:**

```bash
# Firebase CLI 재로그인
firebase login --reauth

# 프로젝트 확인
firebase projects:list

# 올바른 프로젝트 선택
firebase use {project-id}
```

### 문제 2: Cloud Scheduler가 작동하지 않음

**확인 사항:**

1. Cloud Scheduler API 활성화 확인
2. Topic 이름이 정확한지 확인
3. Functions가 정상 배포되었는지 확인

**수동 실행:**

```bash
# Job 수동 실행
gcloud scheduler jobs run auto-confirm-purchases

# 로그 확인
firebase functions:log --only autoConfirmPurchases
```

### 문제 3: Security Rules 오류

**증상:**

```
FirebaseError: Missing or insufficient permissions
```

**해결:**

```bash
# Rules 테스트
firebase emulators:start --only firestore

# Rules 재배포
firebase deploy --only firestore:rules
```

**Rules 디버깅:**
Firebase Console → Firestore → Rules → Playground에서 테스트

### 문제 4: 상태 전이가 실행되지 않음

**확인 사항:**

1. Cloud Function이 정상 실행되는지 로그 확인
2. Firestore Rules에서 권한이 있는지 확인
3. 상태 머신 검증 통과하는지 확인

**디버깅:**

```typescript
// 콘솔에서 상태 전이 검증
const validation = EscrowStateMachine.validateTransition(
  "escrow_completed",
  "shipping",
  "seller",
  { tracking_number_provided: true }
);
console.log(validation);
```

---

## 📊 성능 최적화

### Functions 최적화

**Cold Start 감소:**

```typescript
// functions/src/escrow.ts
// Keep-warm 설정
export const keepWarm = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    console.log("Keep-warm ping");
    return null;
  });
```

**메모리 설정:**

```typescript
export const registerShipment = functions
  .runWith({ memory: "256MB", timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    // ...
  });
```

### Firestore 최적화

**인덱스 생성:**

```bash
# Firebase Console → Firestore → 인덱스
# 또는 firestore.indexes.json
```

**필요한 인덱스:**

- `items`: `status`, `shippedAt` (Ascending)
- `event_logs`: `itemId`, `createdAt` (Descending)

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] Functions 코드가 빌드되는지 확인 (`npm run build`)
- [ ] Security Rules가 유효한지 확인
- [ ] 환경 변수가 설정되었는지 확인 (`.env.local`)
- [ ] Cloud Scheduler가 설정되었는지 확인
- [ ] 테스트 시나리오를 모두 통과했는지 확인
- [ ] 에러 로깅이 작동하는지 확인
- [ ] 알림 시스템이 작동하는지 확인

배포 후 확인사항:

- [ ] Functions가 정상 실행되는지 로그 확인
- [ ] Security Rules가 적용되었는지 확인
- [ ] Cloud Scheduler가 정상 작동하는지 확인
- [ ] 실제 거래 플로우 테스트
- [ ] 모니터링 대시보드 확인

---

**작성일:** 2025-01-11
**버전:** 1.0.0














