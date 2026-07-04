import React, { useState, useEffect, useRef } from "react";
import { Stock } from "../types";
import { Search, Flame, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface SearchBoxProps {
  onSelectStock: (stock: Stock) => void;
  selectedTicker?: string;
}

export default function SearchBox({ onSelectStock, selectedTicker }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trendingStocks = [
    { ticker: "PETR4", name: "Petrobras S.A.", change: 1.25 },
    { ticker: "VALE3", name: "Vale S.A.", change: -0.85 },
    { ticker: "ITUB4", name: "Itaú Unibanco", change: 0.45 },
    { ticker: "WEGE3", name: "WEG S.A.", change: 1.55 },
    { ticker: "MGLU3", name: "Magazine Luiza", change: -3.45 },
  ];

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/stocks/search?query=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (stock: Stock) => {
    onSelectStock(stock);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full z-30" ref={dropdownRef}>
      <div className="flex items-center gap-3 bg-[#121212] border border-[#222] focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/20 rounded-xl px-4 py-3 shadow-lg transition-all">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Busque por ticker ou nome da empresa na B3... (ex: PETR4, VALE3)"
          className="bg-transparent text-white placeholder-gray-500 text-sm outline-none w-full font-sans"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-xs text-gray-500 hover:text-white bg-[#1a1a1a] px-2 py-0.5 rounded transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.trim().length > 0 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0d] border border-[#222] rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-2 border-b border-[#1f1f1f] text-[10px] font-semibold text-gray-500 tracking-wider">
            RESULTADOS DA BUSCA ({isLoading ? "BUSCANDO..." : results.length})
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-[#1f1f1f]">
            {results.length === 0 && !isLoading && (
              <div className="p-4 text-center text-sm text-gray-400">
                Nenhum ticker correspondente encontrado.
              </div>
            )}
            {results.map((stock) => (
              <button
                key={stock.ticker}
                onClick={() => handleSelect(stock)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[#161616] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="px-2 py-1 bg-[#161616] text-emerald-400 border border-[#262626] rounded text-xs font-bold font-mono">
                    {stock.ticker}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {stock.name}
                    </div>
                    <div className="text-xs text-gray-400">{stock.sector}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-300">
                    R$ {stock.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      stock.change >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {stock.change >= 0 ? "+" : ""}
                    {stock.change.toFixed(2)}%
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Search Badges */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
          <Flame className="w-3.5 h-3.5 text-orange-400" /> Ativos Populares:
        </span>
        {trendingStocks.map((trend) => (
          <button
            key={trend.ticker}
            onClick={() => handleSelect({ ticker: trend.ticker, name: trend.name, sector: "", price: 0, change: trend.change })}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#111111] hover:bg-[#181818] border transition-all duration-250 flex items-center gap-1.5 cursor-pointer ${
              selectedTicker === trend.ticker
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-[#222] hover:border-[#333] text-gray-300"
            }`}
          >
            <span className="font-mono font-bold">{trend.ticker}</span>
            <span
              className={`flex items-center text-[10px] ${
                trend.change >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {trend.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend.change)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
