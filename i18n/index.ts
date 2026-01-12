import "dayjs/locale/de";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/nl";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE } from "@/constants";
import { useAppStore } from "@/store";

import de from "./locales/de.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import nl from "./locales/nl.json";

dayjs.extend(relativeTime);

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

  const currentLanguage = useAppStore.getState()?.language ?? DEFAULT_LANGUAGE;

  i18n.use(initReactI18next).init({
    lng: currentLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    resources: {
      en: {
        translation: en,
      },
      es: {
        translation: es,
      },
      de: {
        translation: de,
      },
      fr: {
        translation: fr,
      },
      nl: {
        translation: nl,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    pluralSeparator: "_",
  });

  initDayjs();
};

export const initDayjs = () => {
  const currentLanguage = useAppStore.getState()?.language ?? DEFAULT_LANGUAGE;
  dayjs.locale(currentLanguage);
};

initI18n();

export default i18n;
