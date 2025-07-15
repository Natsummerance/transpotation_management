import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 语言资源
const resources = {
  'zh-CN': {
    translation: require('../public/locales/zh-CN/translation.json'),
  },
  'zh-TW': {
    translation: require('../public/locales/zh-TW/translation.json'),
  },
  'en-US': {
    translation: require('../public/locales/en-US/translation.json'),
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['zh-CN', 'zh-TW', 'en-US'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n; 