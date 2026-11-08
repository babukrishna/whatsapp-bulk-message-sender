import React from 'react';

interface ProgressBarProps {
  total: number;
  sent: number;
  opened: number;
  skipped: number;
  showDetails?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  total,
  sent,
  opened,
  skipped,
  showDetails = true,
}) => {
  const sentPct = total > 0 ? (sent / total) * 100 : 0;
  const openedPct = total > 0 ? (opened / total) * 100 : 0;
  const skippedPct = total > 0 ? (skipped / total) * 100 : 0;
  const remaining = Math.max(0, total - (sent + skipped));
  const completionPct = total > 0 ? Math.round(((sent + skipped) / total) * 100) : 0;

  return (
    <div className="w-full space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Campaign Progress</span>
            <span className="text-xs px-2 py-0.5 font-bold rounded-full bg-emerald-100 text-emerald-800">
              {completionPct}% Complete
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {sent} sent of {total} contacts ({remaining} remaining)
          </span>
        </div>
      )}

      {/* Bar */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        {sentPct > 0 && (
          <div
            style={{ width: `${sentPct}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
            title={`Sent: ${sent} (${Math.round(sentPct)}%)`}
          />
        )}
        {openedPct > 0 && (
          <div
            style={{ width: `${openedPct}%` }}
            className="bg-amber-400 h-full transition-all duration-300"
            title={`Opened in WhatsApp: ${opened} (${Math.round(openedPct)}%)`}
          />
        )}
        {skippedPct > 0 && (
          <div
            style={{ width: `${skippedPct}%` }}
            className="bg-purple-400 h-full transition-all duration-300"
            title={`Skipped: ${skipped} (${Math.round(skippedPct)}%)`}
          />
        )}
      </div>

      {showDetails && total > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Sent: <strong className="text-slate-800">{sent}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Opened: <strong className="text-slate-800">{opened}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span>Skipped: <strong className="text-slate-800">{skipped}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>Remaining: <strong className="text-slate-800">{remaining}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
