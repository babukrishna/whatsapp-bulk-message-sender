import React, { useState, useEffect } from 'react';
import { Contact, ContactStatus } from '../../types';
import { Modal } from '../common/Modal';
import { normalizePhoneNumber } from '../../utils/phoneValidator';
import { PhoneBadge } from '../common/Badge';
import { User, Phone, MapPin, Tag, FileText, CheckCircle2 } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => void;
  contact?: Contact | null; // null if adding new
  defaultCountryCode?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contact,
  defaultCountryCode = '+91',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');
  const [language, setLanguage] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ContactStatus>('Not Started');

  // Real-time phone validation state
  const [phoneValidation, setPhoneValidation] = useState(
    normalizePhoneNumber('', defaultCountryCode)
  );

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
      setNickname(contact.nickname || '');
      setCity(contact.city || '');
      setLanguage(contact.language || '');
      setNotes(contact.notes || '');
      setStatus(contact.status || 'Not Started');
      setPhoneValidation(normalizePhoneNumber(contact.phone, defaultCountryCode));
    } else {
      setName('');
      setPhone('');
      setNickname('');
      setCity('');
      setLanguage('');
      setNotes('');
      setStatus('Not Started');
      setPhoneValidation(normalizePhoneNumber('', defaultCountryCode));
    }
  }, [contact, isOpen, defaultCountryCode]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    setPhoneValidation(normalizePhoneNumber(val, defaultCountryCode));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a contact name.');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter a phone number.');
      return;
    }

    onSave({
      id: contact?.id,
      name: name.trim(),
      phone: phoneValidation.display || phone.trim(),
      normalizedPhone: phoneValidation.normalized,
      isValidPhone: phoneValidation.isValid,
      phoneError: phoneValidation.error,
      nickname: nickname.trim() || undefined,
      city: city.trim() || undefined,
      language: language.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? 'Edit Contact' : 'Add New Contact'}
      subtitle="Contacts are saved locally and used for personalized WhatsApp outreach"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            {contact ? 'Save Changes' : 'Add Contact'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Name Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pooja Sharma"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Phone Field with Realtime Validation */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            {phone && (
              <PhoneBadge isValid={phoneValidation.isValid} error={phoneValidation.error} />
            )}
          </div>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={phone}
              onChange={handlePhoneChange}
              placeholder="e.g. 9876543210 or +91 98765 43210"
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${
                phone && !phoneValidation.isValid
                  ? 'border-rose-300 bg-rose-50/20 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
              }`}
            />
          </div>
          
          {/* Phone validation info / helper */}
          <div className="mt-1.5 text-xs">
            {phone ? (
              phoneValidation.isValid ? (
                <p className="text-emerald-700 flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600" />
                  WhatsApp format: <strong>wa.me/{phoneValidation.normalized}</strong>
                </p>
              ) : (
                <p className="text-rose-600 text-[11px]">
                  ⚠️ {phoneValidation.error}
                </p>
              )
            ) : (
              <p className="text-slate-400 text-[11px]">
                Enter 10-digit mobile or international format with country code. Default: {defaultCountryCode}.
              </p>
            )}
          </div>
        </div>

        {/* Two-column layout for Nickname & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nickname / Greeting Name
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Pooja / Didi"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              City / Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Delhi"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Language & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Preferred Language
            </label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. Hindi, English"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Message Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactStatus)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="Not Started">Not Started</option>
              <option value="Ready">Ready</option>
              <option value="Opened in WhatsApp">Opened in WhatsApp</option>
              <option value="Marked as Sent">Marked as Sent</option>
              <option value="Skipped">Skipped</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Food Preferences / Customer Notes
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefers dry-fruit sweets, diabetic-friendly, gift hampers"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
            />
          </div>
        </div>

      </form>
    </Modal>
  );
};
