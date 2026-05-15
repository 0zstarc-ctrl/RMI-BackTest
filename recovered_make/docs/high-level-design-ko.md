# RMI 백테스트 시스템 High Level Design

## 1. 개요

RMI 백테스트 시스템은 Upbit 공개 API의 과거 캔들 데이터를 기반으로, 사용자가 설정한 RMI(Relative Momentum Index) 전략을 시뮬레이션하고 결과 리포트를 제공하는 웹 서비스이다.

서비스는 사용자가 조건을 입력하는 `BackTest page`와 실행 결과를 확인하는 `Result page` 두 화면으로 구성한다. 초기 버전은 단일 사용자 브라우저 기반 애플리케이션으로 설계하며, 서버 저장소 없이 요청 시점의 설정과 결과 데이터를 화면 간 상태로 전달한다.

## 2. 목표

- Upbit KRW 마켓 종목 중 시가총액 상위 20개 종목을 대상으로 백테스트를 수행한다.
- 사용자가 기간, 봉 간격, RMI 파라미터, 매수/매도 조건, 손절, 슬리피지, 수수료를 직접 설정할 수 있게 한다.
- 백테스트 결과를 수익률, 최종 자산, 거래 횟수, 승률, 최대 낙폭, Sharpe Ratio, 자산 곡선, 가격/RMI 차트, 거래 내역으로 제공한다.
- 화면은 `BackTest page`와 `Result page` 두 개로 제한하여 단순한 사용 흐름을 유지한다.

## 3. 비목표

- 실제 주문 실행 기능은 포함하지 않는다.
- 사용자 계정, 로그인, 포트폴리오 저장, 전략 저장 기능은 초기 범위에 포함하지 않는다.
- Upbit 개인 API Key가 필요한 잔고 조회, 주문, 체결 내역 조회는 포함하지 않는다.
- 투자 추천 또는 자동 매매 의사결정 서비스로 동작하지 않는다.

## 4. 사용자 흐름

1. 사용자는 `BackTest page`에 진입한다.
2. 종목, 봉 간격, 백테스트 기간을 선택한다.
3. RMI 설정값인 Period, Momentum, Overbought, Oversold를 입력한다.
4. 매수 조건, 매도 조건, 손절률, 슬리피지, 수수료, 초기 자본을 입력한다.
5. `백테스트 실행` 버튼을 누른다.
6. 시스템은 Upbit API에서 해당 종목과 기간의 캔들 데이터를 조회한다.
7. 시스템은 RMI 값을 계산하고 매수/매도/손절 조건을 적용해 거래 시뮬레이션을 실행한다.
8. 사용자는 `Result page`에서 결과 리포트와 차트를 확인한다.
9. 사용자는 `PDF 출력` 버튼을 눌러 결과 리포트를 PDF 파일로 저장하거나 인쇄할 수 있다.
10. 사용자는 `백테스트로 돌아가기`를 눌러 설정을 수정하고 다시 실행할 수 있다.

## 5. 화면 설계

### 5.1 BackTest Page

`BackTest page`는 백테스트 실행 전 모든 입력값을 설정하는 화면이다.

주요 영역:

- 헤더
  - 서비스명: RMI 백테스트 시스템
  - 보조 설명: Upbit KRW 마켓 기반 RMI 전략 시뮬레이션

- 백테스트 대상 카드
  - 종목 선택
  - 봉 간격 선택: 1시간봉, 4시간봉, 일봉
  - 시작일
  - 종료일
  - 초기 자본

- RMI 지표 설정 카드
  - Period
  - Momentum
  - Overbought
  - Oversold

- 매수/매도 조건 카드
  - 매수 RMI 기준값
  - 매수 신호 타입: 기준선 돌파, 구간 진입
  - 매도 RMI 기준값
  - 매도 신호 타입: 기준선 돌파, 구간 진입

- 거래 비용과 리스크 카드
  - 손절률
  - 슬리피지
  - 수수료
  - 백테스트 실행 버튼

입력 검증:

- 시작일은 종료일보다 이전이어야 한다.
- Period, Momentum은 1 이상이어야 한다.
- RMI 기준값은 0에서 100 사이여야 한다.
- 수수료와 슬리피지는 0 이상이어야 한다.
- 초기 자본은 0보다 커야 한다.

### 5.2 Result Page

`Result page`는 백테스트 실행 결과를 요약 지표, 차트, 거래 내역으로 보여준다.

주요 영역:

- 헤더
  - 백테스트로 돌아가기 버튼
  - PDF 출력 버튼
  - 결과 리포트 제목
  - 종목과 봉 간격 요약

- 요약 지표 카드
  - 총 손익
  - 총 수익률
  - 거래 횟수
  - 승률
  - 최종 자산
  - 최대 낙폭
  - Sharpe Ratio

- 자산 곡선 차트
  - 시간별 평가 자산
  - 초기 자본 기준선

- 가격과 RMI 차트
  - 종가
  - RMI
  - Overbought 기준선
  - Oversold 기준선

- 백테스트 설정 요약
  - 기간
  - RMI 설정
  - 매수/매도 기준
  - 비용 설정

- 거래 내역 테이블
  - 일시
  - 구분: 매수, 매도
  - 체결 가격
  - 수량
  - RMI 값
  - 거래 사유
  - 실현 손익

- PDF 출력
  - 현재 결과 리포트의 요약 지표, 차트, 설정 요약, 거래 내역을 PDF로 출력
  - 브라우저 인쇄 기능 또는 클라이언트 PDF 생성 라이브러리를 사용
  - 출력 시 버튼, 내비게이션 등 조작 UI는 제외

## 6. 시스템 구성

초기 버전은 브라우저 단일 애플리케이션 구조로 구성한다.

```text
User
  -> BackTest Page
    -> Upbit Market/Candle API
    -> RMI Calculator
    -> Backtest Engine
  -> Result Page
```

주요 모듈:

- UI Layer
  - `BackTestPage`: 입력 폼과 실행 액션 담당
  - `ResultPage`: 결과 리포트와 차트 표시 담당

- Service Layer
  - `upbitService`: Upbit 공개 API 호출 담당
  - 종목 목록 조회
  - 캔들 데이터 조회

- Domain Layer
  - `rmi`: RMI 계산 담당
  - `backtest`: 매수/매도/손절 시뮬레이션 담당

- Routing Layer
  - `/`: BackTest page
  - `/result`: Result page

## 7. 데이터 흐름

### 7.1 백테스트 실행 흐름

```text
사용자 입력
  -> BacktestConfig 생성
  -> Upbit 캔들 데이터 조회
  -> RMI 배열 계산
  -> 캔들별 조건 평가
  -> 거래 내역 생성
  -> 자산 곡선 계산
  -> 성과 지표 계산
  -> Result page로 결과 전달
```

### 7.2 화면 간 데이터 전달

초기 버전에서는 React Router의 navigation state를 사용해 `BacktestResult`를 `Result page`로 전달한다.

장점:

- 서버 저장소가 필요 없다.
- 구현이 단순하다.
- 사용자가 여러 조건을 빠르게 반복 테스트하기 쉽다.

제약:

- 새로고침 시 결과 state가 사라질 수 있다.
- URL만 공유해서 동일 결과를 재현할 수 없다.

향후 개선 시 쿼리 파라미터, localStorage, IndexedDB, 서버 저장소 중 하나를 도입할 수 있다.

## 8. 주요 데이터 모델

### 8.1 BacktestConfig

```ts
interface BacktestConfig {
  symbol: string;
  startDate: Date;
  endDate: Date;
  interval: "1h" | "4h" | "1d";
  rmi: {
    period: number;
    momentum: number;
    overbought: number;
    oversold: number;
  };
  buyCondition: number;
  buySignalType: "enter" | "break";
  sellCondition: number;
  sellSignalType: "enter" | "break";
  stopLoss: number;
  slippage: number;
  fee: number;
  initialCapital: number;
}
```

### 8.2 CandleData

```ts
interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### 8.3 BacktestResult

```ts
interface BacktestResult {
  trades: Trade[];
  equity: number[];
  timestamps: number[];
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  numberOfTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  config: BacktestConfig;
  candleData: CandleData[];
  rmiValues: number[];
}
```

## 9. Upbit API 설계

### 9.1 종목 목록

사용 API:

```text
GET https://api.upbit.com/v1/market/all?isDetails=true
```

역할:

- Upbit에서 거래 가능한 전체 마켓 조회
- `KRW-` 마켓만 필터링
- 표시명, 심볼, 거래 가능 여부를 화면 선택지에 활용

시가총액 상위 20개 요구사항:

- Upbit 공개 API만으로 정확한 시가총액 순위를 제공하기 어렵다.
- 초기 설계에서는 다음 중 하나를 선택한다.
  - 외부 시가총액 API를 추가 연동한다.
  - 사전에 관리하는 상위 20개 화이트리스트를 사용한다.
  - 거래대금 기준 상위 20개를 대체 지표로 사용한다.

권장 초기안:

- Upbit `market/all`로 KRW 마켓을 조회한다.
- Upbit ticker API로 24시간 거래대금을 조회한다.
- 초기 MVP에서는 거래대금 상위 20개를 제공하고, UI 문구는 `거래대금 상위 20개`로 명확히 표시한다.
- 이후 CoinGecko 등 외부 데이터 연동 시 `시가총액 상위 20개`로 확장한다.

운영 버전의 시가총액 상위 20개 처리:

- Upbit 공개 API만으로는 정확한 실시간 시가총액 순위를 직접 가져오기 어렵다.
- 최종 서비스에서 `시가총액 상위 20개`를 요구할 경우 외부 시가총액 데이터 제공 API를 별도로 연동한다.
- 외부 시가총액 API에서 상위 20개 코인의 심볼을 가져온 뒤, Upbit KRW 마켓에 상장된 종목과 매칭한다.
- 외부 시가총액 API 연동 전까지는 `거래대금 상위 20개` 또는 관리자가 관리하는 상위 20개 화이트리스트를 사용한다.

### 9.2 캔들 데이터

운영 버전에서는 캔들 데이터를 서버 DB에 저장한다. 프론트엔드는 Upbit API를 직접 호출하지 않고 자체 Backend API를 호출한다. Backend API는 요청 기간의 캔들 데이터가 DB에 존재하는지 확인하고, 부족한 구간만 Upbit API에서 추가 조회한 뒤 DB에 저장한다.

Frontend 사용 API:

```text
GET /api/candles?market=KRW-BTC&interval=1d&from=2024-01-01&to=2024-12-31
```

Backend 내부 Upbit 사용 API:

```text
GET https://api.upbit.com/v1/candles/minutes/60
GET https://api.upbit.com/v1/candles/minutes/240
GET https://api.upbit.com/v1/candles/days
```

요청 파라미터:

- `market`: 예: `KRW-BTC`
- `interval`: `1h`, `4h`, `1d`
- `from`: 조회 시작일
- `to`: 조회 종료일

Backend가 Upbit에 전달하는 파라미터:

- `market`: 예: `KRW-BTC`
- `to`: 조회 기준 시각
- `count`: 최대 조회 개수

설계 고려사항:

- Backend는 먼저 DB에서 `market + interval + timestamp` 기준으로 기존 캔들을 조회한다.
- 요청 기간 중 DB에 없는 구간만 Upbit API로 추가 조회한다.
- 새로 조회한 캔들은 DB에 upsert한다.
- Upbit 캔들 API는 한 번에 가져올 수 있는 개수 제한이 있으므로 기간이 길면 페이지네이션 방식으로 반복 조회한다.
- API 응답은 최신 데이터부터 내려올 수 있으므로 백테스트 엔진에 넘기기 전에 시간 오름차순으로 정렬한다.
- API 요청 제한을 고려해 재시도와 지연 처리 전략을 둔다.
- 과거 확정 캔들은 장기 보관하고, 최신 진행 중인 캔들은 짧은 TTL 또는 재조회 정책을 둔다.

캔들 저장 테이블 예시:

```text
candles
- id
- market
- interval
- timestamp
- open
- high
- low
- close
- volume
- source
- fetched_at
- created_at
- updated_at

unique index:
- market + interval + timestamp
```

초기 캔들 데이터 적재 전략:

- 서비스 최초 운영 시 한 번만 초기 적재 작업을 실행한다.
- 초기 적재 작업은 대상 ticker 목록을 확정한 뒤 각 ticker의 `1시간봉`, `4시간봉`, `1일봉` 데이터를 가능한 과거 구간부터 현재까지 수집한다.
- 수집한 캔들은 서버 DB에 저장한다.
- 이후 백테스트 실행 시 프론트엔드는 Backend API를 호출하고, Backend는 기본적으로 DB에 저장된 캔들 데이터를 사용한다.
- 요청 기간 중 DB에 없는 구간 또는 최신 미반영 구간만 Upbit API에서 추가 조회한다.
- 초기 적재 작업은 API 요청 제한과 데이터량을 고려해 동기 요청이 아닌 백그라운드 job으로 실행한다.
- 작업은 중간에 실패해도 재시작 가능한 idempotent 구조로 만든다.

초기 적재 흐름:

```text
Bootstrap Job
  -> 대상 ticker 20개 조회
  -> ticker별 interval 목록 생성: 1h, 4h, 1d
  -> DB에 이미 저장된 가장 오래된/최신 timestamp 확인
  -> 부족한 과거 구간을 Upbit API에서 페이지네이션 조회
  -> candles 테이블에 upsert 저장
  -> 작업 상태와 진행률 기록
