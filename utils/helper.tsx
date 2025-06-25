import { useAppStore } from "@/store";
import { changeLanguage as i18nChangeLanguage } from "i18next";

export const changeLanguage = (language: string) => {
  useAppStore.setState(() => ({
    settings: {
      language,
    },
  }));

  i18nChangeLanguage(language);
  console.log(useAppStore.getState());
};
