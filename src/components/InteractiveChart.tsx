import { useState, useEffect } from "react";
import { ChartPoint } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Eye, Calendar, Award, RefreshCw, BarChart2 } from "lucide-react";

interface InteractiveChartProps {
  ticker: string;
}

export default function InteractiveChart({ ticker }: InteractiveChartProps) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [interval, setInterval] = useState("1d");
  const [range, setRange] = useState("3mo");
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<"area" | "line">("area");

  const periods = [
    { label: "1 Min", interval: "1m", range: "1d" },
    { label: "5 Min", interval: "5m", range: "5d" },
    { label: "15 Min", interval: "15m", range: "5d" },
    { label: "1 Hora", interval: "1h", range: "1mo" },
    { label: "Diário", interval: "1d", range: "3mo" },
    { label: "Semanal", interval: "1wk", range: "1y" },
    { label: "Mensal", interval: "1mo", range: "max" },
  ];

  const fetchChartData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stocks/${ticker}/chart?interval=${interval}&range=${range}`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [ticker, interval, range]);

  const handlePeriodChange = (p: { interval: string; range: string }) => {
    setInterval(p.interval);
    setRange(p.range);
  };

  // Calculate high, low, and average for metadata display
  const prices = chartData.map((d) => d.close).filter((p) => p !== null && p > 0);
  const highPrice = prices.length ? Math.max(...prices) : 0;
  const lowPrice = prices.length ? Math.min(...prices) : 0;
  const avgPrice = prices.length ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
  const lastPrice = prices.length ? prices[prices.length - 1] : 0;
  const startPrice = prices.length ? prices[0] : 0;
  const periodPerformance = startPrice > 0 ? ((lastPrice - startPrice) / startPrice) * 100 : 0;

  const isPositive = periodPerformance >= 0;
  const strokeColor = isPositive ? "#10b981" : "#ef4444";
  const fillColor = isPositive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#121212] border border-[#222] p-3 rounded-lg shadow-2xl font-mono text-xs text-gray-300">
          <p className="text-gray-400 mb-1 font-semibold">{data.time}</p>
          <p className="text-white">Fechamento: <span className="text-emerald-400 font-bold">R$ {data.close.toFixed(2)}</span></p>
          {data.open && <p>Abertura: R$ {data.open.toFixed(2)}</p>}
          {data.high && <p className="text-emerald-500">Máxima: R$ {data.high.toFixed(2)}</p>}
          {data.low && <p className="text-red-500">Mínima: R$ {data.low.toFixed(2)}</p>}
          <p className="text-gray-400">Volume: {data.volume.toLocaleString("pt-BR")}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Title block with TradingView controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
              GRÁFICO INTERATIVO DE PERFORMANCE
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">R$ {lastPrice.toFixed(2)}</span>
              {prices.length > 0 && (
                <span
                  className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded flex items-center ${
                    isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {periodPerformance.toFixed(2)}% no período
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center flex-wrap gap-1 bg-[#141414] border border-[#222] p-1 rounded-xl">
          {periods.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer ${
                interval === p.interval
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shadow-lg shadow-emerald-500/5"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-[#111111] border border-[#222] rounded-xl mb-4 text-xs font-mono">
        <div>
          <span className="text-gray-500 block">MÁXIMA</span>
          <span className="text-emerald-400 font-bold">R$ {highPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">MÍNIMA</span>
          <span className="text-red-400 font-bold">R$ {lowPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">MÉDIA DO PERÍODO</span>
          <span className="text-gray-300">R$ {avgPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-500 block">TIPO DE GRÁFICO</span>
            <button
              onClick={() => setChartType(chartType === "area" ? "line" : "area")}
              className="text-emerald-400 hover:text-emerald-300 font-bold uppercase cursor-pointer"
            >
              {chartType}
            </button>
          </div>
          <button
            onClick={fetchChartData}
            title="Atualizar dados"
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Chart Stage */}
      <div className="h-72 w-full relative">
        {isLoading && chartData.length === 0 && (
          <div className="absolute inset-0 bg-[#050505]/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-gray-400 font-mono">CARREGANDO DADOS DA B3...</p>
            </div>
          </div>
        )}

        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
            Sem dados gráficos disponíveis para o período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#666666"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#666666"
                fontSize={10}
                domain={["auto", "auto"]}
                tickLine={false}
                axisLine={false}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={avgPrice} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-3 border-t border-[#222] pt-2">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-blue-500" /> Cotações atualizadas em D-0
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-emerald-500" /> TradingView Engine Core
        </span>
      </div>
    </div>
  );
}
