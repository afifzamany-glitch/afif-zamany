import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Printer, Copy, Check, Sparkles } from 'lucide-react';
import { formatDisplayDate } from '../lib/time';

interface QRCodePassCardProps {
  roomNumber: string;
  guestName: string;
  pax: number;
  token: string;
  breakfastDate: string; // YYYY-MM-DD
  hotelName?: string;
  onClose?: () => void;
}

export const QRCodePassCard: React.FC<QRCodePassCardProps> = ({
  roomNumber,
  guestName,
  pax,
  token,
  breakfastDate,
  hotelName = 'GRAND TJOKRO YOGYAKARTA',
  onClose,
}) => {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const formattedDate = formatDisplayDate(breakfastDate);

  // Render high-contrast QR on the display canvas
  useEffect(() => {
    if (!qrCanvasRef.current || !token) return;

    // Minimum QR display size: 400 x 400 px
    QRCode.toCanvas(
      qrCanvasRef.current,
      token,
      {
        width: 400,
        margin: 4, // sufficient quiet zone
        color: {
          dark: '#0f172a', // high contrast dark slate
          light: '#ffffff', // pure white
        },
        errorCorrectionLevel: 'H', // High error correction
      },
      (err) => {
        if (err) console.error('Error generating QR Canvas', err);
      }
    );
  }, [token]);

  // Generate full hotel pass image onto an offscreen canvas for PNG/JPG download
  const generatePassCanvas = async (type: 'png' | 'jpeg'): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const width = 1000;
    const height = 1450;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Background: Dark Slate Luxury Theme
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Gold Outer Border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(42, 42, width - 84, height - 84);

    // Hotel Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24'; // Gold
    ctx.font = 'bold 36px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(hotelName.toUpperCase(), width / 2, 115);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('BREAKFAST PASS', width / 2, 155);

    // Golden Divider Line
    const lineGrad = ctx.createLinearGradient(150, 0, width - 150, 0);
    lineGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
    lineGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.8)');
    lineGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 185);
    ctx.lineTo(width - 120, 185);
    ctx.stroke();

    // Guest Info Section
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 58px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(`ROOM ${roomNumber}`, width / 2, 260);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 34px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(guestName.toUpperCase(), width / 2, 315);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(`${pax} PAX`, width / 2, 365);

    // QR Code Container Box (White backing for maximum scan contrast)
    const qrBoxSize = 540;
    const qrBoxX = (width - qrBoxSize) / 2;
    const qrBoxY = 415;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
    ctx.shadowColor = 'transparent';

    // QR Code generation directly to image
    const qrDataUrl = await QRCode.toDataURL(token, {
      width: 480,
      margin: 4,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });

    const qrImg = new Image();
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.src = qrDataUrl;
    });

    ctx.drawImage(qrImg, qrBoxX + 30, qrBoxY + 30, 480, 480);

    // Token Text below QR
    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px monospace';
    ctx.fillText(`TOKEN: ${token}`, width / 2, 995);

    // Breakfast Date & Notice
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 30px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('BREAKFAST', width / 2, 1055);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 38px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(formattedDate.toUpperCase(), width / 2, 1105);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Please show this QR Code at Breakfast Restaurant', width / 2, 1165);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 18px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Tjokro Resto · 06:00 - 10:00 WIB', width / 2, 1205);

    // Watermark footer
    ctx.fillStyle = '#475569';
    ctx.font = '400 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Valid for one breakfast redemption per day · Grand Tjokro Yogyakarta', width / 2, 1370);

    return canvas;
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    try {
      setDownloading(true);
      const canvas = await generatePassCanvas(format === 'png' ? 'png' : 'jpeg');
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, 0.95);

      const link = document.createElement('a');
      link.download = `Breakfast_Pass_Room_${roomNumber}_${token}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Download error', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const canvas = await generatePassCanvas('png');
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Breakfast_Pass_Room_${roomNumber}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Breakfast Pass - Room ${roomNumber}`,
            text: `Breakfast Pass for ${guestName} (Room ${roomNumber}, ${pax} Pax). Date: ${formattedDate}.`,
            files: [file],
          });
        } else if (navigator.share) {
          await navigator.share({
            title: `Breakfast Pass - Room ${roomNumber}`,
            text: `Grand Tjokro Yogyakarta Breakfast Pass for Room ${roomNumber} (${guestName}, ${pax} Pax). Token: ${token}`,
          });
        } else {
          // Fallback to PNG download
          handleDownload('png');
        }
      }, 'image/png');
    } catch (e) {
      console.warn('Share error or cancelled', e);
      handleDownload('png');
    }
  };

  const handlePrint = async () => {
    try {
      const canvas = await generatePassCanvas('png');
      const dataUrl = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Breakfast Pass - Room ${roomNumber}</title>
              <style>
                body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
                img { max-width: 100%; height: auto; max-height: 95vh; }
                @media print {
                  body { margin: 0; }
                  img { width: 100%; max-width: 480px; page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (e) {
      console.error('Print error', e);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* CARD PREVIEW CONTAINER */}
      <div 
        id="breakfast-pass-card"
        className="w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/60 p-6 md:p-8 shadow-2xl text-center relative overflow-hidden"
      >
        {/* Subtle decorative gold corner badges */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

        {/* HOTEL HEADER */}
        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grand Tjokro Yogyakarta</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase">
            BREAKFAST PASS
          </h2>
          <div className="h-0.5 w-24 mx-auto bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-2" />
        </div>

        {/* GUEST INFO */}
        <div className="space-y-1 mb-6">
          <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-amber-400 font-mono">
            ROOM {roomNumber}
          </div>
          <div className="text-lg md:text-xl font-semibold text-slate-100 uppercase tracking-wide">
            {guestName}
          </div>
          <div className="text-sm font-semibold text-slate-300">
            {pax} PAX
          </div>
        </div>

        {/* HIGH CONTRAST QR CODE DISPLAY (MINIMUM 400 x 400 PX DISPLAY) */}
        <div className="relative flex justify-center items-center my-4">
          <div className="p-3 bg-white rounded-xl shadow-xl border-4 border-amber-400/80 inline-block">
            <canvas
              ref={qrCanvasRef}
              width={400}
              height={400}
              className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] object-contain block mx-auto rounded-lg"
              title={`Breakfast QR for Room ${roomNumber}`}
            />
          </div>
        </div>

        {/* TOKEN */}
        <div className="mt-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-md border border-slate-700 font-mono text-xs text-amber-300">
            <span>TOKEN: {token}</span>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="space-y-1 text-slate-300 pt-2 border-t border-slate-700/60">
          <div className="text-xs uppercase tracking-wider font-semibold text-amber-400">
            BREAKFAST
          </div>
          <div className="text-base font-bold text-white tracking-wide">
            {formattedDate}
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mt-1">
            Please show this QR Code at Breakfast Restaurant
          </p>
          <p className="text-[11px] text-slate-500">
            Tjokro Resto · 06:00 - 10:00 WIB
          </p>
        </div>
      </div>

      {/* QR IMAGE ACTIONS */}
      <div className="w-full mt-6 space-y-3">
        {/* Main requirement: PNG & JPG Save Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDownload('png')}
            disabled={downloading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>SAVE PNG</span>
          </button>

          <button
            onClick={() => handleDownload('jpg')}
            disabled={downloading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>SAVE JPG</span>
          </button>
        </div>

        {/* Secondary Actions: SHARE, PRINT, COPY TOKEN */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>SHARE</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>PRINT</span>
          </button>

          <button
            onClick={handleCopyToken}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>COPY TOKEN</span>
              </>
            )}
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-medium text-slate-400 hover:text-white transition text-center"
          >
            Close Preview
          </button>
        )}
      </div>
    </div>
  );
};
