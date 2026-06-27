# Florai Polling Interval Patch

## 변경 내용

Redis 사용량을 줄이기 위해 분석 결과 조회 polling 기본 주기를 40초로 변경했습니다.

- `NEXT_PUBLIC_ANALYSIS_POLL_INTERVAL_MS`: `1500` → `40000`
- `NEXT_PUBLIC_ANALYSIS_POLL_TIMEOUT_MS`: `120000` → `300000`
- 코드 기본값도 `1_500ms` → `40_000ms`로 변경

## 영향

- Redis status 조회 빈도가 크게 줄어듭니다.
- 대신 분석 완료 후 결과 화면 전환이 최대 약 40초 늦게 보일 수 있습니다.
- 데모에서는 worker 처리 시간이 짧더라도 프론트가 다음 polling 시점까지 기다릴 수 있습니다.

## 로컬 적용

`.env.local`에 이미 값을 넣어두었다면 아래처럼 수정해야 합니다.

```env
NEXT_PUBLIC_ANALYSIS_POLL_INTERVAL_MS=40000
NEXT_PUBLIC_ANALYSIS_POLL_TIMEOUT_MS=300000
```

수정 후 서버를 재시작하세요.

```bash
npm run dev
```
