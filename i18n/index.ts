import { useAppStore } from "@/store";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

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
    useAppStore.getState()?.settings?.language ??
    process?.env?.EXPO_PUBLIC_DEFAULT_LANGUAGE ?? "en";

  i18n.use(initReactI18next).init({
    lng: currentLanguage,
    fallbackLng: process?.env?.EXPO_PUBLIC_DEFAULT_LANGUAGE ?? "en",
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