```

초기 적재 이후 조회 흐름:

```text
BackTest Page
  -> Backend API /api/candles
  -> DB에서 요청 기간 캔들 조회
  -> 부족한 최신 구간만 Upbit API로 보강
  -> DB에 upsert
  -> 시간 오름차순 CandleData[] 반환
```

## 10. RMI 계산 설계

RMI는 RSI와 유사하지만, 전일 대비 변화가 아니라 `Momentum` 기간 전 가격과 현재 가격의 차이를 사용한다.

계산 흐름:

1. 각 캔들에서 `현재 종가 - momentum 기간 전 종가`를 계산한다.
2. 양수 변화량은 상승 모멘텀, 음수 변화량의 절댓값은 하락 모멘텀으로 분리한다.
3. 지정한 `period` 동안 상승/하락 모멘텀 평균을 계산한다.
4. 상대 강도 `RS = avgUp / avgDown`을 계산한다.
5. `RMI = 100 - 100 / (1 + RS)`를 계산한다.

기본값:

- Period: 20
- Momentum: 5
- Overbought: 70
- Oversold: 30

## 11. 백테스트 엔진 설계

### 11.1 매수 조건

지원 신호:

- 기준선 돌파(`break`)
  - 이전 RMI가 매수 기준 이하이고 현재 RMI가 기준을 상향 돌파하면 매수

- 구간 진입(`enter`)
  - 이전 RMI가 매수 기준보다 높고 현재 RMI가 기준 이하로 진입하면 매수

### 11.2 매도 조건

지원 신호:

- 기준선 돌파(`break`)
  - 이전 RMI가 매도 기준 이상이고 현재 RMI가 기준을 하향 돌파하면 매도

- 구간 진입(`enter`)
  - 이전 RMI가 매도 기준보다 낮고 현재 RMI가 기준 이상으로 진입하면 매도

### 11.3 손절 조건

- 포지션 보유 중 현재 종가 기준 손실률이 사용자가 설정한 손절률 이상이면 매도한다.
- 손절은 RMI 매도 조건보다 우선 적용한다.

### 11.4 비용 적용

- 매수 가격에는 슬리피지를 더한다.
- 매도 가격에는 슬리피지를 뺀다.
- 매수와 매도 금액에 수수료를 적용한다.

### 11.5 포지션 정책

MVP에서는 단순화를 위해 다음 정책을 사용한다.

- 현금 100% 매수
- 단일 종목 단일 포지션
- 숏 포지션 없음
- 분할 매수/분할 매도 없음

## 12. 결과 지표 설계

필수 지표:

- 최종 자산
- 총 손익
- 총 수익률
- 거래 횟수
- 승리 거래 수
- 손실 거래 수
- 승률
- 최대 낙폭
- Sharpe Ratio

차트:

- 자산 곡선 차트
- 가격/RMI 복합 차트
- Overbought/Oversold 기준선

테이블:

- 전체 거래 내역
- 매수/매도 구분
- 거래 가격
- 수량
- RMI 값
- 거래 사유
- 실현 손익

## 13. 오류 처리

BackTest page:

- API 호출 실패 시 사용자에게 오류 메시지를 표시한다.
- 기간 또는 입력값이 유효하지 않으면 백테스트 실행을 막는다.
- 조회된 캔들 데이터가 부족하면 RMI 계산 불가 안내를 표시한다.

Result page:

- navigation state가 없으면 `백테스트 결과가 없습니다` 화면을 보여준다.
- 차트 데이터가 비어 있으면 빈 상태 메시지를 표시한다.

API:

- HTTP 오류
- 요청 제한
- 네트워크 실패
- 응답 포맷 변경
- 캔들 데이터 누락

## 14. 성능 고려사항

- 긴 기간의 1시간봉 데이터는 데이터 수가 많아질 수 있으므로 조회 개수 제한과 로딩 상태가 필요하다.
- 캔들 데이터와 RMI 계산은 브라우저 메인 스레드에서 처리하되, 데이터량이 커지면 Web Worker 도입을 검토한다.
- 차트 렌더링은 데이터 포인트가 많을 경우 샘플링 또는 범위 축소 기능을 제공한다.
- 동일 종목/기간/봉 간격 요청은 캐싱할 수 있다.

## 15. 보안과 규정 고려사항

- 공개 API만 사용하므로 초기 버전에서는 API Key를 저장하지 않는다.
- 실거래 기능을 제공하지 않으므로 주문 권한은 요구하지 않는다.
- 결과 화면에는 투자 유의 문구를 포함하는 것이 좋다.
- 백테스트 결과는 미래 수익을 보장하지 않는다는 고지를 제공한다.

## 16. 향후 확장

- 실제 시가총액 API 연동
- 전략 저장과 불러오기
- 여러 종목 동시 백테스트
- 파라미터 최적화
- CSV 다운로드
- 결과 공유 URL
- 모바일 UX 최적화
- 서버 기반 데이터 캐싱
- 백테스트 실행 로그 저장
- 수익률 비교 벤치마크 추가

## 17. MVP 구현 순서

1. 현재 UI의 한국어 문구와 입력 검증 정리
2. Upbit `market/all`, `ticker`, `candle` API 연동
3. 캔들 데이터 페이지네이션 구현
4. RMI 계산 함수 테스트
5. 백테스트 엔진 테스트
6. Result page 차트와 거래 테이블 검증
7. API 오류와 빈 상태 처리
8. 빌드 및 브라우저 동작 확인

## 18. 상세 구현 계획

### 18.1 1단계: 프로젝트와 UI 정리

목표:

- 현재 Figma Make 복원본을 실제 개발 가능한 React 앱 구조로 안정화한다.
- 깨진 한글 문구, 잘못된 JSX, 임시 mock 표현을 정리한다.

작업:

- `BackTestPage`의 모든 화면 문구를 한글로 정리한다.
- `ResultPage`의 모든 화면 문구를 한글로 정리한다.
- 입력 컴포넌트의 최소값, 최대값, step 값을 명확히 지정한다.
- 시작일이 종료일보다 늦은 경우 실행 버튼을 비활성화하거나 오류 메시지를 표시한다.
- 초기 자본, RMI 값, 손절률, 수수료, 슬리피지 입력값에 대한 검증 함수를 만든다.
- 로딩 상태, 오류 상태, 빈 결과 상태 UI를 정의한다.

완료 기준:

- `npm run build`가 성공한다.
- BackTest page에서 모든 입력값이 정상적으로 변경된다.
- Result page의 기본 상태와 결과 상태가 모두 깨지지 않고 표시된다.

### 18.2 2단계: Upbit 공개 API 연동

목표:

- mock 캔들 데이터를 제거하고 Backend API를 통해 Upbit 공개 API의 실제 과거 데이터를 사용한다.
- 운영 버전에서는 캔들 데이터를 서버 DB에 저장하고 재사용한다.
- 프론트엔드는 Upbit API를 직접 호출하지 않고 자체 Backend API만 호출한다.
- 서비스 최초 실행 시 대상 ticker의 1시간봉, 4시간봉, 1일봉 데이터를 과거 구간부터 현재까지 서버 DB에 초기 적재한다.
- 이 단계부터 Supabase 개발용 PostgreSQL 프로젝트를 연결한다.
- Render 배포 설정은 18.2 개발 중 필수가 아니며, 배포 단계에서 진행한다.

개발 환경 기준:

- Backend API는 로컬에서 실행한다.
- Frontend는 로컬 Vite 개발 서버에서 실행한다.
- DB는 Supabase 개발용 PostgreSQL 프로젝트를 사용한다.
- 로컬 Backend가 Supabase의 `DATABASE_URL`로 직접 연결한다.
- Render는 18.2 구현과 검증이 끝난 뒤 배포 단계에서 설정한다.

운영 데이터 처리 흐름:

```text
최초 1회:
ticker 20개 선정
-> 1h/4h/1d 과거 캔들 전체 수집
-> DB 저장

이후:
백테스트 요청
-> DB에서 캔들 조회
-> 부족한 최신/누락 구간만 Upbit 보강
-> DB 저장 후 실행
```

진행 원칙:

- 18.2 전체를 한 번에 구현하지 않는다.
- Supabase 연결, Backend 기본 구조, Market API, Candle API, 초기 전체 적재 job을 단계적으로 나눈다.
- 먼저 `18.2-A`부터 `18.2-C`까지 완료하여 실제 Upbit 데이터 기반 백테스트가 가능한 상태를 만든다.
- `18.2-D`의 초기 전체 적재 job은 데이터량, API rate limit, 재시도 처리가 크므로 별도 단계로 진행한다.

### 18.2-A Supabase + Backend 기본 구조

목표:

- 로컬 Backend API 서버를 만들고 Supabase 개발용 PostgreSQL에 연결한다.
- DB migration과 기본 health check를 검증한다.

작업:

1. Supabase 개발용 프로젝트를 생성한다.
   - Supabase에서 새 프로젝트를 만든다.
   - Database password와 connection string을 확인한다.
   - 로컬 Backend의 `.env`에 `DATABASE_URL`을 설정한다.
   - Supabase Auth와 Storage는 이 단계에서 사용하지 않는다.
   - Supabase는 PostgreSQL DB 용도로만 사용한다.

2. Backend 프로젝트를 구성한다.
   - Frontend와 분리된 Backend API 서버를 만든다.
   - 권장 스택은 Node.js 기반 `Fastify`, `Express`, `NestJS` 중 하나로 한다.
   - Backend는 Upbit API 호출, 캔들 DB 저장, 백테스트용 데이터 조회를 담당한다.
   - Frontend는 Backend API만 호출한다.

3. DB 스키마를 생성한다.
   - `markets` 테이블을 생성한다.
     - `market`: 예: `KRW-BTC`
     - `korean_name`
     - `english_name`
     - `rank`
     - `rank_type`: `market_cap`, `trade_volume`, `manual`
     - `is_active`
     - `updated_at`
   - `candles` 테이블을 생성한다.
     - `market`
     - `interval`: `1h`, `4h`, `1d`
     - `timestamp`
     - `open`
     - `high`
     - `low`
     - `close`
     - `volume`
     - `source`: `upbit`
     - `fetched_at`
     - `created_at`
     - `updated_at`
   - `candle_sync_jobs` 테이블을 생성한다.
     - `market`
     - `interval`
     - `status`: `pending`, `running`, `completed`, `failed`
     - `started_at`
     - `finished_at`
     - `last_synced_at`
     - `error_message`
   - `candles`에는 `market + interval + timestamp` unique index를 둔다.
   - 캔들 저장은 항상 upsert로 처리한다.

4. 기본 API를 구현한다.
   - `GET /health`
   - DB 연결 확인용 간단한 query

완료 기준:

- 로컬 Backend가 실행된다.
- Supabase DB migration이 성공한다.
- `markets`, `candles`, `candle_sync_jobs` 테이블이 생성된다.
- `GET /health`가 정상 응답한다.

### 18.2-B Market API

목표:

- 백테스트 대상 ticker 20개를 선정하고 DB에 저장한다.
- Frontend의 종목 선택 UI가 Backend API에서 받은 종목 목록을 사용하도록 변경한다.

작업:

1. ticker 20개 선정 로직을 구현한다.
   - Backend에서 Upbit `market/all` API를 호출한다.
     - `GET https://api.upbit.com/v1/market/all?isDetails=true`
     - `KRW-` 마켓만 필터링한다.
   - Upbit만으로는 정확한 시가총액 상위 20개를 알기 어렵다.
   - 운영 버전에서 시가총액 기준이 필수이면 외부 시가총액 API를 연동한다.
   - 외부 시가총액 API가 준비되기 전에는 다음 중 하나를 사용한다.
     - Upbit 거래대금 상위 20개
     - 관리자가 관리하는 ticker 20개 화이트리스트
   - 선정된 ticker 20개는 `markets` 테이블에 저장한다.

2. 종목 목록 API를 구현한다.
   - Endpoint: `GET /api/markets/top?limit=20`
   - `markets` 테이블에 저장된 대상 ticker를 반환한다.
   - 데이터가 없으면 ticker 선정 로직을 실행하거나 명확한 오류를 반환한다.

3. Frontend 종목 목록 조회를 변경한다.
   - `upbit.ts`의 `getTopCoins(limit)`는 `GET /api/markets/top`을 호출한다.
   - 로딩 상태와 API 실패 상태를 UI에 표시한다.

완료 기준:

- Backend가 Upbit KRW 마켓 목록을 조회한다.
- ticker 20개가 `markets` 테이블에 저장된다.
- `GET /api/markets/top`이 정상 응답한다.
- Frontend 종목 선택 UI가 Backend 응답을 사용한다.

### 18.2-C Candle API 최소 구현

목표:

