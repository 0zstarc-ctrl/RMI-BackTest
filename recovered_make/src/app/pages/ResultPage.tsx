import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowDownUp, ArrowLeft, DollarSign, FileDown, TrendingDown, TrendingUp } from "lucide-react";
import { BacktestResult, Trade } from "../utils/backtest";
import { loadLastBacktestResult } from "../utils/persistence";
import { formatKstDate, formatKstDateTime, formatKstMonthDay } from "../utils/time";

type SortDirection = "asc" | "desc";

export function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [storedResult] = useState(() => loadLastBacktestResult());
  const result = (location.state?.result as BacktestResult | undefined) ?? storedResult ?? undefined;
  const [tradeSort, setTradeSort] = useState<SortDirection>("asc");

  const sortedTrades = useMemo(() => {
    if (!result) return [];

    return [...result.trades].sort((a, b) => {
      return tradeSort === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });
  }, [result, tradeSort]);

  if (!result) {
    return (
      <main className="app-shell">
        <div className="container">
          <section className="card stack">
            <h1 className="page-title">백테스트 결과가 없습니다</h1>
            <p className="page-subtitle">백테스트를 먼저 실행하면 결과 리포트를 확인할 수 있습니다.</p>
            <button className="button button-primary" onClick={() => navigate("/")}>
              백테스트 페이지로 이동
            </button>
          </section>
        </div>
      </main>
    );
  }

  const equityData = result.timestamps.map((timestamp, index) => ({
    timestamp,
    date: formatKstMonthDay(timestamp),
    dateTime: formatKstDateTime(timestamp),
    equity: Math.round(result.equity[index]),
    initial: result.config.initialCapital,
  }));

  const tradeByTimestamp = buildTradeMarkerMap(result.trades);
  const priceRmiData = result.candleData.map((candle, index) => {
    const marker = tradeByTimestamp.get(candle.timestamp);

    return {
      timestamp: candle.timestamp,
      date: formatKstMonthDay(candle.timestamp),
      dateTime: formatKstDateTime(candle.timestamp),
      price: Math.round(candle.close),
      rmi: Math.round(result.rmiValues[index] * 10) / 10,
      overbought: result.config.rmi.overbought,
      oversold: result.config.rmi.oversold,
      buyPrice: marker?.buyPrice,
      sellPrice: marker?.sellPrice,
    };
  });

  return (
    <main className="app-shell">
      <div className="container">
        <header className="page-header">
          <div>
            <h1 className="page-title">백테스트 결과 리포트</h1>
            <p className="page-subtitle">
              {result.config.symbol} / {intervalLabel(result.config.interval)} / {formatKstDate(result.config.startDate)} ~ {formatKstDate(result.config.endDate)}
            </p>
          </div>
          <div className="toolbar no-print">
            <button className="button button-ghost" onClick={() => navigate("/")}>
              <ArrowLeft size={18} />
              백테스트로 돌아가기
            </button>
            <button className="button button-ghost" onClick={() => window.print()}>
              <FileDown size={18} />
              PDF 출력
            </button>
          </div>
        </header>

        <section className="grid grid-4">
          <Metric
            icon={<DollarSign size={20} />}
            label="총 손익"
            value={`${signed(Math.round(result.totalReturn).toLocaleString())}원`}
            sub={`${signed(result.totalReturnPercent.toFixed(2))}%`}
            tone={result.totalReturn >= 0 ? "positive" : "negative"}
          />
          <Metric icon={<Activity size={20} />} label="거래 횟수" value={`${result.numberOfTrades}회`} sub={`승률 ${result.winRate.toFixed(1)}%`} />
          <Metric icon={<TrendingUp size={20} />} label="최종 자산" value={`${Math.round(result.finalCapital).toLocaleString()}원`} sub="마지막 봉 평가 기준" />
          <Metric icon={<TrendingDown size={20} />} label="최대 낙폭" value={`${result.maxDrawdown.toFixed(2)}%`} sub={`Sharpe ${result.sharpeRatio.toFixed(2)}`} tone="negative" />
        </section>

        <section className="card report-section">
          <h2 className="section-title">자산 곡선</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 10000)}만`} />
                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.dateTime ?? ""} formatter={(value) => `${Number(value).toLocaleString()}원`} />
                <Legend />
                <Line type="monotone" dataKey="equity" name="평가 자산" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="initial" name="초기 자본" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card report-section">
          <h2 className="section-title">가격과 RMI</h2>
          <div className="chart-box chart-box-tall">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={priceRmiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="price" orientation="left" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                <YAxis yAxisId="rmi" orientation="right" domain={[0, 100]} />
                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.dateTime ?? ""} />
                <Legend />
                <Area yAxisId="price" type="monotone" dataKey="price" name="종가" fill="#dbeafe" stroke="#2563eb" />
                <Line yAxisId="rmi" type="monotone" dataKey="rmi" name="RMI" stroke="#f97316" dot={false} />
                <Line yAxisId="rmi" type="monotone" dataKey="overbought" name="과매수" stroke="#dc2626" strokeDasharray="4 4" dot={false} />
                <Line yAxisId="rmi" type="monotone" dataKey="oversold" name="과매도" stroke="#16a34a" strokeDasharray="4 4" dot={false} />
                <Scatter yAxisId="price" dataKey="buyPrice" name="매수" fill="#16a34a" shape="triangle" />
                <Scatter yAxisId="price" dataKey="sellPrice" name="매도/손절" fill="#dc2626" shape="diamond" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card report-section">
          <h2 className="section-title">백테스트 설정</h2>
          <div className="grid grid-4">
            <Info label="종목" value={result.config.symbol} />
            <Info label="기간" value={`${formatKstDate(result.config.startDate)} ~ ${formatKstDate(result.config.endDate)}`} />
            <Info label="봉 간격" value={intervalLabel(result.config.interval)} />
            <Info label="RMI" value={`Period ${result.config.rmi.period} / Momentum ${result.config.rmi.momentum}`} />
            <Info label="매수/매도 기준" value={`${result.config.buyCondition} / ${result.config.sellCondition}`} />
            <Info label="손절" value={`${result.config.stopLoss}%`} />
            <Info label="비용" value={`수수료 ${result.config.fee}%, 슬리피지 ${result.config.slippage}%`} />
            <Info label="초기 자본" value={`${result.config.initialCapital.toLocaleString()}원`} />
          </div>
        </section>

        <section className="card report-section">
          <div className="section-header">
            <h2 className="section-title">거래 내역</h2>
            <button className="button button-ghost no-print" onClick={() => setTradeSort((current) => (current === "asc" ? "desc" : "asc"))}>
              <ArrowDownUp size={16} />
              {tradeSort === "asc" ? "오래된순" : "최신순"}
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>일시</th>
                  <th>구분</th>
                  <th>가격</th>
                  <th>수량</th>
                  <th>RMI</th>
                  <th>사유</th>
                  <th>실현 손익</th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      설정한 조건에서 발생한 거래가 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedTrades.map((trade, index) => (
                    <TradeRow key={`${trade.timestamp}-${trade.type}-${index}`} trade={trade} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  return (
    <tr>
      <td>{formatKstDateTime(trade.timestamp)}</td>
      <td className={trade.type === "BUY" ? "positive" : "negative"}>{trade.type === "BUY" ? "매수" : "매도"}</td>
      <td>{Math.round(trade.price).toLocaleString()}원</td>
      <td>{trade.amount.toFixed(6)}</td>
      <td>{trade.rmi.toFixed(1)}</td>
      <td>{trade.reason}</td>
      <td className={trade.pnl === undefined ? "" : trade.pnl >= 0 ? "positive" : "negative"}>
        {trade.pnl === undefined ? "-" : `${Math.round(trade.pnl).toLocaleString()}원`}
      </td>
    </tr>
  );
}

function Metric(props: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: "positive" | "negative" }) {
  return (
    <div className="card metric">
      <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#64748b" }}>
        {props.icon}
        <span className="metric-label">{props.label}</span>
      </div>
      <div className={`metric-value ${props.tone ?? ""}`}>{props.value}</div>
      <div className={props.tone ?? ""}>{props.sub}</div>
    </div>
  );
}

function Info(props: { label: string; value: string }) {
  return (
    <div>
      <div className="metric-label">{props.label}</div>
      <div style={{ marginTop: 6, fontWeight: 700 }}>{props.value}</div>
    </div>
  );
}

function buildTradeMarkerMap(trades: Trade[]) {
  const byTimestamp = new Map<number, { buyPrice?: number; sellPrice?: number }>();

  for (const trade of trades) {
    const marker = byTimestamp.get(trade.timestamp) ?? {};
    if (trade.type === "BUY") {
      marker.buyPrice = trade.price;
    } else {
      marker.sellPrice = trade.price;
    }
    byTimestamp.set(trade.timestamp, marker);
  }

  return byTimestamp;
}

function intervalLabel(interval: string) {
  if (interval === "1h") return "1시간봉";
  if (interval === "4h") return "4시간봉";
  return "일봉";
}

function signed(value: string) {
  return value.startsWith("-") ? value : `+${value}`;
}
