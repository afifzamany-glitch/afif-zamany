import React from 'react';
import { LogOut, Settings, Clock, User, Shield, Utensils, QrCode } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { getJakartaDate, getJakartaTime, getSimulatedTime } from '../lib/time';

interface HeaderProps {
  currentUser: UserProfile;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  onOpenSettings,
}) => {
  const isSimulated = !!getSimulatedTime();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Title (Single element display) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white leading-tight">
              Grand Tjokro Yogyakarta
            </span>
            <span className="text-[11px] font-semibold text-amber-400/90 tracking-wider uppercase">
              Tjokro Resto · Breakfast System
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean typography, role-aware) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          {(currentUser.role === 'RECEPTION' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
            <button
              onClick={() => onSelectTab('reception')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'reception'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Reception
            </button>
          )}

          {(currentUser.role === 'RESTAURANT' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
            <button
              onClick={() => onSelectTab('restaurant')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'restaurant'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Restaurant Scanner
            </button>
          )}

          {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {currentUser.role === 'ADMIN' ? 'Admin Console' : 'Supervisor Overview'}
            </button>
          )}
        </nav>

        {/* Zone 3: Actions (PWA install, time indicator, profile, logout) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Real-time Asia/Jakarta clock */}
          <div 
            onClick={onOpenSettings}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer ${
              isSimulated 
                ? 'bg-sky-950/60 text-sky-300 border-sky-600/40' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Click to open time simulator / settings"
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{getJakartaTime()} WIB</span>
            {isSimulated && <span className="text-[9px] uppercase font-sans text-sky-400 font-bold">(Sim)</span>}
          </div>

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Settings button for Admin / Supervisor */}
          {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition"
              title="Hotel Settings & Simulation"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Current User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Mobile sub-nav bar for quick switching */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 py-2 bg-slate-900/60 px-2">
        {(currentUser.role === 'RECEPTION' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
          <button
            onClick={() => onSelectTab('reception')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg ${
              activeTab === 'reception' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Reception
          </button>
        )}
        {(currentUser.role === 'RESTAURANT' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
          <button
            onClick={() => onSelectTab('restaurant')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg ${
              activeTab === 'restaurant' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Restaurant
          </button>
        )}
        {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg ${
              activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            {currentUser.role === 'ADMIN' ? 'Admin' : 'Supervisor'}
          </button>
        )}
      </div>
    </header>
  );
};