- 특정 market, interval, 기간에 대한 실제 Upbit 캔들을 조회하고 DB에 저장한다.
- Frontend 백테스트가 mock 데이터가 아니라 Backend의 실제 캔들 데이터로 실행된다.

작업:

1. Backend 내부에서 Upbit 캔들 API를 연동한다.
   - `1h`: `GET /v1/candles/minutes/60`
   - `4h`: `GET /v1/candles/minutes/240`
   - `1d`: `GET /v1/candles/days`

2. Upbit 응답을 내부 `CandleData`로 매핑한다.
   - `timestamp`: `candle_date_time_utc` 또는 `candle_date_time_kst`
   - `open`: `opening_price`
   - `high`: `high_price`
   - `low`: `low_price`
   - `close`: `trade_price`
   - `volume`: `candle_acc_trade_volume`
   - 저장 전 timestamp 기준 중복을 제거한다.
   - 백테스트에 전달하기 전 시간 오름차순으로 정렬한다.

3. 기간이 긴 경우 Backend에서 반복 조회를 구현한다.
   - Upbit 응답의 가장 오래된 캔들 시각을 다음 요청의 `to` 값으로 사용한다.
   - 종료 조건은 시작일 이전 데이터에 도달하거나 더 이상 데이터가 없을 때로 한다.

4. 백테스트용 캔들 조회 API를 구현한다.
   - Endpoint: `GET /api/candles`
   - 요청 파라미터:
     - `market`: 예: `KRW-BTC`
     - `interval`: `1h`, `4h`, `1d`
     - `from`: 시작일
     - `to`: 종료일
   - 처리 순서:
     - DB에서 요청 구간의 캔들을 먼저 조회한다.
     - 요청 구간 데이터가 충분하면 Upbit API를 호출하지 않는다.
     - 누락 구간 또는 최신 stale 구간이 있으면 해당 구간만 Upbit API로 보강한다.
     - 보강한 캔들을 DB에 upsert한다.
     - 최종 캔들 배열을 시간 오름차순으로 반환한다.

5. Frontend API 클라이언트를 변경한다.
   - `upbit.ts`는 더 이상 Upbit API를 직접 호출하지 않는다.
   - `fetchCandleData(symbol, startDate, endDate, interval)`는 `GET /api/candles`를 호출한다.
   - API 호출 실패, 로딩, 빈 데이터 상태를 UI에 전달한다.

완료 기준:

- `GET /api/candles`가 실제 Upbit 캔들을 반환한다.
- 반환된 캔들이 `candles` 테이블에 저장된다.
- 같은 요청을 다시 실행하면 DB 데이터를 재사용한다.
- Frontend 백테스트가 실제 캔들 데이터로 실행된다.
- 1시간봉, 4시간봉, 일봉이 최소 1개 종목에서 동작한다.

### 18.2-D 초기 전체 캔들 적재 Job

목표:

- 최초 1회 ticker 20개의 `1h`, `4h`, `1d` 과거 캔들 전체를 DB에 적재한다.
- 중간 실패 후 재실행 가능한 구조를 만든다.

작업:

1. 초기 캔들 적재 job을 구현한다.
   - 대상 ticker 20개를 `markets` 테이블에서 조회한다.
   - 각 ticker에 대해 `1h`, `4h`, `1d` interval 적재 작업을 만든다.
   - 각 ticker/interval 조합마다 존재하는 과거 캔들부터 현재까지 수집한다.

2. sync job 상태 관리를 구현한다.
   - `pending`
   - `running`
   - `completed`
   - `failed`
   - `last_synced_at`
   - `error_message`

3. Upbit 페이지네이션과 rate limit 처리를 강화한다.
   - Upbit 응답의 가장 오래된 캔들 시각을 다음 요청의 `to` 값으로 사용한다.
   - 더 이상 과거 데이터가 없으면 해당 ticker/interval job을 `completed`로 처리한다.
   - 요청 간 delay를 둔다.
   - 실패 시 retry와 backoff를 적용한다.

4. 재실행 가능성을 보장한다.
   - 이미 저장된 캔들은 unique index와 upsert로 중복 저장하지 않는다.
   - 실패한 job은 마지막 저장 지점부터 이어받을 수 있게 한다.

완료 기준:

- ticker 20개의 `1h`, `4h`, `1d` sync job이 생성된다.
- job 진행 상태가 `candle_sync_jobs`에 기록된다.
- job 실패 후 재실행할 수 있다.
- 적재 완료 후 백테스트 요청은 기본적으로 DB 데이터만 사용한다.

### 18.2-E 검증과 운영 정책

목표:

- 18.2-A부터 18.2-D까지 구현한 데이터 흐름을 검증하고 운영 정책을 확정한다.
- 상세 운영 검증 절차는 [operations-policy-ko.md](./operations-policy-ko.md)를 기준으로 한다.

작업:

1. 운영 캐시 정책을 정의한다.
   - 과거 확정 캔들은 장기 보관한다.
   - 현재 진행 중인 최신 캔들은 짧은 TTL을 두고 재조회한다.
   - DB에 충분한 데이터가 있으면 Upbit API를 호출하지 않는다.
   - Upbit API 실패 시 DB에 기존 데이터가 있으면 fallback 응답을 고려한다.
   - 초기 적재 job은 수동 실행과 재실행이 가능해야 한다.
   - 18.2 로컬 개발 단계에서는 자동 스케줄러를 포함하지 않는다.
   - 이 단계의 캔들 저장은 `npm run sync:candles:initial` 수동 실행 또는 백테스트 요청 시 부족 구간 보강으로 수행한다.
   - Render 배포 단계에서 Cron Job 또는 Background Worker를 추가해 최신 봉을 주기적으로 보강한다.

2. 로컬 개발 검증을 수행한다.
   - 로컬 Frontend에서 로컬 Backend API를 호출한다.
   - 로컬 Backend가 Supabase DB에 연결되는지 확인한다.
   - `markets`, `candles`, `candle_sync_jobs` 테이블에 데이터가 저장되는지 확인한다.
   - Render 배포 없이도 18.2 기능 검증이 가능해야 한다.

3. 오류 처리를 점검한다.
   - Upbit API 실패
   - Supabase 연결 실패
   - 캔들 데이터 부족
   - ticker 목록 없음
   - sync job 중단

완료 기준:

- 로컬 Frontend, 로컬 Backend, Supabase 개발 DB가 함께 동작한다.
- 실제 Upbit 데이터 기반 백테스트가 여러 종목에서 실행된다.
- 누락 구간 보강, DB 재사용, 오류 처리가 검증된다.

완료 기준:

- Frontend가 Backend API를 통해 실제 Upbit 데이터 기반 백테스트를 실행한다.
- 캔들 데이터가 서버 DB에 저장된다.
- Supabase 개발용 PostgreSQL에 `markets`, `candles`, `candle_sync_jobs` 테이블이 생성된다.
- 로컬 Backend가 Supabase DB에 정상 연결된다.
- 초기 적재 job이 ticker 20개의 1시간봉, 4시간봉, 1일봉 데이터를 DB에 저장한다.
- 같은 `market + interval + 기간` 요청 시 DB 데이터를 재사용한다.
- DB에 없는 부족한 구간만 Upbit API로 추가 조회한다.
- 1시간봉, 4시간봉, 일봉이 모두 동작한다.
- API 실패 시 사용자에게 오류가 표시된다.
- 캔들 데이터가 시간 오름차순으로 정렬된다.

### 18.3 3단계: 백테스트 엔진 고도화

목표:

- RMI 기반 매수/매도/손절 로직을 명확하게 검증하고 결과 지표의 신뢰도를 높인다.
- 백테스트 엔진의 시간 기준, 거래 정책, 비용 계산, 성과 지표 계산을 코드와 테스트로 고정한다.
- 이후 Result Page와 운영 배포 단계에서 결과를 신뢰할 수 있도록 계산 책임을 분리한다.

작업:

#### 18.3-A 테스트 환경 구성

목표:

- 프론트엔드 유틸 함수에 대한 자동 테스트 환경을 구성한다.

작업:

1. 테스트 도구를 추가한다.
   - 권장: `Vitest`
   - 대상 파일:
     - `src/app/utils/rmi.ts`
     - `src/app/utils/backtest.ts`
     - `src/app/utils/time.ts`

2. npm script를 추가한다.
   - `npm run test`
   - `npm run test:watch`

3. 테스트 fixture를 만든다.
   - 상승 추세 캔들
   - 하락 추세 캔들
   - 횡보 캔들
   - 매수/매도 신호가 명확히 발생하는 RMI 배열 또는 캔들 배열

완료 기준:

- `npm run test`가 실행된다.
- 테스트가 실패하면 CI 또는 로컬 검증에서 바로 확인 가능하다.

진행 결과:

- Vitest 기반 테스트 환경을 구성했다.
- `npm run test`, `npm run test:watch` 스크립트를 추가했다.
- `src/app/utils/testFixtures.ts`에 캔들 fixture 생성 유틸을 추가했다.
- `src/app/utils/rmi.test.ts`에 RMI 기본 스모크 테스트를 추가했다.
- `src/app/utils/time.test.ts`에 한국시간 날짜 변환 테스트를 추가했다.
- `npm run test`와 `npm run build`가 통과해야 다음 단계로 진행한다.

#### 18.3-B RMI 계산 검증

목표:

- `calculateRMI()`의 계산 규칙을 명확히 고정한다.

작업:

1. 데이터 부족 구간 처리 정책을 고정한다.
   - `period + momentum` 이전 구간은 현재처럼 중립값 `50`을 반환할지 검토한다.
   - 정책을 확정한 뒤 테스트로 고정한다.

2. RMI 계산 케이스를 테스트한다.
   - 상승 추세 데이터에서 RMI가 높게 계산되는지 확인한다.
   - 하락 추세 데이터에서 RMI가 낮게 계산되는지 확인한다.
   - 변동이 없는 데이터에서 50 또는 별도 정책값을 반환할지 확정한다.
   - `avgDown = 0`인 경우 100 처리 여부를 검증한다.
   - `avgUp = 0`인 경우 0에 가까운 값이 나오는지 검증한다.

3. 입력값 방어 로직을 검토한다.
   - 빈 캔들 배열
   - `period < 2`
   - `momentum < 1`
   - 가격 값이 0 이하인 비정상 데이터

완료 기준:

- RMI 테스트가 모두 통과한다.
- RMI 계산 결과가 캔들 순서에 의존하므로, 입력 캔들은 시간 오름차순이어야 한다는 전제가 문서와 테스트에 반영된다.

진행 결과:

- `calculateRMI()` 입력 방어 로직을 추가했다.
  - `period`는 2 이상의 정수여야 한다.
  - `momentum`은 1 이상의 정수여야 한다.
  - 캔들 종가는 0보다 큰 유한 숫자여야 한다.
- 데이터 부족 구간은 중립값 `50`을 반환하는 정책으로 고정했다.
- 상승만 있는 구간은 `100`, 하락만 있는 구간은 `0`, 변동이 없는 횡보 구간은 `50`을 반환하도록 고정했다.
- 상승/하락이 섞인 구간은 평균 상승폭과 평균 하락폭 기반 공식으로 계산한다.
- RMI 테스트를 10개로 확장했다.
- `npm run test`와 `npm run build`가 통과해야 다음 단계로 진행한다.

#### 18.3-C 거래 시뮬레이션 정책 고정

목표:

- 백테스트 엔진의 매수/매도/손절 규칙을 명확히 고정한다.

거래 정책:

- 전액 매수
- 단일 포지션
- 포지션 보유 중 추가 매수 없음
- 매수/매도 체결가는 해당 봉의 종가 기준
- 매수 가격에는 슬리피지를 더한다.
- 매도 가격에는 슬리피지를 뺀다.
- 매수와 매도 모두 수수료를 적용한다.
- 손절 조건은 RMI 매도 조건보다 먼저 평가한다.
- 마지막 캔들까지 포지션이 남아 있으면 마지막 종가 기준 평가 자산에 반영한다.
- 미청산 포지션은 실현 손익 거래로 기록하지 않는다.

작업:

1. `runBacktest()` 테스트를 추가한다.
   - 매수 신호 발생
   - 매도 신호 발생
   - 손절 우선 처리
   - 수수료 0%일 때 계산
   - 수수료 적용 시 계산
   - 슬리피지 0%일 때 계산
   - 슬리피지 적용 시 계산
   - 포지션 미보유 상태에서 매도 신호가 발생해도 거래하지 않는지 확인
   - 포지션 보유 상태에서 매수 신호가 다시 발생해도 추가 매수하지 않는지 확인

2. 거래 사유 값을 정리한다.
   - `RMI 매수`
   - `RMI 매도`
   - `손절`

3. 거래 결과 구조를 검토한다.
   - 매수 거래에는 `pnl` 없음
   - 매도 거래에는 `pnl` 있음
   - 추후 확장을 위해 `fee`, `slippage`, `gross`, `net` 필드 추가 여부 검토

완료 기준:

- 손절 조건이 RMI 매도 조건보다 먼저 적용된다.
- 수수료와 슬리피지를 0으로 설정했을 때 계산 결과가 수작업 계산과 일치한다.
- 단일 포지션 정책이 테스트로 보장된다.

