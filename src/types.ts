export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  high?: number;
  low?: number;
  volume?: number;
  company?: string;
  isMock?: boolean;
}

export interface ChartPoint {
  time: string;
  timestamp: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number;
}

export interface Transaction {
  id: string;
  ticker: string;
  type: "COMPRA" | "VENDA";
  quantity: number;
  price: number;
  date: string;
}

export interface PortfolioAsset {
  ticker: string;
  name: string;
  sector: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  profitDifference: number;
  profitPercent: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
}

export interface Alert {
  id: string;
  ticker: string;
  type: "PRICE_ABOVE" | "PRICE_BELOW" | "PERCENT_CHANGE";
  value: number;
  active: boolean;
  triggeredAt?: string;
}

export interface StockAnalysis {
  ticker: string;
  companyName: string;
  recommendation: "Compra Forte" | "Compra" | "Manter" | "Venda" | "Venda Forte";
  score: number;
  probabilityUp: number;
  probabilityDown: number;
  riskLevel: "Baixo" | "Médio" | "Alto" | "Muito Alto";
  timeHorizon: "Curto Prazo" | "Médio Prazo" | "Longo Prazo";
  executiveSummary: string;
  fundamentalAnalysis: {
    p_l: string;
    p_vp: string;
    roe: string;
    roic: string;
    dividendYield: string;
    marginLiquida: string;
    netDebtEbitda: string;
    description: string;
  };
  technicalAnalysis: {
    rsi: string;
    macd: string;
    movingAverages: string;
    support: string;
    resistance: string;
    trend: string;
    description: string;
  };
  macroAnalysis: {
    description: string;
    impact: "Positivo" | "Neutro" | "Negativo";
  };
  sectorAnalysis: {
    description: string;
    competitors: string[];
  };
  justification: string;
  portfolioGuidance: {
    onKeep: string;
    onIncrease: string;
    onTakeProfit: string;
    onSell: string;
    overallAdvice: string;
  };
}
