import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import swcd from './locales/swcd.json';

const resources = {
    en: {
        translation: en,
    },
    fr: {
        translation: fr,
    },
    sw_drc: {
        translation: swcd,
    },
};

const initializeI18Next = () => {
    i18n.use(initReactI18next).init({
        debug: false,
        resources,
        lng: 'en',
        fallbackLng: 'en',
        compatibilityJSON: 'v4',
        interpolation: {
            escapeValue: false,
        },
    });
};

// Initialize immediately when module is imported
initializeI18Next();

export default i18n;

