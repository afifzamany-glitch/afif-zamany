import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Calendar } from 'lucide-react';
import { exportDailyReportExcel, exportMonthlyReportExcel } from '../lib/reports';
import { getJakartaDate } from '../lib/time';
import { UserProfile } from '../types';

interface ReportExportModalProps {
  currentUser: UserProfile;
  initialType?: 'DAILY' | 'MONTHLY';
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  currentUser,
  initialType = 'DAILY',
  onClose,
}) => {
  const today = getJakartaDate();
  const currentMonth = today.substring(0, 7); // YYYY-MM

  const [reportType, setReportType] = useState<'DAILY' | 'MONTHLY'>(initialType);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (reportType === 'DAILY') {
        exportDailyReportExcel(selectedDate, currentUser);
      } else {
        exportMonthlyReportExcel(selectedMonth, currentUser);
      }
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 600);
    } catch (e) {
      console.error(e);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Export Breakfast Excel Report
              </h3>
              <p className="text-[11px] text-slate-400">
                SheetJS XLSX Spreadsheet Generator
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setReportType('DAILY')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                reportType === 'DAILY'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setReportType('MONTHLY')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                reportType === 'MONTHLY'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Report
            </button>
          </div>

          {reportType === 'DAILY' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Select Breakfast Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Generates a multi-sheet spreadsheet including Summary Metrics, Total Pax Served, QR scan vs. Manual counts, and detailed transaction records.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Select Month Period
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Generates a complete monthly breakdown sheet aggregated per calendar day, total monthly pax, and full audit list.
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wide rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating XLSX...' : 'Download Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
