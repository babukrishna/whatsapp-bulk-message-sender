export type ContactStatus = 
  | 'Not Started' 
  | 'Ready' 
  | 'Opened in WhatsApp' 
  | 'Marked as Sent' 
  | 'Skipped';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  isValidPhone: boolean;
  phoneError?: string;
  nickname?: string;
  city?: string;
  language?: string;
  notes?: string;
  status: ContactStatus;
  sentAt?: string; // ISO string
  openedAt?: string; // ISO string
  createdAt: string;
}

export interface CampaignDraft {
  id: string;
  name: string;
  subject: string;
  body: string;
  catalogueUrl: string;
  signature: string;
  imageId?: string; // key in IndexedDB
  imageFileName?: string;
  imageFileType?: string;
  imageFileSize?: number;
  imageUrl?: string; // temporary object URL or data URL
  isUserCustomDraft?: boolean;
  updatedAt: string;
}

export interface AppSettings {
  defaultCountryCode: string; // e.g. '+91'
  businessName: string;
  businessTagline: string;
  autoAdvanceOnSent: boolean;
  safetyNoticeDismissed: boolean;
  useWhatsAppWebDirect: boolean; // true: web.whatsapp.com, false: wa.me
}

export interface CSVContactRow {
  name?: string;
  phone?: string;
  nickname?: string;
  city?: string;
  language?: string;
  notes?: string;
  status?: string;
  [key: string]: string | undefined;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'contacts' 
  | 'composer' 
  | 'sender' 
  | 'history' 
  | 'settings';
