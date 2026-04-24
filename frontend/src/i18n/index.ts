import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zhCN from "./locales/zh-CN.json";
import en from "./locales/en.json";

/**
 * Chinese-first by design. Persist an explicit user pick, otherwise start in
 * zh-CN instead of inheriting an English browser locale.
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
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: "home-topology-mapper.lang"
    }
  });

export default i18n;
