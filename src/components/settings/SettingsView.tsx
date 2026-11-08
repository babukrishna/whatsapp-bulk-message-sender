import React, { useState } from 'react';
import { AppSettings, Contact } from '../../types';
import { generateSampleContacts } from '../../utils/sampleData';
import { exportFullBackup, importFullBackup } from '../../utils/storage';
import { 
  Settings, 
  ShieldCheck, 
  Smartphone, 
  Database, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  Sparkles, 
  HelpCircle,
  ExternalLink,
  Save
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  contacts: Contact[];
  onSaveSettings: (settings: AppSettings) => void;
  onLoadDemoContacts: (demoContacts: Contact[]) => void;
  onClearAllContacts: () => void;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  contacts,
  onSaveSettings,
  onLoadDemoContacts,
  onClearAllContacts,
  onRefreshAll,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [demoLoadedSuccess, setDemoLoadedSuccess] = useState(false);
  const [importBackupError, setImportBackupError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleLoadDemo = () => {
    if (contacts.length > 0) {
      if (!window.confirm('This will replace your current contact list with 15 sample Recipe Mantra contacts. Proceed?')) {
        return;
      }
    }
    const sample = generateSampleContacts(form.defaultCountryCode);
    onLoadDemoContacts(sample);
    setDemoLoadedSuccess(true);
    setTimeout(() => setDemoLoadedSuccess(false), 2500);
  };

  const handleExportBackup = async () => {
    const json = await exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recipe_Mantra_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportBackupError(null);

    try {
      const text = await file.text();
      await importFullBackup(text);
      alert('Backup restored successfully!');
      onRefreshAll();
    } catch (err: any) {
      setImportBackupError(err.message || 'Failed to restore backup file');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>Application Settings & Privacy</span>
          </h2>
          <p className="text-xs text-slate-500">
            Configure phone defaults, workflow preferences, and manage local data
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Settings Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Business & Regional Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Business & Regional Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Default Country Code
              </label>
              <input
                type="text"
                value={form.defaultCountryCode}
                onChange={(e) => setForm({ ...form, defaultCountryCode: e.target.value })}
                placeholder="+91"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to normalize 10-digit Indian numbers without country code.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Business Tagline / Subtitle
            </label>
            <input
              type="text"
              value={form.businessTagline}
              onChange={(e) => setForm({ ...form, businessTagline: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Workflow & WhatsApp Navigation Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Sending Workflow Preferences
          </h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoAdvanceOnSent}
                onChange={(e) => setForm({ ...form, autoAdvanceOnSent: e.target.checked })}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Automatically advance to next contact on "Mark as Sent"
                </span>
                <span className="text-slate-500">
                  Speeds up your outreach by immediately showing the next pending recipient.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.useWhatsAppWebDirect}
                onChange={(e) => setForm({ ...form, useWhatsAppWebDirect: e.target.checked })}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Use web.whatsapp.com directly (instead of wa.me redirect)
                </span>
                <span className="text-slate-500">
                  Recommended if you primarily send from WhatsApp Web in your desktop browser. Uncheck if using WhatsApp Desktop app or mobile browser.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

      </form>

      {/* Guide: How to Use with Android Phone */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-3xl border border-emerald-200 space-y-4">
        <div className="flex items-center gap-2.5 text-emerald-900">
          <Smartphone className="w-5 h-5 text-emerald-700" />
          <h3 className="font-extrabold text-base">
            How to Use with Your Android Phone & Existing WhatsApp Number
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-emerald-950">
          <div className="bg-white/80 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-center leading-5 text-[11px]">1</span>
              Method A: Desktop + WhatsApp Web (Easiest)
            </span>
            <p className="text-slate-600 leading-relaxed">
              Open <strong>web.whatsapp.com</strong> on your computer and scan the QR code from your Android phone (WhatsApp &gt; Linked Devices). When you click "Open WhatsApp" in this app, it opens the chat right in your browser with your personalized message already typed!
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-center leading-5 text-[11px]">2</span>
              Method B: Mobile Browser on Android
            </span>
            <p className="text-slate-600 leading-relaxed">
              You can also open this web application on your Android phone's Chrome browser (connecting to your computer's local Wi-Fi IP). Clicking "Open WhatsApp" will instantly trigger the native WhatsApp Android application directly!
            </p>
          </div>
        </div>

        <div className="text-[11px] text-emerald-800/90 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Zero third-party servers. All data stays in your browser's IndexedDB and localStorage.
          </span>
        </div>
      </div>

      {/* Demo Data & Local Storage Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-600" />
          <span>Data Management & Backup</span>
        </h3>

        {/* Demo Contacts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-orange-50/60 border border-orange-200/70">
          <div className="space-y-0.5">
            <span className="font-bold text-xs text-orange-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-600" />
              Test with Recipe Mantra Demo Contacts
            </span>
            <p className="text-xs text-slate-600">
              Populate 15 realistic food customer contacts to preview templates and test sending before importing your real 90 contacts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-3.5 py-2 text-xs font-bold text-orange-700 bg-white hover:bg-orange-50 border border-orange-300 rounded-xl transition-colors shadow-2xs shrink-0"
          >
            {demoLoadedSuccess ? '✓ Loaded 15 Contacts' : 'Load Demo Data'}
          </button>
        </div>

        {/* Backup & Restore */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-xs text-slate-800 block">Export Full Backup</span>
            <p className="text-xs text-slate-500">
              Download all contacts, campaign drafts, and settings as a JSON file.
            </p>
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup (JSON)</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-xs text-slate-800 block">Restore from Backup</span>
            <p className="text-xs text-slate-500">
              Restore a previously saved JSON backup file.
            </p>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Select Backup File</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportBackup}
              />
            </label>
            {importBackupError && (
              <p className="text-[11px] text-rose-600">{importBackupError}</p>
            )}
          </div>
        </div>

        {/* Clear Contacts */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-rose-700">Wipe All Contacts</span>
            <p className="text-xs text-slate-500">
              Clears all {contacts.length} contacts from this browser's storage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClearAllContacts}
            disabled={contacts.length === 0}
            className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors disabled:opacity-40"
          >
            Clear Contacts
          </button>
        </div>

      </div>

    </div>
  );
};
