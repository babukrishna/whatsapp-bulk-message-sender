import { get, set, del } from 'idb-keyval';
import { Contact, CampaignDraft, AppSettings } from '../types';
import { DEFAULT_TEMPLATE } from './messageParser';

const CONTACTS_KEY = 'recipemantra_contacts_v1';
const CAMPAIGN_KEY = 'recipemantra_campaign_v1';
const SETTINGS_KEY = 'recipemantra_settings_v1';
const IMAGE_STORE_PREFIX = 'recipemantra_img_';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultCountryCode: '+91',
  businessName: 'Recipe Mantra',
  businessTagline: 'Homemade Sweets & Snacks in Small Batches',
  autoAdvanceOnSent: true,
  safetyNoticeDismissed: false,
  useWhatsAppWebDirect: false, // wa.me is universally compatible
};

export const DEFAULT_CAMPAIGN: CampaignDraft = {
  id: 'campaign_default',
  name: 'Recipe Mantra Festive & Snacks Launch',
  subject: 'Homemade Sweets & Snacks Catalogue Sharing',
  body: DEFAULT_TEMPLATE,
  catalogueUrl: 'https://wa.me/c/919625924506',
  signature: 'Warm regards,\nRecipe Mantra Team',
  updatedAt: new Date().toISOString(),
};

/* ----------------- Contacts Storage ----------------- */

export function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load contacts from localStorage:', err);
    return [];
  }
}

export function saveContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('Failed to save contacts to localStorage:', err);
  }
}

/* ----------------- Campaign Draft Storage ----------------- */

const OLD_CATALOGUE_URL = 'https://wa.me/c/919876543210';

export function loadCampaign(): CampaignDraft {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY);
    if (!raw) return DEFAULT_CAMPAIGN;
    const parsed = JSON.parse(raw);

    // If the user has not explicitly clicked "Save Draft" on a custom message in the UI,
    // or if the stored draft is any variation of the default Recipe Mantra template,
    // always use the latest DEFAULT_TEMPLATE from code so code edits reflect immediately!
    const isDefaultVariation =
      !parsed.isUserCustomDraft ||
      !parsed.body ||
      parsed.body.includes('Recipe Mantra') ||
      parsed.body.includes('Hey {{name}}');

    const isOldUrl = !parsed.catalogueUrl || parsed.catalogueUrl === OLD_CATALOGUE_URL;

    return {
      ...DEFAULT_CAMPAIGN,
      ...parsed,
      body: isDefaultVariation ? DEFAULT_TEMPLATE : parsed.body,
      catalogueUrl: isOldUrl ? DEFAULT_CAMPAIGN.catalogueUrl : parsed.catalogueUrl,
    };
  } catch (err) {
    console.error('Failed to load campaign from localStorage:', err);
    return DEFAULT_CAMPAIGN;
  }
}

export function saveCampaign(campaign: CampaignDraft): void {
  try {
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign));
  } catch (err) {
    console.error('Failed to save campaign to localStorage:', err);
  }
}

/* ----------------- Settings Storage ----------------- */

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

/* ----------------- IndexedDB Image Storage ----------------- */

/**
 * Validates and saves an uploaded image to IndexedDB.
 * Returns a unique imageId and the object/data URL.
 */
export async function saveImageToDB(file: File): Promise<{
  imageId: string;
  dataUrl: string;
  name: string;
  size: number;
  type: string;
}> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPG, PNG, or WebP image.');
  }

  // Validate size (max 8MB)
  const maxSize = 8 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Image size exceeds 8MB. Please upload a smaller image.');
  }

  const imageId = `${IMAGE_STORE_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Read as Data URL so it can be previewed, downloaded, and safely stored
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  // Store in IndexedDB
  await set(imageId, {
    dataUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
  });

  return {
    imageId,
    dataUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Loads an image from IndexedDB by imageId
 */
export async function getImageFromDB(imageId: string): Promise<{
  dataUrl: string;
  name: string;
  size: number;
  type: string;
} | null> {
  try {
    const item = await get(imageId);
    return item || null;
  } catch (err) {
    console.error('Failed to retrieve image from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes an image from IndexedDB by imageId
 */
export async function deleteImageFromDB(imageId: string): Promise<void> {
  try {
    await del(imageId);
  } catch (err) {
    console.error('Failed to delete image from IndexedDB:', err);
  }
}

/* ----------------- Backup & Restore ----------------- */

export async function exportFullBackup(): Promise<string> {
  const contacts = loadContacts();
  const campaign = loadCampaign();
  const settings = loadSettings();
  let imageData = null;

  if (campaign.imageId) {
    imageData = await getImageFromDB(campaign.imageId);
  }

  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    contacts,
    campaign,
    settings,
    imageData,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importFullBackup(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  if (Array.isArray(data.contacts)) {
    saveContacts(data.contacts);
  }
  if (data.campaign) {
    if (data.imageData && data.campaign.imageId) {
      await set(data.campaign.imageId, data.imageData);
    }
    saveCampaign(data.campaign);
  }
  if (data.settings) {
    saveSettings(data.settings);
  }
}