진행 결과:

- `runBacktest()` 거래 사유 문자열을 정리했다.
  - `RMI 매수`
  - `RMI 매도`
  - `손절`
- 손절이 발생한 봉에서는 추가 매수/매도 신호를 평가하지 않도록 고정했다.
- `src/app/utils/backtest.test.ts`를 추가했다.
- 테스트로 고정한 정책:
  - 수수료와 슬리피지 0%일 때 종가 기준 매수/매도
  - 매수 수수료, 매도 수수료, 슬리피지 적용
  - 손절이 RMI 매도 신호보다 우선
  - 포지션이 없으면 매도 신호가 있어도 거래 없음
  - 포지션 보유 중 추가 매수 없음
  - 미청산 포지션은 마지막 종가 기준 평가 자산에 반영
- `npm run test`와 `npm run build`가 통과해야 다음 단계로 진행한다.

#### 18.3-D 결과 지표 계산 분리

목표:

- `runBacktest()` 안에 섞여 있는 성과 지표 계산을 독립 함수로 분리한다.

분리 대상:

- `calculateTotalReturn()`
- `calculateTotalReturnPercent()`
- `calculateWinRate()`
- `calculateMaxDrawdown()`
- `calculateSharpeRatio()`
- `calculateTradeStats()`

작업:

1. 성과 지표 전용 파일을 만든다.
   - 예: `src/app/utils/performance.ts`

2. 각 지표별 테스트를 추가한다.
   - 총 손익
   - 총 수익률
   - 승률
   - 최대 낙폭
   - Sharpe Ratio
   - 거래가 0건인 경우
   - 손실 거래만 있는 경우
   - 수익 거래만 있는 경우

3. Sharpe Ratio 기준을 명확히 한다.
   - 현재는 일 단위 `sqrt(252)` 기준이다.
   - 1시간봉/4시간봉에서도 같은 기준을 쓸지, interval별 annualization factor를 다르게 둘지 결정한다.
   - MVP에서는 기존 값을 유지하되, 문서에 한계를 명시한다.

완료 기준:

- 결과 지표 계산 함수가 독립 테스트를 가진다.
- `runBacktest()`는 거래 시뮬레이션과 결과 조립에 집중한다.

진행 결과:

- `src/app/utils/performance.ts`를 추가해 성과 지표 계산을 분리했다.
- 분리한 함수:
  - `calculateTotalReturn()`
  - `calculateTotalReturnPercent()`
  - `calculateTradeStats()`
  - `calculateWinRate()`
  - `calculateMaxDrawdown()`
  - `calculateSharpeRatio()`
- `runBacktest()`는 거래 시뮬레이션, 최종 자산 계산, 결과 조립에 집중하도록 정리했다.
- `src/app/utils/performance.test.ts`를 추가했다.
- 테스트로 검증한 케이스:
  - 총 손익
  - 총 수익률
  - 승률
  - 거래가 0건인 경우
  - 최대 낙폭
  - 빈 equity
  - 변동성이 없는 Sharpe Ratio
  - 명시적 annualization factor 기반 Sharpe Ratio
- Sharpe Ratio는 MVP에서 기존과 동일하게 기본 `sqrt(252)` 기준을 유지한다.
- `npm run test`와 `npm run build`가 통과해야 다음 단계로 진행한다.

#### 18.3-E 한국시간 기준 검증

목표:

- 백테스트 입력 기간, 캔들 조회 범위, 결과 리포트 시간이 한국시간 기준으로 일관되는지 검증한다.

작업:

1. 날짜 입력 변환 테스트를 추가한다.
   - 시작일 `YYYY-MM-DD`는 KST `00:00:00.000`으로 해석한다.
   - 종료일 `YYYY-MM-DD`는 KST `23:59:59.999`로 해석한다.
   - Backend API에는 UTC ISO 문자열로 전달한다.

2. 결과 표시 테스트 또는 수동 검증 항목을 만든다.
   - 차트 X축 날짜
   - 거래 내역 시간
   - 백테스트 기간 표시

3. DB 저장 기준을 명시한다.
   - DB는 UTC timestamp로 저장한다.
   - 사용자 입력과 화면 표시는 한국시간 기준으로 처리한다.

완료 기준:

- 사용자가 선택한 날짜 범위가 한국시간 기준으로 캔들 조회에 반영된다.
- 결과 리포트의 날짜와 거래 시간이 한국시간 기준으로 표시된다.

진행 결과:

- `src/app/utils/time.test.ts`의 한국시간 검증을 확장했다.
- 테스트로 고정한 정책:
  - 시작일 `YYYY-MM-DD`는 KST `00:00:00.000`으로 해석한다.
  - 종료일 `YYYY-MM-DD`는 KST `23:59:59.999`로 해석한다.
  - 예: `2026-05-01` 시작일은 Backend API에 `2026-04-30T15:00:00.000Z`로 전달한다.
  - 예: `2026-05-02` 종료일은 Backend API에 `2026-05-02T14:59:59.999Z`로 전달한다.
  - 결과 리포트 날짜, 월일, 일시는 `Asia/Seoul` 기준으로 표시한다.
  - 자정은 `24:00`이 아니라 `00:00`으로 표시한다.
  - 기본 시작일 계산은 로컬 머신 timezone에 의존하지 않는다.
- `src/app/services/upbit.test.ts`를 추가했다.
- `fetchCandleData()`가 KST 기준에서 변환된 UTC ISO 범위를 Backend `/api/candles` 파라미터로 보내는지 검증했다.
- DB 내부 저장은 UTC timestamp 기준을 유지하고, 사용자 입력과 화면 표시는 한국시간 기준으로 처리한다.
- `npm run test`와 `npm run build`가 통과해야 다음 단계로 진행한다.

완료 기준:

- 핵심 계산 함수 테스트가 통과한다.
- 수수료와 슬리피지를 0으로 설정했을 때 계산 결과가 예상값과 일치한다.
- 손절 조건이 RMI 매도 조건보다 먼저 적용된다.
- 한국시간 기준 날짜 입력과 결과 표시가 검증된다.

### 18.4 4단계: Result Page 리포트 구현

목표:

- 백테스트 결과를 사용자가 의사결정에 참고할 수 있는 형태로 시각화한다.

작업:

- 요약 카드 표시
  - 총 손익
  - 총 수익률
  - 최종 자산
  - 거래 횟수
  - 승률
  - 최대 낙폭
  - Sharpe Ratio

- 차트 구현
  - 자산 곡선 차트
  - 가격/RMI 복합 차트
  - Overbought/Oversold 기준선
  - 매수/매도 지점 마커

- 거래 내역 테이블 구현
  - 거래 시간이 최신순 또는 오래된순으로 정렬 가능하게 한다.
  - 매수/매도 구분 색상을 다르게 표시한다.
  - 실현 손익은 매도 거래에만 표시한다.

- 설정 요약 영역 구현
  - 종목
  - 기간
  - 봉 간격
  - RMI 설정
  - 매수/매도 조건
  - 비용 설정

완료 기준:

- Result page에서 모든 주요 지표가 표시된다.
- 차트와 테이블이 동일한 결과 데이터를 기준으로 표시된다.
- 거래가 0건이어도 화면이 깨지지 않는다.

진행 결과:

- `src/app/pages/ResultPage.tsx`를 리포트 화면 기준으로 정리했다.
- 깨진 한글 문자열을 복구했다.
- 요약 카드에 다음 지표를 표시한다.
  - 총 손익
  - 총 수익률
  - 거래 횟수
  - 승률
  - 최종 자산
  - 최대 낙폭
  - Sharpe Ratio
- 자산 곡선 차트를 구현했다.
  - 평가 자산
  - 초기 자본 기준선
- 가격/RMI 복합 차트를 구현했다.
  - 종가
  - RMI
  - Overbought 기준선
  - Oversold 기준선
  - 매수 마커
  - 매도/손절 마커
- 백테스트 설정 요약을 표시한다.
  - 종목
  - 기간
  - 봉 간격
  - RMI 설정
  - 매수/매도 기준
  - 손절
  - 수수료/슬리피지
  - 초기 자본
- 거래 내역 테이블을 정리했다.
  - 한국시간 기준 일시 표시
  - 매수/매도 색상 구분
  - 실현 손익은 매도 거래에만 표시
  - 오래된순/최신순 정렬 토글
  - 거래가 없을 때 빈 상태 표시
- PDF 출력 버튼은 `window.print()`로 동작한다.
- `src/styles.css`에 리포트 섹션, 차트 박스, 섹션 헤더 스타일을 추가했다.
- `npm run test`와 `npm run build`가 통과해야 다음 단계로 진행한다.

### 18.5 5단계: PDF 출력 기능 구현

목표:

- Result page의 결과 리포트를 PDF로 저장하거나 인쇄할 수 있게 한다.

구현 옵션:

- 1안: 브라우저 인쇄 기반
  - `window.print()` 사용
  - CSS `@media print`로 버튼과 내비게이션을 숨긴다.
  - 구현이 단순하고 안정적이다.

- 2안: 클라이언트 PDF 생성
  - `html2canvas`, `jspdf` 또는 유사 라이브러리 사용
  - 사용자가 바로 PDF 파일을 다운로드할 수 있다.
  - 차트 캡처 품질과 페이지 분할 처리가 추가로 필요하다.

권장 MVP:

- 1안 브라우저 인쇄 기반으로 먼저 구현한다.
- 이후 PDF 파일명 지정, 페이지 분할, 로고/푸터가 필요해지면 2안으로 확장한다.

작업:

- Result page 헤더에 `PDF 출력` 버튼을 추가한다.
- 버튼 클릭 시 `window.print()`를 호출한다.
- `styles.css`에 `@media print` 스타일을 추가한다.
  - 버튼 숨김
  - 배경 단순화
  - 카드 그림자 제거
  - 차트와 테이블이 페이지 폭에 맞게 출력되도록 조정
- PDF에 포함할 영역과 제외할 영역을 className으로 구분한다.

완료 기준:

- Result page에서 PDF 출력 버튼을 누르면 브라우저 인쇄 창이 열린다.
- PDF 미리보기에서 요약 카드, 차트, 설정 요약, 거래 내역이 표시된다.
- 백테스트로 돌아가기 버튼과 PDF 출력 버튼은 출력물에 포함되지 않는다.

진행 결과:

- MVP 방식은 브라우저 인쇄 기반 `window.print()`로 유지했다.
- Result page의 `PDF 출력` 버튼은 `window.print()`를 호출한다.
- `src/styles.css`의 `@media print` 스타일을 강화했다.
  - A4 페이지 여백 설정
  - 배경 단순화
  - 버튼과 내비게이션 숨김
  - 카드 그림자 제거
  - 카드/테이블 행 page break 방지
  - 인쇄용 카드 padding 조정
  - 인쇄용 2열 요약 그리드 적용
  - 차트 높이 축소
  - 테이블 글자 크기와 padding 축소
  - 색상 출력 보존을 위한 `print-color-adjust` 적용
- PDF 미리보기에서 요약 카드, 자산 곡선, 가격/RMI 차트, 설정 요약, 거래 내역을 읽을 수 있게 조정했다.
- `npm run test`와 `npm run build`가 통과해야 다음 단계로 진행한다.

### 18.6 6단계: 상태 관리와 재현성 개선

목표:

- 새로고침이나 URL 공유 상황에서도 사용자 경험이 크게 깨지지 않게 한다.

작업:

- 백테스트 설정을 URL query 또는 localStorage에 저장한다.
- Result page 새로고침 시 결과가 없으면 설정 복원 후 재실행할 수 있게 한다.
- 최근 실행한 설정을 `BackTest page`에 자동 복원한다.

완료 기준:

- 새로고침 후에도 사용자가 백테스트 설정을 잃지 않는다.
- 결과 state가 없을 때 명확한 복구 액션이 제공된다.

진행 결과:

- `src/app/utils/persistence.ts`를 추가했다.
- localStorage 저장 키:
  - `rmi-backtest:last-settings`
  - `rmi-backtest:last-result`
- BackTest page는 최근 백테스트 설정을 자동 복원한다.
  - 종목
  - 봉 간격
  - 시작일/종료일
  - RMI 설정
  - 매수/매도 조건
  - 손절/슬리피지/수수료
  - 초기 자본
- 백테스트 실행 시 최근 설정과 결과를 localStorage에 저장한다.
- Result page는 router state가 없으면 최근 저장된 결과를 localStorage에서 복원한다.
- 결과 저장 시 `Date` 값은 ISO 문자열로 저장하고, 복원 시 다시 `Date` 인스턴스로 변환한다.
- localStorage 사용이 불가능한 환경에서는 저장/복원 실패가 백테스트 실행을 막지 않도록 처리했다.
- `src/app/utils/persistence.test.ts`를 추가했다.
- `npm run test`와 `npm run build`가 통과해야 다음 단계로 진행한다.

### 18.7 7단계: 품질 검증

목표:

- 실제 사용 가능한 수준으로 기능 안정성을 확보한다.

