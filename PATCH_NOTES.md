# Florai auth role patch

## 변경 내용

- 상단 헤더의 MVP 배지를 로그인 / 회원가입 버튼으로 교체했습니다.
- localStorage 기반 회원가입/로그인 기능을 추가했습니다.
- 회원가입 유형을 구매자용 / 판매자용으로 분리했습니다.
- 구매자는 상품 목록 조회, 구매 요청, 구매 내역 확인만 사용할 수 있게 했습니다.
- 판매자는 AI 품질 분석, 상품 게시, 상품 구매 요청을 모두 사용할 수 있게 했습니다.
- 판매자 계정에는 열고 닫을 수 있는 사이드바를 추가했습니다.
- 마이페이지를 추가해 계정 유형, 게시 상품 수, 구매 요청 수를 확인할 수 있게 했습니다.
- 상품 게시 시 현재 로그인한 판매자 정보가 상품 카드에 저장되도록 변경했습니다.
- 구매 요청 시 현재 로그인한 사용자 정보가 구매자 정보 기본값으로 들어가도록 변경했습니다.
- UI에 보이던 데모/localStorage/DB/이번 편집 제외 안내 문구를 제거했습니다.

## 저장 구조

- 계정: `florai:local:users:v1`
- 세션: `florai:local:session:v1`
- 상품: `florai:demo:listings:v1`
- 주문: `florai:demo:purchases:v1`

현재는 브라우저 저장소 기반으로 동작하고, 이후 `authRepository`, `productListingRepository`, `purchaseOrderRepository`를 API 호출 방식으로 교체하면 DB 확장이 가능합니다.
