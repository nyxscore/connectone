# 에스크로 시스템 테스트 시나리오

## 1. 정상 플로우 (구매→배송→확정→정산)

### 시나리오: 성공적인 거래 완료

```
1. INITIATED → PAID (구매자 결제)
2. PAID → IN_ESCROW (시스템 자동)
3. IN_ESCROW → AWAITING_SHIPMENT (구매자 배송지 요청)
4. AWAITING_SHIPMENT → SHIPPED (판매자 송장 등록)
5. SHIPPED → IN_TRANSIT (택배사 웹훅)
6. IN_TRANSIT → DELIVERED (택배사 웹훅)
7. DELIVERED → DELIVERY_CONFIRMED (구매자 확인)
8. DELIVERY_CONFIRMED → BUYER_CONFIRMED (구매자 최종 확정)
```

### 테스트 케이스:

- [ ] 구매자 결제 성공
- [ ] 에스크로 자동 전이
- [ ] 배송지 정보 입력
- [ ] 송장 등록 및 배송 시작
- [ ] 배송 상태 웹훅 처리
- [ ] 구매자 배송 확인
- [ ] 최종 구매확정
- [ ] 판매자 정산 처리

## 2. 구매자가 발송 전 취소 (환불)

### 시나리오: 배송 전 취소 및 환불

```
1. INITIATED → PAID (구매자 결제)
2. PAID → IN_ESCROW (시스템 자동)
3. IN_ESCROW → CANCEL_REQUESTED (구매자 취소 요청)
4. CANCEL_REQUESTED → CANCELLED (판매자 승인 또는 자동 취소)
5. CANCELLED → REFUND_PENDING (시스템 자동)
6. REFUND_PENDING → REFUNDED (PG 환불 완료)
```

### 테스트 케이스:

- [ ] 구매자 취소 요청
- [ ] 판매자 승인 처리
- [ ] 자동 취소 (24시간 미응답)
- [ ] 환불 처리 시작
- [ ] PG 환불 API 호출
- [ ] 환불 완료 확인

## 3. 판매자 승인 거부 (분쟁 발생)

### 시나리오: 판매자 미응답으로 인한 분쟁

```
1. INITIATED → PAID (구매자 결제)
2. PAID → IN_ESCROW (시스템 자동)
3. IN_ESCROW → CANCEL_REQUESTED (구매자 취소 요청)
4. CANCEL_REQUESTED → DISPUTE (구매자 고객센터 요청)
5. DISPUTE → REFUNDED (관리자 개입)
```

### 테스트 케이스:

- [ ] 구매자 취소 요청
- [ ] 판매자 24시간 미응답
- [ ] 구매자 고객센터 요청
- [ ] 관리자 분쟁 접수
- [ ] 관리자 환불 승인
- [ ] 환불 처리 완료

## 4. 판매자 잠적 (관리자 개입 후 환불)

### 시나리오: 판매자 연락 두절

```
1. INITIATED → PAID (구매자 결제)
2. PAID → IN_ESCROW (시스템 자동)
3. IN_ESCROW → AWAITING_SHIPMENT (구매자 배송지 요청)
4. AWAITING_SHIPMENT → DISPUTE (구매자 고객센터 요청)
5. DISPUTE → REFUNDED (관리자 개입)
```

### 테스트 케이스:

- [ ] 배송지 요청 후 판매자 미응답
- [ ] 구매자 고객센터 요청
- [ ] 관리자 판매자 연락 시도
- [ ] 관리자 환불 승인
- [ ] 환불 처리 완료

## 5. 중복 환불 시도 차단

### 시나리오: 중복 환불 방지

```
1. CANCEL_REQUESTED → REFUND_PENDING (첫 번째 환불 요청)
2. REFUND_PENDING 상태에서 추가 환불 요청 시도
3. 시스템이 중복 요청 차단
```

### 테스트 케이스:

- [ ] 첫 번째 환불 요청 성공
- [ ] 동일한 거래에 대한 두 번째 환불 요청
- [ ] 중복 요청 차단 확인
- [ ] 에러 메시지 반환
- [ ] 로그 기록 확인

