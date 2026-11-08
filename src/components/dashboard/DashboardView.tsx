import React from 'react';
import { Contact, CampaignDraft, ActiveTab } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  FileSpreadsheet, 
  PenSquare, 
  ShieldAlert, 
  Sparkles,
  ShoppingBag,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface DashboardViewProps {
  contacts: Contact[];
  campaign: CampaignDraft;
  onNavigate: (tab: ActiveTab) => void;
  onOpenImportModal: () => void;
  onResetCampaignClick: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  contacts,
  campaign,
  onNavigate,
  onOpenImportModal,
  onResetCampaignClick,
}) => {
  const totalContacts = contacts.length;
  const sentCount = contacts.filter((c) => c.status === 'Marked as Sent').length;
  const openedCount = contacts.filter((c) => c.status === 'Opened in WhatsApp').length;
  const skippedCount = contacts.filter((c) => c.status === 'Skipped').length;
  const readyCount = contacts.filter((c) => c.status === 'Ready').length;
  const notStartedCount = contacts.filter((c) => c.status === 'Not Started').length;
  const invalidCount = contacts.filter((c) => !c.isValidPhone).length;
  const remainingCount = Math.max(0, totalContacts - (sentCount + skippedCount));

  // "Messages prepared" represents valid contacts ready/available to be sent
  const messagesPrepared = contacts.filter((c) => c.isValidPhone && campaign.body.trim().length > 0).length;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-orange-500/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recipe Mantra Homemade Food Campaign</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Personalized WhatsApp Outreach
          </h1>
          <p className="text-sm sm:text-base text-amber-50/90 leading-relaxed">
            Send sweet & savoury updates to your personal contacts directly through your Android phone's WhatsApp. No paid APIs, no risk of automated bans.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {totalContacts === 0 ? (
              <button
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-md hover:bg-amber-50 transition-all hover:scale-102"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Contacts CSV</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('sender')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-md hover:bg-amber-50 transition-all hover:scale-102"
              >
                <Send className="w-4 h-4" />
                <span>
                  {sentCount > 0 ? `Resume Campaign (${remainingCount} left)` : 'Start Sending Messages'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}

            <button
              onClick={() => onNavigate('composer')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-700/60 hover:bg-orange-700/80 text-white font-semibold text-sm backdrop-blur-md transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              <span>Review Message & Catalogue</span>
            </button>
          </div>
        </div>

        {/* Decorative background food emoji watermark */}
        <div className="absolute right-4 -bottom-6 text-9xl opacity-20 select-none pointer-events-none">
          🍯
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Active Campaign: {campaign.name || 'Recipe Mantra Special'}
            </h2>
            <p className="text-xs text-slate-500">
              Personalized promo with catalogue link: <span className="font-mono text-slate-700 truncate max-w-xs">{campaign.catalogueUrl || 'None set'}</span>
            </p>
          </div>
          {sentCount > 0 && (
            <button
              onClick={onResetCampaignClick}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Campaign Progress</span>
            </button>
          )}
        </div>

        <ProgressBar
          total={totalContacts}
          sent={sentCount}
          opened={openedCount}
          skipped={skippedCount}
          showDetails={true}
        />
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Contacts */}
        <div 
          onClick={() => onNavigate('contacts')} 
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Contacts</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalContacts}</span>
            <p className="text-xs text-slate-500 mt-1">In contact directory</p>
          </div>
        </div>

        {/* Messages Prepared */}
        <div 
          onClick={() => onNavigate('composer')} 
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Prepared</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PenSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{messagesPrepared}</span>
            <p className="text-xs text-slate-500 mt-1">Ready with template</p>
          </div>
        </div>

        {/* Messages Marked as Sent */}
        <div 
          onClick={() => onNavigate('history')} 
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Marked Sent</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{sentCount}</span>
            <p className="text-xs text-slate-500 mt-1">
              {totalContacts > 0 ? `${Math.round((sentCount / totalContacts) * 100)}% reached` : '0%'}
            </p>
          </div>
        </div>

        {/* Contacts Remaining */}
        <div 
          onClick={() => onNavigate('sender')} 
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Remaining</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{remainingCount}</span>
            <p className="text-xs text-slate-500 mt-1">Pending outreach</p>
          </div>
        </div>

        {/* Invalid Phone Numbers */}
        <div 
          onClick={() => onNavigate('contacts')} 
          className={`col-span-2 sm:col-span-1 p-5 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            invalidCount > 0 
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' 
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${invalidCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              Invalid Phones
            </span>
            <div className={`p-2 rounded-xl ${invalidCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl sm:text-3xl font-extrabold ${invalidCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {invalidCount}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {invalidCount > 0 ? 'Action required in contacts' : 'All numbers valid'}
            </p>
          </div>
        </div>

      </div>

      {/* Quick Action Cards & Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Step 1: Contacts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-slate-900">Manage 90 Contacts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Import contacts from your CSV file with names, phone numbers, and cities. Normalized automatically with Indian +91 default.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('contacts')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open Contacts Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step 2: Message Composer */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-slate-900">Personalize & Add Catalogue</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use dynamic variables like <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] text-slate-800">{'{{name}}'}</code>, insert your WhatsApp catalogue link, and upload a promotional image.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('composer')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Edit Message & Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step 3: Send Messages Workspace */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-slate-900">One-Click WhatsApp Chat</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Step through your contacts one by one. Preview personalized text, launch WhatsApp with text prefilled, send, and advance to next.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('sender')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Launch Sending Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Safety & Compliance Card */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-amber-900">WhatsApp Safety & Privacy Reminder:</span>
          <p className="text-amber-800/90 leading-relaxed">
            All contact information, messages, and uploaded images remain entirely on your local computer in your browser. This application creates official <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">wa.me</code> links that open your personal WhatsApp on Android/Web. You remain in complete control and must press Send inside WhatsApp. Send only to contacts who know Recipe Mantra, and promptly respect anyone who declines further messages.
          </p>
        </div>
      </div>

    </div>
  );
};
