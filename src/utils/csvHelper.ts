import Papa from 'papaparse';
import { Contact, ContactStatus, CSVContactRow } from '../types';
import { normalizePhoneNumber } from './phoneValidator';

export const CSV_COLUMNS = [
  'name',
  'phone',
  'nickname',
  'city',
  'language',
  'notes',
  'status',
] as const;

export interface CsvParseResult {
  contacts: Contact[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  errors: string[];
}

/**
 * Normalizes header keys by removing spaces, underscores, and lowercasing.
 */
function normalizeHeader(header: string): string {
  const clean = header.trim().toLowerCase().replace(/[\s_\-]/g, '');
  if (['name', 'fullname', 'contactname', 'customername'].includes(clean)) return 'name';
  if (['phone', 'phonenumber', 'mobile', 'mobilenumber', 'cell', 'whatsapp', 'whatsappnumber', 'contact'].includes(clean)) return 'phone';
  if (['nickname', 'shortname', 'callingname'].includes(clean)) return 'nickname';
  if (['city', 'location', 'town', 'place'].includes(clean)) return 'city';
  if (['language', 'lang'].includes(clean)) return 'language';
  if (['notes', 'note', 'remark', 'remarks', 'comment'].includes(clean)) return 'notes';
  if (['status', 'messagestatus', 'campaignstatus'].includes(clean)) return 'status';
  return clean;
}

/**
 * Parses CSV string or File into normalized Contact array.
 */
export async function parseContactsCsv(
  fileOrText: File | string,
  defaultCountryCode = '+91'
): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVContactRow>(fileOrText as any, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: normalizeHeader,
      complete: (results) => {
        const contacts: Contact[] = [];
        const errors: string[] = [];
        let validCount = 0;
        let invalidCount = 0;

        results.data.forEach((row, idx) => {
          const rawName = (row.name ?? '').trim();
          const rawPhone = (row.phone ?? '').trim();

          // Skip completely empty rows
          if (!rawName && !rawPhone) {
            return;
          }

          const validation = normalizePhoneNumber(rawPhone, defaultCountryCode);

          if (validation.isValid) {
            validCount++;
          } else {
            invalidCount++;
            if (rawPhone) {
              errors.push(`Row ${idx + 2} (${rawName || 'Unnamed'}): ${validation.error}`);
            } else {
              errors.push(`Row ${idx + 2} (${rawName || 'Unnamed'}): Missing phone number`);
            }
          }

          // Validate status or default to 'Not Started'
          const rawStatus = (row.status ?? '').trim();
          const validStatuses: ContactStatus[] = [
            'Not Started',
            'Ready',
            'Opened in WhatsApp',
            'Marked as Sent',
            'Skipped',
          ];
          const status: ContactStatus = validStatuses.includes(rawStatus as ContactStatus)
            ? (rawStatus as ContactStatus)
            : 'Not Started';

          const contact: Contact = {
            id: `c_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            name: rawName || 'Friend',
            phone: validation.display || rawPhone,
            normalizedPhone: validation.normalized,
            isValidPhone: validation.isValid,
            phoneError: validation.error,
            nickname: (row.nickname ?? '').trim() || undefined,
            city: (row.city ?? '').trim() || undefined,
            language: (row.language ?? '').trim() || undefined,
            notes: (row.notes ?? '').trim() || undefined,
            status,
            createdAt: new Date().toISOString(),
          };

          contacts.push(contact);
        });

        resolve({
          contacts,
          totalRows: contacts.length,
          validCount,
          invalidCount,
          errors,
        });
      },
      error: (err) => {
        reject(new Error(`CSV Parsing failed: ${err.message}`));
      },
    });
  });
}

/**
 * Exports contacts array to a downloadable CSV file
 */
export function exportContactsToCsv(contacts: Contact[], filename = 'Recipe_Mantra_Contacts.csv'): void {
  const exportData = contacts.map((c) => ({
    name: c.name,
    phone: c.phone,
    whatsapp_number: c.normalizedPhone,
    is_valid_phone: c.isValidPhone ? 'Yes' : 'No',
    nickname: c.nickname || '',
    city: c.city || '',
    language: c.language || '',
    notes: c.notes || '',
    status: c.status,
    sent_at: c.sentAt ? new Date(c.sentAt).toLocaleString() : '',
    opened_at: c.openedAt ? new Date(c.openedAt).toLocaleString() : '',
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a sample CSV template with Recipe Mantra demo rows
 */
export function downloadSampleCsvTemplate(): void {
  const sampleData = [
    {
      name: 'Pooja Sharma',
      phone: '9876543210',
      nickname: 'Pooja',
      city: 'Delhi',
      language: 'Hindi',
      notes: 'Loves besan laddu and kaju katli',
      status: 'Not Started',
    },
    {
      name: 'Rajesh Verma',
      phone: '+91 98111 22334',
      nickname: 'Rajesh ji',
      city: 'Noida',
      language: 'Hindi/English',
      notes: 'Regular customer for mathri and namkeen',
      status: 'Not Started',
    },
    {
      name: 'Ananya Iyer',
      phone: '+91 (982) 345-6789',
      nickname: 'Anu',
      city: 'Bengaluru',
      language: 'English',
      notes: 'Interested in diabetic-friendly sweets',
      status: 'Not Started',
    },
    {
      name: 'Vikram Mehta',
      phone: '09845012345',
      nickname: 'Vikram',
      city: 'Mumbai',
      language: 'Hindi',
      notes: 'Gift box inquiry for Diwali',
      status: 'Not Started',
    },
    {
      name: 'Sunita Patel',
      phone: '9898765432',
      nickname: 'Sunita Didi',
      city: 'Ahmedabad',
      language: 'Gujarati/Hindi',
      notes: 'Favorite: dry fruit barfi',
      status: 'Not Started',
    },
    {
      name: 'David Miller',
      phone: '+1 415 555 0192',
      nickname: 'David',
      city: 'San Francisco',
      language: 'English',
      notes: 'Friend visiting India next month',
      status: 'Not Started',
    },
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'recipe_mantra_sample_contacts.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
