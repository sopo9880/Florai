# Florai Purchase Demo Patch

- 상품 목록 카드에 `구매하기` 버튼을 추가했습니다.
- 데모 상품 구매 요청 화면을 추가했습니다.
- 구매자 이름, 연락처, 구매 수량, 희망 수령일, 수령 방식, 결제 방식을 입력할 수 있습니다.
- 구매 요청 완료 화면을 추가했습니다.
- 구매 내역 화면을 추가했습니다.
- 구매 요청 데이터는 `localStorage`의 `florai:demo:purchases:v1`에 저장됩니다.
- 구매 완료 시 같은 브라우저 localStorage 안에서 상품 수량이 차감됩니다.
- 실제 결제는 발생하지 않으며, DB 확장 시 `services/purchaseOrderRepository.ts`를 `/api/orders` 호출로 교체할 수 있도록 저장소 레이어를 분리했습니다.
