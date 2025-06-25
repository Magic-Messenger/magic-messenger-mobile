import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

const initI18n = async () => {
  //TODO: Zustand structer

  i18n.use(initReactI18next).init({
    lng: "tr",
    fallbackLng: "en",
    resources: {
      tr: {
        translation: tr,
      },
      en: {
        translation: en,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;
