import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        // Supported languages: 
        // af, ar, bn, de, en, es, fi, fil, fr, hi, id, ja, ko, ms, my, pt-BR, th, tr, ur, vi, zh, zh-TW
        supportedLngs: [
            'af', 'ar', 'bn', 'de', 'en', 'es', 'fi', 'fil', 'fr', 'hi',
            'id', 'ja', 'ko', 'ms', 'my', 'pt-BR', 'th', 'tr', 'ur', 'vi', 'zh', 'zh-TW'
        ],
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false,
        },

        backend: {
            loadPath: `/locales/{{lng}}.json?v=${Date.now() + 5}`,
        },

        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage', 'cookie'],
            lookupQuerystring: 'lang',
        },
    });

export default i18n;
