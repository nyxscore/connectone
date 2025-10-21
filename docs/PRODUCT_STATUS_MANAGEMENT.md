# 📦 상품 상태 관리 가이드

## 🎯 목적

**상품 데이터 손실 방지**를 위한 중앙 집중식 상태 관리 시스템입니다.

## 🚨 중요!

**상품 상태를 추가하거나 수정할 때는 반드시 이 문서를 참고하세요!**

잘못된 필터링 로직으로 인해 상품이 목록에서 사라지는 것을 방지합니다.

---

## 📋 시스템 구조

### 1. 중앙 관리 파일

```
lib/api/product-status.ts
```

**모든 상품 상태 관련 로직이 이 파일에 집중되어 있습니다.**

- ✅ 상태 정의 (`ITEM_STATUS`)
- ✅ 상태 그룹 (`STATUS_GROUPS`)
- ✅ 필터링 로직 (`getStatusFilterArray()`)
- ✅ 검증 로직 (`isValidStatusTransition()`)

### 2. 자동 검증 스크립트

```
scripts/verify-product-visibility.mjs
```

상품이 올바르게 표시되는지 자동으로 확인합니다.

---

## 🔧 상태 추가하는 방법

### Step 1: `product-status.ts`에 상태 추가

```typescript
export const ITEM_STATUS = {
  // ... 기존 상태들
  NEW_STATUS: "new_status",  // ← 새 상태 추가
} as const;
```

### Step 2: 라벨 추가

```typescript
export const STATUS_LABELS: Record<ItemStatus, string> = {
  // ... 기존 라벨들
  [ITEM_STATUS.NEW_STATUS]: "새 상태",  // ← 한글 라벨
};
```

### Step 3: 색상 추가

```typescript
export const STATUS_COLORS: Record<ItemStatus, string> = {
  // ... 기존 색상들
  [ITEM_STATUS.NEW_STATUS]: "bg-pink-100 text-pink-800",  // ← Tailwind 색상
};
```

### Step 4: 적절한 그룹에 추가

```typescript
export const STATUS_GROUPS = {
  ALL_ACTIVE: [
    // ... 기존 상태들
    ITEM_STATUS.NEW_STATUS,  // ← 목록에 표시되어야 한다면 여기 추가!
  ],
  // ...
};
```

### Step 5: 검증 스크립트 실행

```bash
node scripts/verify-product-visibility.mjs
```

✅ 통과하면 완료!  
❌ 실패하면 로직 수정

---

## 🛡️ 상품 손실 방지 체크리스트

배포 전에 반드시 확인하세요:

- [ ] `STATUS_GROUPS.ALL_ACTIVE`에 새 상태 추가했나요?
- [ ] 검증 스크립트를 실행했나요?
- [ ] 실제 앱에서 상품 목록을 확인했나요?
- [ ] 필터별로 올바르게 표시되나요?

---

## 🔍 현재 상태 목록

| 상태 | 코드 | 설명 | 목록 표시 |
|------|------|------|----------|
| 판매중 | `active` | 거래 가능한 상품 | ✅ |
| 거래중 | `reserved` | 예약된 상품 | ✅ |
| 결제완료 | `escrow_completed` | 에스크로 결제 완료 | ✅ |
| 배송중 | `shipping` | 배송 진행 중 | ✅ |
| 배송완료 | `shipped` | 배송 완료 | ✅ |
| 거래완료 | `sold` | 최종 거래 완료 | ✅ |
| 취소됨 | `cancelled` | 거래 취소 | ❌ |
| 삭제됨 | `deleted` | 삭제된 상품 | ❌ |

---

## 🐛 문제 발생 시

### 증상: 특정 상품이 목록에서 안 보여요

**해결 방법:**

1. 검증 스크립트 실행:
   ```bash
   node scripts/verify-product-visibility.mjs
   ```

2. 상품의 상태 확인:
   ```bash
   # Firestore 콘솔에서 확인
   # 또는
   node scripts/check-items.mjs
   ```

3. `product-status.ts`의 `STATUS_GROUPS.ALL_ACTIVE`에 해당 상태가 있는지 확인

4. 없다면 추가 후 재배포

---

## 📚 관련 파일

- `lib/api/product-status.ts` - 상태 정의 및 로직
- `lib/api/products.ts` - 상품 API (상태 사용)
- `scripts/verify-product-visibility.mjs` - 자동 검증
- `components/items/ItemStatusBadge.tsx` - 상태 뱃지 UI

---

## 💡 모범 사례

### ✅ 좋은 예

```typescript
// 중앙 관리 파일 사용
import { getStatusFilterArray } from "./product-status";
const statusFilter = getStatusFilterArray(filters.status);
```

### ❌ 나쁜 예

```typescript
// 하드코딩된 상태 배열 (유지보수 어려움)
const statusFilter = ["active", "sold"]; // ← 새 상태 추가 시 누락 위험!
```

---

## 🚀 배포 전 필수 확인

```bash
# 1. 검증 스크립트 실행
npm run verify:products

# 2. 로컬에서 테스트
npm run dev

# 3. 각 필터별 확인
#    - 전체
#    - 거래가능
#    - 거래중
#    - 배송중
#    - 거래완료

# 4. 문제 없으면 배포
npm run build
vercel --prod
```

---

## 📞 문의

상품 상태 관련 문제가 발생하면:
1. 이 문서를 먼저 확인
2. 검증 스크립트 실행
3. 문제가 계속되면 개발팀에 문의

**기억하세요: 상품 데이터는 매우 중요합니다! 신중하게 처리하세요.** 🎯

