/**
 * Phone number normalization and validation utility for WhatsApp click-to-chat.
 * 
 * WhatsApp click-to-chat links (wa.me) require:
 * - Digits only (no +, no -, no (), no spaces).
 * - Full international phone number including country code.
 * - No leading zeroes in the country code or local number.
 */

export interface PhoneValidationResult {
  raw: string;
  normalized: string; // Digits only, suitable for wa.me/<normalized>
  display: string;    // Human-friendly international format, e.g. +91 98765 43210
  isValid: boolean;
  error?: string;
  countryCode?: string;
}

/**
 * Normalizes and validates a phone number.
 * 
 * @param phone Raw phone string from CSV or input
 * @param defaultCountryCode Default country code with '+' (e.g., '+91')
 */
export function normalizePhoneNumber(
  phone: string | null | undefined,
  defaultCountryCode = '+91'
): PhoneValidationResult {
  const raw = (phone ?? '').trim();

  if (!raw) {
    return {
      raw,
      normalized: '',
      display: '',
      isValid: false,
      error: 'Phone number is empty',
    };
  }

  // Clean country code: strip leading '+'
  const defaultCCDigits = defaultCountryCode.replace(/\D/g, '') || '91';

  // Check if original had an explicit '+' or international prefix '00'
  const hasPlus = raw.startsWith('+');
  const has00 = raw.startsWith('00');

  // Strip all non-digit characters except leading '+' if present
  let digits = raw.replace(/\D/g, '');

  if (!digits) {
    return {
      raw,
      normalized: '',
      display: raw,
      isValid: false,
      error: 'Contains no numeric digits',
    };
  }

  // If starts with 00 (e.g. 0091...), remove leading 00
  if (has00 && digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  let normalized = '';

  // Case 1: Explicit '+' was provided (e.g. +91 98765 43210 or +1 555 123 4567)
  if (hasPlus) {
    // Explicit international number: use as-is (digits only)
    normalized = digits;
  }
  // Case 2: Number starts with '0' followed by 10 digits (Standard Indian trunk prefix: 09876543210)
  else if (digits.length === 11 && digits.startsWith('0')) {
    normalized = defaultCCDigits + digits.slice(1);
  }
  // Case 3: Exactly 10 digits (Standard Indian mobile: 9876543210)
  else if (digits.length === 10) {
    // Prepend default country code
    normalized = defaultCCDigits + digits;
  }
  // Case 4: 12 digits starting with the default country code digits (e.g. 919876543210 for +91)
  else if (digits.length === (defaultCCDigits.length + 10) && digits.startsWith(defaultCCDigits)) {
    // Already contains country code! Do NOT prepend country code again.
    normalized = digits;
  }
  // Case 5: 11 digits starting with country code of 1 digit (e.g. 1xxxxxxxxxx for US/Canada)
  else if (digits.length === 11 && digits.startsWith('1')) {
    normalized = digits;
  }
  // Case 6: International length already (between 11 and 15 digits)
  else if (digits.length >= 11 && digits.length <= 15) {
    normalized = digits;
  }
  // Case 7: Less than 10 digits - definitely incomplete
  else {
    normalized = digits;
  }

  // Validate normalized digits
  // E.164 numbers are between 8 and 15 digits
  let isValid = true;
  let error: string | undefined;

  if (normalized.length < 10) {
    isValid = false;
    error = `Too short (${normalized.length} digits). Minimum 10 digits required.`;
  } else if (normalized.length > 15) {
    isValid = false;
    error = `Too long (${normalized.length} digits). E.164 maximum is 15 digits.`;
  } else if (defaultCCDigits === '91') {
    // Additional validation for Indian numbers
    if (normalized.startsWith('91')) {
      const localPart = normalized.slice(2);
      if (localPart.length !== 10) {
        isValid = false;
        error = `Indian phone numbers require 10 digits after +91 (got ${localPart.length}).`;
      } else if (!/^[6-9]/.test(localPart)) {
        isValid = false;
        error = `Indian mobile numbers typically start with 6, 7, 8, or 9.`;
      }
    }
  }

  // Create human-friendly display format: +<CC> <rest>
  let display = `+${normalized}`;
  if (normalized.startsWith(defaultCCDigits)) {
    const cc = defaultCCDigits;
    const local = normalized.slice(cc.length);
    if (local.length === 10) {
      display = `+${cc} ${local.slice(0, 5)} ${local.slice(5)}`;
    } else {
      display = `+${cc} ${local}`;
    }
  }

  return {
    raw,
    normalized,
    display,
    isValid,
    error,
    countryCode: defaultCountryCode,
  };
}

/**
 * Creates a valid WhatsApp click-to-chat URL.
 * 
 * @param normalizedPhone Digits-only phone number with country code
 * @param messageText Message body
 * @param useDirectWeb If true, uses https://web.whatsapp.com/send
 */
export function buildWhatsAppUrl(
  normalizedPhone: string,
  messageText: string,
  useDirectWeb = false
): string {
  const encodedText = encodeURIComponent(messageText);
  if (useDirectWeb) {
    return `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
  }
  // Use api.whatsapp.com/send/?phone= instead of wa.me shortlink because
  // wa.me's 302 redirect corrupts multi-byte UTF-8 emojis (e.g. 🥰, 😋, 🫶) into %EF%BF%BD ()
  return `https://api.whatsapp.com/send/?phone=${normalizedPhone}&text=${encodedText}`;
}