작업:

- 단위 테스트
  - RMI 계산
  - 백테스트 엔진
  - 결과 지표 계산

- 통합 테스트
  - 입력값 설정
  - 백테스트 실행
  - Result page 이동
  - PDF 출력 버튼 동작

- 수동 검증
  - 1시간봉, 4시간봉, 일봉
  - 짧은 기간, 긴 기간
  - 거래 0건 케이스
  - API 실패 케이스

완료 기준:

- 빌드가 성공한다.
- 주요 테스트가 통과한다.
- 실제 Upbit API 데이터로 최소 3개 종목 이상 백테스트가 정상 실행된다.

진행 결과:

- Frontend 단위 테스트를 실행했다.
  - `npm run test`
  - 6개 테스트 파일, 33개 테스트가 통과했다.
  - 검증 범위: RMI 계산, 백테스트 엔진, 결과 지표, 한국시간 변환, Backend 캔들 요청 파라미터, localStorage 저장/복원
- Frontend production build를 실행했다.
  - `npm run build`
  - 빌드는 성공했다.
  - Vite chunk size 경고가 있으나 기능 실패는 아니다.
- Backend build를 실행했다.
  - `npm run build`
  - TypeScript 컴파일이 성공했다.
- Prisma schema 검증을 실행했다.
  - `npm run db:validate`
  - schema 검증이 성공했다.
- 운영 검증 스크립트를 실행했다.
  - `npm run verify:ops`
  - Supabase DB 연결, 필수 테이블 접근, 활성 종목, 캔들 수, 중복 캔들 여부를 확인했다.
  - 기존 확인 시점에는 `markets=50`, `candles=6778`, `syncJobs=2`가 조회되었다.
  - 2026-05-15 정책 변경 후 신규 조회/초기 적재 기준은 상위 20개 종목으로 조정한다.
  - interval별 캔들은 `1h=242`, `4h=2997`, `1d=3539`가 조회되었다.
  - `market + interval + timestamp` 기준 중복 캔들은 없었다.
- 오래된 `RUNNING` sync job 1건을 확인하고 `FAILED`로 정리했다.
  - 앞으로 `verify:ops`는 1시간 이상 갱신되지 않은 `RUNNING` sync job을 경고한다.
  - 실패 job은 운영자가 원인을 확인하고 필요하면 해당 interval sync를 재실행한다.
- 실제 Backend Candle API 데이터 조회를 3개 종목 이상으로 확인했다.
  - `KRW-BTC`, `KRW-ETH`, `KRW-XRP`
  - 2026년 5월 1일부터 2026년 5월 10일까지 일봉 데이터 조회를 확인했다.
  - DB에 있는 구간은 `database`, 부족한 구간은 `upbit` source로 응답되는 것을 확인했다.

남은 수동 검증:

- 브라우저에서 1시간봉, 4시간봉, 일봉 각각으로 백테스트를 실행한다.
- 짧은 기간과 긴 기간을 각각 실행한다.
- 거래가 0건인 조건에서도 Result page가 깨지지 않는지 확인한다.
- Backend를 재시작한 뒤 긴 기간 캔들 조회 실패 시 재시도/지연 로직이 적용되는지 확인한다.
- Result page의 PDF 미리보기에서 버튼이 제외되고 요약 지표, 차트, 설정 요약, 거래 내역이 출력되는지 확인한다.

## 19. 작업 분해

### Epic 1. UI 안정화

- 한글 문구 정상화
- 입력 검증 추가
- 로딩/오류/빈 상태 UI 추가
- 반응형 레이아웃 점검

### Epic 2. Upbit 데이터 연동

- 시장 목록 조회
- 거래대금 상위 20개 조회
- 캔들 데이터 조회
- 페이지네이션 조회
- API 오류 처리

### Epic 3. 백테스트 도메인

- RMI 계산 검증
- 매수/매도 신호 검증
- 손절 로직 검증
- 성과 지표 계산 분리

### Epic 4. 결과 리포트

- 요약 지표 카드
- 자산 곡선 차트
- 가격/RMI 차트
- 거래 내역 테이블
- 설정 요약

### Epic 5. PDF 출력

- PDF 출력 버튼
- print CSS
- 출력 제외 영역 처리
- PDF 미리보기 검증

### Epic 6. 테스트와 배포 준비

- 단위 테스트
- 통합 테스트
- 빌드 검증
- 성능 점검
- 투자 유의 문구 추가

## 20. 우선순위

P0:

- 깨진 UI 문구 수정
- 실제 Upbit 캔들 API 연동
- 백테스트 실행 성공
- Result page 결과 표시

P1:

- 거래대금 상위 20개 종목 조회
- 입력 검증
- PDF 출력
- 결과 지표 정확도 테스트

P2:

- 결과 공유/복구
- CSV 다운로드
- 외부 시가총액 API 연동
- 전략 저장

## 21. Render + Supabase 배포 설계

### 21.1 배포 기준

운영 배포는 `Render + Supabase` 조합을 기본 기준으로 한다.

- Render
  - Frontend 정적 사이트 배포
  - Backend API 서버 배포
  - 초기 캔들 적재 job 실행
  - 향후 주기적 최신 캔들 동기화 job 실행

- Supabase
  - PostgreSQL 데이터베이스 제공
  - 캔들 데이터, 종목 목록, sync job 상태 저장
  - 향후 사용자 계정, 전략 저장, 결과 저장 기능 확장 가능

이번 MVP 배포 범위:

- Frontend는 Render Static Site로 배포한다.
- Backend는 Render Web Service로 배포한다.
- DB는 Supabase PostgreSQL을 사용한다.
- Frontend는 Upbit API를 직접 호출하지 않고 Render Backend API만 호출한다.
- Backend는 Supabase DB를 먼저 조회하고, 부족한 캔들 구간만 Upbit API로 보강한다.
- 백테스트 계산은 현재 구현처럼 Frontend에서 수행한다.
- 결과 리포트와 PDF 출력은 브라우저 기반 기능으로 제공한다.
- 초기 캔들 적재는 Render Shell 또는 별도 Background Worker에서 수동 실행한다.

이번 MVP 배포에서 제외하는 범위:

- 사용자 로그인과 계정 관리
- 전략 저장과 백테스트 결과 서버 저장
- 실제 주문 실행 또는 자동매매
- 관리자 페이지
- Render Cron Job 기반 최신 캔들 자동 동기화
- 외부 시가총액 API 기반 정확한 시가총액 상위 20개 선정

배포 완료 기준:

- Render Backend `/health`가 정상 응답한다.
- Render Backend `/health/db`가 Supabase 연결 성공을 반환한다.
- `/api/markets/top?limit=5`가 종목 목록을 반환한다.
- `/api/candles`가 DB 또는 Upbit 보강 데이터를 반환한다.
- Render Frontend에서 종목 드롭다운이 Backend/Supabase 기반으로 채워진다.
- `KRW-BTC`, `KRW-ETH`, `KRW-XRP` 중 최소 3개 종목으로 백테스트를 실행할 수 있다.
- 1시간봉, 4시간봉, 일봉 중 최소 1개 이상은 실제 DB 저장 캔들로 백테스트가 실행된다.
- Result page가 표시되고 PDF 출력 미리보기가 열린다.
- `npm run verify:ops`에서 DB 연결, 테이블 접근, 중복 캔들 검증이 통과한다.

운영 전제:

- `DATABASE_URL`은 Backend에만 설정하고 Frontend에는 노출하지 않는다.
- Render Backend는 `HOST=0.0.0.0`으로 실행한다.
- Render가 주입하는 `PORT`를 사용하고, 운영 환경에서 포트를 고정하지 않는다.
- Backend CORS는 Render Frontend 도메인을 허용해야 한다.
- DB timestamp는 UTC로 저장하고, 사용자 입력과 화면 표시는 한국시간 기준을 유지한다.
- 초기 운영에서는 on-demand 캔들 보강을 기본으로 사용하고, 자동 최신 봉 동기화는 별도 단계에서 추가한다.

### 21.2 전체 배포 구조

```text
User Browser
  -> Render Static Site
    -> React Frontend
      -> Render Backend Web Service
        -> Supabase PostgreSQL
        -> Upbit Open API
```

역할 분리:

- Render Static Site
  - React/Vite Frontend를 제공한다.
  - 사용자의 입력, 백테스트 실행 버튼, Result page, PDF 출력을 담당한다.
  - `VITE_API_BASE_URL`에 설정된 Render Backend만 호출한다.

- Render Backend Web Service
  - `/health`, `/health/db`, `/api/markets/top`, `/api/candles`를 제공한다.
  - Upbit API 호출을 Backend로 집중시킨다.
  - Supabase DB에서 종목과 캔들을 조회한다.
  - 요청 기간에 부족한 캔들이 있으면 Upbit API로 보강하고 DB에 upsert한다.

- Supabase PostgreSQL
  - `markets`, `candles`, `candle_sync_jobs`를 저장한다.
  - 캔들 timestamp는 UTC 기준으로 저장한다.

- Upbit Open API
  - 종목 목록, ticker 거래대금, 캔들 원천 데이터를 제공한다.
  - Frontend에서는 직접 호출하지 않는다.

초기 캔들 적재 흐름:

```text
Render Shell 또는 Render Background Worker
  -> Backend sync command 실행
  -> ticker 20개 선정
  -> 1h/4h/1d 과거 캔들 전체 수집
  -> Supabase PostgreSQL 저장
  -> verify:ops로 적재 상태 검증
```

초기 적재는 최초 1회성 작업이다. Render Cron Job은 주기적 최신 봉 보강을 위한 별도 단계에서 사용한다.

백테스트 실행 흐름:

```text
Frontend
  -> GET /api/markets/top
  -> 종목 드롭다운 표시
  -> 사용자가 백테스트 조건 입력
  -> GET /api/candles
      -> Backend가 Supabase DB 조회
      -> 부족한 구간만 Upbit API로 보강
      -> Supabase DB에 upsert
      -> 시간 오름차순 캔들 반환
  -> Frontend에서 RMI 계산과 백테스트 실행
  -> Result page 표시
  -> 브라우저 PDF 출력
```

백테스트 계산 위치는 MVP에서는 Frontend로 유지한다. Backend는 캔들 데이터 제공과 저장을 담당한다. 향후 데이터량이 커지거나 결과 저장이 필요해지면 백테스트 계산을 Backend로 이동할 수 있다.

최신 캔들 보강 흐름:

```text
현재 MVP
  -> 백테스트 요청 시 on-demand 보강

향후 운영 고도화
  -> Render Cron Job
  -> 최신 1h/4h/1d 캔들만 조회
  -> Supabase DB upsert
  -> verify:ops 또는 별도 모니터링으로 확인
```

이번 배포에서는 on-demand 보강을 기본으로 사용한다. Cron 기반 최신 봉 보강은 별도 `sync latest candles` 명령을 추가한 뒤 진행한다.

### 21.3 Render 서비스 구성

Render에는 최소 2개 서비스를 먼저 구성한다.

1. Backend Web Service
2. Frontend Static Site

초기 캔들 적재는 Backend 배포 후 Render Shell 또는 별도 Background Worker에서 수동 실행한다. 주기적 최신 캔들 동기화 Cron Job은 이번 MVP 배포 범위에서 제외하고, 별도 `sync latest candles` 명령을 만든 뒤 추가한다.

#### 21.3.1 Backend Web Service

목적:

- Frontend가 호출하는 API 서버
- Supabase DB 조회/저장
- Upbit Open API 호출
- 캔들 부족 구간 on-demand 보강

Render 설정:

```text
Service Type: Web Service
Runtime: Node
Root Directory: recovered_make/backend
Build Command: npm install && npm run db:generate && npm run build
Start Command: npm run start
```

Backend 환경변수:

```text
DATABASE_URL=postgresql://...
UPBIT_API_BASE_URL=https://api.upbit.com/v1
CORS_ORIGIN=https://<render-frontend-site>.onrender.com
HOST=0.0.0.0
NODE_ENV=production
```

설정 주의사항:

- `DATABASE_URL`은 Supabase pooler connection string을 권장한다.
- `DATABASE_URL`은 Backend에만 설정하고 Frontend에는 절대 설정하지 않는다.
- `HOST=0.0.0.0`을 설정해야 Render 외부 요청을 받을 수 있다.
- `PORT`는 Render가 자동 주입하므로 환경변수로 고정하지 않는다.
- Frontend 배포 전에는 `CORS_ORIGIN`에 임시로 로컬 origin을 포함할 수 있다.

배포 후 확인 endpoint:

```text
https://<render-backend-service>.onrender.com/health
https://<render-backend-service>.onrender.com/health/db
https://<render-backend-service>.onrender.com/api/markets/top?limit=5
```

DB migration 적용:

```text
npm run db:deploy
```

`db:deploy`는 Render Shell에서 실행하거나, Backend 배포 후 1회성 Job으로 실행한다.

#### 21.3.2 Frontend Static Site

목적:

- React/Vite UI 제공
- BackTest page, Result page 제공
- 브라우저 기반 PDF 출력 제공

Render 설정:

