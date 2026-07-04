import { useState, useEffect } from "react";
import { User } from "../types";
import { Shield, Cpu, Key, Database, RefreshCw, BarChart, Server, Activity, Users, Mail } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [apiLatency, setApiLatency] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate random throughput/latency metric points
  const generateMetrics = () => {
    const data = [];
    const date = new Date();
    for (let i = 15; i >= 0; i--) {
      const time = new Date(date.getTime() - i * 10 * 1000);
      data.push({
        time: time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        latency: Math.floor(180 + Math.random() * 250),
        requests: Math.floor(2 + Math.random() * 8),
      });
    }
    setApiLatency(data);
  };

  useEffect(() => {
    generateMetrics();
    const interval = setInterval(generateMetrics, 10000);

    const loadUsers = async () => {
      // 1. Start with local registry users as fallback
      const storedUsers = JSON.parse(localStorage.getItem("b3_users") || "[]");
      const demoUser = {
        id: "demo-user-1",
        email: "duque.majores@gmail.com",
        name: "Majores S.A.",
        balance: 0.0,
        isDemo: true,
      };

      // Ensure demo user is in local users if not present
      if (!storedUsers.some((u: any) => u.id === demoUser.id)) {
        storedUsers.push(demoUser);
      }
      setUsers(storedUsers);

      // 2. Query cloud Firestore to fetch real, up-to-date users list from the cloud
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const cloudUsers: any[] = [];
        querySnapshot.forEach((doc) => {
          cloudUsers.push(doc.data());
        });

        if (cloudUsers.length > 0) {
          // Merge demo user into cloud users for display
          if (!cloudUsers.some((u: any) => u.id === demoUser.id)) {
            cloudUsers.push(demoUser);
          }
          setUsers(cloudUsers);
          
          // Sync local storage with current cloud users
          const localOnlyDemo = cloudUsers.filter((u: any) => !u.isDemo);
          localStorage.setItem("b3_users", JSON.stringify(localOnlyDemo));
        }
      } catch (err) {
        console.warn("Could not query users list from cloud Firestore (permissions or offline):", err);
      }
    };

    loadUsers();

    return () => clearInterval(interval);
  }, []);

  const handleRefreshDiagnostics = () => {
    setIsLoading(true);
    setTimeout(() => {
      generateMetrics();
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Title Header */}
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <Server className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Painel Administrativo</h1>
            <p className="text-xs text-gray-400">Diagnósticos do servidor, limites de taxa API e gerenciamento de banco de dados.</p>
          </div>
        </div>
        <button
          onClick={handleRefreshDiagnostics}
          className="px-4 py-2 bg-[#111111] hover:bg-[#161616] text-gray-300 border border-[#222] font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          Recarregar Diagnóstico
        </button>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: API configurations and connections */}
        <div className="space-y-6">
          {/* API Keys */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" /> STATUS DE APIs INTEGRADAS
            </h3>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="p-3 bg-[#111111] border border-[#222] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 block">IA GENERATIVA GEMINI</span>
                  <span className="text-white font-bold block mt-0.5">gemini-3.5-flash</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold">ATIVO</span>
              </div>

              <div className="p-3 bg-[#111111] border border-[#222] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 block">YAHOO FINANCE CHART PROXY</span>
                  <span className="text-white font-bold block mt-0.5">finance.yahoo.com</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold">ATIVO</span>
              </div>

              <div className="p-3 bg-[#111111] border border-[#222] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 block">CVM COMPLIANCE SCRAPER</span>
                  <span className="text-gray-400 block mt-0.5">Sistemas CVM (Simulado)</span>
                </div>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-bold">INTERNO</span>
              </div>
            </div>
          </div>

          {/* System Performance Diagnostics */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" /> RECURSOS DO CONTAINER
            </h3>

            <div className="space-y-3 font-mono text-xs text-gray-400">
              <div className="flex justify-between py-2 border-b border-[#222]">
                <span>CPU UTILIZADA</span>
                <span className="text-emerald-400 font-bold">3.2%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#222]">
                <span>MEMÓRIA DE PROCESSOS</span>
                <span className="text-white font-bold">148 MB / 512 MB</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#222]">
                <span>SISTEMA OPERACIONAL</span>
                <span className="text-gray-300">Linux (Cloud Run Container)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#222]">
                <span>NODE RUNTIME</span>
                <span className="text-gray-300">v22.x (ESM Mode)</span>
              </div>
              <div className="flex justify-between py-2">
                <span>REQUISITOS PORT</span>
                <span className="text-blue-400 font-bold">3000 (Proxy Ativo)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right column: Performance Latency graphs, User table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latency Recharts Graph */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-400" /> MONITOR DE LATÊNCIA DA API FINANCEIRA (ms)
            </h3>
            <div className="h-44 w-full">
              {apiLatency.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
                  Calculando estatísticas latentes...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={apiLatency} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#444" fontSize={8} tickLine={false} />
                    <YAxis stroke="#444" fontSize={8} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: "8px", fontSize: "11px", color: "#fff" }} />
                    <Area type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLatency)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Registered Users Database */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> CONTAS REGISTRADAS NO TERMINAL
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222] text-gray-500 text-[10px]">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">INVESTIDOR</th>
                    <th className="py-2.5 px-3">E-MAIL</th>
                    <th className="py-2.5 px-3 text-right">SALDO CAIXA</th>
                    <th className="py-2.5 px-3 text-center">TIPO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161616]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#111111] transition-colors">
                      <td className="py-3 px-3 text-gray-500 text-[10px]">{u.id.slice(0, 10)}...</td>
                      <td className="py-3 px-3 text-white font-bold">{u.name}</td>
                      <td className="py-3 px-3 text-gray-400">{u.email}</td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">R$ {u.balance.toLocaleString("pt-BR")}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          u.isDemo ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {u.isDemo ? "DEMONSTRAÇÃO" : "REGISTRADO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
