import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';


import ar from './locales/ar.json';
import fr from './locales/fr.json';

const LANGUAGE_KEY = '@app_language';


i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: 'fr', 
    fallbackLng: 'fr',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
  });


export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
    } else {
      
      const locales = Localization.getLocales();
      const systemLanguage = locales && locales.length > 0 ? locales[0].languageCode : null;
      if (systemLanguage && ['fr', 'ar'].includes(systemLanguage)) {
        await i18n.changeLanguage(systemLanguage);
      }
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
};


export const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export default i18n;