## 6. 결제 PG 웹훅 이중 호출 (중복 이벤트) 처리

### 시나리오: PG 웹훅 중복 처리

```
1. PG에서 동일한 결제 완료 웹훅을 2회 전송
2. 첫 번째 웹훅 처리: PAID 상태로 변경
3. 두 번째 웹훅 처리: 이미 PAID 상태이므로 무시
```

### 테스트 케이스:

- [ ] 첫 번째 웹훅 수신 및 처리
- [ ] 두 번째 동일한 웹훅 수신
- [ ] 중복 처리 방지 확인
- [ ] 로그 기록 확인
- [ ] 알림 중복 방지

## 7. 자동 구매확정 (타임아웃)

### 시나리오: 구매자 미확정 시 자동 확정

```
1. DELIVERED → DELIVERY_CONFIRMED (구매자 배송 확인)
2. DELIVERY_CONFIRMED 상태에서 72시간 대기
3. 구매자 미확정 시 AUTO_CONFIRMED로 자동 전이
4. 판매자 정산 처리
```

### 테스트 케이스:

- [ ] 배송 완료 후 구매자 확인
- [ ] 72시간 대기 (또는 테스트용 단축 시간)
- [ ] 자동 확정 처리
- [ ] 시스템 메시지 발송
- [ ] 판매자 정산 처리

## 8. 상품 불량으로 인한 반품

### 시나리오: 배송 후 상품 문제

```
1. DELIVERED → CANCEL_REQUESTED (구매자 반품 요청)
2. CANCEL_REQUESTED → CANCELLED (판매자 승인)
3. CANCELLED → REFUND_PENDING (환불 처리)
4. REFUND_PENDING → REFUNDED (환불 완료)
```

### 테스트 케이스:

- [ ] 배송 완료 후 구매자 반품 요청
- [ ] 판매자 반품 승인
- [ ] 반품 상품 회수 (택배사)
- [ ] 환불 처리
- [ ] 환불 완료 확인

## 9. 분쟁 중 관리자 개입

### 시나리오: 복잡한 분쟁 해결

```
1. DELIVERED → DISPUTE (구매자 분쟁 신고)
2. DISPUTE 상태에서 증빙 자료 수집
3. 관리자 검토 및 판단
4. DISPUTE → REFUNDED (관리자 환불 결정)
```

### 테스트 케이스:

- [ ] 구매자 분쟁 신고
- [ ] 증빙 자료 업로드
- [ ] 관리자 대시보드 확인
- [ ] 관리자 판단 및 결정
- [ ] 최종 처리 완료

## 10. 시스템 장애 복구

### 시나리오: 중간 상태에서의 복구

```
1. 시스템 장애로 인한 중간 상태 발생
2. 장애 복구 후 상태 검증
3. 필요한 경우 상태 수정 또는 재처리
```

### 테스트 케이스:

- [ ] 시스템 장애 시뮬레이션
- [ ] 장애 복구 후 데이터 검증
- [ ] 미완료 트랜잭션 재처리
- [ ] 웹훅 재전송 처리
- [ ] 알림 복구 처리

## 테스트 데이터 준비

### 사용자 데이터:

```json
{
  "buyer": {
    "id": "buyer_001",
    "email": "buyer@test.com",
    "nickname": "테스트구매자"
  },
  "seller": {
    "id": "seller_001",
    "email": "seller@test.com",
    "nickname": "테스트판매자"
  },
  "admin": {
    "id": "admin_001",
    "email": "admin@test.com",
    "nickname": "관리자"
  }
}
```

### 상품 데이터:

```json
{
  "listing": {
    "id": "item_001",
    "title": "테스트 상품",
    "price": 50000,
    "category": "electronics"
  }
}
```

### 거래 데이터:

```json
{
  "transaction": {
    "id": "txn_001",
    "listingId": "item_001",
    "buyerId": "buyer_001",
    "sellerId": "seller_001",
    "amount": 50000,
    "status": "INITIATED"
  }
}
```












