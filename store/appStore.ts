import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingDto {
  language: string | null;
  timeZone?: string | null;
}

interface AppStore {
  settings: SettingDto;
  appVersion: string;
  rehydrated: boolean;
  changeLanguage: (language: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: {
        language: null,
        timeZone: null,
      },
      appVersion: "",
      rehydrated: false,
      changeLanguage: (language: string) => {
        set((state) => ({
          settings: {
            ...state.settings,
            language,
          },
        }));
      },
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ rehydrated: true });
      },
    }
  )
);
