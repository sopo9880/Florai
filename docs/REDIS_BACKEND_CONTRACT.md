# Florai Redis Backend Contract

Florai는 Render Web Service 하나 안에 Front와 Next API route를 같이 올립니다. 브라우저는 Redis를 직접 알지 않고, 같은 앱의 `/api/analyze-flower`에 사진과 입력값을 보냅니다.

## Flow

```text
Browser Front
-> Render Next API /api/analyze-flower
-> Redis job enqueue
-> Local model worker pops queue
-> Worker stores result in Redis
-> Browser polls /api/analyze-flower/status/[jobId]
```

## Redis keys

기본 prefix는 `florai`이며 `FLORAI_REDIS_KEY_PREFIX`로 바꿀 수 있습니다.

```text
florai:job:queue       # RPUSH jobId, worker는 BLPOP/BRPOP으로 소비
florai:job:{jobId}     # job JSON
florai:result:{jobId}  # worker result JSON
```

## Job payload

`/api/analyze-flower`는 Redis가 설정되어 있으면 아래 구조로 job을 저장합니다.

```json
{
  "schemaVersion": "florai.redis.job.v1",
  "jobId": "florai_178..._abcd1234",
  "status": "queued",
  "createdAt": "2026-06-26T00:00:00.000Z",
  "input": {
    "taxonomy": {
      "categoryType": "cut_flower",
      "itemId": "3",
      "item": "거베라",
      "cultivarId": "1",
      "cultivar": "폼포니",
      "cultivarClassId": "10",
      "cultivarClassName": "거베라_폼포니"
    },
    "measurements": {
      "stemLengthCm": "70",
      "bundleCount": "10",
      "leafArea": "35"
    },
    "userObservations": {
      "floweringStage": "4/5 개화"
    },
    "captureGuide": {
      "mode": "cut_flower_full",
      "referenceObject": "ruler"
    },
    "memo": "",
    "shippedAt": ""
  },
  "image": {
    "kind": "base64",
    "mimeType": "image/jpeg",
    "filename": "florai-capture.jpg",
    "dataBase64": "/9j/4AAQSk..."
  },
  "modelRequest": {
    "task": "quality_grading",
    "pipeline": "condition_then_grade",
    "returnEvidence": true,
    "returnDescription": true
  }
}
```

## Worker result format

Worker는 `florai:result:{jobId}`에 아래 형식으로 저장하면 됩니다. Florai 화면은 이 형식을 자동으로 화면용 `AnalysisResult`로 변환합니다.

```json
{
  "schemaVersion": "florai.result.v1",
  "jobId": "florai_178..._abcd1234",
  "status": "completed",
  "completedAt": "2026-06-26T00:00:10.000Z",
  "prediction": {
    "condition": {
      "label": "normal",
      "labelKo": "정상",
      "confidence": 0.93
    },
    "grade": {
      "label": "special",
      "labelKo": "특",
      "confidence": 0.86
    }
  },
  "evidence": {
    "standardReferences": [
      {
        "title": "농산물 표준규격 거베라",
        "matchedRule": "1묶음 평균 꽃대 길이 70cm 이상은 1급 기준에 해당합니다.",
        "field": "stemLengthCm",
        "inputValue": 70
      }
    ],
    "visualFindings": [
      "꽃송이 형태가 안정적으로 보입니다.",
      "줄기 휘어짐이 크지 않은 것으로 판단됩니다."
    ]
  },
  "description": {
    "summary": "입력된 화훼 이미지는 정상 상태로 판단되며, 특 등급 가능성이 높습니다.",
    "reasons": [
      "줄기 길이와 개화 정도가 기준에 부합합니다.",
      "잎 면적 정보와 촬영 이미지가 함께 전달되었습니다."
    ],
    "warnings": [
      "AI 보조 판정이므로 실제 유통 등급과 차이가 있을 수 있습니다."
    ],
    "recommendation": "출하 전 실제 묶음 단위 검수를 권장합니다."
  }
}
```

기존 화면용 결과를 바로 저장해도 됩니다.

```json
{
  "condition": "normal",
  "grade": "특",
  "confidence": 86,
  "summary": "분석 요약",
  "reasons": ["근거 1"],
  "warnings": ["주의 1"],
  "recommendation": "추천 조치"
}
```

---

## 멀티 이미지 입력 확장

현재 Redis job은 기존 worker 호환을 위해 `image` 필드를 유지하면서, 실제 멀티뷰 입력은 `images` 배열에 담습니다.

```json
{
  "image": { "role": "main", "view": "front_full", "label": "정면 전체" },
  "images": [
    { "role": "main", "view": "front_full", "label": "정면 전체" },
    { "role": "additional", "view": "top_view", "label": "상단 뷰" },
    { "role": "additional", "view": "close_up", "label": "근접 사진" }
  ]
}
```

worker는 `job.get("images") or [job["image"]]` 방식으로 읽으면 단일 이미지/멀티 이미지 모두 대응할 수 있습니다.
