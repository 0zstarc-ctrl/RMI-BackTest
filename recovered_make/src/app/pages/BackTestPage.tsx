import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Activity, AlertCircle, Play } from "lucide-react";
import { Coin, fetchCandleData, getTopCoins } from "../services/upbit";
import { BacktestConfig, CandleInterval, SignalType, runBacktest } from "../utils/backtest";
import { loadLastBacktestSettings, saveLastBacktestResult, saveLastBacktestSettings } from "../utils/persistence";
import { addMonthsToDateInput, dateInputToKstEndDate, dateInputToKstStartDate, getTodayDateInputKst } from "../utils/time";

export function BackTestPage() {
  const navigate = useNavigate();
  const todayKst = getTodayDateInputKst();
  const [savedSettings] = useState(() => loadLastBacktestSettings());
  const [coins, setCoins] = useState<Coin[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState(savedSettings?.selectedSymbol ?? "");
  const [isCoinsLoading, setIsCoinsLoading] = useState(true);
  const [interval, setInterval] = useState<CandleInterval>(savedSettings?.interval ?? "1d");
  const [startDate, setStartDate] = useState(() => savedSettings?.startDate ?? addMonthsToDateInput(todayKst, -1));
  const [endDate, setEndDate] = useState(() => savedSettings?.endDate ?? todayKst);
  const [rmiPeriod, setRmiPeriod] = useState(savedSettings?.rmiPeriod ?? 14);
  const [rmiMomentum, setRmiMomentum] = useState(savedSettings?.rmiMomentum ?? 5);
  const [overbought, setOverbought] = useState(savedSettings?.overbought ?? 75);
  const [oversold, setOversold] = useState(savedSettings?.oversold ?? 15);
  const [buyCondition, setBuyCondition] = useState(savedSettings?.buyCondition ?? 15);
  const [buySignalType, setBuySignalType] = useState<SignalType>(savedSettings?.buySignalType ?? "enter");
  const [sellCondition, setSellCondition] = useState(savedSettings?.sellCondition ?? 75);
  const [sellSignalType, setSellSignalType] = useState<SignalType>(savedSettings?.sellSignalType ?? "enter");
  const [stopLoss, setStopLoss] = useState(savedSettings?.stopLoss ?? 5);
  const [slippage, setSlippage] = useState(savedSettings?.slippage ?? 0.1);
  const [fee, setFee] = useState(savedSettings?.fee ?? 0.05);
  const [initialCapital, setInitialCapital] = useState(savedSettings?.initialCapital ?? 10_000_000);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCoins() {
      setIsCoinsLoading(true);
      setErrorMessage("");

      try {
        const nextCoins = await getTopCoins(20);
        if (cancelled) return;

        setCoins(nextCoins);
        setSelectedSymbol((current) => current || nextCoins[0]?.symbol || "");
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : "종목 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsCoinsLoading(false);
        }
      }
    }

    void loadCoins();

    return () => {
      cancelled = true;
    };
  }, []);

  const validationMessage = validateBacktestForm({
    selectedSymbol,
    startDate,
    endDate,
    rmiPeriod,
    rmiMomentum,
    overbought,
    oversold,
    buyCondition,
    sellCondition,
    stopLoss,
    slippage,
    fee,
    initialCapital,
  });
  const canSubmit = !isLoading && !isCoinsLoading && !validationMessage;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage("");

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsLoading(true);

    try {
      const config: BacktestConfig = {
        symbol: selectedSymbol,
        startDate: dateInputToKstStartDate(startDate),
        endDate: dateInputToKstEndDate(endDate),
        interval,
        rmi: {
          period: rmiPeriod,
          momentum: rmiMomentum,
          overbought,
          oversold,
        },
        buyCondition,
        buySignalType,
        sellCondition,
        sellSignalType,
        stopLoss,
        slippage,
        fee,
        initialCapital,
      };
      saveLastBacktestSettings({
        selectedSymbol,
        interval,
        startDate,
        endDate,
        rmiPeriod,
        rmiMomentum,
        overbought,
        oversold,
        buyCondition,
        buySignalType,
        sellCondition,
        sellSignalType,
        stopLoss,
        slippage,
        fee,
        initialCapital,
      });
      const candleData = await fetchCandleData(config.symbol, config.startDate, config.endDate, config.interval);
      if (candleData.length < config.rmi.period + config.rmi.momentum + 1) {
        throw new Error("선택한 기간의 캔들 데이터가 부족합니다. 기간을 늘리거나 RMI 값을 낮춰주세요.");
      }

      const result = runBacktest(candleData, config);
      saveLastBacktestResult(result);
      navigate("/result", { state: { result } });
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "백테스트 실행 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="container">
        <header className="page-header">
          <div>
            <h1 className="page-title">RMI 백테스트 시스템</h1>
            <p className="page-subtitle">Upbit KRW 마켓 종목을 기준으로 RMI 전략을 시뮬레이션합니다.</p>
          </div>
          <Activity size={32} color="#2563eb" />
        </header>

        <form className="grid grid-2" onSubmit={handleSubmit}>
          {(errorMessage || validationMessage) && (
            <div className="notice notice-error grid-span-2" role="alert">
              <AlertCircle size={18} />
              <span>{errorMessage || validationMessage}</span>
            </div>
          )}

          <section className="card stack">
            <h2 className="section-title">백테스트 대상</h2>
            <div className="field">
              <label htmlFor="symbol">종목 선택</label>
              <select
                id="symbol"
                value={selectedSymbol}
                onChange={(event) => setSelectedSymbol(event.target.value)}
                disabled={isCoinsLoading || coins.length === 0}
              >
                {isCoinsLoading && <option>종목 목록을 불러오는 중입니다</option>}
                {!isCoinsLoading && coins.length === 0 && <option>조회 가능한 종목이 없습니다</option>}
                {coins.map((coin) => (
                  <option key={coin.symbol} value={coin.symbol}>
                    {coin.koreanName} ({coin.englishName}) - #{coin.rank}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-3">
              <div className="field">
                <label htmlFor="interval">봉 간격</label>
                <select
                  id="interval"
                  value={interval}
                  onChange={(event) => setInterval(event.target.value as CandleInterval)}
                >
                  <option value="1h">1시간봉</option>
                  <option value="4h">4시간봉</option>
                  <option value="1d">일봉</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="start">시작일</label>
                <input id="start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="end">종료일</label>
                <input id="end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="capital">초기 자본</label>
              <input
                id="capital"
                type="number"
                min="100000"
                step="100000"
                value={initialCapital}
                onChange={(event) => setInitialCapital(Number(event.target.value))}
              />
            </div>
          </section>

          <section className="card stack">
            <h2 className="section-title">RMI 지표 설정</h2>
            <div className="grid grid-2">
              <NumberField label="Period" value={rmiPeriod} min={2} max={100} onChange={setRmiPeriod} helpText="RMI 평균 계산 기간" />
              <NumberField label="Momentum" value={rmiMomentum} min={1} max={50} onChange={setRmiMomentum} helpText="몇 봉 전 종가와 비교할지 설정" />
              <NumberField label="Overbought" value={overbought} min={1} max={100} onChange={setOverbought} />
              <NumberField label="Oversold" value={oversold} min={1} max={100} onChange={setOversold} />
            </div>
          </section>

          <section className="card stack">
            <h2 className="section-title">매수/매도 조건</h2>
            <div className="grid grid-2">
              <NumberField label="매수 RMI 기준" value={buyCondition} min={1} max={100} onChange={setBuyCondition} />
              <SignalField label="매수 신호" value={buySignalType} onChange={setBuySignalType} />
              <NumberField label="매도 RMI 기준" value={sellCondition} min={1} max={100} onChange={setSellCondition} />
              <SignalField label="매도 신호" value={sellSignalType} onChange={setSellSignalType} />
            </div>
          </section>

          <section className="card stack">
            <h2 className="section-title">거래 비용과 리스크</h2>
            <div className="grid grid-3">
              <NumberField label="손절(%)" value={stopLoss} min={0.1} max={100} step={0.1} onChange={setStopLoss} />
              <NumberField label="슬리피지(%)" value={slippage} min={0} max={10} step={0.01} onChange={setSlippage} />
              <NumberField label="수수료(%)" value={fee} min={0} max={5} step={0.01} onChange={setFee} />
            </div>
            <button className="button button-primary" type="submit" disabled={!canSubmit}>
              <Play size={18} />
              {isLoading ? "백테스트 실행 중" : "백테스트 실행"}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  helpText?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <input
        type="number"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
      {props.helpText && <span className="help-text">{props.helpText}</span>}
    </div>
  );
}

function SignalField(props: { label: string; value: SignalType; onChange: (value: SignalType) => void }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <select value={props.value} onChange={(event) => props.onChange(event.target.value as SignalType)}>
        <option value="break">기준선 돌파</option>
        <option value="enter">구간 진입</option>
      </select>
    </div>
  );
}

function validateBacktestForm(values: {
  selectedSymbol: string;
  startDate: string;
  endDate: string;
  rmiPeriod: number;
  rmiMomentum: number;
  overbought: number;
  oversold: number;
  buyCondition: number;
  sellCondition: number;
  stopLoss: number;
  slippage: number;
  fee: number;
  initialCapital: number;
}) {
  if (!values.selectedSymbol) {
    return "백테스트할 종목을 선택해주세요.";
  }
  if (!values.startDate || !values.endDate) {
    return "諛깊뀒?ㅽ듃 湲곌컙???щ컮瑜닿쾶 ?낅젰?댁＜?몄슂.";
  }

  const start = dateInputToKstStartDate(values.startDate).getTime();
  const end = dateInputToKstEndDate(values.endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "백테스트 기간을 올바르게 입력해주세요.";
  }
  if (start >= end) {
    return "시작일은 종료일보다 이전이어야 합니다.";
  }
  if (values.initialCapital <= 0) {
    return "초기 자본은 0보다 커야 합니다.";
  }
  if (values.rmiPeriod < 2 || values.rmiMomentum < 1) {
    return "RMI Period는 2 이상, Momentum은 1 이상이어야 합니다.";
  }
  if (!isRmiRange(values.overbought) || !isRmiRange(values.oversold) || !isRmiRange(values.buyCondition) || !isRmiRange(values.sellCondition)) {
    return "RMI 기준값은 1에서 100 사이여야 합니다.";
  }
  if (values.oversold >= values.overbought) {
    return "Oversold 값은 Overbought 값보다 작아야 합니다.";
  }
  if (values.stopLoss <= 0 || values.slippage < 0 || values.fee < 0) {
    return "손절률은 0보다 커야 하며, 슬리피지와 수수료는 0 이상이어야 합니다.";
  }

  return "";
}

function isRmiRange(value: number) {
  return value >= 1 && value <= 100;
}
