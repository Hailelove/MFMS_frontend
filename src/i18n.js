import i18n from "i18next";

import { initReactI18next } from "react-i18next";

import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import amCommon from "./locales/am/common.json";

import enLayout from "./locales/en/layout.json";
import amLayout from "./locales/am/layout.json";
import enMember from "./locales/en/member.json";
import amMember from "./locales/am/member.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        layout: enLayout,
        member: enMember,
      },

      am: {
        common: amCommon,
        layout: amLayout,
        member: amMember,
      },
    },

    lng: localStorage.getItem("language") || "en",

    ns: ["common", "layout", "member"],

    defaultNS: "common",

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
