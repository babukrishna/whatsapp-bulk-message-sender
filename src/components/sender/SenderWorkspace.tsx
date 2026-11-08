import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Contact, CampaignDraft, ContactStatus, ActiveTab } from '../../types';
import { StatusBadge, PhoneBadge } from '../common/Badge';
import { WhatsAppPreview } from '../common/WhatsAppPreview';
import { personalizeMessage } from '../../utils/messageParser';
import { buildWhatsAppUrl } from '../../utils/phoneValidator';
import { getImageFromDB } from '../../utils/storage';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  ExternalLink, 
  Copy, 
  Check, 
  SkipForward, 
  CheckCircle2, 
  Download, 
  Image as ImageIcon, 
  AlertTriangle, 
  Keyboard, 
  HelpCircle,
  FileSpreadsheet,
  Users,
  RotateCcw
} from 'lucide-react';

interface SenderWorkspaceProps {
  contacts: Contact[];
  campaign: CampaignDraft;
  onUpdateStatus: (id: string, status: ContactStatus, timestampField?: 'sentAt' | 'openedAt') => void;
  onNavigate: (tab: ActiveTab) => void;
  autoAdvanceOnSent?: boolean;
  useDirectWeb?: boolean;
  initialContactId?: string;
}

export const SenderWorkspace: React.FC<SenderWorkspaceProps> = ({
  contacts,
  campaign,
  onUpdateStatus,
  onNavigate,
  autoAdvanceOnSent = true,
  useDirectWeb = false,
  initialContactId,
}) => {
  const [filterMode, setFilterMode] = useState<'pending' | 'all' | 'sent' | 'skipped'>('pending');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [catalogueImageData, setCatalogueImageData] = useState<string | null>(campaign.imageUrl || null);

  // Load image if not loaded
  useEffect(() => {
    async function loadImg() {
      if (campaign.imageId && !catalogueImageData) {
        const stored = await getImageFromDB(campaign.imageId);
        if (stored) {
          setCatalogueImageData(stored.dataUrl);
        }
      }
    }
    loadImg();
  }, [campaign.imageId, catalogueImageData]);

  // Filter contacts according to selection
  const visibleContacts = useMemo(() => {
    switch (filterMode) {
      case 'pending':
        // Not Started, Ready, or Opened but not marked as Sent or Skipped
        return contacts.filter((c) => c.status !== 'Marked as Sent' && c.status !== 'Skipped');
      case 'sent':
        return contacts.filter((c) => c.status === 'Marked as Sent');
      case 'skipped':
        return contacts.filter((c) => c.status === 'Skipped');
      case 'all':
      default:
        return contacts;
    }
  }, [contacts, filterMode]);

  // Set initial contact if passed
  useEffect(() => {
    if (initialContactId) {
      const idx = visibleContacts.findIndex((c) => c.id === initialContactId);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [initialContactId, visibleContacts]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= visibleContacts.length && visibleContacts.length > 0) {
      setCurrentIndex(visibleContacts.length - 1);
    }
  }, [visibleContacts.length, currentIndex]);

  const currentContact: Contact | undefined = visibleContacts[currentIndex];

  // Navigation callbacks
  const handleNext = useCallback(() => {
    if (currentIndex < visibleContacts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, visibleContacts.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Open WhatsApp
  const handleOpenWhatsApp = () => {
    if (!currentContact) return;

    if (!currentContact.isValidPhone) {
      alert(`Cannot open WhatsApp: ${currentContact.phoneError || 'Invalid phone number'}`);
      return;
    }

    const personalized = personalizeMessage(
      campaign.body,
      currentContact,
      campaign.catalogueUrl,
      campaign.signature
    );

    const waUrl = buildWhatsAppUrl(currentContact.normalizedPhone, personalized, useDirectWeb);
    
    // Open in a new tab
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Update status to 'Opened in WhatsApp' if not already Sent
    if (currentContact.status !== 'Marked as Sent') {
      onUpdateStatus(currentContact.id, 'Opened in WhatsApp', 'openedAt');
    }
  };

  // Mark as Sent
  const handleMarkAsSent = () => {
    if (!currentContact) return;
    onUpdateStatus(currentContact.id, 'Marked as Sent', 'sentAt');

    if (autoAdvanceOnSent) {
      // In 'pending' mode, marking as sent will remove the contact from list.
      // So staying at the same index effectively advances to the next pending contact!
      if (filterMode !== 'pending' && currentIndex < visibleContacts.length - 1) {
        handleNext();
      }
    }
  };

  // Skip Contact
  const handleSkip = () => {
    if (!currentContact) return;
    onUpdateStatus(currentContact.id, 'Skipped');
    if (filterMode !== 'pending' && currentIndex < visibleContacts.length - 1) {
      handleNext();
    }
  };

  // Copy Message
  const handleCopyMessage = () => {
    if (!currentContact) return;
    const personalized = personalizeMessage(
      campaign.body,
      currentContact,
      campaign.catalogueUrl,
      campaign.signature
    );
    navigator.clipboard.writeText(personalized);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Download Catalogue Image
  const handleDownloadImage = () => {
    if (!catalogueImageData) return;
    const a = document.createElement('a');
    a.href = catalogueImageData;
    a.download = campaign.imageFileName || 'Recipe_Mantra_Catalogue.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy Catalogue Image to Clipboard
  const handleCopyImage = async () => {
    if (!catalogueImageData) return;
    try {
      const img = new Image();
      img.src = catalogueImageData;
      await new Promise((res) => { img.onload = res; });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(async (pngBlob) => {
        if (pngBlob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2000);
        }
      }, 'image/png');
    } catch (e) {
      // Fallback
      handleDownloadImage();
    }
  };

  // Keyboard Shortcuts: Alt+W (WhatsApp), Alt+S (Mark Sent), Alt+K (Skip), Alt+N (Next), Alt+P (Prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only if not in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleOpenWhatsApp();
      } else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleMarkAsSent();
      } else if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleSkip();
      } else if ((e.altKey && e.key.toLowerCase() === 'n') || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if ((e.altKey && e.key.toLowerCase() === 'p') || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, currentContact, autoAdvanceOnSent]);

  const totalContacts = contacts.length;
  const sentCount = contacts.filter((c) => c.status === 'Marked as Sent').length;

  // Empty state if no contacts
  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Contacts Found</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Import your contacts from a CSV file or add them manually to begin sending personalized WhatsApp messages for Recipe Mantra.
        </p>
        <button
          onClick={() => onNavigate('contacts')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Go to Contacts Directory</span>
        </button>
      </div>
    );
  }

  // All completed in pending filter mode
  if (!currentContact) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {filterMode === 'pending' ? 'All Pending Messages Processed! 🎉' : 'No Contacts Match This Filter'}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          {filterMode === 'pending'
            ? `You've stepped through all contacts in this campaign. Total marked sent: ${sentCount} of ${totalContacts}.`
            : `Try changing your filter to 'All Contacts' or 'Pending Contacts'.`}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setFilterMode('all')}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Show All Contacts
          </button>
          <button
            onClick={() => onNavigate('history')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            View Campaign Report
          </button>
        </div>
      </div>
    );
  }

  const personalizedText = personalizeMessage(
    campaign.body,
    currentContact,
    campaign.catalogueUrl,
    campaign.signature
  );

  return (
    <div className="space-y-5">
      
      {/* Workspace Header & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Progress & Current Position */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
            {currentIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-base">
                Contact {currentIndex + 1} of {visibleContacts.length}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {totalContacts > 0 ? `${Math.round(((sentCount) / totalContacts) * 100)}% campaign completed` : '0%'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Personalized sending queue for Recipe Mantra
            </p>
          </div>
        </div>

        {/* Filter & Keyboard Hint */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-medium">
            <button
              onClick={() => {
                setFilterMode('pending');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterMode === 'pending'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({totalContacts - sentCount})
            </button>
            <button
              onClick={() => {
                setFilterMode('all');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalContacts})
            </button>
            <button
              onClick={() => {
                setFilterMode('sent');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterMode === 'sent'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sent ({sentCount})
            </button>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
              title="Previous Contact (Alt+P or Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === visibleContacts.length - 1}
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
              title="Next Contact (Alt+N or Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-column Layout: Contact Details & Image on Left, WhatsApp Bubble & Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Contact Details Card & Image Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recipient Information
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {currentContact.name}
                </h3>
                {currentContact.nickname && (
                  <p className="text-xs text-orange-600 font-medium">
                    Greeting name: <strong>{currentContact.nickname}</strong>
                  </p>
                )}
              </div>
              <StatusBadge status={currentContact.status} />
            </div>

            {/* Phone Info & WhatsApp Link */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Phone Number:</span>
                <PhoneBadge isValid={currentContact.isValidPhone} error={currentContact.phoneError} />
              </div>
              <div className="font-mono text-sm font-bold text-slate-900">
                {currentContact.phone}
              </div>
              
              {currentContact.isValidPhone ? (
                <div className="text-[11px] text-emerald-700 font-mono flex items-center gap-1 pt-1 border-t border-slate-200/60">
                  <span>wa.me/{currentContact.normalizedPhone}</span>
                </div>
              ) : (
                <div className="text-xs text-rose-600 font-medium pt-1 border-t border-slate-200/60">
                  ⚠️ {currentContact.phoneError}
                </div>
              )}
            </div>

            {/* City, Language & Notes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">City</span>
                <span className="font-semibold text-slate-800">{currentContact.city || 'Not specified'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Language</span>
                <span className="font-semibold text-slate-800">{currentContact.language || 'English / Hindi'}</span>
              </div>
            </div>

            {currentContact.notes && (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                <span className="text-amber-800 font-bold block text-[10px] uppercase">
                  Customer Preferences / Notes:
                </span>
                <p className="text-amber-950 mt-0.5">{currentContact.notes}</p>
              </div>
            )}

            {/* Status Override */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Update status manually:</span>
              <select
                value={currentContact.status}
                onChange={(e) => onUpdateStatus(currentContact.id, e.target.value as ContactStatus)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none"
              >
                <option value="Not Started">Not Started</option>
                <option value="Ready">Ready</option>
                <option value="Opened in WhatsApp">Opened in WhatsApp</option>
                <option value="Marked as Sent">Marked as Sent</option>
                <option value="Skipped">Skipped</option>
              </select>
            </div>
          </div>

          {/* Catalogue Image Action Card */}
          {catalogueImageData && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Catalogue Image</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {campaign.imageFileName || 'catalogue.jpg'}
                </span>
              </div>

              <div className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center max-h-48">
                <img
                  src={catalogueImageData}
                  alt="Catalogue"
                  className="w-full h-auto object-cover max-h-48"
                />
              </div>

              {/* Image Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedImage ? 'Copied Image!' : 'Copy Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Image</span>
                </button>
              </div>

              {/* Instructions on manual image attachment */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-950">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                  How to send this image with your message:
                </div>
                <ol className="list-decimal list-inside space-y-0.5 text-amber-800">
                  <li>Click <strong>Open WhatsApp</strong> below to open the chat with your text prefilled.</li>
                  <li>In WhatsApp, click the 📎 paperclip (Attach) or press <kbd className="bg-white px-1 rounded border">Ctrl+V</kbd>.</li>
                  <li>Select or paste this image and tap <strong>Send</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-slate-500" />
              <span className="font-medium">Hotkeys:</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span><kbd className="bg-white px-1 py-0.5 rounded border shadow-2xs">Alt+W</kbd> WhatsApp</span>
              <span><kbd className="bg-white px-1 py-0.5 rounded border shadow-2xs">Alt+S</kbd> Sent</span>
              <span><kbd className="bg-white px-1 py-0.5 rounded border shadow-2xs">Alt+N</kbd> Next</span>
            </div>
          </div>

        </div>

        {/* Right Column: Message Preview & Primary Action Buttons (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Real WhatsApp Chat Bubble Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-bold text-slate-700">
                Personalized WhatsApp Message for {currentContact.name}
              </span>
              <span className="text-[11px]">Clickable links included</span>
            </div>

            <WhatsAppPreview
              contactName={currentContact.name}
              contactPhone={currentContact.phone}
              messageText={personalizedText}
              imageUrl={catalogueImageData}
              imageName={campaign.imageFileName}
              onCopy={() => {
                setCopiedMessage(true);
                setTimeout(() => setCopiedMessage(false), 2000);
              }}
            />
          </div>

          {/* Action Bar (The Critical Step) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
            
            {/* Primary Action Button: Open WhatsApp */}
            <div>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                disabled={!currentContact.isValidPhone}
                className={`w-full py-3.5 px-6 rounded-2xl text-base font-extrabold flex items-center justify-center gap-3 shadow-md transition-all ${
                  currentContact.isValidPhone
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:scale-[1.01]'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>Open WhatsApp Chat with {currentContact.name}</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
              </button>

              <p className="text-center text-[11px] text-slate-500 mt-2">
                Opens <strong>wa.me/{currentContact.normalizedPhone}</strong> with your personalized message prefilled. You review and send manually inside WhatsApp.
              </p>
            </div>

            {/* Secondary Post-Sending Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
              
              {/* Mark as Sent */}
              <button
                type="button"
                onClick={handleMarkAsSent}
                className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="Mark this contact as sent and advance to next (Alt+S)"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mark as Sent</span>
              </button>

              {/* Copy Message Text */}
              <button
                type="button"
                onClick={handleCopyMessage}
                className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Copy personalized text to clipboard"
              >
                {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copiedMessage ? 'Copied!' : 'Copy Text'}</span>
              </button>

              {/* Skip Contact */}
              <button
                type="button"
                onClick={handleSkip}
                className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-300 hover:border-purple-300 text-slate-700 hover:text-purple-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Skip this contact for now (Alt+K)"
              >
                <SkipForward className="w-4 h-4 text-purple-600" />
                <span>Skip Contact</span>
              </button>

            </div>

            {/* Next / Previous bar */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Contact</span>
              </button>

              <span className="text-slate-400 font-mono text-[11px]">
                {currentIndex + 1} / {visibleContacts.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === visibleContacts.length - 1}
                className="text-emerald-700 hover:text-emerald-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
              >
                <span>Next Contact</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
