# Florai 상품 구매 데모

이 패치는 상품 게시 이후의 데모 흐름을 보여주기 위해 **구매 요청 로직**을 추가합니다.
실제 결제나 회원 로그인을 붙이지 않고, 로컬 개발/시연을 위해 브라우저 `localStorage`에 주문 데이터를 저장합니다.

## 데모 흐름

```text
상품 목록
→ 구매하기
→ 구매자 정보/수량/수령 방식 입력
→ 구매 요청 완료
→ 구매 내역 확인
```

## 저장소 역할

```text
Redis
= AI 분석 job / result 임시 저장

localStorage 상품 게시
= 데모 상품 목록 저장

localStorage 구매 주문
= 데모 구매 요청 내역 저장

DB
= 실제 서비스 확장 시 상품/주문/회원/결제 데이터 저장
```

## localStorage key

```text
florai:demo:listings:v1
florai:demo:purchases:v1
```

## 구매 주문 JSON 예시

```json
{
  "schemaVersion": "florai.purchase.v1",
  "orderId": "order_1782489000000_abcd1234",
  "status": "requested",
  "storageMode": "local_demo",
  "buyer": {
    "buyerId": "demo_buyer",
    "buyerName": "홍길동",
    "buyerPhone": "010-0000-0000"
  },
  "seller": {
    "sellerId": "demo_seller",
    "sellerName": "데모 판매자"
  },
  "listingId": "listing_1782488000000_abcd1234",
  "item": {
    "title": "심비디움 해피차펠 7호 특 등급",
    "unitPrice": 25000,
    "quantity": 2,
    "unit": "화분",
    "totalPrice": 50000
  },
  "fulfillment": {
    "desiredDate": "2026-06-29",
    "deliveryMethod": "직접 픽업",
    "location": "광주 화훼시장"
  },
  "payment": {
    "method": "협의",
    "status": "demo_pending"
  }
}
```

## DB 확장 시 추천 구조

현재 프론트는 `services/purchaseOrderRepository.ts`의 repository만 호출합니다.
나중에 DB를 붙일 때는 이 파일의 구현을 API 호출 방식으로 교체하면 됩니다.

```text
현재:
purchaseOrderRepository.create()
→ localStorage 저장
→ 상품 수량 localStorage 감소

확장:
purchaseOrderRepository.create()
→ POST /api/orders
→ DB transaction
   1. listing 재고 확인
   2. order 생성
   3. listing 재고 감소
   4. payment pending 생성
```

## 추천 테이블 후보

```text
users
- id
- name
- phone
- role: seller / buyer

listings
- id
- seller_id
- title
- price
- quantity
- status
- quality_result_json
- image_url

orders
- id
- listing_id
- buyer_id
- seller_id
- quantity
- total_price
- status
- desired_date
- delivery_method
- payment_method
- memo

payments
- id
- order_id
- method
- status
- amount
```

## 데모 한계

- 실제 결제는 발생하지 않습니다.
- 브라우저를 바꾸면 주문 내역이 공유되지 않습니다.
- 상품 수량 감소도 같은 브라우저 localStorage 안에서만 반영됩니다.
- 실제 서비스에서는 주문 생성과 재고 차감이 DB transaction으로 처리되어야 합니다.
