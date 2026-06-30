# Florai 상품 게시 데모 설계

현재 상품 게시 기능은 **로컬 개발/시연용 localStorage 저장소**를 사용합니다.
Redis는 AI 분석 job/result 전용으로 유지하고, 상품 게시 데이터는 Redis에 넣지 않습니다.

## 현재 데모 흐름

```text
AI 품질 평가 완료
→ 결과 리포트에서 상품 게시하기
→ 가격/수량/출하 가능일/판매 지역 입력
→ localStorage에 listing JSON 저장
→ 게시 완료 카드 및 상품 목록 표시
```

## 저장 위치

```text
localStorage key: florai:demo:listings:v1
schemaVersion: florai.listing.v1
```

같은 브라우저에서는 새로고침해도 상품 목록이 유지됩니다. 다만 다른 브라우저/다른 기기에서는 공유되지 않습니다.

## DB 확장 방향

현재 프론트는 `ProductListingRepository` 인터페이스를 통해 상품 저장소를 호출합니다.

```ts
export type ProductListingRepository = {
  create(input: CreateProductListingInput): ProductListing;
  list(): ProductListing[];
  get(listingId: string): ProductListing | null;
  clear(): void;
};
```

나중에 DB를 붙일 때는 아래처럼 저장소 구현만 교체하면 됩니다.

```text
현재:
components → productListingRepository(localStorage)

확장:
components → productListingApiRepository(fetch /api/listings) → DB
```

권장 API는 다음과 같습니다.

```text
POST /api/listings       상품 등록
GET  /api/listings       상품 목록
GET  /api/listings/:id   상품 상세
PATCH /api/listings/:id  판매상태/수량 수정
```

## DB 테이블 후보

```text
product_listings
- id
- seller_id
- status
- title
- category_type
- item_id
- item
- cultivar_id
- cultivar
- cultivar_class_id
- cultivar_class_name
- price
- quantity
- unit
- available_from
- location
- delivery_method
- quality_condition
- quality_grade
- quality_confidence
- quality_summary
- measurements_json
- image_url
- seller_memo
- created_at
- updated_at
```

이미지는 DB에 base64로 저장하지 말고, 나중에는 Object Storage/S3/R2/Supabase Storage에 올린 뒤 `image_url`만 DB에 저장하는 것을 권장합니다.

## 역할 분리

```text
Redis  = AI 분석 작업 큐 / 임시 결과
DB     = 상품 게시글 / 판매 정보 / 판매자 정보
Storage = 상품 이미지 파일
```


## 구매 요청 데모와의 연결

상품 목록 카드에는 `구매하기` 버튼이 추가됩니다. 구매 요청이 완료되면 같은 브라우저의 localStorage 안에서 상품 수량이 차감되고, 주문 내역은 `florai:demo:purchases:v1`에 저장됩니다. 실제 서비스 확장 시에는 상품 등록은 `/api/listings`, 구매 요청은 `/api/orders`로 분리하고 DB transaction으로 재고 차감과 주문 생성을 함께 처리하는 구조를 권장합니다.
