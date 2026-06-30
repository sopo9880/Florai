# Florai seller decision and listing edit patch

## 변경 내용

- 판매자가 본인이 등록한 상품을 상품 목록에서 수정할 수 있게 했습니다.
- 구매자가 구매 요청을 만들면 상품 상태가 `예약됨`으로 전환됩니다.
- 예약된 상품은 다른 구매자가 추가 구매 요청을 만들 수 없습니다.
- 판매자 계정의 구매/판매 요청 화면에서 들어온 요청을 확인할 수 있습니다.
- 판매자가 `판매 결정`을 누르면 주문 상태가 `판매 완료됨`으로 바뀌고 상품도 `판매 완료됨`으로 표시됩니다.
- 구매자 화면에서는 본인 구매 요청이 `예약됨` 또는 `판매 완료됨` 상태로 표시됩니다.
- 기존 localStorage 저장 구조를 유지하면서 나중에 DB/API 저장소로 교체하기 쉽도록 repository 함수만 확장했습니다.

## 주요 파일

- `components/ProductListingEditPage.tsx`
- `components/ProductMarketplacePage.tsx`
- `components/PurchaseOrderHistoryPage.tsx`
- `services/productListingRepository.ts`
- `services/purchaseOrderRepository.ts`
- `types/productListing.ts`
- `types/purchaseOrder.ts`
- `app/page.tsx`


## Class list sync with Flora AI document

- Updated the product/cultivar dropdown source to match `Flora AI 학습 데이터 전체 클래스 목록`.
- Class inventory now includes 12 items, 55 cultivars, and the documented normal/major-defect folder availability.
- Removed entries that were not in the document, including 백합 and extra 거베라 cultivars.
- Added missing documented items: 튤립, 안스리움, 칼랑코에, 아이비.
- Updated category routing: 절화류 = 01, 02, 03, 12 / 분화류 = 06, 07, 08, 09, 10, 13, 14, 15.

## UI cleanup: hide class IDs and remove standard evidence panel

- 결과 리포트에서 `표준규격 근거` 카드 영역을 제거했습니다.
- 촬영 가이드, 결과 선택 정보, 식물 정보 입력 확인 박스에서 `class_id`가 보이지 않도록 정리했습니다.
- 사용자가 보는 문구에서는 `선택 클래스`를 `선택 품종`으로 바꿨습니다.
- mock 분석 응답에서도 `class_id` 문구가 판단 근거에 노출되지 않도록 바꿨습니다.
- 내부 데이터 구조의 `cultivarClassId`는 서버/모델 연동을 위해 유지했습니다.

