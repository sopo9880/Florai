# Florai Multi-image Capture Patch

## 목적

기존에는 분석 요청에 대표 이미지 1장만 포함했습니다. 이 패치부터는 대표 정면 사진과 선택 추가 사진을 함께 전송할 수 있습니다.

```text
대표 정면 사진: 필수
상단 뷰: 선택
근접 사진: 선택
```

## Front -> Next API FormData

```text
images: File | dataURL   // 여러 번 append
imageMeta: JSON string   // images와 같은 순서로 여러 번 append
image: File | dataURL    // 하위 호환용 대표 이미지 1장
payload: JSON string
```

`imageMeta` 예시:

```json
{
  "index": 1,
  "id": "capture_1782490000000_abcd1234",
  "role": "additional",
  "view": "top_view",
  "label": "상단 뷰",
  "filename": "florai-top_view.jpg"
}
```

## Redis Job 입력

Worker는 `images` 배열을 우선 읽으면 됩니다. 기존 worker 호환을 위해 `image`에는 첫 번째 대표 사진도 함께 넣습니다.

```json
{
  "schemaVersion": "florai.redis.job.v1",
  "jobId": "florai_1782490000000_abcd1234",
  "status": "queued",
  "input": {
    "taxonomy": {},
    "measurements": {},
    "userObservations": {},
    "captureGuide": {},
    "memo": ""
  },
  "image": {
    "kind": "base64",
    "role": "main",
    "view": "front_full",
    "label": "정면 전체",
    "index": 0,
    "mimeType": "image/jpeg",
    "filename": "main.jpg",
    "dataBase64": "..."
  },
  "images": [
    {
      "kind": "base64",
      "role": "main",
      "view": "front_full",
      "label": "정면 전체",
      "index": 0,
      "mimeType": "image/jpeg",
      "filename": "main.jpg",
      "dataBase64": "..."
    },
    {
      "kind": "base64",
      "role": "additional",
      "view": "top_view",
      "label": "상단 뷰",
      "index": 1,
      "mimeType": "image/jpeg",
      "filename": "top.jpg",
      "dataBase64": "..."
    }
  ],
  "modelRequest": {
    "task": "quality_grading",
    "pipeline": "condition_then_grade",
    "returnEvidence": true,
    "returnDescription": true
  }
}
```

## 모델 출력 JSON

기존 `florai.result.v1` 형식을 그대로 유지해도 됩니다. 사진별 근거를 결과창에 보여주고 싶을 때만 아래 optional 필드를 추가하면 됩니다.

```json
{
  "schemaVersion": "florai.result.v1",
  "status": "completed",
  "prediction": {},
  "evidence": {
    "perImageFindings": [
      {
        "view": "front_full",
        "label": "정면 전체",
        "findings": ["전체 형태와 기준 물체를 확인했습니다."]
      },
      {
        "view": "top_view",
        "label": "상단 뷰",
        "findings": ["잎 면적과 퍼짐 정도를 확인했습니다."]
      }
    ]
  },
  "description": {}
}
```

## 화면 변경

- 촬영 화면에서 정면 전체, 상단 뷰, 근접 사진 슬롯을 제공합니다.
- 결과 화면에서 썸네일 갤러리와 “총 N장의 이미지 기반 분석” 문구를 보여줍니다.
- 상품 게시 화면은 첫 번째 이미지를 대표 이미지로 쓰고, 추가 이미지는 상품 상세 이미지 후보로 저장합니다.
