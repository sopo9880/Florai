# Florai landing cleanup patch

## 변경 내용

- 랜딩 히어로 이미지 위에 표시되던 `Render 서버 연동 준비` 카드 제거
- `정보 입력 → 이미지 분석 → 근거 리포트 → 상품 게시` 플로우 문구 제거
- 히어로 이미지를 방해하던 하단 오버레이 제거

## 검증

- `npm run lint`: 에러 없음, 기존 `<img>` warning 12개
- `npm run build -- --webpack`: 성공
