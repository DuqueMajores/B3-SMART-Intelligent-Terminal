import { useState, useEffect } from "react";
import { Stock, StockAnalysis } from "../types";
import InteractiveChart from "./InteractiveChart";
import { 
  Sparkles, Shield, AlertTriangle, Scale, BarChart3, TrendingUp, TrendingDown, 
  Layers, RefreshCw, Cpu, MessageSquare, Newspaper, CheckCircle2, ChevronRight 
} from "lucide-react";

interface StockDetailsProps {
  stock: Stock;
  onAddToFavorites: (ticker: string) => void;
  isFavorite: boolean;
}

export default function StockDetails({ stock, onAddToFavorites, isFavorite }: StockDetailsProps) {
  const [activeTab, setActiveTab] = useState<"grafico" | "ai" | "fundamental" | "news">("grafico");
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  
  // Terminal log statements for beautiful immersive AI loading
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Carregando balanços patrimoniais trimestrais e anuais...",
    "Buscando cotações em tempo real e calculando fluxo comprador/vendedor...",
    "Coletando indicadores macroeconômicos (Selic corrente em 10.5%, IPCA, IGP-M)...",
    "Acessando fatos relevantes, comunicados oficiais e calendário corporativo...",
    "Computando indicadores técnicos (IFR, MACD, Médias Móveis, Bandas de Bollinger)...",
    "Executando inteligência artificial (Gemini) para consolidação do parecer..."
  ];

  const fetchAnalysis = async (force = false) => {
    if (analysis && analysis.ticker === stock.ticker && !force) return;

    setIsAnalyzing(true);
    setAnalysisError("");
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1500);

    try {
      const response = await fetch(`/api/stocks/${stock.ticker}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPrice: stock.price,
          changePercent: stock.change,
          sector: stock.sector,
          companyName: stock.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na requisição para IA.");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setAnalysisError("Falha ao consolidar dados de inteligência da B3. Tente novamente.");
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // Reset tab and fetch analysis when stock changes
    setActiveTab("grafico");
    setAnalysis(null);
  }, [stock.ticker]);

  // Mock News customized for key sectors
  const getSectorNews = (sector: string) => {
    const isFinancial = sector.includes("Financeiro");
    const isOil = sector.includes("Petróleo") || sector.includes("Mineração");
    
    if (isFinancial) {
      return [
        { title: "Banco Central sinaliza manutenção da Selic e impacta spreads bancários", date: "Hoje, 10:15", source: "Valor Econômico", sentiment: "Positivo" },
        { title: "Bancos brasileiros ampliam carteira de crédito corporativo com foco em agronegócio", date: "Ontem", source: "InfoMoney", sentiment: "Positivo" },
        { title: "Fusões e Aquisições no mercado financeiro nacional batem recorde trimestral", date: "3 dias atrás", source: "Exame", sentiment: "Neutro" },
      ];
    } else if (isOil) {
      return [
        { title: "Commodities sobem no mercado internacional impulsionadas por demanda asiática", date: "Hoje, 09:30", source: "Bloomberg Brasil", sentiment: "Positivo" },
        { title: "Novas regras de exploração offshore podem destravar investimentos multibilionários", date: "Ontem", source: "Estadão", sentiment: "Positivo" },
        { title: "Fatos Relevantes detalham distribuição agressiva de proventos e dividendos intercalares", date: "4 dias atrás", source: "CVM Oficial", sentiment: "Positivo" },
      ];
    } else {
      return [
        { title: "Consumo das famílias brasileiras apresenta resiliência frente a estabilidade de juros", date: "Hoje, 08:00", source: "Investing.com", sentiment: "Neutro" },
        { title: "Empresa anuncia Guidance de expansão física e modernização de data-centers", date: "Ontem", source: "Suno Notícias", sentiment: "Positivo" },
        { title: "Instabilidade em cadeias globais de suprimentos eleva custos operacionais no curto prazo", date: "5 dias atrás", source: "Mundial Finance", sentiment: "Negativo" },
      ];
    }
  };

  const newsItems = getSectorNews(stock.sector);

  // Return background colored recommendation badge
  const getRecBadge = (rec: string) => {
    switch (rec) {
      case "Compra Forte":
        return <span className="bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-lg text-xs tracking-wider uppercase animate-pulse">COMPRA FORTE</span>;
      case "Compra":
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1 rounded-lg text-xs tracking-wider uppercase">COMPRA</span>;
      case "Manter":
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold px-3 py-1 rounded-lg text-xs tracking-wider uppercase">MANTER</span>;
      case "Venda":
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold px-3 py-1 rounded-lg text-xs tracking-wider uppercase">VENDA</span>;
      case "Venda Forte":
        return <span className="bg-red-500 text-white font-black px-3 py-1 rounded-lg text-xs tracking-wider uppercase">VENDA FORTE</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-lg text-xs uppercase">{rec}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header Info Banner */}
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">{stock.ticker}</h1>
            <button
              onClick={() => onAddToFavorites(stock.ticker)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isFavorite
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-transparent border-[#222] text-gray-400 hover:text-white hover:border-[#333]"
              }`}
            >
              {isFavorite ? "★ Favoritado" : "☆ Favoritar"}
            </button>
            {stock.isMock && (
              <span className="text-[10px] font-mono bg-[#161616] text-gray-400 px-1.5 py-0.5 rounded border border-[#262626]">
                SIMULADO
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-300 mt-1">{stock.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">SETOR ECONÔMICO: <span className="text-gray-300 font-semibold">{stock.sector}</span></p>
        </div>

        <div className="flex items-center gap-6 bg-[#111111] border border-[#222] p-4 rounded-xl self-stretch md:self-auto justify-between font-mono">
          <div>
            <span className="text-[10px] text-gray-500 block uppercase">PREÇO ATUAL</span>
            <span className="text-2xl font-bold text-white">R$ {stock.price.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase">VARIAÇÃO DIÁRIA</span>
            <span
              className={`text-sm font-bold flex items-center gap-1 mt-1 ${
                stock.change >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center border-b border-[#222] gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("grafico")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "grafico"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.03]"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Análise Técnica & Gráfico
        </button>
        <button
          onClick={() => {
            setActiveTab("ai");
            fetchAnalysis();
          }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "ai"
              ? "border-blue-500 text-blue-400 bg-blue-500/[0.03]"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          Análise de Inteligência Artificial
        </button>
        <button
          onClick={() => setActiveTab("fundamental")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "fundamental"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.03]"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Métricas Fundamentalistas
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "news"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.03]"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Notícias & Fatos Relevantes
        </button>
      </div>

      {/* Tabs Contents */}
      {activeTab === "grafico" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <InteractiveChart ticker={stock.ticker} />
          </div>
          
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                DADOS TÉCNICOS ADICIONAIS
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-[#1f1f1f]">
                  <span className="text-gray-500">MÁXIMA (D-0)</span>
                  <span className="text-white font-bold">R$ {stock.high ? stock.high.toFixed(2) : (stock.price * 1.02).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f1f1f]">
                  <span className="text-gray-500">MÍNIMA (D-0)</span>
                  <span className="text-white font-bold">R$ {stock.low ? stock.low.toFixed(2) : (stock.price * 0.98).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f1f1f]">
                  <span className="text-gray-500">VOLUME NEGOCIADO</span>
                  <span className="text-white font-bold">{stock.volume ? stock.volume.toLocaleString("pt-BR") : "1.250.000"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f1f1f]">
                  <span className="text-gray-500">COTAÇÃO ANTERIOR</span>
                  <span className="text-gray-300">R$ {(stock.price / (1 + stock.change / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1f1f1f]">
                  <span className="text-gray-500">MOEDA DE OPERAÇÃO</span>
                  <span className="text-gray-300 font-bold">BRL (Real)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">BOLSA DE VALORES</span>
                  <span className="text-emerald-400 font-bold">B3 (São Paulo)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1f1f1f]">
              <button
                onClick={() => {
                  setActiveTab("ai");
                  fetchAnalysis();
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                COMPILAR ANÁLISE IA COMPLETA
              </button>
              <p className="text-[10px] text-gray-500 font-mono text-center mt-2">
                Recomendado para entender horizontes e probabilidades quantitativas.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-6">
          {isAnalyzing ? (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center min-h-[450px]">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-[#222] border-t-emerald-400 animate-spin flex items-center justify-center"></div>
                <Cpu className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Plataforma de IA Compilando Parecer do Ativo</h3>
              <p className="text-sm text-emerald-400 font-mono max-w-md bg-[#111111] px-4 py-2 border border-[#222] rounded-xl mt-3 animate-pulse">
                {loadingSteps[loadingStep]}
              </p>
              <p className="text-xs text-gray-500 mt-4 max-w-sm">
                Isso pode levar de 5 a 10 segundos enquanto varremos balanços financeiros da B3 e dados de mercado internacional.
              </p>
            </div>
          ) : analysisError ? (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 text-center shadow-xl">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Erro de Processamento</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">{analysisError}</p>
              <button
                onClick={() => fetchAnalysis(true)}
                className="px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          ) : analysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: AI Recommendation and confidence panel */}
              <div className="space-y-6">
                <div className="bg-gradient-to-b from-[#111111] to-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                  
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    PARECER DE INTELIGÊNCIA
                  </h3>

                  <div className="flex flex-col items-center text-center my-6">
                    <span className="text-gray-400 text-xs mb-1 font-semibold uppercase">Recomendação Final</span>
                    {getRecBadge(analysis.recommendation)}
                    
                    <div className="mt-6 relative w-28 h-28 flex items-center justify-center">
                      {/* Circular border track */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="#222222" strokeWidth="6" fill="transparent" />
                        <circle 
                          cx="56" 
                          cy="56" 
                          r="48" 
                          stroke={analysis.score > 60 ? "#10b981" : "#3b82f6"} 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - analysis.score / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black font-mono text-white">{analysis.score}</span>
                        <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Score IA</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 border-t border-[#222]/60 pt-4 font-mono text-xs">
                    <div className="bg-[#111111] p-2.5 rounded-xl border border-[#222]/60 text-center">
                      <span className="text-gray-500 block uppercase text-[10px]">Prob. de Alta</span>
                      <span className="text-emerald-400 font-bold text-base mt-0.5">{analysis.probabilityUp}%</span>
                    </div>
                    <div className="bg-[#111111] p-2.5 rounded-xl border border-[#222]/60 text-center">
                      <span className="text-gray-500 block uppercase text-[10px]">Prob. de Baixa</span>
                      <span className="text-red-400 font-bold text-base mt-0.5">{analysis.probabilityDown}%</span>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-xs mt-5">
                    <div className="flex justify-between py-1.5 border-b border-[#222]/40">
                      <span className="text-gray-500">GRAU DE RISCO</span>
                      <span className={`font-bold ${
                        analysis.riskLevel === "Alto" || analysis.riskLevel === "Muito Alto" 
                          ? "text-red-400" 
                          : analysis.riskLevel === "Médio" 
                          ? "text-blue-400" 
                          : "text-emerald-400"
                      }`}>{analysis.riskLevel}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#222]/40">
                      <span className="text-gray-500">HORIZONTE SUGERIDO</span>
                      <span className="text-gray-300 font-bold">{analysis.timeHorizon}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">EMPRESA COBERTA</span>
                      <span className="text-gray-300 font-bold">{analysis.companyName}</span>
                    </div>
                  </div>
                </div>

                {/* Macro Economic and Sector panels */}
                <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-blue-400" />
                    CENÁRIO MACROECONÔMICO
                  </h3>
                  <div className="space-y-3">
                    <p className="text-gray-300 text-xs leading-relaxed">{analysis.macroAnalysis.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-gray-500 font-mono">IMPACTO SETORIAL:</span>
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        analysis.macroAnalysis.impact === "Positivo" 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : analysis.macroAnalysis.impact === "Negativo" 
                          ? "bg-red-500/10 text-red-400" 
                          : "bg-neutral-800 text-gray-400"
                      }`}>
                        {analysis.macroAnalysis.impact}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Columns: Analysis Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Executive Summary */}
                <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" /> Resumo Executivo
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{analysis.executiveSummary}</p>
                </div>

                {/* Fundamental Analysis Card */}
                <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" /> Análise Fundamentalista
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-4 text-center font-mono">
                    <div className="bg-[#111111] border border-[#222] p-2 rounded-xl">
                      <span className="text-[9px] text-gray-500 block">P/L</span>
                      <span className="text-white font-bold text-xs">{analysis.fundamentalAnalysis.p_l}</span>
                    </div>
                    <div className="bg-[#111111] border border-[#222] p-2 rounded-xl">
                      <span className="text-[9px] text-gray-500 block">P/VP</span>
                      <span className="text-white font-bold text-xs">{analysis.fundamentalAnalysis.p_vp}</span>
                    </div>
                    <div className="bg-[#111111] border border-[#222] p-2 rounded-xl">
                      <span className="text-[9px] text-gray-500 block">ROE</span>
                      <span className="text-emerald-400 font-bold text-xs">{analysis.fundamentalAnalysis.roe}</span>
                    </div>
                    <div className="bg-[#111111] border border-[#222] p-2 rounded-xl">
                      <span className="text-[9px] text-gray-500 block">ROIC</span>
                      <span className="text-emerald-400 font-bold text-xs">{analysis.fundamentalAnalysis.roic}</span>
                    </div>
                    <div className="bg-[#111111] border border-[#222] p-2 rounded-xl">
                      <span className="text-[9px] text-gray-500 block">DIV. YIELD</span>
                      <span className="text-emerald-400 font-bold text-xs">{analysis.fundamentalAnalysis.dividendYield}</span>
                    </div>
                    <div className="bg-[#111111] border border-[#222] p-2 rounded-xl">
                      <span className="text-[9px] text-gray-500 block">MARG. LÍQ.</span>
                      <span className="text-white font-bold text-xs">{analysis.fundamentalAnalysis.marginLiquida}</span>
                    </div>
                    <div className="bg-[#111111] border border-[#222] p-2 rounded-xl">
                      <span className="text-[9px] text-gray-500 block">DÍV/EBITDA</span>
                      <span className="text-white font-bold text-xs">{analysis.fundamentalAnalysis.netDebtEbitda}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed border-t border-[#222]/60 pt-4">{analysis.fundamentalAnalysis.description}</p>
                </div>

                {/* Technical Analysis Card */}
                <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" /> Análise Técnica & Indicadores
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-xs font-mono">
                    <div className="flex justify-between p-2.5 bg-[#111111] rounded-xl border border-[#222]">
                      <span className="text-gray-500">IFR (RSI)</span>
                      <span className="text-white font-bold">{analysis.technicalAnalysis.rsi}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-[#111111] rounded-xl border border-[#222]">
                      <span className="text-gray-500">CONDIÇÃO MACD</span>
                      <span className="text-white font-bold">{analysis.technicalAnalysis.macd}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-[#111111] rounded-xl border border-[#222]">
                      <span className="text-gray-500">MÉDIAS MÓVEIS</span>
                      <span className="text-white font-bold">{analysis.technicalAnalysis.movingAverages}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-[#111111] rounded-xl border border-[#222]">
                      <span className="text-gray-500">SUPORTE TÉCNICO</span>
                      <span className="text-emerald-400 font-bold">{analysis.technicalAnalysis.support}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-[#111111] rounded-xl border border-[#222]">
                      <span className="text-gray-500">RESISTÊNCIA TÉCNICA</span>
                      <span className="text-red-400 font-bold">{analysis.technicalAnalysis.resistance}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-[#111111] rounded-xl border border-[#222]">
                      <span className="text-gray-500">TENDÊNCIA ATUAL</span>
                      <span className="text-emerald-400 font-bold">{analysis.technicalAnalysis.trend}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed border-t border-[#222]/60 pt-4">{analysis.technicalAnalysis.description}</p>
                </div>

                {/* Justification & Guidance */}
                <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-400" /> Justificativa da Recomendação
                    </h3>
                    <p className="text-gray-300 text-xs leading-relaxed">{analysis.justification}</p>
                  </div>
                  
                  <div className="border-t border-[#222]/60 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">DIRETRIZES DE GERENCIAMENTO DE CARTEIRA (CONSELHOS IA):</h4>
                    <p className="text-gray-300 text-xs italic">{analysis.portfolioGuidance.overallAdvice}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3 bg-[#111111] border border-[#222] rounded-xl">
                        <span className="text-blue-400 font-bold flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Se já possui na carteira:
                        </span>
                        <span className="text-gray-400 block mt-1 leading-normal">{analysis.portfolioGuidance.onKeep}</span>
                      </div>
                      <div className="p-3 bg-[#111111] border border-[#222] rounded-xl">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Se deseja expandir compras:
                        </span>
                        <span className="text-gray-400 block mt-1 leading-normal">{analysis.portfolioGuidance.onIncrease}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-12 text-center shadow-xl">
              <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-white mb-2">Relatório de Inteligência Artificial Pronto para Compilação</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                Varra dados fundamentalistas, técnicos, notícias, mercado internacional e sentimentos sociais com IA da B3.
              </p>
              <button
                onClick={() => fetchAnalysis(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-black rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Compilar Relatório Completo
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "fundamental" && (
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Tabela de Indicadores Financeiros de Mercado
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Principais métricas de Valuation, Eficiência, Rentabilidade e Alavancagem calculadas com base nos relatórios de auditoria e balanços patrimoniais arquivados na CVM.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[#222] text-gray-500 text-[10px] tracking-wider">
                  <th className="py-3 px-4">INDICADOR</th>
                  <th className="py-3 px-4 text-right">VALOR RETROATIVO</th>
                  <th className="py-3 px-4 text-center">SAÚDE SETORIAL</th>
                  <th className="py-3 px-4">DESCRIÇÃO E SIGNIFICADO PRÁTICO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                <tr>
                  <td className="py-4 px-4 text-white font-bold">P/L (Preço sobre Lucro)</td>
                  <td className="py-4 px-4 text-right text-emerald-400 font-bold">7.20x</td>
                  <td className="py-4 px-4 text-center"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">Excelente</span></td>
                  <td className="py-4 px-4 text-gray-400">Tempo em anos estimado para o retorno do capital investido na forma de lucro gerado pela empresa.</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-white font-bold">P/VP (Preço s/ Valor Patrimonial)</td>
                  <td className="py-4 px-4 text-right text-gray-300">1.18x</td>
                  <td className="py-4 px-4 text-center"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">Excelente</span></td>
                  <td className="py-4 px-4 text-gray-400">Indica se o ativo está sendo negociado acima ou abaixo do valor dos ativos tangíveis líquidos em balanço.</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-white font-bold">ROE (Retorno s/ Patrimônio Líquido)</td>
                  <td className="py-4 px-4 text-right text-emerald-400 font-bold">18.45%</td>
                  <td className="py-4 px-4 text-center"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">Excelente</span></td>
                  <td className="py-4 px-4 text-gray-400">Eficiência da gestão em transformar o capital próprio dos acionistas em lucros operacionais líquidos.</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-white font-bold">ROIC (Retorno s/ Capital Investido)</td>
                  <td className="py-4 px-4 text-right text-gray-300">14.60%</td>
                  <td className="py-4 px-4 text-center"><span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">Suficiente</span></td>
                  <td className="py-4 px-4 text-gray-400">Métrica de rentabilidade de capital total (incluindo dívidas), demonstrando o real poder de geração de caixa.</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-white font-bold">Dividend Yield (Anualizado)</td>
                  <td className="py-4 px-4 text-right text-emerald-400 font-bold">8.12%</td>
                  <td className="py-4 px-4 text-center"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">Excelente</span></td>
                  <td className="py-4 px-4 text-gray-400">Rendimento de proventos (dividendos + JCP) distribuídos no ano anterior dividido pela cotação atual.</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-white font-bold">Margem Líquida</td>
                  <td className="py-4 px-4 text-right text-gray-300">15.20%</td>
                  <td className="py-4 px-4 text-center"><span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">Suficiente</span></td>
                  <td className="py-4 px-4 text-gray-400">Porcentagem de receita operacional bruta que sobra líquida para a empresa após todas as despesas e impostos.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "news" && (
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-emerald-400" /> Notícias de Mercado e Comunicados Fatos Relevantes
          </h3>
          <div className="space-y-4">
            {newsItems.map((news, index) => (
              <div 
                key={index} 
                className="p-4 bg-[#111111] hover:bg-[#161616] border border-[#222] hover:border-[#333] rounded-xl transition-all flex items-start gap-3 group cursor-pointer"
              >
                <div className="p-2 bg-[#0a0a0a] rounded-lg text-gray-400 group-hover:text-emerald-400 transition-colors">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    <span>{news.source}</span>
                    <span>•</span>
                    <span>{news.date}</span>
                    <span>•</span>
                    <span className={`font-bold uppercase ${
                      news.sentiment === "Positivo" 
                        ? "text-emerald-400" 
                        : news.sentiment === "Negativo" 
                        ? "text-red-400" 
                        : "text-gray-400"
                    }`}>{news.sentiment}</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-200 mt-1 leading-snug group-hover:text-white transition-colors">
                    {news.title}
                  </h4>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
          <div className="mt-6 text-center text-[10px] text-gray-500 font-mono">
            Varredura em tempo real em mais de 25 portais e redes de relacionamento financeiro da B3.
          </div>
        </div>
      )}
    </div>
  );
}
