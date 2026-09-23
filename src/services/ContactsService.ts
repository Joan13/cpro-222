import parsePhoneNumberFromString, { getCountryCallingCode } from 'libphonenumber-js';
import { TContact, TUser } from '../types/types';
import { removeDuplicateNumbers } from '../../GlobalVariables';
import store from '../store/app/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openRealmInstance } from './RealmInstance';

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

/**
 * Resolves the display name of a contact from the device's address book / repertoire.
 * Searches in order:
 * 1. Global in-memory registry (`contactNameByPhoneRegistry`)
 * 2. Redux state (`persisted_app.raw_contacts` or `app.raw_contacts`)
 * 3. AsyncStorage (`persist:root` -> `persisted_app.raw_contacts`) for cold-start background push tasks
 * 4. Local Realm database (`UserContacts`)
 */
export const resolveContactDisplayName = async (phone: string): Promise<string | null> => {
    if (!phone || typeof phone !== 'string') return null;

    const trimmed = phone.trim();
    if (!trimmed) return null;

    // 1. Fast path: Direct in-memory lookup in registry
    if (contactNameByPhoneRegistry[trimmed]) {
        return contactNameByPhoneRegistry[trimmed];
    }

    const normalized = normalizePhoneNumber(trimmed);
    if (normalized && contactNameByPhoneRegistry[normalized]) {
        return contactNameByPhoneRegistry[normalized];
    }

    const cleanedNoPlus = normalized.startsWith('+') ? normalized.slice(1) : normalized;
    if (cleanedNoPlus && contactNameByPhoneRegistry[cleanedNoPlus]) {
        return contactNameByPhoneRegistry[cleanedNoPlus];
    }

    // 2. Look in Redux store
    let rawContacts: TContact[] = [];
    try {
        const state: any = store.getState();
        rawContacts = state?.persisted_app?.raw_contacts || state?.app?.raw_contacts || [];
    } catch (_) {}

    // Helper to find match in a contacts array
    const findInContacts = (contactsList: TContact[]): string | null => {
        if (!Array.isArray(contactsList) || contactsList.length === 0) return null;

        // Exact variant or phoneNumber match
        const exactMatch = contactsList.find(
            (c) =>
                c.phoneNumber === trimmed ||
                c.phoneNumber === normalized ||
                c.phoneNumber === cleanedNoPlus
        );
        if (exactMatch?.displayName) {
            return exactMatch.displayName;
        }

        // Suffix/digit matching (at least 6 digits to match local vs international formats)
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length >= 6) {
            const suffixMatch = contactsList.find((c) => {
                const cDigits = (c.phoneNumber || '').replace(/\D/g, '');
                return cDigits.length >= 6 && (cDigits.endsWith(digits) || digits.endsWith(cDigits));
            });
            if (suffixMatch?.displayName) {
                return suffixMatch.displayName;
            }
        }
        return null;
    };

    if (rawContacts.length > 0) {
        const matchedName = findInContacts(rawContacts);
        if (matchedName) {
            contactNameByPhoneRegistry[trimmed] = matchedName;
            if (normalized) contactNameByPhoneRegistry[normalized] = matchedName;
            return matchedName;
        }
    }

    // 3. Look in AsyncStorage (cold-start headless background task where Redux is not yet hydrated)
    try {
        const rawRoot = await AsyncStorage.getItem('persist:root');
        if (rawRoot) {
            const parsedRoot = JSON.parse(rawRoot);
            if (parsedRoot.persisted_app) {
                const persistedApp =
                    typeof parsedRoot.persisted_app === 'string'
                        ? JSON.parse(parsedRoot.persisted_app)
                        : parsedRoot.persisted_app;
                const persistedContacts: TContact[] = persistedApp?.raw_contacts || [];
                if (persistedContacts.length > 0) {
                    const matchedName = findInContacts(persistedContacts);
                    if (matchedName) {
                        contactNameByPhoneRegistry[trimmed] = matchedName;
                        if (normalized) contactNameByPhoneRegistry[normalized] = matchedName;
                        return matchedName;
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error reading raw_contacts from AsyncStorage in resolveContactDisplayName:', e);
    }

    // 4. Fallback to Realm UserContacts
    try {
        const realm = await openRealmInstance();
        if (realm && !realm.isClosed) {
            const realmContact: any =
                realm.objectForPrimaryKey('UserContacts', trimmed) ||
                realm.objectForPrimaryKey('UserContacts', normalized) ||
                realm.objects('UserContacts').filtered('phone_number == $0', trimmed)[0] ||
                realm.objects('UserContacts').filtered('phone_number == $0', normalized)[0];

            if (realmContact?.user_names && realmContact.user_names !== trimmed && realmContact.user_names !== normalized) {
                contactNameByPhoneRegistry[trimmed] = realmContact.user_names;
                return realmContact.user_names;
            }
        }
    } catch (e) {}

    return null;
};

