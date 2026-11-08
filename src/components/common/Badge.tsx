import React from 'react';
import { ContactStatus } from '../../types';
import { CheckCircle2, Clock, ExternalLink, SkipForward, AlertCircle, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: ContactStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  switch (status) {
    case 'Marked as Sent':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sent</span>
        </span>
      );
    case 'Opened in WhatsApp':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
          <span>Opened</span>
        </span>
      );
    case 'Ready':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Ready</span>
        </span>
      );
    case 'Skipped':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
          <SkipForward className="w-3.5 h-3.5 text-purple-600" />
          <span>Skipped</span>
        </span>
      );
    case 'Not Started':
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>Not Started</span>
        </span>
      );
  }
};

interface PhoneBadgeProps {
  isValid: boolean;
  error?: string;
  showTooltip?: boolean;
}

export const PhoneBadge: React.FC<PhoneBadgeProps> = ({ isValid, error }) => {
  if (isValid) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50/70 border border-emerald-200 px-1.5 py-0.5 rounded">
        <Check className="w-3 h-3 text-emerald-600" />
        Valid
      </span>
    );
  }

  return (
    <span 
      className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded cursor-help"
      title={error || 'Invalid phone number format'}
    >
      <AlertCircle className="w-3 h-3 text-rose-600" />
      Invalid
    </span>
  );
};
