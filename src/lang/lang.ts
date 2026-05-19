import LocalizedStrings from 'react-native-localization';

import ENG from './locales/en.json';
import FRC from './locales/fr.json';
import SW_CD from './locales/swcd.json';

export let strings = new LocalizedStrings({
  en: ENG,
  fr: FRC,
  sw_drc: SW_CD,
});

export const changeLanguage = (languageKey: string) => {
  strings.setLanguage(languageKey);
};
