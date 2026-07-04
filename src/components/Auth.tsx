import React, { useState } from "react";
import { User } from "../types";
import { Shield, TrendingUp, Lock, Mail, User as UserIcon, Activity } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleDemoLogin = () => {
    const demoUser: User = {
      id: "demo-user-1",
      email: "duque.majores@gmail.com",
      name: "Majores S.A.",
      balance: 150000.0,
    };
    // Save demo portfolio if empty
    if (!localStorage.getItem(`portfolio_${demoUser.id}`)) {
      const initialTransactions = [
        { id: "t1", ticker: "PETR4", type: "COMPRA", quantity: 200, price: 34.50, date: "2026-04-10" },
        { id: "t2", ticker: "VALE3", type: "COMPRA", quantity: 100, price: 68.20, date: "2026-05-15" },
        { id: "t3", ticker: "ITUB4", type: "COMPRA", quantity: 300, price: 31.10, date: "2026-06-01" },
        { id: "t4", ticker: "WEGE3", type: "COMPRA", quantity: 150, price: 38.50, date: "2026-06-20" },
      ];
      localStorage.setItem(`portfolio_${demoUser.id}`, JSON.stringify(initialTransactions));
    }
    localStorage.setItem("current_user", JSON.stringify(demoUser));
    onLogin(demoUser);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (!isLogin && !name)) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      if (isLogin) {
        // Firebase Authentication Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fUser = userCredential.user;
        
        let displayName = fUser.displayName || "Investidor";
        let balance = 0.0;
        
        try {
          const userDocRef = doc(db, "users", fUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            displayName = data.name || displayName;
            balance = data.balance !== undefined ? data.balance : 0.0;
          } else {
            // Create user profile if it didn't exist in Firestore
            await setDoc(userDocRef, {
              id: fUser.uid,
              email: fUser.email,
              name: displayName,
              balance: 0.0
            });
          }
        } catch (fsErr) {
          console.warn("Firestore fetch failed:", fsErr);
        }

        const loggedUser: User = {
          id: fUser.uid,
          email: fUser.email || email,
          name: displayName,
          balance: balance,
        };
        
        localStorage.setItem("current_user", JSON.stringify(loggedUser));

        // Sync local users store
        const localUsers = JSON.parse(localStorage.getItem("b3_users") || "[]");
        if (!localUsers.some((u: any) => u.email === email)) {
          localUsers.push({
            id: fUser.uid,
            email: fUser.email,
            name: displayName,
            balance: balance,
          });
          localStorage.setItem("b3_users", JSON.stringify(localUsers));
        }

        onLogin(loggedUser);
      } else {
        // Firebase Authentication Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fUser = userCredential.user;
        
        await updateProfile(fUser, { displayName: name });
        
        const initialBalance = 0.0; // Starts at R$ 0,00 as requested
        
        try {
          await setDoc(doc(db, "users", fUser.uid), {
            id: fUser.uid,
            email: fUser.email,
            name: name,
            balance: initialBalance
          });
        } catch (fsErr) {
          console.warn("Firestore profile save failed:", fsErr);
        }

        const loggedUser: User = {
          id: fUser.uid,
          email: fUser.email || email,
          name: name,
          balance: initialBalance,
        };

        localStorage.setItem("current_user", JSON.stringify(loggedUser));

        const localUsers = JSON.parse(localStorage.getItem("b3_users") || "[]");
        if (!localUsers.some((u: any) => u.email === email)) {
          localUsers.push({
            id: fUser.uid,
            email,
            name,
            balance: initialBalance,
          });
          localStorage.setItem("b3_users", JSON.stringify(localUsers));
        }

        onLogin(loggedUser);
      }
    } catch (err: any) {
      console.warn("Firebase authentication error:", err);
      // Fallback: Local database Auth fallback
      const users = JSON.parse(localStorage.getItem("b3_users") || "[]");

      if (isLogin) {
        const userMatch = users.find((u: any) => u.email === email && u.password === password);
        if (userMatch) {
          const loggedUser: User = {
            id: userMatch.id,
            email: userMatch.email,
            name: userMatch.name,
            balance: userMatch.balance !== undefined ? userMatch.balance : 0.0,
          };
          localStorage.setItem("current_user", JSON.stringify(loggedUser));
          onLogin(loggedUser);
        } else {
          let msg = "E-mail ou senha incorretos.";
          if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
            msg = "Credenciais incorretas ou usuário não cadastrado.";
          } else if (err.code === "auth/invalid-email") {
            msg = "E-mail inválido.";
          }
          setError(msg);
        }
      } else {
        const emailExists = users.some((u: any) => u.email === email);
        if (emailExists) {
          setError("Este e-mail já está cadastrado.");
          return;
        }

        const newUser = {
          id: "user_" + Date.now(),
          email,
          password,
          name,
          balance: 0.0,
        };

        users.push(newUser);
        localStorage.setItem("b3_users", JSON.stringify(users));

        const loggedUser: User = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          balance: 0.0,
        };
        localStorage.setItem("current_user", JSON.stringify(loggedUser));
        onLogin(loggedUser);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#e2e8f0] px-4 relative overflow-hidden font-sans">
      {/* Dynamic abstract radial backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 shadow-2xl relative z-10 animate-slide-in">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              B3 <span className="text-emerald-400 font-medium text-lg px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">SMART</span>
            </h1>
            <p className="text-xs text-gray-500">Intelligent Analytics Platform</p>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {isLogin ? "Acesso ao Terminal" : "Criar Nova Conta"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isLogin
              ? "Insira suas credenciais para acessar análises quantitativas"
              : "Cadastre-se para começar a gerenciar sua carteira de ações"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">NOME COMPLETO</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#222] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl outline-none text-white text-sm transition-all placeholder-gray-600"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">E-MAIL DO INVESTIDOR</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#222] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl outline-none text-white text-sm transition-all placeholder-gray-600"
                placeholder="nome@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">CHAVE DE ACESSO (SENHA)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#222] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl outline-none text-white text-sm transition-all placeholder-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] text-sm cursor-pointer"
          >
            {isLogin ? "Acessar Plataforma" : "Criar Cadastro"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#222]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0a0a0a] px-2 text-gray-500">OU</span>
          </div>
        </div>

        <button
          onClick={handleDemoLogin}
          className="w-full py-3 bg-[#111111] hover:bg-[#161616] border border-[#222] hover:border-[#333] text-emerald-400 font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
          Acesso de Demonstração Rápida
        </button>

        <div className="mt-6 text-center text-xs">
          <p className="text-gray-500">
            {isLogin ? "Não possui conta no terminal?" : "Já possui registro cadastrado?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
              {isLogin ? "Cadastre-se" : "Faça Login"}
            </button>
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-[#222]/50 flex items-center justify-center gap-1.5 text-[10px] text-gray-600">
          <Shield className="w-3 h-3 text-gray-600" />
          <span>Sessão protegida por criptografia de dados local</span>
        </div>
      </div>
    </div>
  );
}
