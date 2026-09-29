import React, { useState } from 'react';
import { Search, X, Check, AlertTriangle, AlertCircle } from 'lucide-react';
import { db } from '../lib/database';
import { sound } from '../lib/sound';
import { formatDisplayDate, getJakartaDate } from '../lib/time';
import { UserProfile, QRVerificationResult } from '../types';

interface ManualRoomSearchModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ManualRoomSearchModal: React.FC<ManualRoomSearchModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    setSuccessMessage(null);

    const guest = db.getGuestByRoom(searchQuery.trim());
    if (!guest) {
      setVerificationResult({
        status: 'INVALID_QR',
        message: `Kamar ${searchQuery.trim()} tidak ditemukan dalam daftar tamu aktif.`,
      });
      return;
    }

    const qr = db.getQRCodeByGuestId(guest.id);
    if (!qr) {
      setVerificationResult({
        status: 'INVALID_QR',
        message: `Tidak ada tiket Breakfast QR untuk kamar ${searchQuery.trim()}.`,
      });
      return;
    }

    // Verify token with breakfast rules
    const result = db.verifyBreakfastToken(qr.token);
    setVerificationResult(result);
  };

  const handleManualRedeem = () => {
    if (!verificationResult || !verificationResult.qr_code || verificationResult.status !== 'VALID') {
      return;
    }

    setIsRedeeming(true);
    const res = db.redeemBreakfast(
      verificationResult.qr_code.id,
      'MANUAL',
      currentUser,
      'MANUAL-SEARCH-RESTO'
    );
    setIsRedeeming(false);

    if (res.success && res.usage) {
      sound.playSuccess();
      setSuccessMessage(
        `✓ Manual Check-in berhasil untuk Kamar ${verificationResult.guest?.room_number} (${verificationResult.guest?.guest_name}, ${verificationResult.guest?.pax} Pax)`
      );
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      sound.playError();
      setVerificationResult({
        status: 'ALREADY_USED',
        message: 'Telah digunakan pada scanner lain.',
        guest: verificationResult.guest,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Manual Room Search
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Search guest entitlement by room number when guest is unable to display their QR code.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Room Number (e.g. 305)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              autoFocus
            />
            <button
              type="submit"
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-bold transition"
            >
              Search
            </button>
          </form>

          {/* Quick test buttons */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Quick:</span>
            {['305', '412', '508', '201'].map((rm) => (
              <button
                key={rm}
                type="button"
                onClick={() => {
                  setSearchQuery(rm);
                  setTimeout(() => {
                    const guest = db.getGuestByRoom(rm);
                    if (guest) {
                      const qr = db.getQRCodeByGuestId(guest.id);
                      if (qr) setVerificationResult(db.verifyBreakfastToken(qr.token));
                      setHasSearched(true);
                    }
                  }, 50);
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-mono text-xs"
              >
                Room {rm}
              </button>
            ))}
          </div>

          {successMessage && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center space-y-1">
              <div className="text-emerald-400 font-bold text-sm">{successMessage}</div>
              <div className="text-[11px] text-emerald-300/70">Recorded as MANUAL redemption in report.</div>
            </div>
          )}

          {!successMessage && hasSearched && verificationResult && (
            <div className="mt-4 p-4 rounded-xl border bg-slate-950/70 border-slate-800 space-y-3">
              {verificationResult.guest ? (
                <>
                  <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                    <div>
                      <div className="text-xl font-bold text-amber-400 font-mono">
                        Room {verificationResult.guest.room_number}
                      </div>
                      <div className="text-sm font-semibold text-slate-200">
                        {verificationResult.guest.guest_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Entitlement</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {verificationResult.guest.pax} PAX
                      </div>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Breakfast Date:</span>
                      <span className="font-semibold text-white">
                        {formatDisplayDate(getJakartaDate())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Stay Period:</span>
                      <span>
                        {formatDisplayDate(verificationResult.guest.check_in)} - {formatDisplayDate(verificationResult.guest.check_out)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-400">Entitlement Status:</span>
                      <span className={`font-bold ${
                        verificationResult.status === 'VALID' ? 'text-emerald-400' :
                        verificationResult.status === 'ALREADY_USED' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {verificationResult.status === 'VALID' ? 'ELIGIBLE TODAY' : verificationResult.status}
                      </span>
                    </div>
                  </div>

                  {verificationResult.status === 'ALREADY_USED' && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Already used at {verificationResult.used_at_str}</span>
                    </div>
                  )}

                  {verificationResult.status === 'VALID' && (
                    <button
                      onClick={handleManualRedeem}
                      disabled={isRedeeming}
                      className="w-full mt-3 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-extrabold text-sm shadow-md transition uppercase tracking-wide disabled:opacity-50"
                    >
                      {isRedeeming ? 'Processing...' : 'CHECK-IN BREAKFAST (MANUAL)'}
                    </button>
                  )}
                </>
              ) : (
                <div className="py-4 text-center text-rose-400 text-xs flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{verificationResult.message || 'Room not found or no entitlement.'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
