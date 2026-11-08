import React, { useState, useRef } from 'react';
import { Contact } from '../../types';
import { Modal } from '../common/Modal';
import { parseContactsCsv, downloadSampleCsvTemplate } from '../../utils/csvHelper';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Check, 
  X,
  FileCheck
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newContacts: Contact[], mode: 'replace' | 'append') => void;
  defaultCountryCode?: string;
  existingCount: number;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  defaultCountryCode = '+91',
  existingCount,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<Contact[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedContacts([]);
    setValidCount(0);
    setInvalidCount(0);
    setErrors([]);
    setSkipInvalid(false);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);

    try {
      const result = await parseContactsCsv(selectedFile, defaultCountryCode);
      setParsedContacts(result.contacts);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
      setErrors(result.errors);
    } catch (err: any) {
      setErrors([err.message || 'Failed to parse CSV file']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    let toImport = parsedContacts;
    if (skipInvalid) {
      toImport = parsedContacts.filter((c) => c.isValidPhone);
    }

    if (toImport.length === 0) {
      alert('No contacts available to import.');
      return;
    }

    onImport(toImport, importMode);
    resetState();
    onClose();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Contacts from CSV"
      subtitle="Upload your list of ~90 contacts for Recipe Mantra personal outreach"
      maxWidth="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedContacts.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
              parsedContacts.length > 0 && !isProcessing
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>
              Import {skipInvalid ? validCount : parsedContacts.length} Contacts
            </span>
          </button>
        </>
      }
    >
      <div className="space-y-5">
        
        {/* Sample Template Callout */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs">
          <div className="flex items-center gap-2 text-orange-900">
            <FileSpreadsheet className="w-4 h-4 text-orange-600" />
            <span>
              Need the exact columns? Download our prepared sample CSV template:
            </span>
          </div>
          <button
            type="button"
            onClick={downloadSampleCsvTemplate}
            className="inline-flex items-center gap-1 font-bold text-orange-700 hover:text-orange-900 bg-white px-2.5 py-1 rounded-lg border border-orange-200 hover:shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>
        </div>

        {/* Drag and Drop Zone */}
        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 flex items-center justify-center transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop your CSV file here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">name, phone, nickname, city, language, notes, status</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Selected Header */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{file.name}</h4>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {parsedContacts.length} rows detected
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetState}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="font-medium text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Valid Phone Numbers:
                </span>
                <span className="text-sm font-extrabold text-emerald-700">{validCount}</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                invalidCount > 0 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`font-medium flex items-center gap-1.5 ${invalidCount > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                  <AlertTriangle className={`w-4 h-4 ${invalidCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                  Invalid / Missing Phones:
                </span>
                <span className={`text-sm font-extrabold ${invalidCount > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                  {invalidCount}
                </span>
              </div>
            </div>

            {/* Invalid rows warning list if any */}
            {errors.length > 0 && (
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                  <span>Formatting Issues Detected ({errors.length}):</span>
                  <label className="flex items-center gap-1.5 font-normal text-rose-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipInvalid}
                      onChange={(e) => setSkipInvalid(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Skip invalid rows on import</span>
                  </label>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-rose-700 font-mono">
                  {errors.slice(0, 10).map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                  {errors.length > 10 && (
                    <div className="text-slate-500 font-sans italic">
                      + {errors.length - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview of first 3 rows */}
            {parsedContacts.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Preview (First 3 contacts)
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                  <div className="grid grid-cols-4 bg-slate-50 p-2 font-bold text-slate-700 border-b border-slate-200">
                    <div>Name</div>
                    <div>Phone</div>
                    <div>City</div>
                    <div>WhatsApp Link</div>
                  </div>
                  {parsedContacts.slice(0, 3).map((c, i) => (
                    <div key={i} className="grid grid-cols-4 p-2 border-b border-slate-100 last:border-b-0">
                      <div className="font-medium text-slate-900 truncate">{c.name}</div>
                      <div className="text-slate-600 truncate">{c.phone}</div>
                      <div className="text-slate-500 truncate">{c.city || '—'}</div>
                      <div className="font-mono text-[11px] text-emerald-700 truncate">
                        wa.me/{c.normalizedPhone || 'invalid'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Mode Selection */}
            {existingCount > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800">
                  You already have {existingCount} existing contacts:
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Replace all existing contacts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Append to existing contacts</span>
                  </label>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </Modal>
  );
};
