import React, { useState } from "react";
import { Stock, Transaction, PortfolioAsset, StockAnalysis } from "../types";
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, History, Plus, 
  Trash2, BrainCircuit, Activity, Calendar, Award, ChevronRight, RefreshCw 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

interface PortfolioProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, "id">) => void;
  onDeleteTransaction: (id: string) => void;
  stockCatalog: Stock[];
  onAnalyzeStock: (stock: Stock) => void;
}

export default function Portfolio({ 
  transactions, 
  onAddTransaction, 
  onDeleteTransaction, 
  stockCatalog, 
  onAnalyzeStock 
}: PortfolioProps) {
  // Add Transaction Form States
  const [ticker, setTicker] = useState("PETR4");
  const [quantity, setQuantity] = useState<number>(100);
  const [price, setPrice] = useState<number>(37.50);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isAdding, setIsAdding] = useState(false);

  // AI Position Consultation States
  const [consultingTicker, setConsultingTicker] = useState<string | null>(null);
  const [consultationResult, setConsultationResult] = useState<StockAnalysis | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);

  // Group transactions to compute current holdings
  const holdings: { [ticker: string]: { qty: number; totalCost: number } } = {};
  transactions.forEach((t) => {
    if (!holdings[t.ticker]) {
      holdings[t.ticker] = { qty: 0, totalCost: 0 };
    }
    if (t.type === "COMPRA") {
      holdings[t.ticker].qty += t.quantity;
      holdings[t.ticker].totalCost += t.quantity * t.price;
    } else {
      holdings[t.ticker].qty -= t.quantity;
      holdings[t.ticker].totalCost -= t.quantity * t.price; // simplificação
    }
  });

  const activeHoldings: PortfolioAsset[] = Object.keys(holdings)
    .map((symbol) => {
      const holding = holdings[symbol];
      if (holding.qty <= 0) return null;

      const catalogItem = stockCatalog.find((s) => s.ticker === symbol);
      const currentPrice = catalogItem ? catalogItem.price : 25.0; // fallback
      const name = catalogItem ? catalogItem.name : `${symbol} S.A.`;
      const sector = catalogItem ? catalogItem.sector : "Outros";

      const currentValue = holding.qty * currentPrice;
      const avgPrice = holding.totalCost / holding.qty;
      const costBasis = holding.totalCost;
      const profitDifference = currentValue - costBasis;
      const profitPercent = costBasis > 0 ? (profitDifference / costBasis) * 100 : 0;

      return {
        ticker: symbol,
        name,
        sector,
        quantity: holding.qty,
        averagePrice: Number(avgPrice.toFixed(2)),
        currentPrice: Number(currentPrice.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        costBasis: Number(costBasis.toFixed(2)),
        profitDifference: Number(profitDifference.toFixed(2)),
        profitPercent: Number(profitPercent.toFixed(2)),
      };
    })
    .filter((asset): asset is PortfolioAsset => asset !== null);

  // Performance totals
  const totalValue = activeHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = activeHoldings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalProfitDiff = totalValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfitDiff / totalCost) * 100 : 0;

  // Chart data for diversification by sector
  const sectorData: { [sector: string]: number } = {};
  activeHoldings.forEach((h) => {
    sectorData[h.sector] = (sectorData[h.sector] || 0) + h.currentValue;
  });
  const sectorChartData = Object.keys(sectorData).map((s) => ({
    name: s,
    value: Number(sectorData[s].toFixed(2)),
  }));

  // Chart data for assets allocation
  const assetChartData = activeHoldings.map((h) => ({
    name: h.ticker,
    value: h.currentValue,
  }));

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#14b8a6"];

  const handleConsultAI = async (symbol: string) => {
    setConsultingTicker(symbol);
    setIsConsulting(true);
    setConsultationResult(null);

    const holding = activeHoldings.find((h) => h.ticker === symbol);
    if (!holding) return;

    try {
      const response = await fetch(`/api/stocks/${symbol}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPrice: holding.currentPrice,
          changePercent: holding.profitPercent,
          sector: holding.sector,
          companyName: holding.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConsultationResult(data);
      }
    } catch (error) {
      console.error("Failed consulting AI for portfolio:", error);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || quantity <= 0 || price <= 0) return;

    onAddTransaction({
      ticker: ticker.toUpperCase(),
      type: "COMPRA",
      quantity,
      price,
      date,
    });

    setIsAdding(false);
  };

  const getPortfolioScore = () => {
    if (!activeHoldings.length) return "N/A";
    const weightedScoreSum = activeHoldings.reduce((sum, h) => {
      // simulate score or check if matched
      return sum + h.currentValue * 75; // baseline score
    }, 0);
    return (weightedScoreSum / totalValue).toFixed(0);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-mono block uppercase">Patrimônio Líquido</span>
            <span className="text-2xl font-black text-white mt-1 block font-mono">
              R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Total investido: R$ {totalCost.toLocaleString("pt-BR")}</span>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-mono block uppercase">Rentabilidade Total</span>
            <span className={`text-2xl font-black mt-1 block font-mono ${totalProfitDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              R$ {totalProfitDiff.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-bold font-mono mt-0.5 block ${totalProfitDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalProfitDiff >= 0 ? "+" : ""}{totalProfitPercent.toFixed(2)}% acumulados
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${totalProfitDiff >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-mono block uppercase">Projeção Dividend Yield</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">
              R$ {(totalValue * 0.078).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / ano
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Média projetada setorial em ~7.8%</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <PieIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-mono block uppercase">Diver. por Setores</span>
            <span className="text-2xl font-black text-white mt-1 block font-mono">
              {sectorChartData.length} Segmentos
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Qualidade de Risco: Saudável (A)</span>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Dynamic diversification layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Holdings Table */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#222]">
              <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Ativos em Custódia
              </h3>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Registrar Operação
              </button>
            </div>

            {/* Add Transaction Form */}
            {isAdding && (
              <form onSubmit={handleAddSubmit} className="bg-[#111111] border border-[#222] p-4 rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
                <div>
                  <label className="block text-gray-400 mb-1">AÇÃO DA B3</label>
                  <select 
                    value={ticker} 
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-2 text-white font-mono"
                  >
                    {stockCatalog.map(s => (
                      <option key={s.ticker} value={s.ticker} className="bg-[#111111]">{s.ticker} - {s.name.slice(0, 15)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">QUANTIDADE</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-2 text-white font-mono" 
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">PREÇO MÉDIO (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={price} 
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-2 text-white font-mono" 
                    min="0.01"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    className="flex-1 bg-emerald-500 text-slate-950 font-bold p-2.5 rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="bg-[#1f1f1f] border border-[#333] text-gray-300 p-2.5 rounded-lg hover:bg-[#252525] cursor-pointer animate-none"
                  >
                    Sair
                  </button>
                </div>
              </form>
            )}

            {activeHoldings.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm font-mono">
                Sua carteira está sem custódia. Registre uma nova compra acima para começar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#222] text-gray-500 text-[10px]">
                      <th className="py-3 px-3">ATIVO</th>
                      <th className="py-3 px-3 text-right">QTD</th>
                      <th className="py-3 px-3 text-right">P. MÉDIO</th>
                      <th className="py-3 px-3 text-right">C. ATUAL</th>
                      <th className="py-3 px-3 text-right">VALOR ATUAL</th>
                      <th className="py-3 px-3 text-right">PRODUTIVIDADE</th>
                      <th className="py-3 px-3 text-center">ACONSELHAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161616]">
                    {activeHoldings.map((h) => (
                      <tr key={h.ticker} className="hover:bg-[#111111]/40 transition-colors">
                        <td className="py-3 px-3">
                          <button 
                            onClick={() => onAnalyzeStock({ ticker: h.ticker, name: h.name, sector: h.sector, price: h.currentPrice, change: h.profitPercent })}
                            className="font-bold text-white hover:text-emerald-400 bg-transparent border-none p-0 cursor-pointer text-left"
                          >
                            {h.ticker}
                            <span className="text-[9px] text-gray-500 block font-normal font-sans">{h.name.slice(0, 18)}...</span>
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-300">{h.quantity}</td>
                        <td className="py-3 px-3 text-right text-gray-400">R$ {h.averagePrice.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-gray-300">R$ {h.currentPrice.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-white font-bold">R$ {h.currentValue.toLocaleString("pt-BR")}</td>
                        <td className={`py-3 px-3 text-right font-bold ${h.profitDifference >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          R$ {h.profitDifference.toFixed(2)}
                          <span className="block text-[10px]">{h.profitDifference >= 0 ? "+" : ""}{h.profitPercent.toFixed(2)}%</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleConsultAI(h.ticker)}
                            className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-slate-950 rounded font-bold transition-all text-[10px] cursor-pointer"
                          >
                            Conselheiro IA
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Consultation display box */}
          {consultingTicker && (
            <div className="bg-[#111111] border border-blue-500/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">CONSELHEIRO CARTEIRA IA - ATIVO {consultingTicker}</h4>
                </div>
                <button
                  onClick={() => setConsultingTicker(null)}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Fechar
                </button>
              </div>

              {isConsulting ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                  <p className="text-xs text-gray-400 font-mono animate-pulse">Consultando dados fundamentais mais recentes de {consultingTicker}...</p>
                </div>
              ) : consultationResult ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-xl border border-[#222]">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">RECOMENDAÇÃO DE CARTEIRA:</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {consultationResult.recommendation === "Compra" || consultationResult.recommendation === "Compra Forte" ? (
                          <span className="text-emerald-400">✓ AUMENTAR POSIÇÃO / MANTER ATIVO</span>
                        ) : consultationResult.recommendation === "Manter" ? (
                          <span className="text-blue-400">→ AGUARDAR / SEGUIR RECOMENDAÇÃO</span>
                        ) : (
                          <span className="text-red-400">⚠ REALIZAR LUCRO PARCIAL / REDUZIR</span>
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block uppercase">SCORE CONFIANÇA:</span>
                      <span className="text-sm font-bold text-emerald-400 block">{consultationResult.score}/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 bg-[#0a0a0a] border border-[#222] rounded-xl">
                      <h5 className="font-bold text-blue-400 flex items-center gap-1.5 mb-1">
                        <ChevronRight className="w-4 h-4 text-blue-400" /> Diretrizes de Manutenção (Keep):
                      </h5>
                      <p className="text-gray-300 leading-relaxed font-sans">{consultationResult.portfolioGuidance.onKeep}</p>
                    </div>

                    <div className="p-3.5 bg-[#0a0a0a] border border-[#222] rounded-xl">
                      <h5 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                        <ChevronRight className="w-4 h-4 text-emerald-400" /> Diretrizes de Expansão (Aumentar):
                      </h5>
                      <p className="text-gray-300 leading-relaxed font-sans">{consultationResult.portfolioGuidance.onIncrease}</p>
                    </div>

                    <div className="p-3.5 bg-[#0a0a0a] border border-[#222] rounded-xl">
                      <h5 className="font-bold text-yellow-400 flex items-center gap-1.5 mb-1">
                        <ChevronRight className="w-4 h-4 text-yellow-400" /> Realização de Lucros (Take Profit):
                      </h5>
                      <p className="text-gray-300 leading-relaxed font-sans">{consultationResult.portfolioGuidance.onTakeProfit}</p>
                    </div>

                    <div className="p-3.5 bg-[#0a0a0a] border border-[#222] rounded-xl">
                      <h5 className="font-bold text-red-400 flex items-center gap-1.5 mb-1">
                        <ChevronRight className="w-4 h-4 text-red-400" /> Liquidação e Venda Total:
                      </h5>
                      <p className="text-gray-300 leading-relaxed font-sans">{consultationResult.portfolioGuidance.onSell}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-red-400">
                  Falha ao coletar conselhos IA. Tente novamente mais tarde.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Diversification charts right panels */}
        <div className="space-y-6">
          {/* Diversification Pie Chart */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              DISTRIBUIÇÃO SETORIAL
            </h3>
            <div className="h-44 w-full">
              {sectorChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
                  Diversificação indisponível.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sectorChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: "8px", fontSize: "11px", color: "#fff" }} formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR")}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Custom List of sectors with values */}
            <div className="space-y-2 mt-4 font-mono text-[10px]">
              {sectorChartData.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-white font-bold">R$ {item.value.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation Bar Chart */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              PARTICIPAÇÃO POR ATIVO
            </h3>
            <div className="h-44 w-full">
              {assetChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
                  Alocação indisponível.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assetChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#444" fontSize={9} tickLine={false} />
                    <YAxis stroke="#444" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: "8px", fontSize: "11px", color: "#fff" }} formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR")}`} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {assetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Transaction History Logs */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" /> HISTÓRICO DE TRANSAÇÕES
            </h3>
            <div className="space-y-3 font-mono text-[10px] max-h-56 overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="text-gray-500 p-4 text-center">Nenhuma operação gravada no livro diário.</div>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-center py-2 border-b border-[#222]">
                    <div>
                      <span className="font-bold text-white">{t.ticker}</span>
                      <span className="text-gray-500 block text-[9px]">{t.date}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${t.type === "COMPRA" ? "text-emerald-400" : "text-red-400"}`}>
                        {t.type} {t.quantity} un.
                      </span>
                      <span className="text-gray-400 block text-[9px]">Preço: R$ {t.price.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => onDeleteTransaction(t.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                      title="Deletar transação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
