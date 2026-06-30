# Florai

Florai는 `Flora + AI`를 의미하는 AI 기반 화훼 품질 판별 보조 플랫폼 MVP입니다.
현재 구조는 **식물 정보 입력 → 촬영 가이드 → 사진 촬영/업로드 → Render API 분석 → 품질 리포트 → 상품 게시 데모 → 상품 구매 요청 데모** 흐름입니다.

## 핵심 흐름

```text
1. 대기준 선택: 절화류 / 분화류
2. 중기준 선택: 장미, 국화, 거베라, 백합, 접목선인장, 심비디움, 호접란, 고무나무, 스킨답서스
3. 소기준 선택: 품종
4. 유형별 추가 정보 입력
   - 절화류: 줄기 길이, 묶음 본수, 개화 정도, 꽃/줄기 상태, 결점 여부
   - 분화류: 화분 호수, 잎 상태, 줄기 상태, 개화 여부, 생육 상태
5. 선택 정보 기반 촬영 가이드 확인
6. 사진 촬영 또는 업로드
7. `/api/analyze-flower`로 FormData 전송
8. 정상/비정상 여부, 등급 후보, 판단 근거, 주의 사항 출력
9. 평가 결과 기반 상품 게시 초안 생성
10. 판매 가격/수량/지역 입력 후 localStorage 데모 상품 목록에 저장
11. 상품 목록에서 구매 요청 생성 및 구매 내역 확인
```

## Render 배포

이 프로젝트는 GitHub Pages 정적 배포가 아니라 **Render 전체 앱 배포**를 기준으로 맞춰져 있습니다.

Render에서 Web Service를 만들고 아래 명령을 사용합니다.

```bash
Build Command: npm ci && npm run build
Start Command: npm run start
```

또는 저장소에 포함된 `render.yaml`을 이용해 Blueprint로 배포할 수 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 보통 아래 주소를 엽니다.

```text
http://localhost:3000
```

## 분석 API 구조

기본값은 브라우저 mock이 아니라 같은 앱의 API route로 요청합니다.

```text
POST /api/analyze-flower
```

클라이언트는 이미지와 함께 `payload` JSON을 FormData로 전송합니다.

```json
{
  "taxonomy": {
    "categoryType": "cut_flower",
    "item": "거베라",
    "cultivar": "폼포니",
    "cultivarClassId": "10",
    "cultivarClassName": "거베라_폼포니"
  },
  "measurements": {
    "stemLengthCm": "65",
    "bundleCount": "10",
    "leafArea": "35"
  },
  "userObservations": {
    "floweringStage": "4/5 개화"
  },
  "captureGuide": {
    "mode": "cut_flower_full",
    "referenceObject": "ruler"
  }
}
```

분화류는 화분 호수 기준으로 윗지름, 밑지름, 높이를 함께 전송하고, 잎 면적과 줄기 길이도 payload에 포함합니다.

## 실제 모델 연결 위치

현재 `/api/analyze-flower`는 실제 모델 연결 전 mock 응답입니다.
지헌 로컬 모델 또는 Redis Queue를 붙일 경우 이 파일을 교체하면 됩니다.

```text
app/api/analyze-flower/route.ts
```

권장 구조:

```text
Render Next API
→ Redis job 등록
→ 로컬 모델 worker가 job 소비
→ 결과 Redis 저장
→ Render API가 결과 반환 또는 polling
```

## 주요 구조

- `app/page.tsx`: 전체 화면 흐름
- `components/FlowerInfoFormPage.tsx`: 대기준/중기준/소기준 및 유형별 입력폼
- `components/CaptureGuidePage.tsx`: 선택 정보 기반 촬영 가이드
- `components/CameraCapturePage.tsx`: 촬영/업로드
- `components/ResultReportPage.tsx`: 결과 리포트
- `components/ProductListingFormPage.tsx`: AI 결과 기반 상품 게시 폼
- `components/ProductPublishCompletePage.tsx`: 상품 게시 완료 화면
- `components/ProductMarketplacePage.tsx`: localStorage 기반 데모 상품 목록 및 구매 진입
- `components/ProductPurchasePage.tsx`: 데모 상품 구매 요청 폼
- `components/ProductPurchaseCompletePage.tsx`: 구매 요청 완료 화면
- `components/PurchaseOrderHistoryPage.tsx`: localStorage 기반 데모 구매 내역
- `constants/flowerClassList.ts`: 2022 화훼류 품질 데이터셋 Class List
- `constants/flowerTaxonomy.ts`: 절화류/분화류 분기
- `constants/potSizes.ts`: 화분 호수별 cm 규격
- `constants/captureGuides.ts`: 촬영 가이드 생성
- `services/flowerAnalysisApi.ts`: FormData 생성 및 분석 요청
- `app/api/analyze-flower/route.ts`: Render 서버 mock API


## 상품 게시 데모

상품 게시 기능은 현재 로컬 개발/시연을 위해 브라우저 `localStorage`에 저장합니다.
Redis는 AI 분석 작업 큐와 임시 결과 저장에만 사용하고, 상품 게시 데이터는 Redis에 넣지 않습니다.

```text
AI 분석 결과
→ 상품 게시하기
→ 판매 정보 입력
→ localStorage 저장
→ 상품 목록 카드 표시
```

나중에 DB를 붙일 때는 `services/productListingRepository.ts`의 저장소 구현을 `/api/listings` 호출 방식으로 교체하면 됩니다.
세부 설계는 `docs/PRODUCT_LISTING_DEMO.md`를 참고하세요.

## Multi-image capture

멀티뷰 촬영 패치가 적용되어 대표 정면 사진 외에 상단 뷰/근접 사진을 추가로 전송할 수 있습니다. 자세한 계약은 `docs/MULTI_IMAGE_CAPTURE.md`를 확인하세요.

## 상품 구매 데모

상품 구매 기능은 실제 결제 없이 구매 요청 내역을 브라우저 `localStorage`에 저장하는 데모 기능입니다. 상품 목록에서 `구매하기`를 누르면 구매자 이름, 연락처, 구매 수량, 희망 수령일, 수령 방식, 결제 방식을 입력할 수 있습니다. 구매 요청이 완료되면 해당 상품의 데모 재고가 차감되고 구매 내역 화면에서 주문 카드를 확인할 수 있습니다.

나중에 DB를 붙일 때는 `services/purchaseOrderRepository.ts`를 `/api/orders` 호출 방식으로 교체하면 됩니다. 세부 설계는 `docs/PURCHASE_DEMO.md`를 참고하세요.
