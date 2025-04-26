// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from '../locales/en/translation.json';
import amTranslation from '../locales/am/translation.json';


// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('i18nLng') || 'en';

i18n
  .use(LanguageDetector) // Detects user's browser language
  .use(initReactI18next) // Bind i18next to React
  .init({
    resources: {
      en: { translation: enTranslation },
      am: { translation: amTranslation },
    },
    lng: savedLanguage, // Use saved language instead of default
    fallbackLng: 'en', // Fallback if saved language is invalid
    supportedLngs: ['en', 'am'], // Supported languages
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['navigator', 'localStorage', 'cookie'], // Detection priority
      caches: ['localStorage'], // Store language preference
    },
    react: {
      useSuspense: false, // Disable suspense if not needed
    },
  });

export default i18n;