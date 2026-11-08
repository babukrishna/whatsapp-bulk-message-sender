import { Contact, CampaignDraft } from '../types';

export const DEFAULT_TEMPLATE: string = `Hey {{name}}! ❤️😊

I’m excited to share *Recipe Mantra – Homemade Ethnic Food with you!* 🥰 We make traditional Indian sweets and snacks in small batches, with a homemade touch. 😋

🍬 Ladoos, Bihari Thekua, Namak Para & more!
🛍️ Check out our catalogue:
👉 {{catalogue_link}}
🚚 Delivery across {{city}}.

Your support, feedback, and sharing our catalogue would mean a lot to me. ❤️ No pressure—just wanted to share something close to my heart! 🫶`;

export const AVAILABLE_VARIABLES = [
  { key: '{{name}}', label: 'Name', description: 'Contact full name or first name' },
  { key: '{{nickname}}', label: 'Nickname', description: 'Informal nickname (falls back to Name)' },
  { key: '{{city}}', label: 'City', description: 'Contact city/location' },
  { key: '{{catalogue_link}}', label: 'Catalogue Link', description: 'WhatsApp or web catalogue URL' },
] as const;

/**
 * Extracts first name from a full name (e.g. "Amit Sharma" -> "Amit")
 */
export function getFirstName(fullName?: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  return parts[0] || '';
}

/**
 * Personalizes a message template for a specific contact.
 * Intelligently handles missing fields to avoid awkward gaps or trailing punctuation.
 */
export function personalizeMessage(
  template: string,
  contact: Partial<Contact>,
  catalogueUrl = '',
  signature = ''
): string {
  if (!template) return '';

  let message = template;

  const rawName = (contact.name ?? '').trim();
  const rawNickname = (contact.nickname ?? '').trim();
  const rawCity = (contact.city ?? '').trim();
  const rawCatalogue = (catalogueUrl ?? '').trim();

  // Determine best name to use
  const preferredName = rawNickname || rawName;
  const firstName = getFirstName(preferredName);

  // Smart greeting cleanup if name is completely missing:
  // e.g. "Hi {{name}}!" -> "Hi there!", "Hello {{name}}!" -> "Hello!"
  if (!preferredName) {
    message = message.replace(/(?:Hi|Hey)\s+\{\{name\}\}!/gi, 'Hi there! 😊');
    message = message.replace(/(?:Hello)\s+\{\{name\}\}!/gi, 'Hello! 😊');
    message = message.replace(/(?:Dear)\s+\{\{name\}\},?/gi, 'Hello,');
    message = message.replace(/(?:Hi|Hey)\s+\{\{nickname\}\}!/gi, 'Hi there! 😊');
    message = message.replace(/(?:Hello)\s+\{\{nickname\}\}!/gi, 'Hello! 😊');
  }

  // Replace {{name}} with firstName if single word or preferredName
  // If template has "Hi {{name}}", user usually expects "Hi Amit!" instead of "Hi Amit Sharma!"
  // But let's check: if name is provided, use firstName for friendly greeting, or preferredName
  const displayName = firstName || preferredName || '';
  message = message.replace(/\{\{name\}\}/gi, displayName);
  message = message.replace(/\{\{nickname\}\}/gi, rawNickname || displayName);

  // Replace {{city}}
  if (rawCity) {
    message = message.replace(/\{\{city\}\}/gi, rawCity);
  } else {
    // If city is empty, handle phrases like "across {{city}}." cleanly
    message = message.replace(/(?:across|in|to)\s+\{\{city\}\}\.?/gi, 'available.');
    message = message.replace(/\s*\{\{city\}\}/gi, '');
  }

  // Replace {{catalogue_link}}
  if (rawCatalogue) {
    // Ensure space after emoji pointer so WhatsApp formats it as a clickable link
    message = message.replace(/👉\s*\{\{catalogue_link\}\}/gi, `👉 ${rawCatalogue}`);
    message = message.replace(/\{\{catalogue_link\}\}/gi, rawCatalogue);
  } else {
    // If no catalogue URL provided, remove placeholder and pointing emoji cleanly
    message = message.replace(/👉\s*\{\{catalogue_link\}\}/gi, '');
    message = message.replace(/\{\{catalogue_link\}\}/gi, '');
  }

  // Append signature if specified and not already in template
  if (signature.trim() && !message.includes(signature.trim())) {
    message = `${message.trim()}\n\n${signature.trim()}`;
  }

  // Clean up any remaining multiple blank lines (max 2 consecutive linebreaks)
  message = message.replace(/\n{3,}/g, '\n\n').trim();

  return message;
}

/**
 * Generates preview data showing raw vs personalized comparison
 */
export function getMessagePreview(
  draft: CampaignDraft,
  contact: Contact
) {
  const personalizedText = personalizeMessage(
    draft.body,
    contact,
    draft.catalogueUrl,
    draft.signature
  );

  return {
    contact,
    text: personalizedText,
    charCount: personalizedText.length,
    catalogueUrl: draft.catalogueUrl,
    hasImage: !!draft.imageId || !!draft.imageUrl,
  };
}