```text
Service Type: Static Site
Root Directory: recovered_make
Build Command: npm install && npm run build
Publish Directory: dist
```

Frontend 환경변수:

```text
VITE_API_BASE_URL=https://<render-backend-service>.onrender.com
```

설정 주의사항:

- Frontend에는 `DATABASE_URL`을 설정하지 않는다.
- `VITE_API_BASE_URL`은 반드시 Render Backend URL로 설정한다.
- Frontend 배포 URL이 확정되면 Backend의 `CORS_ORIGIN`에 해당 URL을 반영하고 Backend를 재배포한다.

배포 후 확인:

- 첫 화면이 정상 로딩되는지 확인한다.
- 종목 드롭다운이 Backend API 기반으로 채워지는지 확인한다.
- 백테스트 실행 후 Result page로 이동하는지 확인한다.
- PDF 출력 버튼으로 브라우저 인쇄 미리보기가 열리는지 확인한다.

#### 21.3.3 Initial Candle Sync 실행 방식

목적:

- 최초 1회 상위 20개 ticker의 `1h`, `4h`, `1d` 과거 캔들을 Supabase DB에 적재한다.

권장 실행 순서:

1. Backend Web Service 배포
2. `npm run db:deploy` 실행
3. `/health/db` 확인
4. 작은 범위 smoke test 실행
5. interval별 전체 적재 실행
6. `npm run verify:ops` 실행

Smoke test:

```text
SYNC_MARKET_LIMIT=1 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=2 npm run sync:candles:initial
npm run verify:ops
```

전체 적재:

```text
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=4h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
```

주의사항:

- `1h` 전체 과거 적재는 데이터량이 크므로 Render 무료/저가 플랜에서는 시간이 오래 걸릴 수 있다.
- 실행 시간이 제한에 걸리면 `SYNC_MARKET_LIMIT` 또는 `SYNC_MAX_PAGES_PER_JOB`을 줄여 나누어 실행한다.
- 실패한 job은 `candle_sync_jobs`에 기록되며, 원인을 확인한 뒤 재실행한다.

#### 21.3.4 Periodic Candle Sync Job

이번 MVP 배포에서는 자동 Cron Job을 바로 구성하지 않는다.

현재 운영 방식:

- 사용자가 백테스트를 요청한다.
- Backend가 DB에 없는 최신/누락 구간만 Upbit API로 보강한다.
- 보강한 캔들을 Supabase DB에 upsert한다.

향후 Cron Job 추가 조건:

- 최신 봉 보강 전용 명령을 별도로 구현한다.
- 예: `npm run sync:candles:latest`
- `sync:candles:initial`은 전체 과거 적재용이므로 Cron Job에 그대로 사용하지 않는다.

향후 Cron 주기 예시:

- 1시간봉: 매시간 이전 봉 확정 후
- 4시간봉: 4시간마다 이전 봉 확정 후
- 일봉: 하루 1회 전일봉 확정 후

### 21.4 Supabase 구성

Supabase는 이번 MVP에서 PostgreSQL DB 용도로만 사용한다. Auth, Storage, Edge Functions, Supabase client SDK는 사용하지 않는다.

프로젝트 기준:

- Supabase Project를 1개 생성한다.
- 개발/초기 운영은 같은 프로젝트를 사용할 수 있다.
- 실제 사용자 공개 후에는 `dev`와 `prod` 프로젝트 분리를 검토한다.
- Region은 한국 사용자 기준으로 가까운 리전을 선택한다.
  - 예: `ap-southeast-2`

연결 방식:

- Backend는 `DATABASE_URL`로 Supabase PostgreSQL에 직접 연결한다.
- Render Backend에서는 Supabase pooler connection string 사용을 권장한다.
- Frontend에는 Supabase URL, anon key, service role key, `DATABASE_URL`을 설정하지 않는다.
- DB 비밀번호에 특수문자가 포함되면 connection string에서 URL encode 여부를 확인한다.

Render Backend 환경변수 예시:

```text
DATABASE_URL=postgresql://...
```

DB 스키마 관리는 Prisma migration으로 수행한다.

```text
cd recovered_make/backend
npm run db:deploy
```

로컬 개발 중 schema를 변경할 때만 다음 명령을 사용한다.

```text
npm run db:migrate
```

현재 Prisma schema 기준 필수 enum:

- `CandleInterval`
  - `ONE_HOUR`
  - `FOUR_HOUR`
  - `ONE_DAY`
- `MarketRankType`
  - `MARKET_CAP`
  - `TRADE_VOLUME`
  - `MANUAL`
- `SyncJobStatus`
  - `PENDING`
  - `RUNNING`
  - `COMPLETED`
  - `FAILED`

현재 Prisma schema 기준 필수 테이블:

#### markets

역할:

- 백테스트 대상 종목 목록 저장
- 현재 MVP에서는 Upbit 거래대금 상위 20개를 저장한다.

주요 컬럼:

- `market`: 예: `KRW-BTC`
- `korean_name`
- `english_name`
- `rank`
- `rank_type`
- `is_active`
- `created_at`
- `updated_at`

제약:

- `market`은 unique이다.

#### candles

역할:

- Upbit 캔들 데이터를 저장한다.
- 백테스트 요청 시 Backend가 먼저 조회하는 캐시/원천 테이블이다.

주요 컬럼:

- `market`
- `interval`: `ONE_HOUR`, `FOUR_HOUR`, `ONE_DAY`
- `timestamp`: UTC 기준 저장
- `open`
- `high`
- `low`
- `close`
- `volume`
- `source`
- `fetched_at`
- `created_at`
- `updated_at`

제약과 인덱스:

- `market + interval + timestamp` unique
- `market + interval + timestamp` index
- `market`은 `markets.market`을 참조한다.
- 종목 삭제 시 관련 캔들은 cascade 삭제된다.

#### candle_sync_jobs

역할:

- 초기 캔들 적재와 interval별 sync 상태를 기록한다.
- 실패 원인과 마지막 동기화 시점을 추적한다.

주요 컬럼:

- `market`
- `interval`
- `status`
- `started_at`
- `finished_at`
- `last_synced_at`
- `error_message`
- `created_at`
- `updated_at`

제약과 인덱스:

- `market + interval` unique
- `status` index
- `market`은 `markets.market`을 참조한다.

초기 데이터 생성 방식:

- `markets`는 `/api/markets/top` 호출 또는 `npm run sync:candles:initial` 실행 시 채워진다.
- `candles`는 `/api/candles` 호출 또는 `npm run sync:candles:initial` 실행 시 upsert된다.
- `candle_sync_jobs`는 초기 적재 job 실행 시 생성 또는 갱신된다.

Supabase Dashboard에서 확인할 항목:

1. Table Editor에서 다음 테이블이 보이는지 확인한다.
   - `markets`
   - `candles`
   - `candle_sync_jobs`
2. SQL Editor에서 중복 캔들이 없는지 확인한다.
   ```sql
   SELECT market, interval, timestamp, COUNT(*)
   FROM candles
   GROUP BY market, interval, timestamp
   HAVING COUNT(*) > 1;
   ```
3. interval별 캔들 수를 확인한다.
   ```sql
   SELECT interval, COUNT(*)
   FROM candles
   GROUP BY interval
   ORDER BY interval;
   ```
4. sync job 상태를 확인한다.
   ```sql
   SELECT status, COUNT(*)
   FROM candle_sync_jobs
   GROUP BY status
   ORDER BY status;
   ```

운영 보안 기준:

- Supabase service role key는 이번 MVP에서 사용하지 않는다.
- service role key가 필요해지는 경우에도 Backend 환경변수에만 저장한다.
- Row Level Security는 Supabase client로 직접 접근할 때 중요하다. 이번 MVP는 Backend가 PostgreSQL에 직접 연결하므로 앱 접근 제어는 Backend API와 CORS에서 처리한다.
- Supabase DB password와 connection string은 문서, Git, Frontend env에 저장하지 않는다.

용량 관리 기준:

- 초기 운영에서는 상위 20개 ticker와 `1h`, `4h`, `1d`만 저장한다.
- `candles` 테이블이 가장 빠르게 증가한다.
- 필요 없는 `candle_sync_jobs` 과거 로그는 향후 보관 기간을 둔다.
- Supabase 무료/저가 플랜에서는 DB 용량과 connection 제한을 주기적으로 확인한다.

검증 명령:

```text
cd recovered_make/backend
npm run verify:ops
```

`verify:ops`에서 확인하는 항목:

- DB 연결
- 필수 테이블 접근
- 활성 종목 조회
- interval별 캔들 수
- 중복 캔들 여부
- 실패 또는 오래된 `RUNNING` sync job 여부

향후 확장 시 추가할 수 있는 테이블:

- `backtest_runs`
- `strategies`
- `users`

### 21.5 환경변수

환경변수는 Render 서비스별로 분리해서 설정한다. Frontend에는 공개되어도 되는 값만 넣고, DB 접속 정보는 반드시 Backend에만 넣는다.

#### 21.5.1 Frontend Static Site 환경변수

Render Static Site에 설정한다.

```text
VITE_API_BASE_URL=https://<render-backend-service>.onrender.com
```

설명:

- Frontend가 호출할 Backend API base URL이다.
- Vite 환경변수이므로 이름이 반드시 `VITE_`로 시작해야 한다.
- 예: `https://rmi-backtest-api.onrender.com`
- 값 끝에 `/`를 붙이지 않는다.

Frontend에 설정하지 않는 값:

- `DATABASE_URL`
- Supabase DB password
- Supabase service role key
- `UPBIT_API_BASE_URL`
- `CORS_ORIGIN`

#### 21.5.2 Backend Web Service 환경변수

Render Web Service에 설정한다.

```text
DATABASE_URL=postgresql://...
UPBIT_API_BASE_URL=https://api.upbit.com/v1
CORS_ORIGIN=https://<render-frontend-site>.onrender.com
HOST=0.0.0.0
NODE_ENV=production
```

필수 여부:

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | 필수 | Supabase PostgreSQL connection string |
| `UPBIT_API_BASE_URL` | 선택 | 기본값은 `https://api.upbit.com/v1` |
| `CORS_ORIGIN` | 필수 | Frontend 허용 origin 목록 |
| `HOST` | 필수 | Render에서는 `0.0.0.0` |
| `NODE_ENV` | 권장 | 운영에서는 `production` |

`DATABASE_URL`:

- Supabase Project의 PostgreSQL connection string을 사용한다.
- Render 운영에서는 pooler connection string 사용을 권장한다.
- 비밀번호에 특수문자가 있으면 URL encode가 필요할 수 있다.
- Frontend에는 절대 노출하지 않는다.

`CORS_ORIGIN`:

- Render Frontend URL을 넣는다.
- 여러 origin은 콤마로 구분한다.
- Frontend 배포 전 임시 테스트가 필요하면 로컬 origin을 함께 넣을 수 있다.

예:

```text
CORS_ORIGIN=https://<render-frontend-site>.onrender.com,http://localhost:5173,http://127.0.0.1:5173
```

운영 공개 후 권장:

```text
CORS_ORIGIN=https://<render-frontend-site>.onrender.com
```

`HOST`:

- 로컬 기본값은 `127.0.0.1`이다.
- Render에서는 외부 요청을 받기 위해 반드시 `0.0.0.0`으로 설정한다.

`PORT`:

- Render가 자동으로 주입한다.
- 운영 환경변수로 직접 설정하지 않는다.
- 로컬 실행 시에는 기본값 `4000`을 사용한다.

#### 21.5.3 Initial Candle Sync 실행용 환경변수

초기 적재 job을 실행할 때만 설정한다.

```text
SYNC_MARKET_LIMIT=20
SYNC_INTERVALS=1d
SYNC_MAX_PAGES_PER_JOB=100
SYNC_PAGE_DELAY_MS=150
SYNC_RETRY_DELAY_MS=1000
```

설명:

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `SYNC_MARKET_LIMIT` | `20` | 적재 대상 종목 수 |
| `SYNC_INTERVALS` | `1h,4h,1d` | 적재할 봉 간격 |
| `SYNC_MAX_PAGES_PER_JOB` | `10000` | job당 최대 페이지 수 |
| `SYNC_PAGE_DELAY_MS` | `150` | Upbit 페이지 요청 간 대기 시간 |
| `SYNC_RETRY_DELAY_MS` | `1000` | Upbit 요청 실패 시 재시도 대기 시간 |

운영 초기 smoke test:

```text
SYNC_MARKET_LIMIT=1 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=2 npm run sync:candles:initial
```

운영 전체 적재 예:

```text
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=4h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
```

주의:

- Render Shell에서 일회성으로 설정하는 값이며, Web Service 상시 환경변수로 둘 필요는 없다.
- 실행 시간이 길면 interval 또는 market limit을 나눠서 실행한다.

#### 21.5.4 검증 스크립트용 환경변수

`npm run verify:candles` 실행 시 선택적으로 사용한다.

```text
VERIFY_CANDLE_MARKET=KRW-BTC
VERIFY_CANDLE_INTERVAL=1d
VERIFY_CANDLE_FROM=2026-05-01T00:00:00.000Z
VERIFY_CANDLE_TO=2026-05-10T00:00:00.000Z
VERIFY_CANDLE_TOLERANCE=0.00000001
```

