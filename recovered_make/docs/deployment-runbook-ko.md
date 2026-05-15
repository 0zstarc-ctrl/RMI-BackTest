# RMI 백테스트 Render 배포 Runbook

## 1. 배포 준비

배포 대상 폴더는 `D:\WORK\RMI-BackTest`이다.

Render Blueprint 파일:

```text
render.yaml
```

배포 전 로컬 검증:

```powershell
cd D:\WORK\RMI-BackTest\recovered_make
npm run test
npm run build

cd D:\WORK\RMI-BackTest\recovered_make\backend
npm run db:validate
npm run build
```

## 2. GitHub에 올리기

`D:\WORK\RMI-BackTest`를 GitHub repository로 올린다.

주의:

- `backend/.env`는 올리지 않는다.
- Supabase DB 비밀번호와 connection string은 Git에 올리지 않는다.
- `node_modules`, `dist`는 올리지 않는다.

## 3. Render Blueprint 생성

Render Dashboard에서:

```text
New
-> Blueprint
-> GitHub repository 선택
-> render.yaml 선택
```

생성될 서비스:

- `rmi-backtest-api`
- `rmi-backtest-web`

## 4. Render 환경변수 입력

Backend `rmi-backtest-api`:

```text
DATABASE_URL=<Supabase pooler connection string>
UPBIT_API_BASE_URL=https://api.upbit.com/v1
CORS_ORIGIN=https://<frontend-url>.onrender.com
HOST=0.0.0.0
NODE_ENV=production
```

Frontend `rmi-backtest-web`:

```text
VITE_API_BASE_URL=https://<backend-url>.onrender.com
```

처음 Blueprint 생성 시 Frontend URL을 아직 모르면:

1. Backend `CORS_ORIGIN`은 임시로 비워두지 말고 나중에 실제 Frontend URL로 수정한다.
2. Frontend `VITE_API_BASE_URL`에는 Backend URL을 넣는다.
3. Frontend URL이 생성된 뒤 Backend `CORS_ORIGIN`을 수정하고 Backend를 재배포한다.

## 5. DB migration

Backend Render Shell에서 실행:

```bash
npm run db:deploy
```

확인:

```text
https://<backend-url>.onrender.com/health
https://<backend-url>.onrender.com/health/db
```

## 6. API smoke test

브라우저 또는 PowerShell에서 확인:

```powershell
Invoke-RestMethod "https://<backend-url>.onrender.com/api/markets/top?limit=5"
```

```powershell
Invoke-RestMethod "https://<backend-url>.onrender.com/api/candles?market=KRW-BTC&interval=1d&from=2026-05-01T00:00:00.000Z&to=2026-05-10T00:00:00.000Z"
```

## 7. 초기 캔들 적재

Backend Render Shell에서 smoke test:

```bash
SYNC_MARKET_LIMIT=1 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=2 npm run sync:candles:initial
npm run verify:ops
```

전체 적재:

```bash
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=4h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
npm run verify:ops
```

## 8. Frontend 검증

Frontend URL에서 확인:

- 종목 드롭다운이 채워지는지 확인
- `KRW-BTC`, `KRW-ETH`, `KRW-XRP` 중 3개 종목 백테스트 실행
- 1시간봉, 4시간봉, 일봉 각각 실행
- Result page 표시 확인
- PDF 출력 미리보기 확인

## 9. 운영 메모

- 현재 최신 캔들 보강은 `/api/candles` 요청 시 on-demand로 수행한다.
- Render Cron Job은 아직 구성하지 않는다.
- Cron을 쓰려면 `sync:candles:latest` 명령을 별도로 구현한 뒤 추가한다.
