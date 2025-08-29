import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingDto {
  language?: string;
  timeZone?: string;
}

interface AppStore {
  settings: SettingDto;
  appVersion: string;
  tor: boolean | null;
  rehydrated: boolean;
  changeLanguage: (language: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: {
        language: 'en',
        timeZone: undefined,
      },
      appVersion: "",
      tor: null,
      rehydrated: false,
      changeLanguage: (language: string) => {
        set((state) => ({
          settings: {
            ...state.settings,
            language,
          },
        }));
      },
      torStatus: (status: boolean) => {
        set(() => ({
          tor: status,
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