설명:

- DB에 저장된 캔들과 Upbit 원본 캔들을 같은 timestamp 기준으로 비교한다.
- `VERIFY_CANDLE_INTERVAL`은 `1h`, `4h`, `1d` 중 하나를 사용한다.
- `VERIFY_CANDLE_FROM`, `VERIFY_CANDLE_TO`는 UTC ISO 문자열로 입력한다.

#### 21.5.5 환경변수 보안 기준

- `DATABASE_URL`은 Frontend에 노출하지 않는다.
- `.env` 파일은 Git에 커밋하지 않는다.
- Supabase service role key는 이번 MVP에서 사용하지 않는다.
- 향후 service role key를 사용할 경우 Backend에만 저장한다.
- Frontend는 반드시 Backend API만 호출한다.
- 문서에는 실제 DB 비밀번호, 실제 connection string, 실제 service role key를 기록하지 않는다.

### 21.6 CORS 정책

Backend API는 허용된 Frontend origin에서 온 브라우저 요청만 받는다. 현재 Backend는 `CORS_ORIGIN` 환경변수를 콤마로 분리해 허용 origin 목록을 만든다.

현재 구현 기준:

```ts
CORS_ORIGIN=http://127.0.0.1:5173,http://localhost:5173
```

- `CORS_ORIGIN`은 콤마로 여러 origin을 지정한다.
- 각 origin은 공백 없이 정확한 protocol, host, port를 포함해야 한다.
- 값 끝에 `/`를 붙이지 않는다.
- `origin` 헤더가 없는 서버 간 요청이나 health check는 허용한다.

로컬 개발 허용 예시:

```text
CORS_ORIGIN=http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174,http://localhost:5174
```

Render 배포 초기 허용 예시:

```text
CORS_ORIGIN=https://<render-frontend-site>.onrender.com,http://localhost:5173,http://127.0.0.1:5173
```

운영 공개 후 권장:

```text
CORS_ORIGIN=https://<render-frontend-site>.onrender.com
```

설정 절차:

1. Backend를 먼저 Render Web Service로 배포한다.
2. Frontend 배포 전에는 임시로 로컬 origin을 `CORS_ORIGIN`에 포함해 Backend API를 검증한다.
3. Frontend Static Site를 배포한다.
4. 생성된 Frontend URL을 Backend의 `CORS_ORIGIN`에 추가한다.
5. Backend를 재배포하거나 환경변수 변경을 적용한다.
6. Frontend에서 종목 목록과 캔들 조회가 정상 동작하는지 확인한다.
7. 운영 공개 후 로컬 origin을 제거한다.

검증 방법:

- 브라우저 개발자 도구 Network 탭에서 `/api/markets/top` 요청이 CORS 오류 없이 성공하는지 확인한다.
- 실패 시 Backend Render 환경변수 `CORS_ORIGIN`에 현재 Frontend 주소가 정확히 들어갔는지 확인한다.
- `https://...onrender.com/`처럼 끝에 `/`가 붙어 있으면 제거한다.
- `http`와 `https`는 서로 다른 origin이므로 Render 배포 URL은 반드시 `https://`로 등록한다.

오류 예시:

- `Origin not allowed`
- `Access to fetch ... has been blocked by CORS policy`

보안 기준:

- 운영에서는 `*` 전체 허용을 사용하지 않는다.
- `CORS_ORIGIN`에 실제 서비스 Frontend URL만 남긴다.
- DB 보안은 CORS에 의존하지 않는다. `DATABASE_URL`은 Backend에만 보관한다.

### 21.7 DB 마이그레이션

DB 스키마는 Prisma migration으로 관리한다. Supabase Dashboard에서 직접 테이블을 수정하지 않고, `backend/prisma/schema.prisma`와 `backend/prisma/migrations`를 기준으로 변경 이력을 관리한다.

현재 migration 상태:

```text
backend/prisma/migrations/20260514155122_init_schema
```

현재 migration에 포함된 항목:

- enum
  - `CandleInterval`
  - `MarketRankType`
  - `SyncJobStatus`
- table
  - `markets`
  - `candles`
  - `candle_sync_jobs`
- unique/index
  - `markets.market`
  - `candles.market + candles.interval + candles.timestamp`
  - `candle_sync_jobs.market + candle_sync_jobs.interval`
  - `candle_sync_jobs.status`

#### 21.7.1 로컬 개발 DB에 적용

로컬 개발 또는 Supabase 개발 DB에서 schema를 변경하고 새 migration을 만들 때 사용한다.

```text
cd recovered_make/backend
npm run db:migrate
```

역할:

- `schema.prisma` 변경사항을 감지한다.
- 새 migration 파일을 생성한다.
- 연결된 개발 DB에 migration을 적용한다.
- Prisma Client를 갱신한다.

주의:

- `db:migrate`는 개발용 명령이다.
- migration 이름 입력을 요구할 수 있다.
- 운영 Render 배포 중에는 사용하지 않는다.
- 운영 DB에서 직접 `migrate dev`를 실행하면 의도치 않은 prompt나 shadow database 관련 문제가 생길 수 있다.

#### 21.7.2 운영/Supabase 배포 DB에 적용

Render 또는 운영 Supabase DB에는 이미 생성된 migration만 적용한다.

```text
cd recovered_make/backend
npm run db:deploy
```

역할:

- `backend/prisma/migrations`에 있는 migration을 운영 DB에 순서대로 적용한다.
- 새 migration 파일을 생성하지 않는다.
- prompt 없이 실행되므로 Render Shell 또는 1회성 Job에 적합하다.

실행 위치:

- Render Shell
- Render one-off Job
- 또는 로컬 터미널에서 운영 `DATABASE_URL`을 설정한 뒤 실행

권장:

- Backend Web Service 배포 후 `/health` 확인
- `npm run db:deploy` 실행
- `/health/db` 확인
- `npm run verify:ops` 실행

#### 21.7.3 Prisma Client 생성

```text
npm run db:generate
```

Render Backend Build Command에는 Prisma Client 생성을 포함한다.

```text
npm install && npm run db:generate && npm run build
```

이유:

- `@prisma/client`가 현재 schema 기준 타입과 query client를 생성해야 한다.
- migration 적용 전에도 Backend build가 가능해야 한다.
- migration 적용은 build와 분리해 `db:deploy`에서 처리한다.

#### 21.7.4 배포 전 검증

로컬에서 schema와 build를 먼저 검증한다.

```text
cd recovered_make/backend
npm run db:validate
npm run build
```

검증 기준:

- Prisma schema가 유효하다.
- TypeScript build가 성공한다.
- migration 파일이 Git 또는 배포 소스에 포함되어 있다.

#### 21.7.5 배포 후 검증

운영 DB에 migration을 적용한 뒤 확인한다.

```text
npm run verify:ops
```

또는 Supabase SQL Editor에서 다음을 확인한다.

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('markets', 'candles', 'candle_sync_jobs')
ORDER BY table_name;
```

Prisma migration 적용 이력 확인:

```sql
SELECT migration_name, finished_at
FROM _prisma_migrations
ORDER BY finished_at;
```

#### 21.7.6 실패 시 대응

- `DATABASE_URL` 연결 실패
  - Supabase project가 paused 상태인지 확인한다.
  - pooler connection string host와 password를 확인한다.
  - 비밀번호 특수문자 URL encode 여부를 확인한다.

- migration 적용 중 실패
  - Render 로그와 Supabase `_prisma_migrations` 상태를 확인한다.
  - 운영 DB에서 임의로 테이블을 수정하지 않는다.
  - 실패 원인을 확인한 뒤 migration을 수정하거나 새 migration으로 보정한다.

- 테이블은 있지만 API가 실패
  - `/health/db` 확인
  - `npm run verify:ops` 실행
  - `markets`, `candles`, `candle_sync_jobs` row 수 확인

운영 원칙:

- `db:migrate`는 개발용 명령이다. 새 migration 생성 질문이 뜰 수 있으므로 Render 운영 배포에서는 사용하지 않는다.
- Render/Supabase 운영 DB에는 이미 생성된 migration을 적용하는 `db:deploy`를 사용한다.
- Supabase Dashboard에서 직접 schema를 변경하지 않는다.
- schema 변경은 항상 `schema.prisma -> db:migrate -> migration commit -> db:deploy` 순서로 진행한다.

### 21.8 초기 캔들 적재 운영

초기 적재 job은 서비스 최초 배포 후 한 번 실행하는 과거 캔들 수집 작업이다. 현재 구현 명령은 `npm run sync:candles:initial`이다.

역할:

- Upbit KRW 마켓에서 거래대금 기준 상위 20개 ticker를 선정한다.
- 각 ticker의 `1h`, `4h`, `1d` 과거 캔들을 현재 시점부터 과거 방향으로 수집한다.
- 수집한 캔들을 Supabase `candles` 테이블에 upsert한다.
- ticker와 sync 상태를 각각 `markets`, `candle_sync_jobs`에 기록한다.

현재 구현 특성:

- 기본 대상 종목 수는 `SYNC_MARKET_LIMIT=20`이다.
- 기본 interval은 `SYNC_INTERVALS=1h,4h,1d`이다.
- Upbit candle API는 1회 요청에서 최대 200개 캔들을 반환한다.
- job은 `maxPagesPerJob` 범위 안에서 페이지네이션한다.
- 각 페이지는 `newest`, `oldest`, `saved` 로그를 남긴다.
- `market + interval + timestamp` unique key 기준으로 upsert하므로 재실행해도 중복 저장하지 않는다.
- 실패 시 `candle_sync_jobs.status=FAILED`와 `error_message`를 기록한다.
- 성공 시 `candle_sync_jobs.status=COMPLETED`로 기록한다.

절차:

```text
1. Supabase DB migration 실행
2. Backend API 배포
3. Backend /health/db 확인
4. 작은 범위 smoke test 실행
5. interval별 initial candle sync 실행
6. sync job 완료 상태 확인
7. Frontend 배포
8. 백테스트 실행 검증
```

사전 조건:

- Render Backend 환경변수 `DATABASE_URL`이 설정되어 있다.
- `npm run db:deploy`가 성공했다.
- `/health/db`가 `database: connected`를 반환한다.
- Upbit API 호출이 가능한 네트워크 환경이다.

Smoke test:

```text
SYNC_MARKET_LIMIT=1 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=2 npm run sync:candles:initial
npm run verify:ops
```

목적:

- Supabase 연결 확인
- Upbit market/ticker/candle API 호출 확인
- `markets`, `candles`, `candle_sync_jobs` 저장 확인
- `verify:ops`로 중복 캔들 여부 확인

전체 적재 권장 순서:

```text
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=4h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
npm run verify:ops
```

순서를 `1d -> 4h -> 1h`로 나누는 이유:

- 일봉은 데이터량이 작아 빠르게 전체 흐름을 검증하기 좋다.
- 4시간봉은 중간 데이터량으로 API와 DB 저장 부하를 점검하기 좋다.
- 1시간봉은 데이터량이 가장 크므로 마지막에 실행한다.

실행 환경:

- Render Shell에서 실행할 수 있다.
- 실행 시간이 길거나 Shell 제한이 있으면 Render Background Worker 또는 one-off Job 사용을 검토한다.
- 로컬에서 운영 DB `DATABASE_URL`을 사용해 실행할 수도 있지만, 실제 운영 DB를 건드리므로 주의한다.

진행 로그 확인:

```text
[KRW-BTC 1d] sync started. job=...
[KRW-BTC 1d] page=1, saved=200, newest=..., oldest=...
[KRW-BTC 1d] sync completed. saved=...
Initial candle sync completed.
```

로그 해석:

- `newest`는 해당 페이지에서 가장 최신 캔들 timestamp이다.
- `oldest`는 해당 페이지에서 가장 오래된 캔들 timestamp이다.
- 다음 페이지는 `oldest - 1ms` 기준으로 과거 방향 조회한다.
- 첫 페이지의 `newest`가 현재 날짜보다 조금 과거일 수 있다. 이는 Upbit의 마지막 확정 캔들 기준으로 응답되기 때문이다.

완료 확인:

```text
npm run verify:ops
```

Supabase SQL Editor 확인:

```sql
SELECT interval, COUNT(*)
FROM candles
GROUP BY interval
ORDER BY interval;
```

```sql
SELECT status, COUNT(*)
FROM candle_sync_jobs
GROUP BY status
ORDER BY status;
```

초기 적재 job 요구사항:

- 중간 실패 시 재실행 가능해야 한다.
- 이미 저장된 캔들은 중복 저장하지 않아야 한다.
- Upbit API rate limit을 고려해 요청 간 delay를 둔다.
- job 진행률을 `candle_sync_jobs`에 기록한다.
- 전체 적재 완료 후 `completed` 상태로 표시한다.

실패와 재실행 정책:

- 실패한 interval만 다시 실행한다.
- 이미 저장된 캔들은 upsert로 갱신되므로 중복 저장되지 않는다.
- `RUNNING` 상태가 오래 유지되면 `verify:ops`에서 stale running job 경고를 확인한다.
- 네트워크 또는 Upbit API 오류가 반복되면 `SYNC_PAGE_DELAY_MS`와 `SYNC_RETRY_DELAY_MS`를 늘린다.
- Render 실행 시간이 부족하면 `SYNC_MAX_PAGES_PER_JOB`을 줄이고 여러 번 나누어 실행한다.

주의:

- `sync:candles:initial`은 전체 과거 적재용이다.
- 주기적 최신 봉 보강 Cron에는 그대로 사용하지 않는다.
- Cron 기반 최신 봉 보강은 별도 `sync:candles:latest` 명령을 구현한 뒤 설정한다.
- 초기 적재 전후로 Supabase DB 용량을 확인한다.

### 21.9 최신 캔들 동기화

초기 적재 이후에는 최신 캔들을 계속 보강해야 한다. 다만 이번 MVP 배포에서는 자동 스케줄러를 바로 구성하지 않고, Backend Candle API의 on-demand 보강을 기본 운영 방식으로 사용한다.

#### 21.9.1 현재 MVP 방식: on-demand 보강

현재 구현된 최신 캔들 보강은 `/api/candles` 요청 시점에 동작한다.

```text
Frontend
  -> GET /api/candles?market=...&interval=...&from=...&to=...
  -> Backend가 Supabase candles 조회
  -> 요청 구간 캔들이 충분하면 DB 데이터 반환
  -> 부족하면 Upbit API에서 요청 구간 조회
  -> Supabase candles에 upsert
  -> 다시 DB에서 조회해 시간 오름차순으로 반환
