"""Florai Redis worker example.

Install:
    pip install redis pillow

Run:
    export REDIS_URL="redis://default:password@host:6379/0"
    python docs/worker_example.py
"""

from __future__ import annotations

import base64
import io
import json
import os
import time
from typing import Any

import redis
from PIL import Image

REDIS_URL = os.environ["REDIS_URL"]
KEY_PREFIX = os.environ.get("FLORAI_REDIS_KEY_PREFIX", "florai")
QUEUE_KEY = f"{KEY_PREFIX}:job:queue"
TTL_SECONDS = int(os.environ.get("FLORAI_JOB_TTL_SECONDS", "1800"))

client = redis.from_url(REDIS_URL, decode_responses=True)


def job_key(job_id: str) -> str:
    return f"{KEY_PREFIX}:job:{job_id}"


def result_key(job_id: str) -> str:
    return f"{KEY_PREFIX}:result:{job_id}"


def decode_images(job: dict[str, Any]) -> list[tuple[dict[str, Any], Image.Image]]:
    image_payloads = job.get("images") or [job["image"]]
    decoded: list[tuple[dict[str, Any], Image.Image]] = []

    for image_payload in image_payloads:
        image_bytes = base64.b64decode(image_payload["dataBase64"])
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        decoded.append((image_payload, image))

    return decoded


def run_model(job: dict[str, Any]) -> dict[str, Any]:
    # TODO: 여기서 지헌 모델 추론으로 교체.
    taxonomy = job["input"].get("taxonomy", {})
    measurements = job["input"].get("measurements", {})
    images = job.get("images") or [job.get("image", {})]
    image_count = len(images)
    cultivar_class_name = taxonomy.get("cultivarClassName", "화훼류")
    stem_length = float(measurements.get("stemLengthCm") or 0)
    grade_label = "특" if stem_length >= 70 else "상" if stem_length >= 60 else "보통"

    return {
        "schemaVersion": "florai.result.v1",
        "jobId": job["jobId"],
        "status": "completed",
        "completedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "prediction": {
            "condition": {"label": "normal", "labelKo": "정상", "confidence": 0.9},
            "grade": {"label": "special", "labelKo": grade_label, "confidence": 0.86},
        },
        "evidence": {
            "standardReferences": [
                {
                    "title": "농산물 표준규격 참고",
                    "matchedRule": f"입력된 줄기 길이 {stem_length:g}cm 기준으로 {grade_label} 등급 후보입니다.",
                    "field": "stemLengthCm",
                    "inputValue": stem_length,
                }
            ],
            "visualFindings": [
                f"총 {image_count}장의 이미지를 수신했습니다.",
                "worker 예시 응답입니다. 실제 Vision Encoder 결과로 교체하세요.",
            ],
            "perImageFindings": [
                {
                    "view": image.get("view", "additional"),
                    "label": image.get("label", f"이미지 {idx + 1}"),
                    "findings": ["해당 촬영 뷰를 모델 입력으로 사용했습니다."],
                }
                for idx, image in enumerate(images)
            ],
        },
        "description": {
            "summary": f"{cultivar_class_name} 분석이 완료되었습니다.",
            "reasons": ["Redis job payload를 정상 수신했습니다.", f"멀티뷰 이미지 {image_count}장을 처리했습니다."],
            "warnings": ["현재 worker_example.py의 임시 결과입니다."],
            "recommendation": "실제 모델 결과로 교체한 뒤 검수하세요.",
        },
    }


def main() -> None:
    print(f"Florai worker listening: {QUEUE_KEY}")
    while True:
        popped = client.blpop(QUEUE_KEY, timeout=0)
        if not popped:
            continue

        _, job_id = popped
        raw_job = client.get(job_key(job_id))
        if not raw_job:
            print(f"job missing: {job_id}")
            continue

        job = json.loads(raw_job)
        print(f"processing: {job_id}")

        try:
            _images = decode_images(job)
            result = run_model(job)
            client.set(result_key(job_id), json.dumps(result, ensure_ascii=False), ex=TTL_SECONDS)
            print(f"completed: {job_id}")
        except Exception as exc:  # noqa: BLE001
            result = {
                "schemaVersion": "florai.result.v1",
                "jobId": job_id,
                "status": "failed",
                "description": {
                    "summary": "모델 추론 중 오류가 발생했습니다.",
                    "reasons": [],
                    "warnings": [str(exc)],
                    "recommendation": "worker 로그를 확인하세요.",
                },
            }
            client.set(result_key(job_id), json.dumps(result, ensure_ascii=False), ex=TTL_SECONDS)
            print(f"failed: {job_id}: {exc}")


if __name__ == "__main__":
    main()
