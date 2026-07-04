import React, { useState } from "react";
import { Stock, Alert } from "../types";
import { Bell, BellOff, Trash2, Plus, Zap, TrendingUp, HelpCircle, CheckCircle2 } from "lucide-react";

interface AlertsPanelProps {
  alerts: Alert[];
  onAddAlert: (a: Omit<Alert, "id" | "active">) => void;
  onDeleteAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  stockCatalog: Stock[];
  favorites: string[];
  onSelectStockByTicker: (ticker: string) => void;
}

export default function AlertsPanel({
  alerts,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
  stockCatalog,
  favorites,
  onSelectStockByTicker,
}: AlertsPanelProps) {
  const [ticker, setTicker] = useState("PETR4");
  const [type, setType] = useState<Alert["type"]>("PRICE_ABOVE");
  const [value, setValue] = useState<number>(38.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || value <= 0) return;

    onAddAlert({
      ticker: ticker.toUpperCase(),
      type,
      value,
    });
  };

  const getAlertDescription = (alert: Alert) => {
    switch (alert.type) {
      case "PRICE_ABOVE":
        return `Disparar quando cotação for MAIOR que R$ ${alert.value.toFixed(2)}`;
      case "PRICE_BELOW":
        return `Disparar quando cotação for MENOR que R$ ${alert.value.toFixed(2)}`;
      case "PERCENT_CHANGE":
        return `Disparar quando oscilação exceder ${alert.value.toFixed(2)}%`;
      default:
        return "";
    }
  };

  const activeFavStocks = stockCatalog.filter((s) => favorites.includes(s.ticker));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
      {/* Column 1: Watch List / Favorites */}
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" /> FAVORITOS & WATCH LIST
        </h3>
        <p className="text-xs text-gray-500">
          Monitore as cotações e tendências dos seus ativos prioritários na B3. Clique em um ativo para detalhar.
        </p>

        {activeFavStocks.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs font-mono border border-dashed border-[#222] rounded-xl">
            Sua watch list está vazia. Adicione favoritos na página de detalhes de cada ação.
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {activeFavStocks.map((fav) => (
              <button
                key={fav.ticker}
                onClick={() => onSelectStockByTicker(fav.ticker)}
                className="w-full flex items-center justify-between p-3 bg-[#111111] hover:bg-[#161616] border border-[#222] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div>
                  <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {fav.ticker}
                  </span>
                  <span className="text-gray-500 block text-[9px] font-sans font-normal">
                    {fav.name.slice(0, 20)}...
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-300 block">R$ {fav.price.toFixed(2)}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      fav.change >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {fav.change >= 0 ? "+" : ""}
                    {fav.change.toFixed(2)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Column 2 & 3: Alerts System */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" /> PROGRAMAR ALERTA PERSONALIZADO
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end font-mono">
            <div>
              <label className="block text-gray-400 mb-1">ATIVO B3</label>
              <select
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-[#111111] border border-[#222] rounded-lg p-2.5 text-white font-mono"
              >
                {stockCatalog.map((s) => (
                  <option key={s.ticker} value={s.ticker} className="bg-[#111111]">
                    {s.ticker}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">CONDIÇÃO DE DISPARO</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Alert["type"])}
                className="w-full bg-[#111111] border border-[#222] rounded-lg p-2.5 text-white font-mono"
              >
                <option value="PRICE_ABOVE" className="bg-[#111111]">Preço acima de</option>
                <option value="PRICE_BELOW" className="bg-[#111111]">Preço abaixo de</option>
                <option value="PERCENT_CHANGE" className="bg-[#111111]">Oscilação maior que (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">VALOR CRÍTICO</label>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full bg-[#111111] border border-[#222] rounded-lg p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Criar Alerta
            </button>
          </form>
        </div>

        {/* Alerts List */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ALERTAS ATIVOS E HISTÓRICO
          </h3>

          {alerts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm font-mono border border-dashed border-[#222] rounded-xl">
              Nenhum alerta de preço configurado. Use o formulário acima para programar monitoramento em tempo real.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 border rounded-xl flex justify-between items-center transition-all ${
                    alert.triggeredAt
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-[#111111] border-[#222] text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.triggeredAt ? "bg-emerald-500/25" : "bg-[#1f1f1f] text-gray-400"
                      }`}
                    >
                      {alert.ticker}
                    </span>
                    <div>
                      <p className="font-semibold">{getAlertDescription(alert)}</p>
                      {alert.triggeredAt && (
                        <span className="text-[10px] text-gray-500 block font-normal">
                          Disparado em: {new Date(alert.triggeredAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleAlert(alert.id)}
                      className="p-1.5 hover:bg-neutral-800 rounded text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                      title={alert.active ? "Desativar alerta" : "Reativar alerta"}
                    >
                      {alert.active ? (
                        <Bell className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <BellOff className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1.5 hover:bg-neutral-800 rounded text-gray-400 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                      title="Excluir alerta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
