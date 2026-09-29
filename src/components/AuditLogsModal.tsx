import React, { useState } from 'react';
import { X, ShieldAlert, Search, FileText } from 'lucide-react';
import { db } from '../lib/database';
import { UserProfile } from '../types';

interface AuditLogsModalProps {
  currentUser: UserProfile;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({
  currentUser,
  onClose,
}) => {
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const logs = db.getAuditLogs();

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.user_name && log.user_name.toLowerCase().includes(term)) ||
      log.entity.toLowerCase().includes(term) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Security Audit Log
              </h3>
              <p className="text-[11px] text-slate-400">
                Immutable trace of all hotel transactions, QR creations, and redemptions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            {['ALL', 'BREAKFAST_REDEEMED', 'QR_GENERATED', 'QR_REVOKED', 'GUEST_CREATED'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterAction === act
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {act.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto flex-1 p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Staff / User</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString('en-GB')}
                  </td>
                  <td className="py-2.5 px-3 font-bold font-sans">
                    <span className={`inline-block ${
                      l.action.includes('REDEEMED') ? 'text-emerald-400' :
                      l.action.includes('REVOKED') ? 'text-rose-400' :
                      l.action.includes('GENERATED') ? 'text-amber-400' : 'text-sky-400'
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-200">
                    {l.user_name || 'System / Staff'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {l.entity}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <pre className="inline text-[10px] bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                      {JSON.stringify(l.metadata || {})}
                    </pre>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    No audit records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
