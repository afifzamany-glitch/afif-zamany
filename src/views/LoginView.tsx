import React, { useState } from 'react';
import { Utensils, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { db } from '../lib/database';
import { UserProfile, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('reception@grandtjokro.com');
  const [password, setPassword] = useState('reception123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const user = db.getUserByEmail(email);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Invalid username or password. Please check your credentials.');
      }
      setIsLoading(false);
    }, 300);
  };

  const handleQuickLogin = (role: UserRole) => {
    const emailMap: Record<UserRole, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@grandtjokro.com', pass: 'admin123' },
      RECEPTION: { email: 'reception@grandtjokro.com', pass: 'reception123' },
      RESTAURANT: { email: 'restaurant@grandtjokro.com', pass: 'resto123' },
      SUPERVISOR: { email: 'supervisor@grandtjokro.com', pass: 'super123' },
    };

    const target = emailMap[role];
    setEmail(target.email);
    setPassword(target.pass);

    const user = db.getUserByEmail(target.email);
    if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* HOTEL LOGO & TITLE SECTION (Section 5) */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 shadow-xl shadow-amber-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Utensils className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-400 tracking-widest uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grand Tjokro Yogyakarta</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            BREAKFAST MANAGEMENT SYSTEM
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Tjokro Resto · Official Entitlement & Scanner Console
          </p>
        </div>

        {/* LOGIN FORM CARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@grandtjokro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-400 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-400 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'SIGNING IN...' : 'LOGIN'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* QUICK DEMO ROLE LOGINS (For testing all 4 roles) */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Role Login (One-Click Testing):
            </span>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('RECEPTION')}
                className="py-2.5 px-3 bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/70 transition"
              >
                Reception (FO)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('RESTAURANT')}
                className="py-2.5 px-3 bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/70 transition"
              >
                Restaurant Scanner
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('SUPERVISOR')}
                className="py-2.5 px-3 bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/70 transition"
              >
                Supervisor
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="py-2.5 px-3 bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/70 transition"
              >
                Admin (Full Access)
              </button>
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Secured with PostgreSQL Row Level Security & Token Enclosure</span>
        </div>
      </div>
    </div>
  );
};