```

현재 구현 기준:

- `hasEnoughCandles()`가 요청 기간의 예상 캔들 수 대비 95% 이상 존재하면 DB 데이터만 반환한다.
- 캔들이 부족하면 Upbit API를 페이지네이션으로 조회한다.
- Upbit 요청은 최대 200페이지까지 수행한다.
- Upbit 요청 실패 시 최대 3회 재시도한다.
- 페이지 요청 사이에는 120ms 대기한다.
- 저장은 `market + interval + timestamp` unique key 기준 upsert로 처리한다.

장점:

- 별도 Cron Job 없이도 사용자가 요청한 구간은 자동으로 보강된다.
- 초기 운영 비용과 구현 복잡도가 낮다.
- 누락 구간이 있어도 백테스트 요청 과정에서 자연스럽게 채워진다.

한계:

- 첫 사용자가 긴 기간을 요청하면 응답 시간이 길어질 수 있다.
- 사용자가 요청하지 않은 종목/interval은 최신화되지 않는다.
- 최신 진행 중 캔들과 확정 캔들을 구분하는 세밀한 TTL 정책은 아직 없다.
- API 요청이 몰리면 Upbit rate limit 영향을 받을 수 있다.

운영 기준:

- 초기 배포 직후에는 on-demand 보강을 기본값으로 사용한다.
- 자주 사용하는 종목과 interval은 초기 적재 job으로 먼저 채워둔다.
- 긴 기간 1시간봉 조회가 느리면 기간을 줄이거나 초기 적재 범위를 늘린다.
- `verify:ops`로 중복 캔들 및 sync job 상태를 주기적으로 확인한다.

#### 21.9.2 향후 방식: Render Cron 기반 최신 봉 보강

운영 트래픽이 생기면 최신 봉만 주기적으로 보강하는 전용 command를 추가한다.

예정 command:

```text
npm run sync:candles:latest
```

주의:

- 현재 이 command는 아직 구현되어 있지 않다.
- `npm run sync:candles:initial`은 전체 과거 적재용이므로 Cron Job에 그대로 사용하지 않는다.
- Cron Job은 "최신 일부 구간만" 조회하도록 별도 구현해야 한다.

향후 latest sync 동작:

```text
Render Cron Job
  -> active markets 조회
  -> interval별 마지막 저장 timestamp 조회
  -> 마지막 저장 시점 이후의 확정 캔들만 Upbit 조회
  -> candles upsert
  -> sync 상태와 저장 건수 로그 기록
```

권장 Cron 주기:

- 1시간봉: 매시간 5~10분 뒤
- 4시간봉: 4시간마다 5~10분 뒤
- 일봉: 매일 오전 9시 5~10분 뒤 또는 운영 정책에 맞춘 고정 시각

한국시간 기준:

- 사용자 화면과 입력은 한국시간 기준이다.
- DB timestamp는 UTC 기준으로 저장한다.
- Cron 실행 시각은 Render의 timezone 설정과 무관하게 UTC 기준으로 동작할 수 있으므로, 확정 봉 계산은 코드에서 명시적으로 처리한다.

#### 21.9.3 최신 캔들 검증

API 응답 source 확인:

```text
GET /api/candles?market=KRW-BTC&interval=1d&from=2026-05-01T00:00:00.000Z&to=2026-05-10T00:00:00.000Z
```

- `source=database`: 요청 구간이 DB에서 충분히 조회되었다.
- `source=upbit`: 부족 구간을 Upbit에서 보강했다.

DB 저장 상태 확인:

```sql
SELECT market, interval, MAX(timestamp) AS latest_timestamp, COUNT(*) AS candle_count
FROM candles
GROUP BY market, interval
ORDER BY market, interval;
```

최근 적재 누락 확인:

```sql
SELECT market, interval, MAX(timestamp) AS latest_timestamp
FROM candles
WHERE market IN ('KRW-BTC', 'KRW-ETH', 'KRW-XRP')
GROUP BY market, interval
ORDER BY market, interval;
```

중복 캔들 확인:

```sql
SELECT market, interval, timestamp, COUNT(*)
FROM candles
GROUP BY market, interval, timestamp
HAVING COUNT(*) > 1;
```

#### 21.9.4 장애 대응

- `/api/candles`가 503을 반환한다.
  - Backend 로그에서 Upbit API 실패 여부를 확인한다.
  - Supabase 연결 상태를 `/health/db`로 확인한다.
  - 요청 기간이 지나치게 긴 경우 기간을 줄여 재시도한다.

- 최신 캔들이 누락되어 보인다.
  - 같은 구간을 `/api/candles`로 직접 호출해 on-demand 보강을 유도한다.
  - `source=upbit` 응답 후 Supabase `candles` row가 증가했는지 확인한다.

- 응답이 느리다.
  - 초기 적재 범위를 늘려 DB hit 비율을 높인다.
  - 자주 사용하는 interval부터 사전 적재한다.
  - 향후 `sync:candles:latest` Cron Job을 구현한다.

### 21.10 배포 순서

현재 구현 기준으로는 다음 순서로 배포한다.

1. 배포 전 로컬 검증
   - Frontend: `npm run test`, `npm run build`
   - Backend: `cd backend`, `npm run build`, `npm run db:validate`
   - 운영 검증: `npm run verify:ops`

2. Supabase 확인
   - Supabase 프로젝트가 실행 중인지 확인한다.
   - Render Backend에서 사용할 `DATABASE_URL`을 준비한다.
   - 운영에서는 Supabase pooler connection string 사용을 권장한다.
   - DB 비밀번호에 특수문자가 있으면 connection string에서 URL encode 여부를 확인한다.

3. Backend를 Render Web Service로 먼저 배포한다.
   - Root Directory: `recovered_make/backend`
   - Build Command:
     ```text
     npm install && npm run db:generate && npm run build
     ```
   - Start Command:
     ```text
     npm run start
     ```
   - Runtime: Node.js

4. Backend Render 환경변수를 설정한다.
   ```text
   DATABASE_URL=postgresql://...
   UPBIT_API_BASE_URL=https://api.upbit.com/v1
   CORS_ORIGIN=https://<render-frontend-site>.onrender.com
   HOST=0.0.0.0
   NODE_ENV=production
   ```
   - Render는 외부 요청을 받기 위해 `HOST=0.0.0.0` 설정이 필요하다.
   - `PORT`는 Render가 자동 주입하므로 별도로 고정하지 않는다.
   - Frontend 배포 전이면 임시로 로컬 개발 origin을 함께 넣어 테스트할 수 있다.

5. Backend 배포 후 DB migration을 적용한다.
   - Render Shell 또는 Render Job에서 실행한다.
   ```text
   npm run db:deploy
   ```
   - `db:deploy` 완료 후 다음 endpoint를 확인한다.
   ```text
   https://<render-backend-service>.onrender.com/health
   https://<render-backend-service>.onrender.com/health/db
   ```

6. Backend API를 검증한다.
   ```text
   https://<render-backend-service>.onrender.com/api/markets/top?limit=5
   https://<render-backend-service>.onrender.com/api/candles?market=KRW-BTC&interval=1d&from=2026-05-01T00:00:00.000Z&to=2026-05-10T00:00:00.000Z
   ```
   - `/api/markets/top` 호출 시 `markets` 테이블이 채워져야 한다.
   - `/api/candles` 호출 시 부족한 캔들 구간은 Upbit에서 조회 후 DB에 저장되어야 한다.

7. Frontend를 Render Static Site로 배포한다.
   - Root Directory: `recovered_make`
   - Build Command:
     ```text
     npm install && npm run build
     ```
   - Publish Directory:
     ```text
     dist
     ```
   - 환경변수:
     ```text
     VITE_API_BASE_URL=https://<render-backend-service>.onrender.com
     ```

8. Frontend 배포 URL을 Backend CORS에 반영한다.
   - Backend Render 환경변수 `CORS_ORIGIN`에 실제 Frontend URL을 설정한다.
   - 여러 origin을 허용할 경우 콤마로 구분한다.
   ```text
   CORS_ORIGIN=https://<render-frontend-site>.onrender.com,http://localhost:5173,http://127.0.0.1:5173
   ```
   - 운영 공개 후에는 로컬 origin을 제거해도 된다.

9. 초기 캔들 적재를 실행한다.
   - Render Shell 또는 별도 Background Worker에서 실행한다.
   - 처음에는 작은 범위로 smoke test를 먼저 실행한다.
   ```text
   SYNC_MARKET_LIMIT=1 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=2 npm run sync:candles:initial
   npm run verify:ops
   ```
   - smoke test가 성공하면 전체 적재를 interval별로 나누어 실행한다.
   ```text
   SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1d SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
   SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=4h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
   SYNC_MARKET_LIMIT=20 SYNC_INTERVALS=1h SYNC_MAX_PAGES_PER_JOB=100 npm run sync:candles:initial
   ```
   - 1시간봉 전체 과거 적재는 데이터량과 실행 시간이 크므로 Render 무료/저가 플랜에서는 끊어서 실행하거나 Background Worker 사용을 검토한다.

10. 배포 후 운영 검증을 실행한다.
    ```text
    npm run verify:ops
    ```
    - DB 연결
    - `markets`, `candles`, `candle_sync_jobs` 접근
    - interval별 캔들 수
    - 중복 캔들 여부
    - 실패 또는 오래된 `RUNNING` sync job 여부

11. 브라우저에서 실제 백테스트를 검증한다.
    - 종목 드롭다운이 Backend/Supabase 기반으로 채워지는지 확인한다.
    - `KRW-BTC`, `KRW-ETH`, `KRW-XRP` 최소 3개 종목을 실행한다.
    - 1시간봉, 4시간봉, 일봉을 각각 확인한다.
    - 짧은 기간과 긴 기간을 각각 확인한다.
    - Result page와 PDF 출력 미리보기를 확인한다.

12. 최신 캔들 동기화 정책을 결정한다.
    - 현재 구현은 백테스트 요청 시 Backend가 부족 구간을 Upbit API로 보강하는 on-demand 방식이다.
    - Render Cron Job으로 자동 보강하려면 별도의 `sync latest candles` 명령을 추가한 뒤 설정한다.
    - `sync:candles:initial`은 전체 과거 적재용이므로 주기적 Cron에 그대로 사용하는 것은 권장하지 않는다.

### 21.11 운영 모니터링

확인해야 할 항목:

- Backend API 응답 시간
- Upbit API 실패율
- 캔들 sync job 성공/실패 상태
- Supabase DB 용량
- `candles` 테이블 row 수 증가량
- 백테스트 요청 시 DB hit 비율
- Render 서비스 재시작 여부

초기 운영에서는 최소한 다음 로그를 남긴다.

- API 요청 로그
- Upbit API 호출 로그
- sync job 시작/종료 로그
- sync job 실패 로그
- DB upsert 건수

### 21.12 비용 고려사항

초기 MVP는 Render와 Supabase의 무료 또는 저가 플랜으로 시작할 수 있다.

비용이 증가할 수 있는 지점:

- Supabase DB 저장 용량 증가
- Render Backend Web Service 유료 인스턴스 사용
- Render Cron/Worker 사용
- 캔들 데이터 초기 적재 중 API 호출량 증가

비용 최적화:

- ticker 20개만 우선 적재한다.
- `1h`, `4h`, `1d`만 저장한다.
- 중복 캔들은 upsert로 방지한다.
- 백테스트 요청 시 DB hit를 우선한다.
- 필요 없는 오래된 sync job 로그는 보관 기간을 둔다.

