import React, { useState, useMemo } from 'react';
import { Contact, ContactStatus, CampaignDraft, ActiveTab } from '../../types';
import { StatusBadge, PhoneBadge } from '../common/Badge';
import { exportContactsToCsv, downloadSampleCsvTemplate } from '../../utils/csvHelper';
import { buildWhatsAppUrl } from '../../utils/phoneValidator';
import { personalizeMessage } from '../../utils/messageParser';
import { 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Send, 
  CheckSquare, 
  Square, 
  ExternalLink, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Users
} from 'lucide-react';

interface ContactsViewProps {
  contacts: Contact[];
  campaign: CampaignDraft;
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onUpdateStatus: (id: string, status: ContactStatus) => void;
  onOpenImportModal: () => void;
  onSendSingle: (contact: Contact) => void;
  defaultCountryCode?: string;
  useDirectWeb?: boolean;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  campaign,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onDeleteMultiple,
  onUpdateStatus,
  onOpenImportModal,
  onSendSingle,
  defaultCountryCode = '+91',
  useDirectWeb = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [validityFilter, setValidityFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter contacts by search, status, and phone validity
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Search term
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nickname && c.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      // Validity filter
      if (validityFilter === 'valid' && !c.isValidPhone) return false;
      if (validityFilter === 'invalid' && c.isValidPhone) return false;

      return true;
    });
  }, [contacts, searchTerm, statusFilter, validityFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected contact(s)?`
      )
    ) {
      onDeleteMultiple(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleQuickWhatsAppOpen = (contact: Contact) => {
    if (!contact.isValidPhone) {
      alert(`Cannot open WhatsApp: ${contact.phoneError || 'Invalid phone number'}`);
      return;
    }
    const message = personalizeMessage(campaign.body, contact, campaign.catalogueUrl, campaign.signature);
    const url = buildWhatsAppUrl(contact.normalizedPhone, message, useDirectWeb);
    window.open(url, '_blank', 'noopener,noreferrer');
    onUpdateStatus(contact.id, 'Opened in WhatsApp');
  };

  const invalidCount = contacts.filter((c) => !c.isValidPhone).length;

  return (
    <div className="space-y-5">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>Contacts Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {contacts.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal contacts, phone numbers and messaging statuses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sample CSV Download */}
          <button
            onClick={downloadSampleCsvTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
            title="Download blank sample CSV template with columns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Sample CSV</span>
          </button>

          {/* Import CSV */}
          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportContactsToCsv(contacts)}
            disabled={contacts.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
            title="Export contacts and campaign status to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {/* Add Single Contact */}
          <button
            onClick={onAddContact}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Invalid numbers alert banner if any exist */}
      {invalidCount > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{invalidCount} contact(s)</strong> have invalid or incomplete phone numbers. They are flagged with a red badge below and cannot open WhatsApp until corrected.
            </span>
          </div>
          <button
            onClick={() => {
              setValidityFilter('invalid');
              setStatusFilter('all');
            }}
            className="underline font-bold text-amber-800 hover:text-amber-950 shrink-0"
          >
            View Invalid
          </button>
        </div>
      )}

      {/* Search, Filter, and Bulk Actions Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, nickname, phone, city..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="Ready">Ready</option>
                <option value="Opened in WhatsApp">Opened in WhatsApp</option>
                <option value="Marked as Sent">Marked as Sent</option>
                <option value="Skipped">Skipped</option>
              </select>
            </div>

            {/* Validity Filter */}
            <select
              value={validityFilter}
              onChange={(e) => {
                setValidityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Phone Numbers</option>
              <option value="valid">Valid Numbers Only</option>
              <option value="invalid">Invalid Numbers Only</option>
            </select>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Selected Items Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs">
            <span className="font-semibold text-emerald-900">
              {selectedIds.length} of {filteredContacts.length} contacts selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  selectedIds.forEach((id) => onUpdateStatus(id, 'Ready'));
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-medium hover:bg-emerald-100 transition-colors"
              >
                Mark as Ready
              </button>
              <button
                onClick={() => {
                  selectedIds.forEach((id) => onUpdateStatus(id, 'Not Started'));
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
              >
                Reset to Not Started
              </button>
              <button
                onClick={handleDeleteSelected}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors flex items-center gap-1 shadow-xs"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={selectedIds.length === filteredContacts.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredContacts.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Phone (WhatsApp)</th>
                <th className="py-3 px-4">City / Region</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-sm font-semibold text-slate-600">No contacts found</p>
                    <p className="text-xs text-slate-400">
                      {contacts.length === 0
                        ? 'Click "Import CSV" to upload your 90 contacts or "Add Contact" to enter one manually.'
                        : 'Try adjusting your search query or status filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(contact.id)}
                          className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Nickname */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{contact.name}</div>
                        {contact.nickname && (
                          <span className="text-[11px] text-slate-500 italic">
                            Calling name: {contact.nickname}
                          </span>
                        )}
                      </td>

                      {/* Phone & Validation */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-800">{contact.phone}</span>
                          <PhoneBadge isValid={contact.isValidPhone} error={contact.phoneError} />
                        </div>
                        {contact.isValidPhone ? (
                          <div className="text-[10px] text-slate-400 font-mono">
                            wa.me/{contact.normalizedPhone}
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-500 font-sans">
                            {contact.phoneError}
                          </div>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-3 px-4">
                        <span className="text-slate-700">{contact.city || '—'}</span>
                        {contact.language && (
                          <span className="block text-[10px] text-slate-400">{contact.language}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={contact.status} size="sm" />
                        {contact.sentAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(contact.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                        {contact.notes || '—'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Send Workspace button */}
                          <button
                            type="button"
                            onClick={() => onSendSingle(contact)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Open in Sending Workspace"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          {/* Quick WhatsApp Link */}
                          {contact.isValidPhone && (
                            <button
                              type="button"
                              onClick={() => handleQuickWhatsAppOpen(contact)}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Direct Click-to-Chat in WhatsApp"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-600" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEditContact(contact)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Contact"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onDeleteContact(contact.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredContacts.length)} of {filteredContacts.length} contacts
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-100"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-800 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
