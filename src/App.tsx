import { useState, useEffect } from "react";
import { User, Stock, Transaction, Alert } from "./types";
import Auth from "./components/Auth";
import SearchBox from "./components/SearchBox";
import StockDetails from "./components/StockDetails";
import Portfolio from "./components/Portfolio";
import AlertsPanel from "./components/AlertsPanel";
import AdminPanel from "./components/AdminPanel";
import { 
  TrendingUp, Wallet, Bell, ShieldAlert, LogOut, LayoutDashboard, User as UserIcon,
  HelpCircle, Menu, X, ArrowUpRight, ArrowDownRight, CheckCircle2, Trash2 
} from "lucide-react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db, auth } from "./lib/firebase";
import { playNotificationSound } from "./utils/sound";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "carteira" | "alertas" | "admin">("dashboard");
  const [stockCatalog, setStockCatalog] = useState<Stock[]>([
    { ticker: "PETR4", name: "Petróleo Brasileiro S.A. - Petrobras", sector: "Petróleo, Gás e Combustíveis", price: 37.54, change: 1.25, high: 38.10, low: 37.20, volume: 15400000, company: "Petrobras" },
    { ticker: "VALE3", name: "Vale S.A.", sector: "Mineração", price: 62.45, change: -0.85, high: 63.30, low: 62.10, volume: 8900000, company: "Vale" },
    { ticker: "ITUB4", name: "Itaú Unibanco Holding S.A.", sector: "Intermediários Financeiros", price: 34.20, change: 0.45, high: 34.50, low: 33.90, volume: 11200000, company: "Itaú Unibanco" },
    { ticker: "BBDC4", name: "Banco Bradesco S.A.", sector: "Intermediários Financeiros", price: 14.80, change: -1.10, high: 15.05, low: 14.70, volume: 9300000, company: "Bradesco" },
    { ticker: "ABEV3", name: "Ambev S.A.", sector: "Bebidas", price: 12.15, change: 0.10, high: 12.30, low: 12.10, volume: 5100000, company: "Ambev" },
    { ticker: "BBAS3", name: "Banco do Brasil S.A.", sector: "Intermediários Financeiros", price: 27.95, change: 1.80, high: 28.15, low: 27.50, volume: 6400000, company: "Banco do Brasil" },
    { ticker: "MGLU3", name: "Magazine Luiza S.A.", sector: "Comércio Varejista", price: 11.20, change: -3.45, high: 11.65, low: 11.15, volume: 14500000, company: "Magazine Luiza" },
    { ticker: "WEGE3", name: "WEG S.A.", sector: "Bens de Capital", price: 41.60, change: 1.55, high: 41.90, low: 41.10, volume: 3800000, company: "WEG" },
    { ticker: "SANB11", name: "Banco Santander (Brasil) S.A.", sector: "Intermediários Financeiros", price: 29.10, change: -0.30, high: 29.40, low: 29.00, volume: 2100000, company: "Santander" },
    { ticker: "ITSA4", name: "Itaúsa S.A.", sector: "Holdings Diversificadas", price: 10.05, change: 0.50, high: 10.15, low: 10.00, volume: 4900000, company: "Itaúsa" },
    { ticker: "BOVA11", name: "iShares Ibovespa Index Fund (ETF)", sector: "Fundos de Índice", price: 124.50, change: 0.82, high: 125.10, low: 123.95, volume: 3200000, company: "ETF Ibovespa" },
    { ticker: "USIM5", name: "Usinas Siderúrgicas de Minas Gerais S.A.", sector: "Siderurgia", price: 7.45, change: -1.20, high: 7.60, low: 7.40, volume: 1700000, company: "Usiminas" },
    { ticker: "CSNA3", name: "Companhia Siderúrgica Nacional", sector: "Siderurgia", price: 13.85, change: 2.10, company: "CSN" },
    { ticker: "ELET3", name: "Centrais Elétricas Brasileiras S.A.", sector: "Energia Elétrica", price: 39.80, change: 0.75, high: 40.10, low: 39.55, volume: 4200000, company: "Eletrobras" },
    { ticker: "RENT3", name: "Localiza Rent a Car S.A.", sector: "Aluguel de Carros", price: 54.30, change: -1.40, high: 55.40, low: 54.10, volume: 3100000, company: "Localiza" },
    { ticker: "LREN3", name: "Lojas Renner S.A.", sector: "Tecidos, Vestuário e Calçados", price: 17.65, change: -0.25, high: 17.90, low: 17.50, volume: 2900000, company: "Lojas Renner" },
  ]);

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Real-time toast notifications
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Set default active stock to PETR4 on first load
  useEffect(() => {
    if (stockCatalog.length > 0 && !selectedStock) {
      setSelectedStock(stockCatalog[0]);
    }
  }, [stockCatalog]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load user session on boot
  useEffect(() => {
    const savedUser = localStorage.getItem("current_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      loadUserData(parsed.id);
    }
  }, []);

  const loadUserData = (userId: string) => {
    // Portfolio
    let userTransactions = [];
    const savedPortfolio = localStorage.getItem(`portfolio_${userId}`);
    if (savedPortfolio) {
      userTransactions = JSON.parse(savedPortfolio);
      setTransactions(userTransactions);
    } else {
      setTransactions([]);
    }

    // Alerts
    const savedAlerts = localStorage.getItem(`alerts_${userId}`);
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    } else {
      setAlerts([]);
    }

    // Favorites
    const savedFavorites = localStorage.getItem(`favorites_${userId}`);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    } else {
      setFavorites(["PETR4", "VALE3", "ITUB4"]);
    }

    // Recalculate and update the balance dynamically
    // COMPRA adds, VENDA subtracts to represent asset balance
    const calculatedBalance = userTransactions.reduce((acc: number, t: any) => {
      const value = t.quantity * t.price;
      return t.type === "COMPRA" ? acc + value : acc - value;
    }, 0.0);

    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, balance: calculatedBalance };
      localStorage.setItem("current_user", JSON.stringify(updated));
      return updated;
    });

    // Also sync the local users store in localStorage
    const localUsers = JSON.parse(localStorage.getItem("b3_users") || "[]");
    const updatedLocal = localUsers.map((u: any) => u.id === userId ? { ...u, balance: calculatedBalance } : u);
    localStorage.setItem("b3_users", JSON.stringify(updatedLocal));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    loadUserData(user.id);
  };

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    setCurrentUser(null);
    setTransactions([]);
    setAlerts([]);
    setFavorites([]);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      // 1. Delete user document from Firestore
      try {
        await deleteDoc(doc(db, "users", currentUser.id));
      } catch (e) {
        console.warn("Could not delete from Firestore:", e);
      }
      
      // 2. Delete user from Firebase Auth if online
      const fUser = auth.currentUser;
      if (fUser) {
        await deleteUser(fUser);
      }
    } catch (e) {
      console.warn("Firebase Auth account deletion requires recent sign-in or failed:", e);
    }

    // 3. Remove user from local registries
    const localUsers = JSON.parse(localStorage.getItem("b3_users") || "[]");
    const updatedLocal = localUsers.filter((u: any) => u.id !== currentUser.id && u.email !== currentUser.email);
    localStorage.setItem("b3_users", JSON.stringify(updatedLocal));

    // 4. Remove user data from localStorage
    localStorage.removeItem(`portfolio_${currentUser.id}`);
    localStorage.removeItem(`alerts_${currentUser.id}`);
    localStorage.removeItem(`favorites_${currentUser.id}`);
    localStorage.removeItem("current_user");

    // 5. Reset App state
    setCurrentUser(null);
    setTransactions([]);
    setAlerts([]);
    setFavorites([]);
    setShowDeleteConfirm(false);

    alert("Sua conta e todos os dados associados foram excluídos com sucesso.");
  };

  // Real-time market tick simulation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setStockCatalog((prevCatalog) => {
        const updated = prevCatalog.map((stock) => {
          // slight random walk deviation +/- 0.15%
          const changePct = (Math.random() - 0.5) * 0.3; 
          const currentPrice = stock.price;
          const priceChange = currentPrice * (changePct / 100);
          const newPrice = Number((currentPrice + priceChange).toFixed(2));
          const totalDayChange = Number((stock.change + changePct).toFixed(2));
          
          return {
            ...stock,
            price: newPrice,
            change: totalDayChange,
            high: stock.high && newPrice > stock.high ? newPrice : stock.high,
            low: stock.low && newPrice < stock.low ? newPrice : stock.low,
          };
        });

        // Sync the active selected stock's prices
        if (selectedStock) {
          const freshSelected = updated.find((s) => s.ticker === selectedStock.ticker);
          if (freshSelected) {
            setSelectedStock(freshSelected);
          }
        }

        // Process trigger alerts
        if (currentUser) {
          setAlerts((prevAlerts) => {
            let alertChanged = false;
            const processed = prevAlerts.map((alert) => {
              if (!alert.active || alert.triggeredAt) return alert;

              const matchStock = updated.find((s) => s.ticker === alert.ticker);
              if (!matchStock) return alert;

              let triggered = false;
              if (alert.type === "PRICE_ABOVE" && matchStock.price >= alert.value) {
                triggered = true;
              } else if (alert.type === "PRICE_BELOW" && matchStock.price <= alert.value) {
                triggered = true;
              } else if (alert.type === "PERCENT_CHANGE" && Math.abs(matchStock.change) >= alert.value) {
                triggered = true;
              }

              if (triggered) {
                alertChanged = true;
                const message = `ALERTA DISPARADO: O ativo ${alert.ticker} cruzou a métrica estipulada de R$ ${alert.value.toFixed(2)} (Preço Atual: R$ ${matchStock.price.toFixed(2)})!`;
                setActiveNotification(message);
                
                // Play alert notification sound
                playNotificationSound();
                
                // Clear toast after 6 seconds
                setTimeout(() => {
                  setActiveNotification(null);
                }, 6000);

                return {
                  ...alert,
                  active: false,
                  triggeredAt: new Date().toISOString(),
                };
              }
              return alert;
            });

            if (alertChanged) {
              localStorage.setItem(`alerts_${currentUser.id}`, JSON.stringify(processed));
            }
            return processed;
          });
        }

        return updated;
      });
    }, 6000); // Trigger ticks every 6 seconds

    return () => clearInterval(timer);
  }, [selectedStock, currentUser]);

  // Favorite manipulation
  const toggleFavorite = (ticker: string) => {
    if (!currentUser) return;
    let nextFavorites;
    if (favorites.includes(ticker)) {
      nextFavorites = favorites.filter((t) => t !== ticker);
    } else {
      nextFavorites = [...favorites, ticker];
    }
    setFavorites(nextFavorites);
    localStorage.setItem(`favorites_${currentUser.id}`, JSON.stringify(nextFavorites));
  };

  // Transaction manipulation
  const addTransaction = (t: Omit<Transaction, "id">) => {
    if (!currentUser) return;
    const newTransaction: Transaction = {
      ...t,
      id: "tx_" + Date.now(),
    };
    const nextList = [newTransaction, ...transactions];
    setTransactions(nextList);
    localStorage.setItem(`portfolio_${currentUser.id}`, JSON.stringify(nextList));

    // COMPRA adds to portfolio balance, VENDA subtracts from portfolio balance
    const delta = t.type === "COMPRA" ? (t.quantity * t.price) : -(t.quantity * t.price);
    const nextBalance = currentUser.balance + delta;

    const updatedUser = {
      ...currentUser,
      balance: nextBalance,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem("current_user", JSON.stringify(updatedUser));

    // Sync local users registry
    const localUsers = JSON.parse(localStorage.getItem("b3_users") || "[]");
    const updatedLocal = localUsers.map((u: any) => u.id === currentUser.id ? { ...u, balance: nextBalance } : u);
    localStorage.setItem("b3_users", JSON.stringify(updatedLocal));

    // Firebase Firestore synchronization
    try {
      setDoc(doc(db, "users", currentUser.id, "transactions", newTransaction.id), newTransaction);
      setDoc(doc(db, "users", currentUser.id), { balance: nextBalance }, { merge: true });
    } catch (fsErr) {
      console.warn("Firestore transactions sync failed:", fsErr);
    }
  };

  const deleteTransaction = (id: string) => {
    if (!currentUser) return;
    const deletedTx = transactions.find(t => t.id === id);
    const nextList = transactions.filter((t) => t.id !== id);
    setTransactions(nextList);
    localStorage.setItem(`portfolio_${currentUser.id}`, JSON.stringify(nextList));

    if (deletedTx) {
      // Reversing the transaction reverses the delta
      const delta = deletedTx.type === "COMPRA" ? -(deletedTx.quantity * deletedTx.price) : (deletedTx.quantity * deletedTx.price);
      const nextBalance = currentUser.balance + delta;

      const updatedUser = {
        ...currentUser,
        balance: nextBalance,
      };
      setCurrentUser(updatedUser);
      localStorage.setItem("current_user", JSON.stringify(updatedUser));

      const localUsers = JSON.parse(localStorage.getItem("b3_users") || "[]");
      const updatedLocal = localUsers.map((u: any) => u.id === currentUser.id ? { ...u, balance: nextBalance } : u);
      localStorage.setItem("b3_users", JSON.stringify(updatedLocal));

      // Firebase Firestore synchronization
      try {
        deleteDoc(doc(db, "users", currentUser.id, "transactions", id));
        setDoc(doc(db, "users", currentUser.id), { balance: nextBalance }, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore transaction deletion sync failed:", fsErr);
      }
    }
  };

  // Alerts manipulation
  const addAlert = (a: Omit<Alert, "id" | "active">) => {
    if (!currentUser) return;
    const newAlert: Alert = {
      ...a,
      id: "alert_" + Date.now(),
      active: true,
    };
    const nextList = [newAlert, ...alerts];
    setAlerts(nextList);
    localStorage.setItem(`alerts_${currentUser.id}`, JSON.stringify(nextList));

    // Firebase Firestore synchronization
    try {
      setDoc(doc(db, "users", currentUser.id, "alerts", newAlert.id), newAlert);
    } catch (fsErr) {
      console.warn("Firestore alerts sync failed:", fsErr);
    }
  };

  const deleteAlert = (id: string) => {
    if (!currentUser) return;
    const nextList = alerts.filter((a) => a.id !== id);
    setAlerts(nextList);
    localStorage.setItem(`alerts_${currentUser.id}`, JSON.stringify(nextList));

    // Firebase Firestore synchronization
    try {
      deleteDoc(doc(db, "users", currentUser.id, "alerts", id));
    } catch (fsErr) {
      console.warn("Firestore alert deletion failed:", fsErr);
    }
  };

  const toggleAlert = (id: string) => {
    if (!currentUser) return;
    let updated: Alert | null = null;
    const nextList = alerts.map((a) => {
      if (a.id === id) {
        updated = { ...a, active: !a.active };
        return updated;
      }
      return a;
    });
    setAlerts(nextList);
    localStorage.setItem(`alerts_${currentUser.id}`, JSON.stringify(nextList));

    // Firebase Firestore synchronization
    if (updated) {
      try {
        setDoc(doc(db, "users", currentUser.id, "alerts", id), updated);
      } catch (fsErr) {
        console.warn("Firestore alert update failed:", fsErr);
      }
    }
  };

  // Search stock select
  const handleSelectStock = (stock: Stock) => {
    // Check if the stock already exists in catalog
    const matched = stockCatalog.find((s) => s.ticker === stock.ticker);
    if (matched) {
      setSelectedStock(matched);
    } else {
      // dynamic stock insertion
      const newStock: Stock = {
        ...stock,
        high: stock.price ? stock.price * 1.02 : 10.20,
        low: stock.price ? stock.price * 0.98 : 9.80,
        volume: 500000,
      };
      setStockCatalog((prev) => [newStock, ...prev]);
      setSelectedStock(newStock);
    }
    setActiveTab("dashboard");
  };

  const handleSelectStockByTicker = (ticker: string) => {
    const matched = stockCatalog.find((s) => s.ticker === ticker);
    if (matched) {
      setSelectedStock(matched);
      setActiveTab("dashboard");
    }
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e8f0] font-sans flex flex-col relative antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Account Deletion Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-slide-in">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-tight">Excluir Sua Conta?</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Esta ação é **irreversível**. Todos os seus dados de custódia, transações, alertas e favoritos serão excluídos do terminal em nuvem e do armazenamento local permanentemente.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Sim, Excluir Definitivamente
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-[#111111] border border-[#222] hover:bg-[#161616] text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Floating Alert Banner */}
      {activeNotification && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-[#0a0a0a] border border-emerald-500 rounded-xl p-4 shadow-2xl flex gap-3 animate-slide-in items-start">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider block">ALERTA DISPARADO</span>
            <p className="text-xs text-gray-300 mt-1 font-mono leading-normal font-medium">{activeNotification}</p>
          </div>
          <button 
            onClick={() => setActiveNotification(null)}
            className="text-xs text-gray-500 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Topbar Header */}
      <header className="bg-[#0a0a0a]/90 border-b border-[#222] sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-4.5 h-4.5 text-[#050505] stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              B3 <span className="text-emerald-400 font-medium text-xs px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">SMART</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Intelligent Terminal</p>
          </div>
        </div>

        {/* Desktop Main Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#050505] p-1 border border-[#222] rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#161616] text-emerald-400 font-bold border border-[#333]"
                : "text-gray-450 hover:text-white border border-transparent"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Análise Técnica & IA
          </button>
          <button
            onClick={() => setActiveTab("carteira")}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "carteira"
                ? "bg-[#161616] text-blue-400 font-bold border border-[#333]"
                : "text-gray-450 hover:text-white border border-transparent"
            }`}
          >
            <Wallet className="w-4 h-4" /> Minha Carteira
          </button>
          <button
            onClick={() => setActiveTab("alertas")}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "alertas"
                ? "bg-[#161616] text-emerald-400 font-bold border border-[#333]"
                : "text-gray-450 hover:text-white border border-transparent"
            }`}
          >
            <Bell className="w-4 h-4" /> Alertas & Favoritos
          </button>
          {currentUser.email === "duque.majores@gmail.com" && currentUser.id !== "demo-user-1" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-[#161616] text-gray-300 font-bold border border-[#333]"
                  : "text-gray-450 hover:text-white border border-transparent"
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Admin Panel
            </button>
          )}
        </nav>

        {/* Right User block with logout */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2.5 bg-[#111111] border border-[#222] px-3 py-1.5 rounded-xl font-mono text-xs">
            <UserIcon className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-300 font-bold">{currentUser.name}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Saldo:</span>
            <span className="text-emerald-400 font-bold">R$ {currentUser.balance.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</span>
          </div>

          {/* Excluir Conta Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Excluir Minha Conta"
            className="p-2 bg-[#111111] hover:bg-red-950/20 border border-red-500/20 text-gray-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>

          <button
            onClick={handleLogout}
            title="Desconectar Terminal"
            className="p-2 bg-[#111111] hover:bg-red-950/20 border border-[#222] hover:border-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-450 hover:text-white bg-[#111111] rounded-xl border border-[#222]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-[#0a0a0a] border-b border-[#222] px-6 py-4 flex flex-col gap-2 text-sm font-semibold relative z-30">
          <button
            onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
            className={`p-3 rounded-lg flex items-center gap-2.5 ${
              activeTab === "dashboard" ? "bg-[#161616] text-emerald-400 border border-[#333]" : "text-gray-450"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Análise Técnica & IA
          </button>
          <button
            onClick={() => { setActiveTab("carteira"); setIsMobileMenuOpen(false); }}
            className={`p-3 rounded-lg flex items-center gap-2.5 ${
              activeTab === "carteira" ? "bg-[#161616] text-blue-400 border border-[#333]" : "text-gray-450"
            }`}
          >
            <Wallet className="w-4 h-4" /> Minha Carteira
          </button>
          <button
            onClick={() => { setActiveTab("alertas"); setIsMobileMenuOpen(false); }}
            className={`p-3 rounded-lg flex items-center gap-2.5 ${
              activeTab === "alertas" ? "bg-[#161616] text-emerald-400 border border-[#333]" : "text-gray-450"
            }`}
          >
            <Bell className="w-4 h-4" /> Alertas & Favoritos
          </button>
          {currentUser.email === "duque.majores@gmail.com" && currentUser.id !== "demo-user-1" && (
            <button
              onClick={() => { setActiveTab("admin"); setIsMobileMenuOpen(false); }}
              className={`p-3 rounded-lg flex items-center gap-2.5 ${
                activeTab === "admin" ? "bg-[#161616] text-gray-300 border border-[#333]" : "text-gray-450"
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Admin Panel
            </button>
          )}
          <div className="border-t border-[#222] mt-2 pt-3 flex flex-col gap-1 font-mono text-xs text-gray-550">
            <span className="text-gray-500">INVESTIDOR: {currentUser.name}</span>
            <span>CAIXA DISPONÍVEL: <span className="text-emerald-400 font-bold">R$ {currentUser.balance.toLocaleString("pt-BR")}</span></span>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Ticker Search Box is persistent on top of the active viewport layout as requested */}
        {activeTab === "dashboard" && (
          <SearchBox onSelectStock={handleSelectStock} selectedTicker={selectedStock?.ticker} />
        )}

        {/* View Router */}
        {activeTab === "dashboard" && selectedStock && (
          <StockDetails 
            stock={selectedStock} 
            onAddToFavorites={toggleFavorite} 
            isFavorite={favorites.includes(selectedStock.ticker)} 
          />
        )}

        {activeTab === "carteira" && (
          <Portfolio 
            transactions={transactions} 
            onAddTransaction={addTransaction} 
            onDeleteTransaction={deleteTransaction} 
            stockCatalog={stockCatalog} 
            onAnalyzeStock={handleSelectStock} 
          />
        )}

        {activeTab === "alertas" && (
          <AlertsPanel 
            alerts={alerts} 
            onAddAlert={addAlert} 
            onDeleteAlert={deleteAlert} 
            onToggleAlert={toggleAlert} 
            stockCatalog={stockCatalog} 
            favorites={favorites} 
            onSelectStockByTicker={handleSelectStockByTicker} 
          />
        )}

        {activeTab === "admin" && currentUser.email === "duque.majores@gmail.com" && currentUser.id !== "demo-user-1" && (
          <AdminPanel />
        )}
      </main>

      {/* Bloomberg style ticker bar bottom */}
      <footer className="bg-[#020202] border-t border-[#222] px-6 py-3 flex items-center justify-between text-[10px] font-mono text-gray-500 select-none overflow-x-auto gap-4 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <span className="text-emerald-500 font-bold tracking-wider">B3 SMART TICKER:</span>
          {stockCatalog.slice(0, 6).map((s) => (
            <span key={s.ticker} className="flex items-center gap-1">
              <span className="text-white font-bold">{s.ticker}</span>
              <span className="text-gray-400">R$ {s.price.toFixed(2)}</span>
              <span className={`font-bold flex items-center ${s.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {s.change >= 0 ? "▲" : "▼"}{Math.abs(s.change).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span>LATÊNCIA: <span className="text-emerald-400 font-bold">D-0 REALTIME FEED</span></span>
          <span>|</span>
          <span>PLATAFORMA INTELIGENTE</span>
        </div>
      </footer>
    </div>
  );
}
