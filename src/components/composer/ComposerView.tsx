import React, { useState, useRef, useEffect } from 'react';
import { CampaignDraft, Contact } from '../../types';
import { AVAILABLE_VARIABLES, DEFAULT_TEMPLATE, personalizeMessage } from '../../utils/messageParser';
import { WhatsAppPreview } from '../common/WhatsAppPreview';
import { saveImageToDB, getImageFromDB, deleteImageFromDB, DEFAULT_CAMPAIGN } from '../../utils/storage';
import {
  Sparkles,
  Upload,
  Trash2,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Save,
  Eye,
  Check,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Copy
} from 'lucide-react';

interface ComposerViewProps {
  campaign: CampaignDraft;
  contacts: Contact[];
  onSaveDraft: (draft: CampaignDraft) => void;
  onStartCampaign: () => void;
}

export const ComposerView: React.FC<ComposerViewProps> = ({
  campaign,
  contacts,
  onSaveDraft,
  onStartCampaign,
}) => {
  const [draft, setDraft] = useState<CampaignDraft>(campaign);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>(
    contacts[0]?.id || ''
  );
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copiedImageSuccess, setCopiedImageSuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sync draft from prop changes
  useEffect(() => {
    setDraft(campaign);
  }, [campaign]);

  // Load image preview from IndexedDB on mount if imageId exists but no imageUrl
  useEffect(() => {
    async function loadCachedImage() {
      if (draft.imageId && !draft.imageUrl) {
        const stored = await getImageFromDB(draft.imageId);
        if (stored) {
          setDraft((prev) => ({
            ...prev,
            imageUrl: stored.dataUrl,
            imageFileName: stored.name,
            imageFileType: stored.type,
            imageFileSize: stored.size,
          }));
        }
      }
    }
    loadCachedImage();
  }, [draft.imageId, draft.imageUrl]);

  // Insert variable tag at cursor position
  const handleInsertVariable = (varKey: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = draft.body;
    const newText = currentText.substring(0, start) + varKey + currentText.substring(end);

    setDraft({ ...draft, body: newText });
    setIsSaved(false);

    // Reposition cursor after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 0);
  };

  // Image Upload handler
  const handleImageFile = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    setImageError(null);

    try {
      // Save to IndexedDB
      const result = await saveImageToDB(file);
      const updatedDraft: CampaignDraft = {
        ...draft,
        imageId: result.imageId,
        imageUrl: result.dataUrl,
        imageFileName: result.name,
        imageFileType: result.type,
        imageFileSize: result.size,
        updatedAt: new Date().toISOString(),
      };
      setDraft(updatedDraft);
      onSaveDraft(updatedDraft);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Remove image handler
  const handleRemoveImage = async () => {
    if (draft.imageId) {
      await deleteImageFromDB(draft.imageId);
    }
    const updatedDraft: CampaignDraft = {
      ...draft,
      imageId: undefined,
      imageUrl: undefined,
      imageFileName: undefined,
      imageFileType: undefined,
      imageFileSize: undefined,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updatedDraft);
    onSaveDraft(updatedDraft);
  };

  // Copy image to clipboard handler
  const handleCopyImageToClipboard = async () => {
    if (!draft.imageUrl) return;
    try {
      const response = await fetch(draft.imageUrl);
      const blob = await response.blob();
      // ClipboardItem requires PNG
      if (blob.type === 'image/png') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } else {
        // Convert to PNG on a canvas
        const img = new Image();
        img.src = draft.imageUrl;
        await new Promise((res) => { img.onload = res; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(async (pngBlob) => {
          if (pngBlob) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
          }
        }, 'image/png');
      }
      setCopiedImageSuccess(true);
      setTimeout(() => setCopiedImageSuccess(false), 2500);
    } catch (err) {
      // Fallback: download the file
      handleDownloadImage();
    }
  };

  // Download image handler
  const handleDownloadImage = () => {
    if (!draft.imageUrl) return;
    const a = document.createElement('a');
    a.href = draft.imageUrl;
    a.download = draft.imageFileName || 'Recipe_Mantra_Catalogue.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Save draft
  const handleSave = () => {
    const updated = {
      ...draft,
      isUserCustomDraft: draft.body !== DEFAULT_TEMPLATE,
      updatedAt: new Date().toISOString(),
    };
    onSaveDraft(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Reset to default template
  const handleResetTemplate = () => {
    if (window.confirm('Reset message body and catalogue link to Recipe Mantra default?')) {
      const reset = {
        ...draft,
        body: DEFAULT_TEMPLATE,
        catalogueUrl: DEFAULT_CAMPAIGN.catalogueUrl,
        isUserCustomDraft: false,
      };
      setDraft(reset);
      onSaveDraft(reset);
      setIsSaved(false);
    }
  };

  // Selected contact for live preview
  const currentPreviewContact = contacts.find((c) => c.id === selectedContactId) || contacts[0] || {
    id: 'preview_sample',
    name: 'Amit Sharma',
    phone: '+91 98765 43210',
    normalizedPhone: '919876543210',
    isValidPhone: true,
    nickname: 'Amit',
    city: 'Delhi',
    status: 'Ready',
    createdAt: new Date().toISOString(),
  };

  const personalizedPreviewText = personalizeMessage(
    draft.body,
    currentPreviewContact,
    draft.catalogueUrl,
    draft.signature
  );

  return (
    <div className="space-y-6">

      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>Message Composer</span>
            {isSaved && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                <Check className="w-3 h-3 text-emerald-600" />
                Draft Saved
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            Compose your promotional message, customize with variables, and attach your catalogue link.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={onStartCampaign}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <span>Start Sending</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 2-column Grid: Editor on Left, Live WhatsApp Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Composer Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">

          {/* Campaign Details Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => {
                    setDraft({ ...draft, name: e.target.value });
                    setIsSaved(false);
                  }}
                  placeholder="e.g. Recipe Mantra Diwali Sweets"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Internal Subject / Note
                </label>
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => {
                    setDraft({ ...draft, subject: e.target.value });
                    setIsSaved(false);
                  }}
                  placeholder="e.g. Homemade snacks & sweets showcase"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Catalogue Link */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  WhatsApp Catalogue URL / Link
                </label>
                {draft.catalogueUrl && (
                  <a
                    href={draft.catalogueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1"
                  >
                    <span>Test link</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={draft.catalogueUrl}
                onChange={(e) => {
                  setDraft({ ...draft, catalogueUrl: e.target.value });
                  setIsSaved(false);
                }}
                placeholder="e.g. https://wa.me/c/919625924506 or your online menu link"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This URL automatically replaces the <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">{'{{catalogue_link}}'}</code> variable in the message text.
              </p>
            </div>
          </div>

          {/* Message Body Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Message Body <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={handleResetTemplate}
                className="text-[11px] text-slate-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                title="Reset to default template"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Default</span>
              </button>
            </div>

            {/* Variable Insertion Chips */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Click to insert personalization variable at cursor:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => handleInsertVariable(v.key)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-800 transition-all shadow-2xs"
                    title={v.description}
                  >
                    <span className="text-emerald-600 font-bold">+</span>
                    <span>{v.key}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={11}
                value={draft.body}
                onChange={(e) => {
                  setDraft({ ...draft, body: e.target.value });
                  setIsSaved(false);
                }}
                placeholder="Type your WhatsApp message..."
                className="w-full p-3.5 text-xs sm:text-sm font-sans rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed resize-y"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{draft.body.length} characters</span>
              <span className="text-[11px] text-slate-400">
                Supports WhatsApp markdown: <strong className="font-bold">*bold*</strong>, <em>_italics_</em>, ~strike~
              </span>
            </div>

            {/* Optional Signature */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Optional Signature
              </label>
              <textarea
                rows={2}
                value={draft.signature}
                onChange={(e) => {
                  setDraft({ ...draft, signature: e.target.value });
                  setIsSaved(false);
                }}
                placeholder="e.g. Warm regards,\nRecipe Mantra"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
              />
            </div>

          </div>

          {/* Catalogue Image Uploader Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Catalogue / Promotional Image (Stored Locally in IndexedDB)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your menu, food photo, or festive catalogue card (JPG, PNG, or WebP up to 8MB)
              </p>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />

            {imageError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Image Preview or Upload Prompt */}
            {!draft.imageUrl ? (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 flex items-center justify-center transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isUploadingImage ? 'Saving image to IndexedDB...' : 'Click to upload catalogue image'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    JPG, PNG, WebP • Stored completely on your device
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={draft.imageUrl}
                      alt="Catalogue preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                        {draft.imageFileName || 'Catalogue Image'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {draft.imageFileSize ? `${(draft.imageFileSize / 1024).toFixed(0)} KB` : 'Local image'} • {draft.imageFileType || 'image'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Copy image button */}
                    <button
                      type="button"
                      onClick={handleCopyImageToClipboard}
                      className="p-1.5 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                      title="Copy image to clipboard"
                    >
                      {copiedImageSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Download */}
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="p-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                      title="Download image to your computer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Replace */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 font-medium"
                    >
                      Replace
                    </button>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Important WhatsApp Limitation Warning */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                    Important WhatsApp Attachment Protocol:
                  </span>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    WhatsApp <code className="bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-mono">wa.me</code> links prefill your text and catalogue link, but WhatsApp does not allow browsers to silently attach binary image files. In the Sending Workspace, you can click <strong>Copy Image</strong> or <strong>Download Image</strong> and easily paste or attach (📎) it in WhatsApp.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Live WhatsApp Chat Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">

          {/* Contact Selector for preview testing */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Preview with Contact
              </span>
              <span className="text-[11px] text-slate-400">
                {contacts.length} contacts available
              </span>
            </div>

            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800"
            >
              {contacts.length === 0 ? (
                <option value="">Sample: Amit Sharma (Delhi)</option>
              ) : (
                contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.nickname ? `(${c.nickname})` : ''} - {c.city || 'No city'}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* WhatsApp Preview Bubble */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-semibold text-slate-700">Real-time WhatsApp Message Preview</span>
              <span className="text-[11px]">Exact look on recipient phone</span>
            </div>

            <WhatsAppPreview
              contactName={currentPreviewContact.name}
              contactPhone={currentPreviewContact.phone}
              messageText={personalizedPreviewText}
              imageUrl={draft.imageUrl}
              imageName={draft.imageFileName}
            />
          </div>

          {/* Quick CTA */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200/80 text-xs space-y-2">
            <p className="text-emerald-900 font-medium">
              Ready to send personalized messages to your contacts?
            </p>
            <button
              type="button"
              onClick={onStartCampaign}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <span>Launch Sending Workspace</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
