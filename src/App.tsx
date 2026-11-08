import React, { useState, useEffect } from 'react';
import { Contact, CampaignDraft, AppSettings, ActiveTab, ContactStatus } from './types';
import { 
  loadContacts, 
  saveContacts, 
  loadCampaign, 
  saveCampaign, 
  loadSettings, 
  saveSettings 
} from './utils/storage';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ContactsView } from './components/contacts/ContactsView';
import { ContactModal } from './components/contacts/ContactModal';
import { CsvImportModal } from './components/contacts/CsvImportModal';
import { ComposerView } from './components/composer/ComposerView';
import { SenderWorkspace } from './components/sender/SenderWorkspace';
import { CampaignHistoryView } from './components/history/CampaignHistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { ConfirmDialog } from './components/common/ConfirmDialog';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core state loaded from local persistence
  const [contacts, setContacts] = useState<Contact[]>(() => loadContacts());
  const [campaign, setCampaign] = useState<CampaignDraft>(() => loadCampaign());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [targetSenderContactId, setTargetSenderContactId] = useState<string | undefined>(undefined);

  // Sync contacts with localStorage whenever changed
  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  // Sync campaign with localStorage whenever changed
  useEffect(() => {
    saveCampaign(campaign);
  }, [campaign]);

  // Sync settings with localStorage whenever changed
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Handler: Add or Edit Contact
  const handleSaveContact = (contactData: Partial<Contact>) => {
    if (contactData.id) {
      // Editing existing
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactData.id
            ? ({ ...c, ...contactData } as Contact)
            : c
        )
      );
    } else {
      // Adding new
      const newContact: Contact = {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: contactData.name || 'Friend',
        phone: contactData.phone || '',
        normalizedPhone: contactData.normalizedPhone || '',
        isValidPhone: contactData.isValidPhone ?? false,
        phoneError: contactData.phoneError,
        nickname: contactData.nickname,
        city: contactData.city,
        language: contactData.language,
        notes: contactData.notes,
        status: contactData.status || 'Not Started',
        createdAt: new Date().toISOString(),
      };
      setContacts((prev) => [newContact, ...prev]);
    }
  };

  // Handler: Delete Single Contact
  const handleDeleteContact = (id: string) => {
    if (window.confirm('Delete this contact?')) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Handler: Delete Multiple Contacts
  const handleDeleteMultipleContacts = (ids: string[]) => {
    setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
  };

  // Handler: Update Contact Status
  const handleUpdateStatus = (
    id: string,
    newStatus: ContactStatus,
    timestampField?: 'sentAt' | 'openedAt'
  ) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated: Contact = {
          ...c,
          status: newStatus,
        };
        if (timestampField === 'sentAt') {
          updated.sentAt = new Date().toISOString();
        } else if (timestampField === 'openedAt') {
          updated.openedAt = new Date().toISOString();
        }
        return updated;
      })
    );
  };

  // Handler: Import Contacts from CSV
  const handleImportCsv = (newContacts: Contact[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setContacts(newContacts);
    } else {
      // Append mode: prevent exact duplicate normalized phone numbers
      const existingPhones = new Set(contacts.map((c) => c.normalizedPhone).filter(Boolean));
      const toAppend = newContacts.filter((c) => !existingPhones.has(c.normalizedPhone));
      setContacts((prev) => [...prev, ...toAppend]);
    }
    setActiveTab('contacts');
  };

  // Handler: Reset Campaign Progress
  const handleResetCampaign = () => {
    setContacts((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'Not Started',
        sentAt: undefined,
        openedAt: undefined,
      }))
    );
  };

  // Handler: Clear All Contacts
  const handleClearAll = () => {
    setContacts([]);
    setIsClearAllConfirmOpen(false);
  };

  // Handler: Navigate to Sender Workspace for a specific contact
  const handleSendSingleContact = (contact: Contact) => {
    setTargetSenderContactId(contact.id);
    setActiveTab('sender');
  };

  // Refresh all state from local storage (used after backup restore)
  const handleRefreshAll = () => {
    setContacts(loadContacts());
    setCampaign(loadCampaign());
    setSettings(loadSettings());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        contacts={contacts}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* View 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            contacts={contacts}
            campaign={campaign}
            onNavigate={setActiveTab}
            onOpenImportModal={() => setIsCsvModalOpen(true)}
            onResetCampaignClick={() => setIsResetConfirmOpen(true)}
          />
        )}

        {/* View 2: Contacts Directory */}
        {activeTab === 'contacts' && (
          <ContactsView
            contacts={contacts}
            campaign={campaign}
            onAddContact={() => {
              setEditingContact(null);
              setIsContactModalOpen(true);
            }}
            onEditContact={(c) => {
              setEditingContact(c);
              setIsContactModalOpen(true);
            }}
            onDeleteContact={handleDeleteContact}
            onDeleteMultiple={handleDeleteMultipleContacts}
            onUpdateStatus={handleUpdateStatus}
            onOpenImportModal={() => setIsCsvModalOpen(true)}
            onSendSingle={handleSendSingleContact}
            defaultCountryCode={settings.defaultCountryCode}
            useDirectWeb={settings.useWhatsAppWebDirect}
          />
        )}

        {/* View 3: Message Composer */}
        {activeTab === 'composer' && (
          <ComposerView
            campaign={campaign}
            contacts={contacts}
            onSaveDraft={(updated) => setCampaign(updated)}
            onStartCampaign={() => setActiveTab('sender')}
          />
        )}

        {/* View 4: Sender Workspace */}
        {activeTab === 'sender' && (
          <SenderWorkspace
            contacts={contacts}
            campaign={campaign}
            onUpdateStatus={handleUpdateStatus}
            onNavigate={setActiveTab}
            autoAdvanceOnSent={settings.autoAdvanceOnSent}
            useDirectWeb={settings.useWhatsAppWebDirect}
            initialContactId={targetSenderContactId}
          />
        )}

        {/* View 5: Campaign History / Audit */}
        {activeTab === 'history' && (
          <CampaignHistoryView
            contacts={contacts}
            campaign={campaign}
            onUpdateStatus={handleUpdateStatus}
            onResetCampaignClick={() => setIsResetConfirmOpen(true)}
            onNavigateToSend={handleSendSingleContact}
            onNavigate={setActiveTab}
          />
        )}

        {/* View 6: Settings & Privacy */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            contacts={contacts}
            onSaveSettings={(newSettings) => setSettings(newSettings)}
            onLoadDemoContacts={(demo) => setContacts(demo)}
            onClearAllContacts={() => setIsClearAllConfirmOpen(true)}
            onRefreshAll={handleRefreshAll}
          />
        )}

      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Recipe Mantra</span>
            <span>•</span>
            <span>WhatsApp Personal Message Assistant</span>
          </div>
          <div>
            100% Free, Private & Local • Uses official WhatsApp Click-to-Chat (<code className="font-mono text-emerald-600">wa.me</code>)
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      
      {/* Contact Add / Edit Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        contact={editingContact}
        defaultCountryCode={settings.defaultCountryCode}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleImportCsv}
        defaultCountryCode={settings.defaultCountryCode}
        existingCount={contacts.length}
      />

      {/* Reset Campaign Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetCampaign}
        title="Reset Campaign Progress?"
        message="This will reset the status of all contacts back to 'Not Started' and clear timestamps. Your contacts and message template will remain completely safe. Are you sure you want to restart?"
        confirmLabel="Reset to Not Started"
        variant="warning"
      />

      {/* Wipe All Contacts Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={handleClearAll}
        title="Wipe All Contacts?"
        message="This will permanently delete all contacts from this browser's local storage. This action cannot be undone unless you have a CSV or JSON backup. Proceed?"
        confirmLabel="Wipe All Contacts"
        variant="danger"
      />

    </div>
  );
};
export default App;
