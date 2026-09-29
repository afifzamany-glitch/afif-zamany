import React, { useState } from 'react';
import { X, Search, Eye, Ban, Download, CheckCircle2, ShieldAlert } from 'lucide-react';
import { db } from '../lib/database';
import { formatDisplayDate } from '../lib/time';
import { UserProfile, QRCodeData, Guest } from '../types';
import { QRCodePassCard } from './QRCodePassCard';

interface QRHistoryModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onUpdated?: () => void;
}

export const QRHistoryModal: React.FC<QRHistoryModalProps> = ({
  currentUser,
  onClose,
  onUpdated,
}) => {
  const [search, setSearch] = useState('');
  const [selectedPass, setSelectedPass] = useState<{ guest: Guest; qr: QRCodeData } | null>(null);

  const qrCodes = db.getQRCodes();
  const guests = db.getGuests();

  const handleRevoke = (qrId: string, room: string) => {
    if (confirm(`Are you sure you want to REVOKE the breakfast QR for Room ${room}? This action cannot be undone.`)) {
      db.revokeQRCode(qrId, currentUser);
      if (onUpdated) onUpdated();
    }
  };

  const filtered = qrCodes.filter((qr) => {
    const guest = guests.find((g) => g.id === qr.guest_id);
    if (!guest) return false;
    const q = search.toLowerCase();
    return (
      guest.room_number.toLowerCase().includes(q) ||
      guest.guest_name.toLowerCase().includes(q) ||
      qr.token.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Breakfast QR History & Management
            </h3>
            <p className="text-xs text-slate-400">
              Audit and manage all generated breakfast pass tokens
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Room number, Guest name, or Token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto flex-1 p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Room</th>
                <th className="py-3 px-3">Guest</th>
                <th className="py-3 px-2 text-center">Pax</th>
                <th className="py-3 px-3">Stay Period</th>
                <th className="py-3 px-3">QR Status</th>
                <th className="py-3 px-3">Created At</th>
                <th className="py-3 px-3">Token</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((qr) => {
                const guest = guests.find((g) => g.id === qr.guest_id);
                if (!guest) return null;

                const isRevoked = qr.status === 'REVOKED';
                const isExpired = qr.status === 'EXPIRED';

                return (
                  <tr key={qr.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-amber-400">
                      {guest.room_number}
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-slate-200">
                      {guest.guest_name}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-300">
                      {guest.pax}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDisplayDate(guest.check_in)} - {formatDisplayDate(guest.check_out)}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        isRevoked ? 'text-rose-400' :
                        isExpired ? 'text-slate-400' : 'text-emerald-400'
                      }`}>
                        {isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(qr.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-3 text-slate-300 text-[11px]">
                      {qr.token}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => setSelectedPass({ guest, qr })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1"
                          title="View & Download QR Pass"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>View</span>
                        </button>

                        {!isRevoked && (
                          <button
                            onClick={() => handleRevoke(qr.id, guest.room_number)}
                            className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 rounded text-[11px] flex items-center gap-1 border border-rose-800/40"
                            title="Revoke QR code"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No breakfast QR passes match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal Overlay if View is clicked */}
        {selectedPass && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-white">QR Pass Preview</span>
                <button
                  onClick={() => setSelectedPass(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <QRCodePassCard
                roomNumber={selectedPass.guest.room_number}
                guestName={selectedPass.guest.guest_name}
                pax={selectedPass.guest.pax}
                token={selectedPass.qr.token}
                breakfastDate={selectedPass.guest.check_in}
                onClose={() => setSelectedPass(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
