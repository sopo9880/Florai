# Florai worker flat result hotfix

## 목적

Redis worker가 `prediction/description` 래퍼 없이 화면용에 가까운 flat JSON을 반환해도 결과 화면으로 정상 변환되도록 수정합니다.

## 대응하는 worker 결과 예시

```json
{
  "condition": "review_required",
  "conditionKo": "중결점 의심",
  "grade": "판정 보류",
  "confidence": 96,
  "summary": "...",
  "details": [
    {
      "title": "분류기 판단",
      "status": "중결점 의심",
      "description": "..."
    }
  ],
  "warnings": ["..."],
  "recommendation": "...",
  "measurements": [
    { "label": "줄기 길이(cm)", "value": "65" }
  ]
}
```

## 변경 내용

- `summary/details/warnings/recommendation/measurements` 기반 flat worker 결과 지원
- `review_required`, `판정 보류`, `재검토` 상태를 결과 화면에서 `판정 보류`로 표시
- `details` 배열을 판단 근거 리스트로 변환
- `measurements` 배열을 입력/측정 정보로 표시
- 기존 `prediction/description/report/classifierExplanation` 형식도 그대로 유지
- invalid worker result 오류 문구를 특정 schema에 묶이지 않도록 완화

## 적용 방법

```bash
unzip -o Florai_worker_flat_result_hotfix_patch.zip
npm run dev
```
