import { create } from "zustand";

interface SettingDto {
  language: string;
  timeZone?: string;
}

interface AppStore {
  settings: SettingDto;
  appVersion: string;
  changeLanguage: (language: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  settings: {
    language: process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE as string,
    timeZone: "",
  },
  appVersion: "",
  changeLanguage: (language: string) => {
    set({ settings: { language } });
  },
}));
