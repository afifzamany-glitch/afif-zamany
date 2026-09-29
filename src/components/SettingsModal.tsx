import React, { useState } from 'react';
import { X, Settings, Database, Sliders, Clock, Copy, Check, RefreshCw } from 'lucide-react';
import { db } from '../lib/database';
import { setSimulatedTime, setSimulatedDate, getSimulatedTime, getSimulatedDate, getJakartaTime, getJakartaDate } from '../lib/time';
import { UserProfile, Hotel } from '../types';

interface SettingsModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  onClose,
  onSaved,
}) => {
  const currentHotel = db.getHotel();

  const [name, setName] = useState(currentHotel.name);
  const [restaurantName, setRestaurantName] = useState(currentHotel.restaurant_name);
  const [timezone, setTimezone] = useState(currentHotel.timezone);
  const [breakfastStart, setBreakfastStart] = useState(currentHotel.breakfast_start);
  const [breakfastEnd, setBreakfastEnd] = useState(currentHotel.breakfast_end);
  const [allowCheckoutDay, setAllowCheckoutDay] = useState(currentHotel.allow_checkout_day);
  const [enforceBreakfastTime, setEnforceBreakfastTime] = useState(currentHotel.enforce_breakfast_time);
  const [allowManualSearch, setAllowManualSearch] = useState(currentHotel.allow_manual_search);

  // Time simulation for testing outside hours
  const [activeTab, setActiveTab] = useState<'HOTEL' | 'TESTING_HOURS' | 'SUPABASE'>('HOTEL');
  const [simTime, setSimTime] = useState(getSimulatedTime() || '');
  const [simDate, setSimDate] = useState(getSimulatedDate() || '');
  const [copiedSql, setCopiedSql] = useState(false);

  // Supabase state
  const supabaseConfig = db.getSupabaseConfig() || { url: '', anonKey: '', enabled: false };
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url);
  const [sbKey, setSbKey] = useState(supabaseConfig.anonKey);
  const [sbEnabled, setSbEnabled] = useState(supabaseConfig.enabled);

  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateHotel(
      {
        name,
        restaurant_name: restaurantName,
        timezone,
        breakfast_start: breakfastStart,
        breakfast_end: breakfastEnd,
        allow_checkout_day: allowCheckoutDay,
        enforce_breakfast_time: enforceBreakfastTime,
        allow_manual_search: allowManualSearch,
      },
      currentUser
    );

    if (activeTab === 'SUPABASE') {
      db.setSupabaseConfig({
        url: sbUrl,
        anonKey: sbKey,
        enabled: sbEnabled,
      });
    }

    if (onSaved) onSaved();
    alert('Settings successfully updated!');
    onClose();
  };

  const handleApplySimulation = () => {
    setSimulatedTime(simTime.trim() || null);
    setSimulatedDate(simDate.trim() || null);
    if (onSaved) onSaved();
    alert(`Simulation applied: Time=${simTime || 'Normal (Asia/Jakarta)'}, Date=${simDate || 'Normal'}`);
  };

  const handleClearSimulation = () => {
    setSimulatedTime(null);
    setSimulatedDate(null);
    setSimTime('');
    setSimDate('');
    if (onSaved) onSaved();
    alert('Restored to live real-time Asia/Jakarta clock.');
  };

  const handleCopySql = () => {
    const sqlText = `-- PostgreSQL Schema for Grand Tjokro Yogyakarta Breakfast QR System\n-- See /supabase_schema.sql in root for full DDL with RLS and constraints.`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                System & Hotel Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Grand Tjokro Yogyakarta Breakfast Management
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('HOTEL')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'HOTEL'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Hotel & Breakfast Rules
          </button>
          <button
            onClick={() => setActiveTab('TESTING_HOURS')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'TESTING_HOURS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('SUPABASE')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'SUPABASE'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase / Database DDL</span>
          </button>
        </div>

        {/* Tab 1: Hotel Settings */}
        {activeTab === 'HOTEL' && (
          <form onSubmit={handleSaveHotel} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Hotel Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  disabled
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Breakfast Start
                </label>
                <input
                  type="time"
                  value={breakfastStart}
                  onChange={(e) => setBreakfastStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Breakfast End
                </label>
                <input
                  type="time"
                  value={breakfastEnd}
                  onChange={(e) => setBreakfastEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Operational Policies
              </h4>

              {/* Section 10: Allow breakfast on checkout day */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Allow Breakfast on Checkout Day
                  </div>
                  <div className="text-[11px] text-slate-400">
                    If YES: Guest check-in 29 Sep, checkout 01 Oct is entitled on 29 Sep, 30 Sep, and 01 Oct.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAllowCheckoutDay(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      allowCheckoutDay ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowCheckoutDay(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      !allowCheckoutDay ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>

              {/* Section 21: Enforce Breakfast Time */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Enforce Breakfast Time Window
                  </div>
                  <div className="text-[11px] text-slate-400">
                    If ON: Scans before 06:00 return "BREAKFAST NOT OPEN"; after 10:00 return "BREAKFAST CLOSED".
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEnforceBreakfastTime(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      enforceBreakfastTime ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnforceBreakfastTime(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      !enforceBreakfastTime ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Allow Manual Room Search */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Allow Manual Room Number Search
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Allows restaurant staff to redeem breakfast by entering room number when guest QR is unavailable.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowManualSearch(!allowManualSearch)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    allowManualSearch ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {allowManualSearch ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Time Simulator (Allows testing 05:30 NOT OPEN, 10:30 CLOSED, etc.) */}
        {activeTab === 'TESTING_HOURS' && (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-sky-950/40 border border-sky-800/50 rounded-2xl">
              <h4 className="text-sm font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Operating Hours Verification Simulator</span>
              </h4>
              <p className="text-xs text-sky-200/80 leading-relaxed">
                Use this tool to simulate any hour of the day to test the business rules in Section 21 without having to change your computer clock!
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Server Time (Asia/Jakarta):</span>
                <span className="font-mono font-bold text-amber-400">
                  {getJakartaDate()} · {getJakartaTime()} WIB
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Breakfast Operating Window:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {breakfastStart} - {breakfastEnd} WIB
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Simulate Time (HH:mm)
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={simTime}
                  onChange={(e) => setSimTime(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
                />
                <button
                  type="button"
                  onClick={handleApplySimulation}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Apply Time
                </button>
                <button
                  type="button"
                  onClick={handleClearSimulation}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                  title="Reset to Real Clock"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[11px] text-slate-400">Quick Test Scenarios:</span>
                <button
                  onClick={() => {
                    setSimTime('05:30');
                    setSimulatedTime('05:30');
                    if (onSaved) onSaved();
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-950 hover:text-sky-300 text-slate-300 text-[11px] border border-slate-700 font-mono"
                >
                  05:30 (Breakfast NOT OPEN)
                </button>
                <button
                  onClick={() => {
                    setSimTime('07:30');
                    setSimulatedTime('07:30');
                    if (onSaved) onSaved();
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 text-[11px] border border-slate-700 font-mono"
                >
                  07:30 (Normal Breakfast Hour)
                </button>
                <button
                  onClick={() => {
                    setSimTime('10:30');
                    setSimulatedTime('10:30');
                    if (onSaved) onSaved();
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 font-mono"
                >
                  10:30 (Breakfast CLOSED)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Supabase Configuration */}
        {activeTab === 'SUPABASE' && (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  <span>Supabase PostgreSQL Schema</span>
                </h4>
                <button
                  onClick={handleCopySql}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied' : 'Copy DDL'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The complete PostgreSQL DDL with UUID keys, <code>(qr_code_id, breakfast_date)</code> UNIQUE constraints, indexes, and Row Level Security (RLS) is located at <code>/supabase_schema.sql</code>.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase">
                Remote Supabase Project Link (Optional)
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  SUPABASE URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  SUPABASE ANON KEY
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveHotel}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
              >
                Save Supabase Config
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
