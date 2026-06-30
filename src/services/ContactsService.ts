import parsePhoneNumberFromString, { getCountryCallingCode } from 'libphonenumber-js';
import { TContact, TUser } from '../types/types';
import { removeDuplicateNumbers } from '../../GlobalVariables';

// Global registry mapping any phone number variant (string) to its display name (string)
export const contactNameByPhoneRegistry: Record<string, string> = {};

/**
 * Normalizes a phone number to keep only digits and the leading '+' when appropriate.
 */
export const normalizePhoneNumber = (phone: string): string => {
    // Keep only digits and '+'
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
        return '+' + cleaned.slice(1).replace(/\+/g, '');
    } else {
        return cleaned.replace(/\+/g, '');
    }
};

/**
 * Generates all useful normalized variants of a phone number to improve matching accuracy.
 */
export const getPhoneVariants = (phone: string, defaultCallingCode: string): string[] => {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) return [];

    const variants = new Set<string>();
    variants.add(normalized);

    const cleanedNoPlus = normalized.startsWith('+') ? normalized.slice(1) : normalized;
    variants.add(cleanedNoPlus);

    if (defaultCallingCode) {
        // Case 1: Stored as local (starts with '0' but not '00')
        if (normalized.startsWith('0') && !normalized.startsWith('00')) {
            const localDigits = normalized.slice(1); // remove the leading '0'
            variants.add(defaultCallingCode + localDigits);
            variants.add('+' + defaultCallingCode + localDigits);
        }
        // Case 2: Stored with '+' and default calling code (e.g. '+243897190103')
        else if (normalized.startsWith('+' + defaultCallingCode)) {
            const localDigits = normalized.slice(1 + defaultCallingCode.length);
            variants.add('0' + localDigits);
            variants.add(defaultCallingCode + localDigits);
        }
        // Case 3: Stored with default calling code but no '+' (e.g. '243897190103')
        else if (normalized.startsWith(defaultCallingCode)) {
            const localDigits = normalized.slice(defaultCallingCode.length);
            variants.add('0' + localDigits);
            variants.add('+' + normalized);
        }
    }

    // Always guarantee both '+' prefix and no-'+' prefix are in the variants set
    if (normalized.startsWith('+')) {
        variants.add(normalized.slice(1));
    } else {
        variants.add('+' + normalized);
    }

    return Array.from(variants);
};

/**
 * Resolves the contact's display name reliably from available fields across platforms.
 */
export const buildDisplayName = (contact: any): string => {
    if (contact?.name && contact.name.trim()) {
        return contact.name.trim();
    }
    const combined = [
        contact?.firstName,
        contact?.middleName,
        contact?.lastName,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();
    if (combined) {
        return combined;
    }
    if (contact?.nickname && contact.nickname.trim()) {
        return contact.nickname.trim();
    }
    return '';
};

/**
 * Determines the default calling code for the user based on their country or phone number.
 */
export const getDefaultCallingCode = (user_data: TUser): string => {
    let callingCode = '';
    if (user_data?.country) {
        try {
            callingCode = getCountryCallingCode(user_data.country as any);
        } catch (e) {}
    }
    if (!callingCode && user_data?.phone_number) {
        try {
            const parsed = parsePhoneNumberFromString(user_data.phone_number);
            if (parsed) {
                callingCode = parsed.countryCallingCode;
            }
        } catch (e) {}
    }
    return callingCode;
};

/**
 * Processes device contacts: extracts multiple numbers, generates variants,
 * maps them to names in a registry, and returns a deduplicated list of TContact.
 */
export const processPhoneContacts = (
    contacts: any[],
    defaultCallingCode: string
): { allContacts: TContact[] } => {
    const contactsList: TContact[] = [];

    // Clear registry to rebuild it for the new contacts scan
    for (const key in contactNameByPhoneRegistry) {
        delete contactNameByPhoneRegistry[key];
    }

    for (const contact of contacts) {
        const phoneNumbers = contact?.phoneNumbers;
        if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            continue;
        }

        const displayName = buildDisplayName(contact);

        for (const phone of phoneNumbers) {
            const rawNumber = phone?.number;
            if (typeof rawNumber !== 'string' || !rawNumber.trim()) {
                continue;
            }

            // Generate variants for the phone number
            const variants = getPhoneVariants(rawNumber, defaultCallingCode);

            for (const variant of variants) {
                contactsList.push({
                    displayName,
                    phoneNumber: variant,
                });

                if (displayName) {
                    contactNameByPhoneRegistry[variant] = displayName;
                }
            }
        }
    }

    // Deduplicate contacts list by phoneNumber
    const allContacts = removeDuplicateNumbers(contactsList);

    return { allContacts };
};
