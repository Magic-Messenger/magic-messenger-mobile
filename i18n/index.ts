import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE } from "@/constants";
import { useAppStore } from "@/store";

import en from "./locales/en.json";

const initI18n = async () => {
  const waitForRehydrate = () =>
    new Promise<void>((resolve) => {
      const unsubscribe = useAppStore.subscribe((state) => {
        if (state.rehydrated) {
          unsubscribe();
          resolve();
        }
      });
    });

  await waitForRehydrate();

  const currentLanguage =
    useAppStore.getState()?.settings?.language ?? DEFAULT_LANGUAGE;

  i18n.use(initReactI18next).init({
    lng: currentLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    resources: {
      en: {
        translation: en,
      },
      es: {
        translation: en,
      },
      fr: {
        translation: en,
      },
      nl: {
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
