# Florai Debug Logging

`FLORAI_DEBUG_LOG=true`를 설정하면 Render Logs 또는 로컬 `npm run dev` 터미널에 Florai 분석 요청/Redis job/status 결과가 JSON 형태로 출력됩니다.

## 켜는 법

로컬 `.env.local` 또는 Render Environment에 아래 값을 추가합니다.

```env
FLORAI_DEBUG_LOG=true
```

끄려면 다음처럼 바꿉니다.

```env
FLORAI_DEBUG_LOG=false
```

## 출력되는 로그

- `ANALYZE_REQUEST_RECEIVED`: 프론트가 `/api/analyze-flower`로 보낸 FormData 요약과 `payload` JSON
- `REDIS_JOB_CREATED`: Redis에 저장될 job JSON
- `REDIS_SET_JOB`: Redis job key, TTL, 저장될 JSON 크기
- `REDIS_PUSH_QUEUE`: Redis queue에 push되는 jobId
- `ANALYZE_QUEUED_RESPONSE`: 프론트로 반환되는 jobId/pollUrl
- `STATUS_REQUEST_RECEIVED`: 프론트 polling 요청
- `REDIS_GET_RESULT`: Redis result key 조회 여부
- `REDIS_GET_JOB`: Redis job key 조회 여부
- `STATUS_RAW_RESULT_FOUND`: worker가 저장한 raw result
- `STATUS_COMPLETED_RESPONSE`: Florai 화면으로 반환되는 최종 변환 결과

## 이미지 로그 정책

이미지는 너무 크기 때문에 base64 원문 전체를 찍지 않습니다.

```json
"dataBase64": {
  "kind": "base64",
  "length": 123456,
  "preview": "/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

이렇게 길이와 앞부분만 출력합니다.

## 터미널에서 볼 예시

```text
[Florai Debug][2026-06-26T11:30:00.000Z] REDIS_JOB_CREATED
{
  "schemaVersion": "florai.redis.job.v1",
  "jobId": "florai_1782473400000_abcd1234",
  "status": "queued",
  "input": {
    "taxonomy": {
      "categoryType": "cut_flower",
      "item": "거베라",
      "cultivar": "폼포니",
      "cultivarClassName": "거베라_폼포니"
    },
    "measurements": {
      "stemLengthCm": "70",
      "bundleCount": "10",
      "leafArea": "35"
    }
  },
  "image": {
    "kind": "base64",
    "mimeType": "image/jpeg",
    "filename": "florai-capture.jpg",
    "dataBase64": {
      "kind": "base64",
      "length": 123456,
      "preview": "/9j/4AAQSkZJRgABAQAAAQABAAD..."
    }
  }
}
```

## 주의

- 개발/시연 검증용으로만 켜는 것을 권장합니다.
- 이미지 자체는 전체 출력하지 않지만, 품목/입력값/메모는 로그에 남습니다.
- Render 무료 플랜에서는 로그가 많아지면 확인이 불편할 수 있으므로, 배포 안정화 후에는 `false`로 두는 것이 좋습니다.
