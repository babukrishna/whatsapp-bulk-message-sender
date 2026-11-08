import React, { useState, useMemo } from 'react';
import { Contact, CampaignDraft, ContactStatus, ActiveTab } from '../../types';
import { StatusBadge, PhoneBadge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { exportContactsToCsv } from '../../utils/csvHelper';
import { 
  History, 
  Download, 
  RotateCcw, 
  Search, 
  Filter, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  AlertCircle,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface CampaignHistoryViewProps {
  contacts: Contact[];
  campaign: CampaignDraft;
  onUpdateStatus: (id: string, status: ContactStatus) => void;
  onResetCampaignClick: () => void;
  onNavigateToSend: (contact: Contact) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const CampaignHistoryView: React.FC<CampaignHistoryViewProps> = ({
  contacts,
  campaign,
  onUpdateStatus,
  onResetCampaignClick,
  onNavigateToSend,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const total = contacts.length;
  const sent = contacts.filter((c) => c.status === 'Marked as Sent').length;
  const opened = contacts.filter((c) => c.status === 'Opened in WhatsApp').length;
  const skipped = contacts.filter((c) => c.status === 'Skipped').length;
  const ready = contacts.filter((c) => c.status === 'Ready').length;
  const notStarted = contacts.filter((c) => c.status === 'Not Started').length;
  const remaining = Math.max(0, total - (sent + skipped));

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
      return true;
    });
  }, [contacts, searchTerm, selectedStatus]);

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <span>Campaign Tracking & Audit</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time status of your outreach for <strong className="text-slate-700">{campaign.name || 'Recipe Mantra'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Report to CSV */}
          <button
            type="button"
            onClick={() => exportContactsToCsv(contacts, `Recipe_Mantra_Campaign_Report_${new Date().toISOString().slice(0, 10)}.csv`)}
            disabled={contacts.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (CSV)</span>
          </button>

          {/* Reset Campaign */}
          <button
            type="button"
            onClick={onResetCampaignClick}
            disabled={contacts.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Campaign</span>
          </button>
        </div>
      </div>

      {/* Progress & Overview Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-slate-800">Overall Delivery Progress</h3>
            <p className="text-xs text-slate-500">
              {sent} of {total} contacts sent • {remaining} remaining
            </p>
          </div>
          {remaining > 0 && (
            <button
              onClick={() => onNavigate('sender')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Continue Outreach</span>
            </button>
          )}
        </div>

        <ProgressBar
          total={total}
          sent={sent}
          opened={opened}
          skipped={skipped}
          showDetails={true}
        />
      </div>

      {/* Status Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div 
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'all' ? 'bg-slate-100 border-slate-400 font-bold' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Contacts</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{total}</div>
        </div>

        <div 
          onClick={() => setSelectedStatus('Marked as Sent')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'Marked as Sent' ? 'bg-emerald-100 border-emerald-400 font-bold' : 'bg-white border-slate-200 hover:bg-emerald-50/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Marked Sent</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{sent}</div>
        </div>

        <div 
          onClick={() => setSelectedStatus('Opened in WhatsApp')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'Opened in WhatsApp' ? 'bg-amber-100 border-amber-400 font-bold' : 'bg-white border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 uppercase">Opened</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{opened}</div>
        </div>

        <div 
          onClick={() => setSelectedStatus('Skipped')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'Skipped' ? 'bg-purple-100 border-purple-400 font-bold' : 'bg-white border-slate-200 hover:bg-purple-50/50'
          }`}
        >
          <span className="text-[11px] font-semibold text-purple-700 uppercase">Skipped</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{skipped}</div>
        </div>

        <div 
          onClick={() => setSelectedStatus('Not Started')}
          className={`col-span-2 sm:col-span-1 p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'Not Started' ? 'bg-slate-200 border-slate-400 font-bold' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Not Started</span>
          <div className="text-2xl font-black text-slate-700 mt-1">{notStarted + ready}</div>
        </div>
      </div>

      {/* Verification & Transparency Disclaimer */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-blue-900">Transparency Notice on WhatsApp Tracking:</span>
          <p className="text-blue-800 leading-relaxed">
            WhatsApp does not allow third-party web applications to spy on delivery or read receipts without a paid WhatsApp Business API. Therefore, all statuses in this table reflect your explicit actions (e.g., clicking <strong>Open WhatsApp</strong> and <strong>Mark as Sent</strong>). This provides complete privacy without exposing your data or paying subscriptions.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Statuses ({contacts.length})</option>
              <option value="Marked as Sent">Marked as Sent ({sent})</option>
              <option value="Opened in WhatsApp">Opened in WhatsApp ({opened})</option>
              <option value="Ready">Ready ({ready})</option>
              <option value="Not Started">Not Started ({notStarted})</option>
              <option value="Skipped">Skipped ({skipped})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Contact Name</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Sent Timestamp</th>
                <th className="py-2.5 px-3">Opened Timestamp</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No contacts match your current filter.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {c.name}
                      {c.nickname && <span className="text-[11px] text-slate-500 ml-1.5 font-normal">({c.nickname})</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {c.phone}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {c.sentAt ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          {new Date(c.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {c.openedAt ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {new Date(c.openedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateToSend(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                        title="Open in sending workspace"
                      >
                        Send / Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
