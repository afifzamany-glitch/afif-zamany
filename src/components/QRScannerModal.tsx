import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  Ban, 
  AlertTriangle, 
  Volume2, 
  Check, 
  Upload, 
  Search,
  RefreshCw
} from 'lucide-react';
import { db } from '../lib/database';
import { sound } from '../lib/sound';
import { formatDisplayDate } from '../lib/time';
import { QRVerificationResult, UserProfile } from '../types';

interface QRScannerModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onScanSuccess?: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  currentUser,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionSuccessData, setRedemptionSuccessData] = useState<{
    room: string;
    guest: string;
    pax: number;
    time: string;
  } | null>(null);

  // Manual token input for quick testing or camera fallback
  const [tokenInput, setTokenInput] = useState('');

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Request rear camera by default ('environment')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
      setHasCameraPermission(true);
      setIsScanning(true);
      scanLoop();
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings.'
          : 'Unable to access device camera. You can still test with the Token Input or File Upload.'
      );
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Frame processing loop for scanning
  const scanLoop = () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleTokenDetected(code.data);
          return; // pause loop
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanLoop);
  };

  // Called when QR is detected from camera or manual input
  const handleTokenDetected = (token: string) => {
    setIsScanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    // Verify token with backend database
    const result = db.verifyBreakfastToken(token);
    setVerificationResult(result);

    if (result.status === 'VALID') {
      // Sound feedback for valid
      sound.playSuccess();
    } else {
      // Sound feedback for warning / invalid
      sound.playError();
    }
  };

  // Check-in Breakfast Redemption Action
  const handleRedeem = () => {
    if (!verificationResult || !verificationResult.qr_code || verificationResult.status !== 'VALID') {
      return;
    }

    setIsRedeeming(true);

    // Call atomic backend transaction
    const redeemRes = db.redeemBreakfast(
      verificationResult.qr_code.id,
      'QR_SCAN',
      currentUser,
      'SCANNER-TABLET-01'
    );

    setIsRedeeming(false);

    if (redeemRes.success && redeemRes.usage) {
      // Section 19: SUCCESS RESULT
      // ✓ BREAKFAST CHECK-IN SUCCESSFUL
      // Play a short success beep. Vibrate if supported.
      sound.playSuccess();

      setRedemptionSuccessData({
        room: verificationResult.guest?.room_number || '-',
        guest: verificationResult.guest?.guest_name || '-',
        pax: verificationResult.guest?.pax || 1,
        time: redeemRes.usage.used_time_str,
      });

      if (onScanSuccess) {
        onScanSuccess();
      }

      // Automatically return to scanner after short delay (2.5s)
      setTimeout(() => {
        resumeScanning();
      }, 2500);
    } else {
      // If simultaneous redemption occurred on another device
      sound.playError();
      setVerificationResult({
        status: 'ALREADY_USED',
        message: 'Baru saja digunakan pada scanner lain.',
        guest: verificationResult.guest,
      });
    }
  };

  // Resume Scanning
  const resumeScanning = () => {
    setVerificationResult(null);
    setRedemptionSuccessData(null);
    setIsScanning(true);
    setTokenInput('');
    if (hasCameraPermission) {
      scanLoop();
    }
  };

  // Fallback: Handle Image File upload for QR scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleTokenDetected(code.data);
        } else {
          setVerificationResult({
            status: 'INVALID_QR',
            message: 'No readable QR code found in the uploaded image.',
          });
          sound.playError();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Breakfast QR Scanner
              </h3>
              <p className="text-[11px] text-slate-400">
                Tjokro Resto · Camera Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center">

          {/* STATE 1: SUCCESS RESULT (Section 19) */}
          {redemptionSuccessData && (
            <div className="w-full text-center py-6 px-4 bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 mb-4 animate-bounce">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                ✓ BREAKFAST CHECK-IN SUCCESSFUL
              </h3>
              
              <div className="mt-5 space-y-2 max-w-xs mx-auto text-left bg-slate-900/80 p-4 rounded-xl border border-emerald-500/30 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Room:</span>
                  <span className="font-bold text-amber-400 text-lg">{redemptionSuccessData.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Guest:</span>
                  <span className="font-semibold text-white">{redemptionSuccessData.guest}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pax:</span>
                  <span className="font-bold text-emerald-400">{redemptionSuccessData.pax} PAX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span className="font-semibold text-slate-200">{redemptionSuccessData.time}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-emerald-300/80 animate-pulse">
                Returning to scanner in 2 seconds...
              </p>

              <button
                onClick={resumeScanning}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Scan Next Immediately
              </button>
            </div>
          )}

          {/* STATE 2: VALID QR RESULT (Section 16) */}
          {!redemptionSuccessData && verificationResult && verificationResult.status === 'VALID' && (
            <div className="w-full text-center py-6 px-4 bg-emerald-950/30 border-2 border-emerald-500 rounded-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold uppercase mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verification Passed</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight uppercase">
                ✓ VALID BREAKFAST
              </h3>

              <div className="mt-4 space-y-2">
                <div className="text-4xl font-extrabold text-amber-400 font-mono">
                  Room {verificationResult.guest?.room_number}
                </div>
                <div className="text-lg font-semibold text-white">
                  {verificationResult.guest?.guest_name}
                </div>
                <div className="inline-block px-3 py-1 bg-slate-800 rounded-lg text-emerald-400 font-bold text-sm">
                  {verificationResult.guest?.pax} PAX
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300 max-w-sm mx-auto text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Breakfast Date:</span>
                  <span className="font-semibold text-white">
                    {formatDisplayDate(verificationResult.breakfast_date || '')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Check-in:</span>
                  <span>{formatDisplayDate(verificationResult.guest?.check_in || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Check-out:</span>
                  <span>{formatDisplayDate(verificationResult.guest?.check_out || '')}</span>
                </div>
              </div>

              {/* ACTION: CHECK-IN BREAKFAST (Section 18) */}
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 transition tracking-wide uppercase disabled:opacity-50"
                >
                  {isRedeeming ? 'PROCESSING TRANSACTION...' : 'CHECK-IN BREAKFAST'}
                </button>

                <button
                  onClick={resumeScanning}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel & Scan Again
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: INVALID QR RESULTS (Section 17) */}
          {!redemptionSuccessData && verificationResult && verificationResult.status !== 'VALID' && (
            <div className="w-full text-center py-6 px-4 bg-slate-900 border-2 rounded-2xl max-w-md mx-auto"
                 style={{
                   borderColor: 
                     verificationResult.status === 'ALREADY_USED' ? '#f59e0b' :
                     verificationResult.status === 'BREAKFAST_NOT_OPEN' || verificationResult.status === 'BREAKFAST_CLOSED' ? '#38bdf8' :
                     '#ef4444'
                 }}
            >
              {/* STATUS ICON & TITLE */}
              {verificationResult.status === 'INVALID_QR' && (
                <>
                  <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mb-3">
                    <X className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-rose-500">
                    ✕ INVALID QR
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    QR Code tidak ditemukan.
                  </p>
                </>
              )}

              {verificationResult.status === 'ALREADY_USED' && (
                <>
                  <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-400">
                    ✕ ALREADY USED
                  </h3>
                  <div className="mt-3 space-y-1 font-mono">
                    <div className="text-xl font-bold text-white">
                      Room {verificationResult.guest?.room_number || '-'}
                    </div>
                    <div className="text-sm text-slate-300">
                      {verificationResult.guest?.guest_name || '-'}
                    </div>
                    <div className="text-xs text-amber-300 font-bold">
                      {verificationResult.guest?.pax} Pax
                    </div>
                  </div>
                  <div className="mt-4 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                    Used at: <strong>{verificationResult.used_at_str || 'Earlier today'}</strong>
                  </div>
                </>
              )}

              {verificationResult.status === 'EXPIRED' && (
                <>
                  <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mb-3">
                    <Clock className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-rose-400">
                    ✕ EXPIRED
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Breakfast tidak berlaku pada tanggal ini.
                  </p>
                  {verificationResult.guest && (
                    <div className="mt-3 text-xs text-slate-400 bg-slate-800 p-2.5 rounded-lg">
                      Room {verificationResult.guest.room_number} · Stay: {formatDisplayDate(verificationResult.guest.check_in)} - {formatDisplayDate(verificationResult.guest.check_out)}
                    </div>
                  )}
                </>
              )}

              {verificationResult.status === 'REVOKED' && (
                <>
                  <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-3">
                    <Ban className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-red-500">
                    ✕ REVOKED
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    QR Code telah dibatalkan.
                  </p>
                </>
              )}

              {verificationResult.status === 'BREAKFAST_NOT_OPEN' && (
                <>
                  <div className="w-14 h-14 mx-auto rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-sky-400">
                    BREAKFAST NOT OPEN
                  </h3>
                  <p className="mt-2 text-sm text-slate-200">
                    Breakfast mulai: <strong>{verificationResult.time_info?.breakfast_start || '06:00'} WIB</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Current Time: {verificationResult.time_info?.current_time} WIB
                  </p>
                </>
              )}

              {verificationResult.status === 'BREAKFAST_CLOSED' && (
                <>
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-700 text-slate-300 flex items-center justify-center mb-3">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-300">
                    BREAKFAST CLOSED
                  </h3>
                  <p className="mt-2 text-sm text-slate-200">
                    Breakfast berakhir: <strong>{verificationResult.time_info?.breakfast_end || '10:00'} WIB</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Current Time: {verificationResult.time_info?.current_time} WIB
                  </p>
                </>
              )}

              {/* ACTION: TRY AGAIN */}
              <div className="mt-6">
                <button
                  onClick={resumeScanning}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
                >
                  Scan Another QR
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: ACTIVE CAMERA SCANNER (Section 15) */}
          {!redemptionSuccessData && !verificationResult && (
            <div className="w-full flex flex-col items-center">
              {/* VIDEO CAMERA CONTAINER */}
              <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[380px] bg-black rounded-2xl overflow-hidden shadow-inner border-2 border-slate-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* SCANNING FRAME (Section 15) */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  {/* Outer dark scrim border */}
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-amber-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400" />
                    
                    {/* Laser scanner animation */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce mt-10" />
                  </div>

                  {/* Frame Text (Section 15) */}
                  <div className="absolute bottom-4 py-1 px-3 bg-slate-950/80 backdrop-blur-xs rounded-full border border-slate-700 text-xs font-bold text-amber-400 tracking-wider uppercase">
                    SCAN BREAKFAST QR
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-5 text-center">
                    <AlertOctagon className="w-10 h-10 text-rose-400 mb-2" />
                    <p className="text-xs text-rose-300 mb-3">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-slate-800 text-xs font-semibold text-slate-200 rounded-lg hover:bg-slate-700 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                    </button>
                  </div>
                )}
              </div>

              {/* QUICK TOKEN TESTER / FALLBACK */}
              <div className="w-full mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                  <span>Enter Token / File Upload:</span>
                  <label className="cursor-pointer text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. BF26-8F72K91X"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tokenInput.trim()) {
                        handleTokenDetected(tokenInput.trim());
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 uppercase"
                  />
                  <button
                    onClick={() => {
                      if (tokenInput.trim()) {
                        handleTokenDetected(tokenInput.trim());
                      }
                    }}
                    disabled={!tokenInput.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition disabled:opacity-40"
                  >
                    Verify
                  </button>
                </div>

                {/* Convenient Quick Click test chips */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-500">Quick Test:</span>
                  <button
                    onClick={() => handleTokenDetected('BF26-8F72K91X')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 rounded border border-slate-700"
                    title="Room 305 (Valid 2 Pax)"
                  >
                    Room 305 (Valid)
                  </button>
                  <button
                    onClick={() => handleTokenDetected('BF26-412AW99')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-amber-950 hover:text-amber-300 text-slate-300 rounded border border-slate-700"
                    title="Room 412 (Already Used)"
                  >
                    Room 412 (Used)
                  </button>
                  <button
                    onClick={() => handleTokenDetected('BF26-201JM77')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded border border-slate-700"
                    title="Room 201 (Expired)"
                  >
                    Room 201 (Expired)
                  </button>
                  <button
                    onClick={() => handleTokenDetected('BF26-114DL66')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 rounded border border-slate-700"
                    title="Room 114 (Revoked)"
                  >
                    Room 114 (Revoked)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
