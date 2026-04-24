import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zhCN from "./locales/zh-CN.json";
import en from "./locales/en.json";

/**
 * Chinese-first by design. We persist the user's pick in localStorage and
 * fall back to the navigator/browser preference. If nothing matches we
 * use zh-CN because that's our primary audience.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "zh-CN": { translation: zhCN },
      en:      { translation: en    }
    },
    fallbackLng: "zh-CN",
    supportedLngs: ["zh-CN", "en"],
    nonExplicitSupportedLngs: true,
    load: "currentOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "homeweb.lang"
    }
  });

export default i18n;
