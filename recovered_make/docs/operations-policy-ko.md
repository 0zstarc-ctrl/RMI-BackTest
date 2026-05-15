# RMI 백테스트 시스템 운영 검증 정책

## 목적

이 문서는 `18.2-E 검증과 운영 정책` 단계의 실행 기준을 정의한다. 목표는 로컬 Frontend, 로컬 Backend, Supabase 개발 DB가 함께 동작하는지 확인하고, Upbit API와 DB 캐시 정책을 안정적으로 운영하는 것이다.

## 검증 순서

1. Supabase 개발 DB 연결
   - `backend/.env`에 `DATABASE_URL`을 설정한다.
   - `npm run db:migrate`로 테이블을 생성한다.

2. Backend 기본 검증
   - `npm run dev`로 Backend를 실행한다.
   - `/health`가 `ok`를 반환하는지 확인한다.
   - `/health/db`가 `database: connected`를 반환하는지 확인한다.

3. Market API 검증
   - `/api/markets/top?limit=5`를 호출한다.
   - 응답에 `markets` 배열이 포함되는지 확인한다.
   - Supabase `markets` 테이블에 데이터가 저장되는지 확인한다.

4. Candle API 검증
   - `/api/candles`를 지정 기간으로 호출한다.
   - 응답에 `candles` 배열이 포함되는지 확인한다.
   - Supabase `candles` 테이블에 데이터가 저장되는지 확인한다.
   - 같은 요청을 다시 호출했을 때 DB 데이터를 재사용하는지 확인한다.

5. 초기 sync job 검증
   - 처음에는 작은 범위로 실행한다.
   - 예: `SYNC_MARKET_LIMIT=1`, `SYNC_INTERVALS=1d`, `SYNC_MAX_PAGES_PER_JOB=2`
   - 초기 적재 job은 항상 현재 시점에서 시작해 과거 방향으로 페이지네이션한다.
   - Upbit candle API는 1회 최대 200개를 반환하므로, `SYNC_MAX_PAGES_PER_JOB=10`이면 최대 2,000개 봉을 조회한다.
   - 전체 과거 데이터를 한 번에 채우려면 interval별 필요한 페이지 수보다 큰 값을 설정한다.
   - `candle_sync_jobs`에 상태가 기록되는지 확인한다.

6. 운영 검증 스크립트 실행
   - `npm run verify:ops`
   - 테이블 접근, 캔들 중복, sync job 상태를 확인한다.

7. 캔들 가격 검증 스크립트 실행
   - `npm run verify:candles`
   - DB에 저장된 캔들 가격과 Upbit 원본 캔들 가격을 동일 timestamp 기준으로 비교한다.
   - 비교 필드는 `open`, `high`, `low`, `close`, `volume`이다.

## 캐시 정책

- 백테스트 요청 시 Backend는 DB를 먼저 조회한다.
- 요청 구간의 캔들이 충분하면 Upbit API를 호출하지 않는다.
- DB에 누락 구간이 있으면 해당 구간만 Upbit API로 보강한다.
- 보강한 캔들은 즉시 DB에 upsert한다.
- 과거 확정 캔들은 장기 보관한다.
- 최신 진행 중인 캔들은 stale 가능성이 있으므로 주기적으로 재조회할 수 있다.

## 오류 정책

- Upbit API 실패
  - DB에 기존 데이터가 있으면 fallback 응답을 고려한다.
  - DB 데이터도 부족하면 사용자에게 명확한 오류를 반환한다.

- Supabase 연결 실패
  - `/health/db`에서 503을 반환한다.
  - Frontend에는 백테스트 실행 불가 메시지를 표시한다.

- 캔들 데이터 부족
  - 기간을 줄이거나 RMI 파라미터를 낮추라는 메시지를 표시한다.

- sync job 실패
  - `candle_sync_jobs.status`를 `FAILED`로 기록한다.
  - `error_message`에 실패 원인을 저장한다.
  - 재실행해도 이미 저장된 캔들은 upsert로 중복 저장하지 않는다.

## 로컬 검증 명령

```powershell
cd D:\WORK\RMI-BackTest\recovered_make\backend

npm run db:migrate
npm run dev
```

다른 터미널:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/health
Invoke-RestMethod http://127.0.0.1:4000/health/db
Invoke-RestMethod "http://127.0.0.1:4000/api/markets/top?limit=5"
Invoke-RestMethod "http://127.0.0.1:4000/api/candles?market=KRW-BTC&interval=1d&from=2024-01-01T00:00:00.000Z&to=2024-01-10T00:00:00.000Z"
```

초기 sync job 소규모 검증:

```powershell
$env:SYNC_MARKET_LIMIT="1"
$env:SYNC_INTERVALS="1d"
$env:SYNC_MAX_PAGES_PER_JOB="2"
npm run sync:candles:initial
npm run verify:ops
```

현재부터 가능한 모든 과거 일봉을 적재하는 예:

```powershell
$env:SYNC_MARKET_LIMIT="1"
$env:SYNC_INTERVALS="1d"
$env:SYNC_MAX_PAGES_PER_JOB="100"
npm run sync:candles:initial
```

`1h`, `4h`, `1d`를 모두 적재하는 운영 전 초기 실행 예:

```powershell
$env:SYNC_MARKET_LIMIT="20"
$env:SYNC_INTERVALS="1h,4h,1d"
$env:SYNC_MAX_PAGES_PER_JOB="10000"
npm run sync:candles:initial
```

캔들 가격 검증:

```powershell
npm run verify:candles
```

검증 대상 변경:

```powershell
$env:VERIFY_CANDLE_MARKET="KRW-BTC"
$env:VERIFY_CANDLE_INTERVAL="1d"
$env:VERIFY_CANDLE_FROM="2024-01-01T00:00:00.000Z"
$env:VERIFY_CANDLE_TO="2024-01-10T00:00:00.000Z"
npm run verify:candles
```

검증 스크립트는 DB의 `timestamp`와 Upbit의 `candle_date_time_utc`를 기준으로 같은 봉을 찾는다. 화면에서 한국 시간 기준 날짜와 다르게 보이면 UTC/KST 표시 차이를 먼저 확인한다.

