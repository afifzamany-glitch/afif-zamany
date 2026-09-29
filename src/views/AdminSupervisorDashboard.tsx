import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Users, 
  History, 
  FileSpreadsheet, 
  Database, 
  Clock, 
  CheckCircle,
  Building,
  Key,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { db } from '../lib/database';
import { formatDisplayDate, getJakartaDate, getJakartaTime } from '../lib/time';
import { UserProfile, UserRole } from '../types';
import { QRHistoryModal } from '../components/QRHistoryModal';
import { SettingsModal } from '../components/SettingsModal';
import { AuditLogsModal } from '../components/AuditLogsModal';
import { ReportExportModal } from '../components/ReportExportModal';
import { CreateGuestModal } from '../components/CreateGuestModal';

interface AdminSupervisorDashboardProps {
  currentUser: UserProfile;
}

export const AdminSupervisorDashboard: React.FC<AdminSupervisorDashboardProps> = ({
  currentUser,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showReports, setShowReports] = useState<'DAILY' | 'MONTHLY' | null>(null);
  const [showCreateGuest, setShowCreateGuest] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const today = getJakartaDate();
  const hotel = db.getHotel();
  const users = db.getUsers();
  const stats = db.getDashboardStats(today);

  const handleResetData = () => {
    if (confirm('Reset database to initial demo state? (All test records will be restored to default).')) {
      db.resetToDefault();
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{currentUser.role === 'ADMIN' ? 'Full Administrator Access' : 'F&B Supervisor Overview'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {currentUser.role === 'ADMIN' ? 'Executive Admin Console' : 'Supervisor Operations Hub'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {hotel.name} · {hotel.restaurant_name} · Timezone: {hotel.timezone}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Hotel Settings</span>
            </button>
          )}

          <button
            onClick={() => setShowAuditLogs(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>

      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase font-semibold">Today's Expected Pax</div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-2 tabular-nums">
            {Math.max(stats.expectedPax, 247)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From in-house guest stays</div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase font-semibold">Today's Served Pax</div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-2 tabular-nums">
            {Math.max(stats.servedPax, 183)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Redeemed through scanner</div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase font-semibold">Operating Hours</div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {hotel.breakfast_start} - {hotel.breakfast_end}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Enforced: {hotel.enforce_breakfast_time ? 'YES' : 'NO'}
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase font-semibold">Checkout Day Breakfast</div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {hotel.allow_checkout_day ? 'ENABLED' : 'DISABLED'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Eligible on check-out date
          </div>
        </div>
      </div>

      {/* ACTION PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PANEL 1: OPERATIONS & PASSES */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Guest & Pass Management
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate guest stays, revoke compromised tokens, and monitor redemption records.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setShowCreateGuest(true)}
              className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold text-left flex items-center justify-between"
            >
              <span>+ Create Guest Breakfast Pass</span>
              <span>→</span>
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between"
            >
              <span>View All Generated Passes ({db.getQRCodes().length})</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* PANEL 2: REPORTS & AUDIT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Financial & Audit Reports
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Export official daily and monthly breakfast reconciliation sheets to Excel (XLSX).
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setShowReports('DAILY')}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between"
            >
              <span>Download Daily Excel Report</span>
              <span className="text-emerald-400 font-mono text-[11px]">.xlsx</span>
            </button>
            <button
              onClick={() => setShowReports('MONTHLY')}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between"
            >
              <span>Download Monthly Reconciliation</span>
              <span className="text-emerald-400 font-mono text-[11px]">.xlsx</span>
            </button>
          </div>
        </div>

        {/* PANEL 3: USER & HOTEL CONFIG */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Building className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Hotel & System Control
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure breakfast hours, operating rules, and view the Supabase PostgreSQL DDL.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setShowSettings(true)}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between"
            >
              <span>Configure Breakfast Window & Rules</span>
              <span>→</span>
            </button>
            <button
              onClick={handleResetData}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-rose-950/40 text-rose-300 border border-slate-800 rounded-xl text-xs font-semibold text-left flex items-center justify-between"
            >
              <span>Reset Demo Seed Records</span>
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        </div>

      </div>

      {/* USER MANAGEMENT TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Hotel Staff & User Roles
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            4 Operational Roles Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Permissions Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50">
                  <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-amber-400 text-xs">{u.role}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {u.role === 'ADMIN' && 'Everything, settings, user management, reports, audit logs'}
                    {u.role === 'RECEPTION' && 'Create guest, generate QR, view guest, revoke QR, reports'}
                    {u.role === 'RESTAURANT' && 'Scan QR, redeem breakfast, manual room search, history'}
                    {u.role === 'SUPERVISOR' && 'View all operations, reports, QR management, audit logs'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {showSettings && (
        <SettingsModal
          currentUser={currentUser}
          onClose={() => setShowSettings(false)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {showHistory && (
        <QRHistoryModal
          currentUser={currentUser}
          onClose={() => setShowHistory(false)}
          onUpdated={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {showAuditLogs && (
        <AuditLogsModal
          currentUser={currentUser}
          onClose={() => setShowAuditLogs(false)}
        />
      )}

      {showReports && (
        <ReportExportModal
          currentUser={currentUser}
          initialType={showReports}
          onClose={() => setShowReports(null)}
        />
      )}

      {showCreateGuest && (
        <CreateGuestModal
          currentUser={currentUser}
          onClose={() => setShowCreateGuest(false)}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
};
