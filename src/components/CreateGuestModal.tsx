import React, { useState } from 'react';
import { X, QrCode, Sparkles, UserPlus } from 'lucide-react';
import { db } from '../lib/database';
import { getJakartaDate } from '../lib/time';
import { UserProfile, QRCodeData, Guest } from '../types';
import { QRCodePassCard } from './QRCodePassCard';

interface CreateGuestModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateGuestModal: React.FC<CreateGuestModalProps> = ({
  currentUser,
  onClose,
  onCreated,
}) => {
  const today = getJakartaDate();
  
  // Calculate default checkout (+2 days)
  const defaultCheckout = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(defaultCheckout);
  const [pax, setPax] = useState<number>(2);

  const [createdPass, setCreatedPass] = useState<{
    guest: Guest;
    qrCode: QRCodeData;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim() || !guestName.trim() || !checkIn || !checkOut || pax < 1) {
      alert('Please fill in all required fields.');
      return;
    }

    const res = db.createGuestAndQR(
      {
        room_number: roomNumber.trim(),
        guest_name: guestName.trim(),
        check_in: checkIn,
        check_out: checkOut,
        pax: Number(pax),
      },
      currentUser
    );

    setCreatedPass({ guest: res.guest, qrCode: res.qrCode });
    if (onCreated) onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* If pass has been generated, show QR Pass preview card directly */}
        {createdPass ? (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Breakfast QR Generated</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QRCodePassCard
              roomNumber={createdPass.guest.room_number}
              guestName={createdPass.guest.guest_name}
              pax={createdPass.guest.pax}
              token={createdPass.qrCode.token}
              breakfastDate={createdPass.guest.check_in}
              onClose={onClose}
            />
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Create Guest / Breakfast QR
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Front Office Reception
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    ROOM NUMBER <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 305"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-amber-400 font-mono placeholder-slate-600 focus:outline-hidden focus:border-amber-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    NUMBER OF PAX <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={pax}
                    onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white font-mono placeholder-slate-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  GUEST NAME <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    CHECK-IN DATE <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    CHECK-OUT DATE <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed">
                A secure random token (e.g. <code>BF26-8F72K91X</code>) will be generated. Guest details are securely mapped in database and never embedded in the QR payload.
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 mt-4"
              >
                <QrCode className="w-5 h-5" />
                <span>GENERATE BREAKFAST QR</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
